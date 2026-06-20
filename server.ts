import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import axios from "axios";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import crypto from "crypto";
import validator from "validator";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Encryption Utility for sensitive data
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'nexus_forge_encryption_key_32_chars_long_!!!').padEnd(32).slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// ─── Sandboxed Code Execution (Piston) ─────────────────────────────────────
// We never execute user-submitted Python/JS locally on this server — that
// would give arbitrary code access to this process's filesystem and env
// vars (DB file, OAuth secrets, encryption key, etc). Instead we send it to
// Piston (https://github.com/engineer-man/piston), a purpose-built sandboxed
// execution engine. Each run happens in an isolated container with no
// access to this server at all.
//
// PISTON_API_URL defaults to the public instance. For heavier production
// traffic, self-host Piston (Docker) and point this at your own URL —
// see the README in their repo.
const PISTON_API_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";

let pistonRuntimesCache: { language: string; version: string; aliases?: string[] }[] | null = null;
let pistonRuntimesFetchedAt = 0;

async function getPistonVersion(language: string): Promise<string> {
  const ONE_HOUR = 60 * 60 * 1000;
  if (!pistonRuntimesCache || Date.now() - pistonRuntimesFetchedAt > ONE_HOUR) {
    const { data } = await axios.get(`${PISTON_API_URL}/runtimes`, { timeout: 10000 });
    pistonRuntimesCache = data;
    pistonRuntimesFetchedAt = Date.now();
  }
  const match = pistonRuntimesCache!.find(
    (r) => r.language === language || r.aliases?.includes(language)
  );
  if (!match) throw new Error(`No Piston runtime available for "${language}"`);
  return match.version;
}

interface PistonResult {
  success: boolean;
  output: string;
  error: string;
  via: string;
}

async function executeSandboxed(code: string, language: string, filename?: string): Promise<PistonResult> {
  const pistonLanguageMap: Record<string, { lang: string; defaultFile: string }> = {
    python: { lang: "python", defaultFile: "main.py" },
    javascript: { lang: "javascript", defaultFile: "main.js" },
  };

  const mapped = pistonLanguageMap[language];
  if (!mapped) throw new Error(`Language "${language}" is not configured for sandboxed execution`);

  const version = await getPistonVersion(mapped.lang);

  const { data } = await axios.post(
    `${PISTON_API_URL}/execute`,
    {
      language: mapped.lang,
      version,
      files: [{ name: filename || mapped.defaultFile, content: code }],
      stdin: "",
      compile_timeout: 10000,
      run_timeout: 10000,
      run_memory_limit: 256 * 1024 * 1024, // 256MB
    },
    { timeout: 20000 }
  );

  // Piston returns { compile?: {stdout,stderr,code}, run: {stdout,stderr,code,signal} }
  if (data.compile && data.compile.code !== 0) {
    return {
      success: false,
      output: data.compile.stdout || "",
      error: data.compile.stderr || "Compilation failed",
      via: "Piston (sandboxed)",
    };
  }

  const run = data.run || {};
  return {
    success: run.code === 0,
    output: run.stdout || "",
    error: run.stderr || (run.signal ? `Process terminated: ${run.signal}` : ""),
    via: "Piston (sandboxed)",
  };
}
// ─────────────────────────────────────────────────────────────────────────

const db = new Database("nexus.db");

// Initialize DB with some sample data if empty
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    provider TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_keys (
    user_id TEXT,
    key_name TEXT,
    key_value TEXT,
    PRIMARY KEY (user_id, key_name),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );
  CREATE TABLE IF NOT EXISTS user_project_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    collection_name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS vercel_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS vercel_deployments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    status TEXT NOT NULL,
    logs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES vercel_projects(id)
  );
`);

// ─── Sandboxed Per-Requester Databases (Database tab / SQL playground) ─────
// `/api/db/query` lets a user run arbitrary SQL from the browser. It used to
// run directly against `nexus.db` — the same file holding `users`,
// `user_keys` (encrypted API keys), `vercel_projects`, etc. — with no auth
// check, so any visitor could run `SELECT * FROM user_keys` or
// `DROP TABLE users`. Real fix: every requester gets their own, completely
// separate SQLite file that starts empty. Whatever SQL they run, it can only
// ever affect their own throwaway sandbox — there is no `users` table in it
// to drop, no other user's data to read. This is sandboxing by physical
// isolation rather than by trying to blacklist dangerous SQL keywords
// (which is always bypassable).
const PROJECT_DB_DIR = path.join(__dirname, "project-data");
if (!fs.existsSync(PROJECT_DB_DIR)) fs.mkdirSync(PROJECT_DB_DIR, { recursive: true });

function sanitizeDbKey(key: string): string {
  // Defense in depth: requesterKey is always server-generated (see
  // getRequesterKey below), never taken verbatim from client input, but we
  // strip anything that isn't a safe filename character anyway so this can
  // never be used for path traversal even if that ever changes.
  return key.replace(/[^a-zA-Z0-9_:-]/g, "_").slice(0, 128);
}

// Identifies the caller for sandboxing purposes. Logged-in users are scoped
// by their real account id. Guests get a random id generated once and
// stored in their (httpOnly, server-side) session — NOT trusted from any
// client-supplied value — so two anonymous visitors never share a sandbox
// (this also fixes the separate "all guests share one 'guest' bucket" bug
// in the Vercel-clone routes' spirit, for this subsystem).
function getRequesterKey(req: express.Request): string {
  const session = req.session as any;
  if (session?.user?.id) return sanitizeDbKey(`user_${session.user.id}`);
  if (!session.anonId) {
    session.anonId = crypto.randomBytes(16).toString("hex");
  }
  return sanitizeDbKey(`anon_${session.anonId}`);
}

const userDbCache = new Map<string, Database.Database>();
const MAX_CACHED_USER_DBS = 200; // bound memory / open file handles

function getUserDb(requesterKey: string): Database.Database {
  let conn = userDbCache.get(requesterKey);
  if (conn) return conn;

  if (userDbCache.size >= MAX_CACHED_USER_DBS) {
    const oldestKey = userDbCache.keys().next().value;
    if (oldestKey) {
      userDbCache.get(oldestKey)?.close();
      userDbCache.delete(oldestKey);
    }
  }

  const dbPath = path.join(PROJECT_DB_DIR, `${requesterKey}.db`);
  conn = new Database(dbPath);
  conn.pragma("journal_mode = WAL");
  // Pre-create the table the structured /api/user-db endpoints rely on.
  conn.exec(`
    CREATE TABLE IF NOT EXISTS user_project_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      collection_name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  userDbCache.set(requesterKey, conn);
  return conn;
}
// ─────────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = process.env.PORT || 3000;

  // Trust proxy for secure cookies behind reverse proxy
  app.set('trust proxy', 1);

  // MUST be before helmet
  // Set COOP header BEFORE helmet
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // Then helmet with COOP disabled so it doesn't override
  app.use(helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:", "http:"],
        "script-src": [
          "'self'", "'unsafe-inline'", "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://apis.google.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "blob:"
        ],
        "connect-src": [
          "'self'",
          "https://api.github.com",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "https://firestore.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://firebase.googleapis.com",
          "wss:", "ws:", "http:", "https:"
        ],
        "frame-src": [
          "'self'",
          "https://accounts.google.com",
          "https://*.firebaseapp.com",
          "https://vibes-coders.firebaseapp.com"
        ],
      },
    },
    frameguard: false,
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api/", limiter);

  app.use(express.json());

  // Input Sanitization Middleware (Basic XSS Protection) - MUST be after express.json()
app.use((req, res, next) => {
  // Skip sanitization for code execution — escaping breaks code syntax.
  // Skip for /api/db/query — escaping breaks SQL containing quotes (e.g. WHERE name = 'John').
  // Skip for /api/user-db/* — these store arbitrary JSON document values verbatim.
  if (
    req.path === '/api/execute' ||
    req.path === '/api/db/query' ||
    req.path.startsWith('/api/user-db/')
  ) {
    return next();
  }
  
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key]);
      }
    }
  }
  next();
});

  app.use(session({
    secret: process.env.SESSION_SECRET || 'nexus_forge_super_secret_2007',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // Auth Routes
  app.get("/api/auth/me", (req, res) => {
    if (req.session && (req.session as any).user) {
      res.json({ user: (req.session as any).user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // GitHub OAuth
  app.get("/api/auth/github/url", (req, res) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID is not configured" });
    }

    const origin = (req.query.origin as string)?.replace(/\/$/, "");
    if (!origin) return res.status(400).json({ error: "Origin is required" });

    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    if (!redirectUri) {
      return res.status(500).json({ error: "GITHUB_REDIRECT_URI is not configured" });
    }

    const state = Buffer.from(origin).toString('base64');
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo%20user:email&state=${state}`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    const { code, state } = req.query;

    const origin = state
      ? Buffer.from(state as string, 'base64').toString('utf8')
      : null;

    if (!code) return res.status(400).send("Code is required");
    if (!origin) return res.status(400).send("Invalid state parameter");

    try {
      const tokenResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_REDIRECT_URI,
        },
        { headers: { Accept: "application/json" } }
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) throw new Error("No access token returned");

      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const githubUser = userResponse.data;

      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await axios.get("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        email =
          emailsResponse.data.find((e: any) => e.primary && e.verified)?.email ||
          emailsResponse.data[0]?.email;
      }

      const user = {
        id: `github:${githubUser.id}`,
        name: githubUser.name || githubUser.login,
        email,
        avatar_url: githubUser.avatar_url,
        provider: "github",
        accessToken,
      };

      db.prepare(`
        INSERT INTO users (id, name, email, avatar_url, provider)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          avatar_url = excluded.avatar_url
      `).run(user.id, user.name, user.email, user.avatar_url, user.provider);

      (req.session as any).user = user;

      res.send(`
        <html><body><script>
          window.opener.postMessage(
            { type: 'AUTH_SUCCESS', user: ${JSON.stringify(user)} },
            '${origin}'
          );
          window.close();
        </script></body></html>
      `);
    } catch (err: any) {
      console.error("GitHub Auth Error:", err.response?.data || err.message);
      res.send(`
        <html><body><script>
          window.opener.postMessage(
            { type: 'AUTH_ERROR', error: 'Authentication failed' },
            '${origin}'
          );
          window.close();
        </script></body></html>
      `);
    }
  });

  // Google OAuth
  app.get("/api/auth/google/url", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured in environment variables" });
    }
    let origin = req.query.origin as string;
    if (!origin) return res.status(400).json({ error: "Origin is required" });

    origin = origin.replace(/\/$/, "");

    (req.session as any).authOrigin = origin;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile%20email`;
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const origin = (req.session as any).authOrigin;

    if (!code) return res.status(400).send("Code is required");
    if (!origin) return res.status(400).send("Session expired, please try again");

    try {
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${origin}/api/auth/google/callback`
      });

      const accessToken = tokenResponse.data.access_token;
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const googleUser = userResponse.data;
      const user = {
        id: `google:${googleUser.id}`,
        name: googleUser.name,
        email: googleUser.email,
        avatar_url: googleUser.picture,
        provider: 'google',
        accessToken: accessToken
      };

      db.prepare(`
        INSERT INTO users (id, name, email, avatar_url, provider)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          avatar_url = excluded.avatar_url
      `).run(user.id, user.name, user.email, user.avatar_url, user.provider);

      (req.session as any).user = user;

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Google Auth Error:", err.response?.data || err.message);
      res.status(500).send(`Authentication failed. Redirect URI: ${origin}/api/auth/google/callback`);
    }
  });

  // API Key Management
  const keySchema = z.object({
    name: z.string().min(1).max(50),
    value: z.string().min(1).max(500)
  });

  app.post("/api/keys", (req, res) => {
    if (!req.session || !(req.session as any).user) return res.status(401).json({ error: "Unauthorized" });

    const validation = keySchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ error: "Invalid input", details: validation.error.format() });

    const { name, value } = validation.data;
    const userId = (req.session as any).user.id;
    try {
      const encryptedValue = encrypt(value);
      db.prepare("INSERT OR REPLACE INTO user_keys (user_id, key_name, key_value) VALUES (?, ?, ?)").run(userId, name, encryptedValue);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/keys", (req, res) => {
    if (!req.session || !(req.session as any).user) return res.status(401).json({ error: "Unauthorized" });
    const userId = (req.session as any).user.id;
    try {
      const keys = db.prepare("SELECT key_name, key_value FROM user_keys WHERE user_id = ?").all(userId);
      const decryptedKeys = keys.map((k: any) => ({
        key_name: k.key_name,
        key_value: decrypt(k.key_value)
      }));
      res.json({ success: true, keys: decryptedKeys });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Real-time Collaboration State
  const projectState: { files: Record<string, any>; cursors: Record<string, any> } = {
    files: {},
    cursors: {}
  };
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.emit("init", projectState);

  // ✅ Join a specific room
  socket.on("join:room", ({ roomId, name, color }) => {
    socket.join(roomId);
    (socket as any).roomId = roomId;
    (socket as any).userName = name;
    (socket as any).userColor = color;

    // Notify others in room
    socket.to(roomId).emit("user:join", {
      userId: socket.id,
      name,
      color,
    });

    console.log(`[Room] ${name} joined room ${roomId}`);
  });

  // ✅ File updates — broadcast to room
  socket.on("file:update", ({ fileId, code }) => {
    const roomId = (socket as any).roomId;
    projectState.files[fileId] = code;
    if (roomId) {
      socket.to(roomId).emit("file:update", {
        fileId, code, userId: socket.id
      });
    } else {
      socket.broadcast.emit("file:update", {
        fileId, code, userId: socket.id
      });
    }
  });

  // ✅ Cursor movement — broadcast to room
  socket.on("cursor:move", ({ fileId, position }) => {
    const roomId = (socket as any).roomId;
    projectState.cursors[socket.id] = { fileId, position };
    const payload = {
      userId: socket.id,
      fileId,
      position,
      color: (socket as any).userColor,
      name: (socket as any).userName,
    };
    if (roomId) {
      socket.to(roomId).emit("cursor:move", payload);
    } else {
      socket.broadcast.emit("cursor:move", payload);
    }
  });

  socket.on("whiteboard:update", (data) => {
    socket.broadcast.emit("whiteboard:update", data);
  });

  socket.on("whiteboard:clear", () => {
    socket.broadcast.emit("whiteboard:clear");
  });

  socket.on("disconnect", () => {
    const roomId = (socket as any).roomId;
    delete projectState.cursors[socket.id];
    if (roomId) {
      socket.to(roomId).emit("user:leave", socket.id);
    } else {
      io.emit("user:leave", socket.id);
    }
    console.log("User disconnected:", socket.id);
  });
});
 
  // Vercel Clone API
  const vercelProjectSchema = z.object({
    name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s-]+$/),
    repo_url: z.string().url()
  });

  app.get("/api/vercel/projects", (req, res) => {
    const userId = (req.session && (req.session as any).user) ? (req.session as any).user.id : 'guest';
    try {
      const projects = db.prepare("SELECT * FROM vercel_projects WHERE user_id = ?").all(userId);
      res.json({ success: true, projects });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/vercel/projects", (req, res) => {
    const userId = (req.session && (req.session as any).user) ? (req.session as any).user.id : 'guest';

    const validation = vercelProjectSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ error: "Invalid input", details: validation.error.format() });

    const { name, repo_url } = validation.data;
    const id = Math.random().toString(36).substring(2, 9);
    const subdomain = `${name.toLowerCase().replace(/\s+/g, '-')}-${id}.nexus.sh`;
    try {
      db.prepare("INSERT INTO vercel_projects (id, user_id, name, repo_url, subdomain) VALUES (?, ?, ?, ?, ?)").run(id, userId, name, repo_url, subdomain);
      res.json({ success: true, project: { id, name, repo_url, subdomain } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/vercel/projects/:id/deployments", (req, res) => {
    const { id } = req.params;
    try {
      const deployments = db.prepare("SELECT * FROM vercel_deployments WHERE project_id = ? ORDER BY created_at DESC").all(id);
      res.json({ success: true, deployments });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/vercel/deployments", async (req, res) => {
    const { project_id } = req.body;
    const deployment_id = `dep-${Math.random().toString(36).substring(2, 9)}`;

    try {
      db.prepare("INSERT INTO vercel_deployments (id, project_id, status, logs) VALUES (?, ?, ?, ?)").run(deployment_id, project_id, 'BUILDING', '');

      const steps = [
        "Cloning repository...",
        "Resolving dependencies...",
        "Running build script...",
        "Optimizing assets...",
        "Uploading to S3...",
        "Deployment ready!"
      ];

      let currentLogs = "";
      res.json({ success: true, deployment_id });

      (async () => {
        for (let i = 0; i < steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
          const logLine = `[${new Date().toLocaleTimeString()}] ${steps[i]}\n`;
          currentLogs += logLine;

          io.emit(`vercel:logs:${deployment_id}`, { log: logLine });

          if (i === steps.length - 1) {
            db.prepare("UPDATE vercel_deployments SET status = ?, logs = ? WHERE id = ?").run('READY', currentLogs, deployment_id);
            io.emit(`vercel:status:${deployment_id}`, { status: 'READY' });
          } else {
            db.prepare("UPDATE vercel_deployments SET logs = ? WHERE id = ?").run(currentLogs, deployment_id);
          }
        }
      })();

    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Database API — runs against the caller's own isolated sandbox DB only
  // (see "Sandboxed Per-Requester Databases" above). Never touches nexus.db.
  app.post("/api/db/query", (req, res) => {
    const { query, params } = req.body;
    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: "A 'query' string is required" });
    }
    if (query.length > 20000) {
      return res.status(400).json({ success: false, error: "Query is too long" });
    }
    try {
      const requesterDb = getUserDb(getRequesterKey(req));
      const stmt = requesterDb.prepare(query);
      const normalized = query.trim().toLowerCase();
      const results = normalized.startsWith("select") || normalized.startsWith("pragma")
        ? stmt.all(params || [])
        : stmt.run(params || []);
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/db/tables", (req, res) => {
    try {
      const requesterDb = getUserDb(getRequesterKey(req));
      const tables = requesterDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      res.json({ success: true, tables });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // User Project Database API (Generic CRUD for user-written code) — also
  // scoped to the caller's own sandbox DB, so projectId/collection are just
  // namespacing *within* a requester's own isolated data, not a security
  // boundary on their own (the old version trusted projectId from the URL
  // alone, so any visitor could read/write/delete any other user's data —
  // and in practice the frontend hardcodes projectId to "my-project" for
  // every single user, so it was effectively one shared bucket for everyone).
  app.post("/api/user-db/:projectId/:collection", (req, res) => {
    const { projectId, collection } = req.params;
    const data = JSON.stringify(req.body);
    try {
      const requesterDb = getUserDb(getRequesterKey(req));
      const stmt = requesterDb.prepare("INSERT INTO user_project_data (project_id, collection_name, data) VALUES (?, ?, ?)");
      const result = stmt.run(projectId, collection, data);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/user-db/:projectId/:collection", (req, res) => {
    const { projectId, collection } = req.params;
    try {
      const requesterDb = getUserDb(getRequesterKey(req));
      const rows = requesterDb.prepare("SELECT id, data, created_at FROM user_project_data WHERE project_id = ? AND collection_name = ?").all(projectId, collection);
      const results = rows.map((r: any) => ({
        id: r.id,
        ...JSON.parse(r.data),
        created_at: r.created_at
      }));
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/user-db/:projectId/:collection/:id", (req, res) => {
    const { projectId, collection, id } = req.params;
    try {
      const requesterDb = getUserDb(getRequesterKey(req));
      requesterDb.prepare("DELETE FROM user_project_data WHERE project_id = ? AND collection_name = ? AND id = ?").run(projectId, collection, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

// ─── Code Execution Endpoint ───────────────────────────────────────────────
  // ─── Code Execution Endpoint (JDoodle + Native fallback) ─────────────────
app.post("/api/execute", async (req, res) => {
  const { code, language, filename } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  // Step 1: Detect language from filename extension
  const extToLang: Record<string, string> = {
    '.py':    'python',
    '.js':    'javascript',
    '.ts':    'typescript',
    '.cpp':   'cpp',
    '.cc':    'cpp',
    '.c':     'c',
    '.java':  'java',
    '.go':    'go',
    '.rs':    'rust',
    '.rb':    'ruby',
    '.php':   'php',
    '.cs':    'csharp',
    '.kt':    'kotlin',
    '.swift': 'swift',
    '.r':     'r',
    '.sh':    'bash',
    '.bash':  'bash',
  };

  const ext = filename
    ? filename.substring(filename.lastIndexOf('.')).toLowerCase()
    : '';
  const finalLanguage =
    filename && extToLang[ext] ? extToLang[ext] : language;

  // Step 2: Sandboxed execution for Python and JavaScript via Piston.
  // IMPORTANT: this used to shell out to `python3`/`node` directly on this
  // server (child_process.exec). That gave any user who could reach this
  // endpoint arbitrary code execution on the box hosting your DB, session
  // secret, and OAuth credentials. It now runs in an isolated container
  // with no access to this server, via the same network-API pattern
  // already used for JDoodle below.
  const sandboxedLanguages = ['python', 'javascript'];
  if (sandboxedLanguages.includes(finalLanguage)) {
    try {
      const result = await executeSandboxed(code, finalLanguage, filename);
      return res.json({
        success: result.success,
        output: result.output,
        error: result.error,
        language: finalLanguage,
        via: result.via,
      });
    } catch (err: any) {
      console.error('[Execute] Piston error:', err.response?.data || err.message);
      return res.json({
        success: false,
        output: '',
        error: err.response?.data?.message || err.message || 'Sandboxed execution failed. The execution service may be temporarily unavailable — try again shortly.',
        language: finalLanguage,
        via: 'Piston (sandboxed)',
      });
    }
  }

  // Step 3: JDoodle for all other languages
  const jdoodleMap: Record<string, { language: string; versionIndex: string }> = {
    'java':       { language: 'java',       versionIndex: '4' },
    'cpp':        { language: 'cpp17',      versionIndex: '1' },
    'c':          { language: 'c',          versionIndex: '5' },
    'typescript': { language: 'typescript', versionIndex: '1' },
    'go':         { language: 'go',         versionIndex: '4' },
    'rust':       { language: 'rust',       versionIndex: '4' },
    'ruby':       { language: 'ruby',       versionIndex: '4' },
    'php':        { language: 'php',        versionIndex: '4' },
    'csharp':     { language: 'csharp',     versionIndex: '4' },
    'kotlin':     { language: 'kotlin',     versionIndex: '3' },
    'swift':      { language: 'swift',      versionIndex: '4' },
    'r':          { language: 'r',          versionIndex: '4' },
    'bash':       { language: 'bash',       versionIndex: '4' },
    'shell':      { language: 'bash',       versionIndex: '4' },
    'sql':        { language: 'sql',        versionIndex: '4' },
    'scala':      { language: 'scala',      versionIndex: '4' },
    'perl':       { language: 'perl',       versionIndex: '4' },
  };

  const jdoodleLang = jdoodleMap[finalLanguage];

  if (!jdoodleLang) {
    return res.json({
      success: false,
      output: '',
      error: `❌ Language "${finalLanguage}" is not supported.\n\nSupported: Python, JS, TS, Java, C, C++, Go, Rust, Ruby, PHP, C#, Kotlin, Swift, R, Bash, SQL, Scala, Perl`,
      language: finalLanguage
    });
  }

  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.json({
      success: false,
      output: '',
      error: '⚠️ JDoodle API credentials not set.\nAdd JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to Render environment variables.\nGet free credentials at: https://www.jdoodle.com/compiler-api',
      language: finalLanguage
    });
  }

  try {
    console.log(`[Execute] Running ${finalLanguage} via JDoodle...`);

    const response = await axios.post(
      'https://api.jdoodle.com/v1/execute',
      {
        script:        code,
        language:      jdoodleLang.language,
        versionIndex:  jdoodleLang.versionIndex,
        clientId,
        clientSecret,
        stdin:         '',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const result = response.data;
    console.log(`[Execute] JDoodle result:`, result);

    // JDoodle returns statusCode 200 on success
    if (result.statusCode === 200 || result.output) {
      return res.json({
        success: true,
        output:  result.output || '',
        error:   '',
        language: finalLanguage,
        via:     'JDoodle',
        cpuTime: result.cpuTime,
        memory:  result.memory
      });
    }

    // Handle JDoodle error responses
    return res.json({
      success: false,
      output:  result.output || '',
      error:   result.error || result.output || 'Execution failed',
      language: finalLanguage,
      via:     'JDoodle'
    });

  } catch (err: any) {
    console.error('[Execute] JDoodle error:', err.response?.data || err.message);

    const errData = err.response?.data;

    // Handle daily limit exceeded
    if (errData?.error?.includes('limit') || err.response?.status === 429) {
      return res.json({
        success: false,
        output:  '',
        error:   '⚠️ JDoodle daily limit reached (200 calls/day on free tier).\nUpgrade at jdoodle.com or try again tomorrow.',
        language: finalLanguage
      });
    }

    return res.json({
      success: false,
      output:  '',
      error:   errData?.error || err.message || 'JDoodle execution failed',
      language: finalLanguage
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
//───────────────────────────────────────────────────
   
  // ──────────────────────────────────────────────────────────────────────────
  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(__dirname, "dist");
  const distExists = fs.existsSync(distPath);

  console.log(`[Nexus Forge] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Nexus Forge] Dist Path: ${distPath} (Exists: ${distExists})`);

  if (!isProduction) {
    console.log("[Nexus Forge] Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    if (distExists) {
      console.log("[Nexus Forge] Starting in production mode, serving from dist...");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("[Nexus Forge] Production mode detected but 'dist' directory is missing! Falling back to root index.html.");
      app.use(express.static(__dirname));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
      });
    }
  }
httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
