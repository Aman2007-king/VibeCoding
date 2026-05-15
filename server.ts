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
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

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
  // Skip sanitization for code execution — escaping breaks code syntax
  if (req.path === '/api/execute') return next();
  
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

    socket.on("file:update", ({ fileId, code }) => {
      projectState.files[fileId] = code;
      socket.broadcast.emit("file:update", { fileId, code, userId: socket.id });
    });

    socket.on("cursor:move", ({ fileId, position }) => {
      projectState.cursors[socket.id] = { fileId, position };
      socket.broadcast.emit("cursor:move", { userId: socket.id, fileId, position });
    });

    socket.on("whiteboard:update", (data) => {
      socket.broadcast.emit("whiteboard:update", data);
    });

    socket.on("whiteboard:clear", () => {
      socket.broadcast.emit("whiteboard:clear");
    });

    socket.on("disconnect", () => {
      delete projectState.cursors[socket.id];
      io.emit("user:leave", socket.id);
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

  // Database API
  app.post("/api/db/query", (req, res) => {
    const { query, params } = req.body;
    try {
      const stmt = db.prepare(query);
      const results = query.trim().toLowerCase().startsWith("select") || query.trim().toLowerCase().startsWith("pragma")
        ? stmt.all(params || [])
        : stmt.run(params || []);
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/db/tables", (req, res) => {
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      res.json({ success: true, tables });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // User Project Database API (Generic CRUD for user-written code)
  app.post("/api/user-db/:projectId/:collection", (req, res) => {
    const { projectId, collection } = req.params;
    const data = JSON.stringify(req.body);
    try {
      const stmt = db.prepare("INSERT INTO user_project_data (project_id, collection_name, data) VALUES (?, ?, ?)");
      const result = stmt.run(projectId, collection, data);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/user-db/:projectId/:collection", (req, res) => {
    const { projectId, collection } = req.params;
    try {
      const rows = db.prepare("SELECT id, data, created_at FROM user_project_data WHERE project_id = ? AND collection_name = ?").all(projectId, collection);
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
      db.prepare("DELETE FROM user_project_data WHERE project_id = ? AND collection_name = ? AND id = ?").run(projectId, collection, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

// ─── Code Execution Endpoint ───────────────────────────────────────────────
// ─── Code Execution Endpoint (Piston API - No API Key Required) ───────────
app.post("/api/execute", async (req, res) => {
  const { code, language, filename } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  // Step 1: Detect language from filename extension
  const extToLang: Record<string, string> = {
    '.py':   'python',
    '.js':   'javascript',
    '.ts':   'typescript',
    '.cpp':  'cpp',
    '.cc':   'cpp',
    '.c':    'c',
    '.java': 'java',
    '.go':   'go',
    '.rs':   'rust',
    '.rb':   'ruby',
    '.php':  'php',
    '.cs':   'csharp',
    '.kt':   'kotlin',
    '.swift':'swift',
    '.r':    'r',
    '.sh':   'bash',
    '.bash': 'bash',
    '.sql':  'sqlite3',
  };

  const ext = filename ? filename.substring(filename.lastIndexOf('.')).toLowerCase() : '';
  const finalLanguage = (filename && extToLang[ext]) ? extToLang[ext] : language;

  // Step 2: Piston language map (language name + version + filename)
  const pistonMap: Record<string, { language: string; version: string; filename: string }> = {
    'python':     { language: 'python',     version: '3.10.0',  filename: 'main.py'    },
    'javascript': { language: 'javascript', version: '18.15.0', filename: 'main.js'    },
    'typescript': { language: 'typescript', version: '5.0.3',   filename: 'main.ts'    },
    'java':       { language: 'java',       version: '15.0.2',  filename: 'Main.java'  },
    'cpp':        { language: 'c++',        version: '10.2.0',  filename: 'main.cpp'   },
    'c':          { language: 'c',          version: '10.2.0',  filename: 'main.c'     },
    'go':         { language: 'go',         version: '1.16.2',  filename: 'main.go'    },
    'rust':       { language: 'rust',       version: '1.50.0',  filename: 'main.rs'    },
    'ruby':       { language: 'ruby',       version: '3.0.1',   filename: 'main.rb'    },
    'php':        { language: 'php',        version: '8.2.3',   filename: 'main.php'   },
    'csharp':     { language: 'csharp',     version: '6.12.0',  filename: 'main.cs'    },
    'kotlin':     { language: 'kotlin',     version: '1.8.20',  filename: 'main.kt'    },
    'swift':      { language: 'swift',      version: '5.3.3',   filename: 'main.swift' },
    'r':          { language: 'r',          version: '4.1.1',   filename: 'main.r'     },
    'bash':       { language: 'bash',       version: '5.2.0',   filename: 'main.sh'    },
    'shell':      { language: 'bash',       version: '5.2.0',   filename: 'main.sh'    },
    'sqlite3':    { language: 'sqlite3',    version: '3.36.0',  filename: 'main.sql'   },
  };

  const pistonLang = pistonMap[finalLanguage];

  if (!pistonLang) {
    return res.json({
      success: false,
      output: '',
      error: `❌ Language "${finalLanguage}" is not supported.\n\nSupported: Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, Ruby, PHP, C#, Kotlin, Swift, R, Bash`,
      language: finalLanguage
    });
  }

  // Step 3: Call Piston API
  try {
    console.log(`[Execute] Running ${finalLanguage} via Piston API...`);

    const response = await axios.post(
      'https://emkc.org/api/v2/piston/execute',
      {
        language: pistonLang.language,
        version:  pistonLang.version,
        files: [{
          name:    pistonLang.filename,
          content: code
        }],
        stdin:           '',
        args:            [],
        compile_timeout: 30000,
        run_timeout:     10000,
        compile_memory_limit: -1,
        run_memory_limit:     -1,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 35000
      }
    );

    const result   = response.data;
    const runOut   = result.run?.stdout   || '';
    const runErr   = result.run?.stderr   || '';
    const compOut  = result.compile?.stdout || '';
    const compErr  = result.compile?.stderr || '';

    // Combine compile + run output
    const fullOutput = [compOut, runOut].filter(Boolean).join('\n').trim();
    const fullError  = [compErr, runErr].filter(Boolean).join('\n').trim();

    console.log(`[Execute] Done. Output: ${fullOutput.length} chars, Error: ${fullError.length} chars`);

    return res.json({
      success: !fullError || !!fullOutput,
      output:  fullOutput,
      error:   fullError,
      language: finalLanguage,
      via: 'Piston'
    });

  } catch (err: any) {
    console.error('[Execute] Piston API error:', err.response?.data || err.message);

    // Retry with different version if version not found
    if (err.response?.status === 400 && err.response?.data?.message?.includes('version')) {
      try {
        const retryResponse = await axios.post(
          'https://emkc.org/api/v2/piston/execute',
          {
            language: pistonLang.language,
            version:  '*',  // Use latest available version
            files: [{
              name:    pistonLang.filename,
              content: code
            }],
            stdin: '',
            args:  [],
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 35000
          }
        );

        const r = retryResponse.data;
        return res.json({
          success: true,
          output:  r.run?.stdout || '',
          error:   r.run?.stderr || r.compile?.stderr || '',
          language: finalLanguage,
          via: 'Piston (latest)'
        });
      } catch (retryErr: any) {
        console.error('[Execute] Retry failed:', retryErr.message);
      }
    }

    return res.json({
      success: false,
      output:  '',
      error:   `⚠️ Execution service temporarily unavailable.\n${err.response?.data?.message || err.message}`,
      language: finalLanguage
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
   
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
