import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, Zap, Shield, Globe, Cpu, Code2, Rocket, Heart, Brain, Layers, Terminal, GitBranch, Play, Lock } from 'lucide-react';

// ── Real changelog / feature blog posts ──────────────────────────────────────
// These describe what the app actually does. No fabricated capabilities.
const blogPosts = [
  {
    title: "Sandboxed Code Execution",
    description: "Run Python, JavaScript, TypeScript, Java, C++, Go, Ruby and more directly in the IDE. Every execution runs in an isolated Piston sandbox — your server's filesystem and secrets are never touched. Real output, real errors, fully safe.",
    image: "https://picsum.photos/seed/code-execution-sandbox/1200/800",
    icon: Terminal,
    color: "text-accent",
    tag: "Security"
  },
  {
    title: "AI-Powered Code Generation",
    description: "Describe what you want in plain English and Gemini generates complete, working code across all supported languages. Ghost-text inline autocomplete, smart refactoring, one-click debug, and fast-fix suggestions make every edit faster.",
    image: "https://picsum.photos/seed/ai-coding-assistant/1200/800",
    icon: Sparkles,
    color: "text-blue-400",
    tag: "AI"
  },
  {
    title: "Real-Time Collaborative Editing",
    description: "Share a room link and code together live. File edits, cursor positions, and whiteboard strokes sync instantly over WebSockets. Late joiners receive the full canvas replay — not a blank screen.",
    image: "https://picsum.photos/seed/realtime-collaboration/1200/800",
    icon: Globe,
    color: "text-emerald-400",
    tag: "Collaboration"
  }
];

// ── How it works — real steps ─────────────────────────────────────────────────
const processSteps = [
  {
    title: "1. Open or Generate",
    desc: "Start from scratch, paste existing code, or describe what you want to build. Gemini generates a complete project structure with real, runnable files.",
    icon: Sparkles
  },
  {
    title: "2. Edit with AI Assist",
    desc: "Monaco Editor with syntax highlighting, ghost-text autocomplete, and inline AI suggestions. Stage and commit changes directly to your GitHub repo from the Source Control panel.",
    icon: Code2
  },
  {
    title: "3. Run & Test",
    desc: "Hit Run to execute your code in a real sandboxed environment. The Test panel generates and runs genuine unit tests against your actual logic — results come from real execution, not hardcoded fixtures.",
    icon: Play
  },
  {
    title: "4. Collaborate & Deploy",
    desc: "Share your room link to code live with teammates on the same canvas. Push all staged files atomically to GitHub in one commit via the Git Trees API — supports any number of files and full Unicode.",
    icon: Rocket
  }
];

// ── Real tech stack ───────────────────────────────────────────────────────────
const webUses = [
  { title: "Gemini AI", desc: "Google Gemini powers code generation, debugging, autocomplete, and the live voice coding session." },
  { title: "Monaco Editor", desc: "The same editor engine as VS Code — full syntax highlighting, IntelliSense, and multi-file tabs." },
  { title: "Socket.IO", desc: "Room-scoped WebSockets for real-time code sync, cursor sharing, and collaborative whiteboard strokes." },
  { title: "AES-256 Encryption", desc: "Your stored API keys are encrypted at rest using AES-256-CBC before being written to the database." }
];

// ── Feature highlights — all real ────────────────────────────────────────────
const features = [
  { title: "AI Pair Coder", icon: Brain, desc: "Gemini generates, debugs, refactors, and explains your code in any supported language." },
  { title: "30+ Languages", icon: Code2, desc: "Python, JS/TS, Java, C/C++, Go, Ruby, PHP, Rust, Swift, Kotlin, and more — all with real sandboxed execution." },
  { title: "Live Preview", icon: Play, desc: "Instant HTML/CSS/JS preview with a real debugger bridge — breakpoints, step-through, and console capture." },
  { title: "GitHub Push", icon: GitBranch, desc: "Atomic multi-file commits via the Git Trees API. Staged changes pushed in one real commit, full Unicode safe." }
];

// ── Real deployment facts ─────────────────────────────────────────────────────
const deploymentSteps = [
  { title: "Node.js + Express Backend", desc: "The server handles OAuth (GitHub + Google), sandboxed code execution, per-user encrypted key storage, and Socket.IO real-time rooms — all on a single Render web service." },
  { title: "React + Vite Frontend", desc: "Built with React, Tailwind CSS v4, Framer Motion, Monaco Editor, and React-Konva for the collaborative whiteboard. Deployed on Vercel with zero build config." },
  { title: "SQLite + Firebase", desc: "SQLite (better-sqlite3) stores user projects, Vercel-clone records, and encrypted API keys on the server. Firebase handles Auth and Firestore for cloud-synced user profiles." }
];

function Card3D({ children, className }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Blog({ onBack, onNavigateAbout }: { onBack: () => void, onNavigateAbout: () => void }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary custom-scrollbar perspective-1000">

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/seed/ide-dark-workspace/1920/1080?blur=1"
            alt="VibeCoding workspace"
            className="w-full h-full object-cover opacity-30 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/20 via-bg-primary/60 to-bg-primary" />
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 text-center space-y-12 px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Browser-Based AI IDE · Built for Developers
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[10rem] font-black tracking-tighter leading-[0.8] uppercase italic"
            >
              Vibe<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-purple-500">Coding.</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-xl text-text-secondary max-w-3xl mx-auto font-medium leading-relaxed opacity-80"
          >
            A full-featured, AI-assisted coding environment that runs entirely in the browser. Write, run, debug, collaborate, and push to GitHub — without installing anything.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-8"
          >
            <button
              onClick={onBack}
              className="w-full sm:w-auto group relative px-8 md:px-12 py-4 md:py-5 bg-accent text-accent-foreground rounded-2xl font-black uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(var(--accent-rgb),0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              <span className="relative z-10">Open the IDE</span>
            </button>
            <button
              onClick={onNavigateAbout}
              className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all"
            >
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-secondary/40"
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-current" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Scroll</span>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-40 space-y-16">
        <div className="space-y-4 text-center">
          <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em]">How It Works</h2>
          <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">From idea to GitHub<br />in one session.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {processSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-bg-secondary border border-white/5 rounded-[2.5rem] space-y-5 hover:border-accent/20 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-accent" />
              </div>
              <h4 className="text-base font-black uppercase tracking-tight">{step.title}</h4>
              <p className="text-sm text-text-secondary leading-relaxed opacity-60">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Real Tech Stack */}
      <section className="bg-bg-secondary py-20 md:py-40">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em]">Under The Hood</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Real tech.<br />No buzzwords.</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {webUses.map((use, i) => (
              <Card3D
                key={i}
                className="p-8 bg-bg-primary border border-white/5 rounded-[2.5rem] space-y-4 hover:border-accent/20 transition-all cursor-default"
              >
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-accent" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight">{use.title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed opacity-60">{use.desc}</p>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* Feature blog posts */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-40 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em]">Feature Deep-Dives</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">What's actually<br />inside.</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {blogPosts.map((post, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-bg-secondary border border-white/5 rounded-[3rem] overflow-hidden hover:border-accent/40 transition-all shadow-2xl"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[9px] font-black uppercase tracking-widest text-white/70">
                  {post.tag}
                </div>
              </div>
              <div className="p-10 space-y-6">
                <div className={`p-3 rounded-2xl bg-white/5 w-fit ${post.color} shadow-lg`}>
                  <post.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black leading-tight uppercase tracking-tight">{post.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed opacity-70">{post.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-bg-secondary py-20 md:py-40">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="space-y-8 md:space-y-12">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
              Everything <br />
              <span className="text-accent italic">in one tab.</span>
            </h2>
            <p className="text-text-secondary text-lg md:text-xl leading-relaxed opacity-80">
              Monaco Editor, AI assistant, sandboxed terminal, live preview with debugger, collaborative whiteboard, GitHub push, API playground — no extensions, no install, no config.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
              {features.map((f, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-3 text-accent">
                    <f.icon className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{f.title}</span>
                  </div>
                  <p className="text-xs text-text-secondary opacity-60 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square">
            <div className="absolute inset-0 bg-accent/20 blur-[150px] rounded-full opacity-20" />
            <motion.div
              animate={{ rotateY: [0, 360], rotateX: [0, 15, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-[4rem] overflow-hidden border border-accent/30 shadow-[0_0_120px_rgba(var(--accent-rgb),0.2)] bg-bg-primary"
            >
              <img
                src="https://picsum.photos/seed/code-editor-dark/1200/1200"
                alt="IDE interface"
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-accent text-accent-foreground px-8 py-4 rounded-3xl shadow-2xl font-black text-xs uppercase tracking-widest backdrop-blur-md"
            >
              Real Execution ✓
            </motion.div>
            <motion.div
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 bg-bg-primary border border-white/10 px-8 py-4 rounded-3xl shadow-2xl text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                Socket.IO Live Sync
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real Architecture */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-40">
        <div className="bg-gradient-to-br from-accent/10 via-bg-secondary to-purple-500/10 border border-white/10 rounded-[3rem] md:rounded-[5rem] p-8 md:p-24 space-y-12 md:space-y-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[150px] rounded-full" />

          <div className="text-center space-y-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Architecture.</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg opacity-70">
              The real stack powering VibeCoding — every layer you can inspect, fork, and deploy yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {deploymentSteps.map((step, i) => (
              <Card3D key={i} className="space-y-6 p-10 bg-bg-primary/40 rounded-[3rem] border border-white/5 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground font-black text-lg shadow-lg">
                  {i + 1}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed opacity-60">{step.desc}</p>
              </Card3D>
            ))}
          </div>

          <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl relative z-10">
            <p className="text-xs text-emerald-400/80 text-center font-medium leading-relaxed">
              <strong className="text-emerald-400 uppercase tracking-widest mr-2">Open & Self-Hostable:</strong>
              VibeCoding runs on standard Node.js and can be deployed on any provider that supports it — Render, Railway, Fly.io, or your own VPS. No proprietary lock-in.
            </p>
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-40">
        <div className="p-10 md:p-16 border border-white/5 rounded-[3rem] bg-bg-secondary space-y-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Security by design.</h3>
          <p className="text-text-secondary max-w-2xl mx-auto opacity-70 leading-relaxed">
            User code never runs on the server's own process. Sandboxed execution (Piston) ensures complete isolation. API keys are AES-256 encrypted at rest. Socket.IO rooms are auth-scoped — no cross-user data leakage. OAuth flows use server-validated origin checks on every callback.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center bg-bg-secondary/50">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Code2 className="w-6 h-6 text-accent" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">VibeCoding</span>
        </div>
        <p className="text-xs text-text-secondary flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] opacity-40">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for developers who build.
        </p>
      </footer>
    </div>
  );
}
