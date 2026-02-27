import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Sparkles, Zap, Shield, Globe, Cpu, Code2, Rocket, Heart, Brain, Layers } from 'lucide-react';

const blogPosts = [
  {
    title: "Neural Synthesis Engine v3.0",
    description: "Our latest update introduces the synthesis engine that predicts architectural patterns before you even type a character.",
    image: "https://picsum.photos/seed/neural-network/1200/800",
    icon: Sparkles,
    color: "text-accent"
  },
  {
    title: "Quantum Compiler Integration",
    description: "Experience the power of parallel processing with our new quantum-inspired compiler, delivering instant builds for massive projects.",
    image: "https://picsum.photos/seed/quantum-computer/1200/800",
    icon: Cpu,
    color: "text-blue-400"
  },
  {
    title: "Cybernetic UI Framework",
    description: "A new design system that adapts to your neural patterns, creating interfaces that feel like an extension of your mind.",
    image: "https://picsum.photos/seed/cyber-tech/1200/800",
    icon: Zap,
    color: "text-yellow-400"
  }
];

const processSteps = [
  { 
    title: "1. Neural Handshake", 
    desc: "Establish a high-bandwidth connection between your intent and our processing core via secure biometric authentication.",
    icon: Zap
  },
  { 
    title: "2. Logic Extraction", 
    desc: "Our AI parses your natural language requirements into a multi-dimensional logic graph, identifying dependencies instantly.",
    icon: Brain
  },
  { 
    title: "3. Automated Assembly", 
    desc: "The machine assembles the application layer by layer, optimizing for performance, security, and scalability in real-time.",
    icon: Cpu
  },
  { 
    title: "4. Hyper-Scale Launch", 
    desc: "Deploy across global edge nodes with zero downtime. Your application is instantly available to billions of users.",
    icon: Rocket
  }
];

const webUses = [
  { title: "AI Core", desc: "Proprietary neural networks optimized for code generation." },
  { title: "3D Rendering", desc: "Hardware-accelerated visuals for an immersive experience." },
  { title: "Real-time Sync", desc: "Zero-latency state synchronization across all devices." },
  { title: "Secure Vault", desc: "Military-grade encryption for your intellectual property." }
];

const features = [
  { title: "Neural Pair", icon: Cpu, desc: "AI that writes code alongside you." },
  { title: "Multi-Stack", icon: Code2, desc: "Support for 20+ modern languages." },
  { title: "Fast Launch", icon: Rocket, desc: "Idea to live preview in seconds." },
  { title: "Global Sync", icon: Globe, desc: "Direct GitHub & Cloud integration." }
];

const deploymentSteps = [
  { title: "Full-Stack Power", desc: "Node.js backend for real-time APIs and logic." },
  { title: "Cloud Native", desc: "Deploy to Google Cloud Run or Vercel instantly." },
  { title: "Git Integration", desc: "Keep your version history in sync with GitHub." }
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
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-y-auto custom-scrollbar perspective-1000">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/cyber-city/1920/1080?blur=1" 
            alt="AI Background" 
            className="w-full h-full object-cover opacity-30 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/20 via-bg-primary/60 to-bg-primary" />
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 text-center space-y-12 px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            System Online: Neural Core v3
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.8] uppercase italic"
            >
              The Machine <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-purple-500">That Codes.</span>
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-text-secondary max-w-3xl mx-auto font-medium leading-relaxed opacity-80"
          >
            Nexus Forge is a high-performance, AI-driven integrated development environment. It leverages massive neural networks to transform your ideas into production-ready software at the speed of thought.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8"
          >
            <button 
              onClick={onBack}
              className="group relative px-12 py-5 bg-accent text-accent-foreground rounded-2xl font-black uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(var(--accent-rgb),0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              <span className="relative z-10">Enter Workspace</span>
            </button>
            <button 
              onClick={onNavigateAbout}
              className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md"
            >
              About Us
            </button>
          </motion.div>
        </div>

        {/* Floating 3D Elements */}
        <motion.div 
          animate={{ y: [0, -40, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 w-24 h-24 bg-accent/10 border border-accent/20 rounded-3xl backdrop-blur-xl hidden lg:flex items-center justify-center"
        >
          <Cpu className="w-10 h-10 text-accent opacity-40" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 40, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-10 w-32 h-32 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] backdrop-blur-xl hidden lg:flex items-center justify-center"
        >
          <Zap className="w-12 h-12 text-blue-400 opacity-40" />
        </motion.div>
      </section>

      {/* How it Works - The Process */}
      <section className="max-w-7xl mx-auto px-6 py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-16">
            <div className="space-y-6">
              <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em]">The Workflow</h2>
              <h3 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">How to Process <br />Your Application.</h3>
            </div>
            <div className="space-y-10">
              {processSteps.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-8 group"
                >
                  <div className="shrink-0 w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-500 shadow-xl">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-black uppercase tracking-tight">{step.title}</h4>
                    <p className="text-base text-text-secondary leading-relaxed opacity-70">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <Card3D className="relative aspect-[4/5]">
            <div className="absolute -inset-10 bg-accent/20 blur-[120px] rounded-full opacity-40 animate-pulse" />
            <div className="relative h-full rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl group">
              <img 
                src="https://picsum.photos/seed/tech-robot/1000/1250" 
                alt="Process Visual" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-12 left-12 right-12 p-8 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10">
                <p className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Active Processing</p>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-accent"
                  />
                </div>
              </div>
            </div>
          </Card3D>
        </div>
      </section>

      {/* Web Uses Section */}
      <section className="bg-bg-secondary py-40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em]">Capabilities</h2>
            <h3 className="text-5xl md:text-8xl font-black tracking-tighter uppercase">What My Web Uses.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {webUses.map((use, i) => (
              <Card3D 
                key={i}
                className="p-10 bg-bg-primary border border-white/5 rounded-[3rem] space-y-6 hover:border-accent/40 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-lg">
                  <Layers className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-black uppercase tracking-tight">{use.title}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed opacity-60">{use.desc}</p>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="max-w-7xl mx-auto px-6 py-40 space-y-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em]">Intelligence Feed</h2>
            <h3 className="text-5xl font-black tracking-tighter uppercase">Latest Insights.</h3>
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
                <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>
              <div className="p-10 space-y-6">
                <div className={`p-3 rounded-2xl bg-white/5 w-fit ${post.color} shadow-lg`}>
                  <post.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black leading-tight uppercase tracking-tight">{post.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed opacity-70">
                  {post.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3D Visual Section */}
      <section className="bg-bg-secondary py-40 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
              Immersive <br />
              <span className="text-accent italic">3D Intelligence.</span>
            </h2>
            <p className="text-text-secondary text-xl leading-relaxed opacity-80">
              Our AI doesn't just see text; it understands the multi-dimensional structure of your application. Experience a development environment that feels alive.
            </p>
            <div className="grid grid-cols-2 gap-10">
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
              animate={{ 
                rotateY: [0, 360],
                rotateX: [0, 15, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-[4rem] overflow-hidden border border-accent/30 shadow-[0_0_120px_rgba(var(--accent-rgb),0.2)] bg-bg-primary"
            >
              <img 
                src="https://picsum.photos/seed/tech-3d-render/1200/1200" 
                alt="3D Render" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            {/* Floating UI elements */}
            <motion.div 
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-accent text-accent-foreground px-8 py-4 rounded-3xl shadow-2xl font-black text-xs uppercase tracking-widest backdrop-blur-md"
            >
              Neural Precision: 99.9%
            </motion.div>
            <motion.div 
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 bg-bg-primary border border-white/10 px-8 py-4 rounded-3xl shadow-2xl text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                Active Sync
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deployment Guide Section */}
      <section className="max-w-7xl mx-auto px-6 py-40">
        <div className="bg-gradient-to-br from-accent/10 via-bg-secondary to-purple-500/10 border border-white/10 rounded-[5rem] p-12 md:p-24 space-y-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[150px] rounded-full" />
          
          <div className="text-center space-y-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Deployment Guide.</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg opacity-70">
              Why your project needs more than just static hosting.
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

          <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl relative z-10">
            <p className="text-xs text-red-400/80 text-center font-medium leading-relaxed">
              <strong className="text-red-400 uppercase tracking-widest mr-2">Note on GitHub Pages:</strong> GitHub Pages is designed for static websites (HTML/CSS/JS only). Since Nexus Forge projects often include a Node.js backend for AI processing and real-time features, they require a full-stack host like Google Cloud Run or Vercel.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center bg-bg-secondary/50">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Code2 className="w-6 h-6 text-accent" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">Nexus Forge</span>
        </div>
        <p className="text-xs text-text-secondary flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] opacity-40">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by the Nexus Team.
        </p>
      </footer>
    </div>
  );
}
