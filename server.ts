import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'nexus_forge_super_secret_2007',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
      return res.status(500).json({ error: "GITHUB_CLIENT_ID is not configured in environment variables" });
    }
    let origin = req.query.origin as string;
    if (!origin) return res.status(400).json({ error: "Origin is required" });
    
    // Normalize origin: remove trailing slash
    origin = origin.replace(/\/$/, "");

    (req.session as any).authOrigin = origin;
    const redirectUri = `${origin}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const origin = (req.session as any).authOrigin;
    
    if (!code) return res.status(400).send("Code is required");
    if (!origin) return res.status(400).send("Session expired, please try again");

    try {
      const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`
      }, {
        headers: { Accept: "application/json" }
      });

      const accessToken = tokenResponse.data.access_token;
      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const githubUser = userResponse.data;
      
      // Get email if not public
      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await axios.get("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        email = emailsResponse.data.find((e: any) => e.primary && e.verified)?.email || emailsResponse.data[0].email;
      }

      const user = {
        id: `github:${githubUser.id}`,
        name: githubUser.name || githubUser.login,
        email: email,
        avatar_url: githubUser.avatar_url,
        provider: 'github'
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
      console.error("GitHub Auth Error:", err.response?.data || err.message);
      res.status(500).send(`Authentication failed. Redirect URI: ${origin}/api/auth/github/callback`);
    }
  });

  // Google OAuth
  app.get("/api/auth/google/url", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured in environment variables" });
    }
    let origin = req.query.origin as string;
    if (!origin) return res.status(400).json({ error: "Origin is required" });

    // Normalize origin: remove trailing slash
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
        provider: 'google'
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
  app.post("/api/keys", (req, res) => {
    if (!req.session || !(req.session as any).user) return res.status(401).json({ error: "Unauthorized" });
    const { name, value } = req.body;
    const userId = (req.session as any).user.id;
    try {
      db.prepare("INSERT OR REPLACE INTO user_keys (user_id, key_name, key_value) VALUES (?, ?, ?)").run(userId, name, value);
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
      res.json({ success: true, keys });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Real-time Collaboration State
  const projectState = {
    files: {},
    cursors: {}
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send initial state
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
