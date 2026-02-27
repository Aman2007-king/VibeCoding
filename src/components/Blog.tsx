import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Shield, Globe, Cpu, Code2, Rocket, Heart } from 'lucide-react';

const blogPosts = [
  {
    title: "The Future of Coding: Nexus Forge AI",
    description: "Discover how Nexus Forge is revolutionizing the development workflow with real-time AI collaboration and instant code generation.",
    image: "https://picsum.photos/seed/nexus1/1200/800",
    icon: Sparkles,
    color: "text-accent"
  },
  {
    title: "Zero-Latency Development",
    description: "Learn about our optimized streaming architecture that brings AI responses to your fingertips without the wait.",
    image: "https://picsum.photos/seed/nexus2/1200/800",
    icon: Zap,
    color: "text-yellow-400"
  },
  {
    title: "Secure & Private by Design",
    description: "Your code is your intellectual property. Explore how we ensure your data remains secure with enterprise-grade encryption.",
    image: "https://picsum.photos/seed/nexus3/1200/800",
    icon: Shield,
    color: "text-emerald-400"
  }
];

const features = [
  { title: "AI Pair Programming", icon: Cpu, desc: "An AI that understands your intent and writes code alongside you." },
  { title: "Multi-Language Support", icon: Code2, desc: "From Python to Rust, Nexus Forge supports over 20+ languages." },
  { title: "Instant Deployment", icon: Rocket, desc: "Go from idea to live preview in seconds with our integrated compiler." },
  { title: "Global Collaboration", icon: Globe, desc: "Connect with GitHub and share your projects with the world." }
];

const deploymentSteps = [
  { title: "Full-Stack Power", desc: "Nexus Forge uses a Node.js backend. Unlike static hosts like GitHub Pages, we support real-time APIs and server-side logic." },
  { title: "Cloud Native", desc: "Deploy your Forge projects to Google Cloud Run, Vercel, or Heroku for full-stack capabilities." },
  { title: "GitHub Integration", desc: "Push your code to GitHub repositories directly from the IDE to keep your version history in sync." }
];

export default function Blog({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-y-auto custom-scrollbar">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/tech3d/1920/1080?blur=2" 
            alt="3D Background" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/50 to-bg-primary" />
        </div>

        <div className="relative z-10 text-center space-y-6 px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" />
            Welcome to the Forge
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter leading-none"
          >
            Crafting the <span className="text-accent">Next Generation</span> of Software.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Nexus Forge is more than just an IDE. It's an intelligent workspace designed to amplify your creativity and accelerate your delivery.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={onBack}
              className="px-8 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Start Coding Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Latest Insights</h2>
            <p className="text-text-secondary">Explore the technology behind Nexus Forge.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-bg-secondary border border-white/5 rounded-3xl overflow-hidden hover:border-accent/30 transition-all"
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 space-y-4">
                <div className={`p-2 rounded-lg bg-white/5 w-fit ${post.color}`}>
                  <post.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold leading-tight">{post.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {post.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3D Visual Section */}
      <section className="bg-bg-secondary py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-none">
              Immersive <br />
              <span className="text-accent">3D Intelligence.</span>
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              Our AI doesn't just see text; it understands the multi-dimensional structure of your application. Experience a development environment that feels alive.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {features.map((f, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2 text-accent">
                    <f.icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{f.title}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square">
            <motion.div 
              animate={{ 
                rotateY: [0, 360],
                rotateX: [0, 10, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-3xl overflow-hidden border border-accent/20 shadow-[0_0_100px_rgba(var(--accent-rgb),0.1)]"
            >
              <img 
                src="https://picsum.photos/seed/3drender/1000/1000" 
                alt="3D Render" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            {/* Floating UI elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-accent text-accent-foreground p-4 rounded-2xl shadow-2xl font-bold text-sm"
            >
              99% Accuracy
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-6 bg-bg-primary border border-white/10 p-4 rounded-2xl shadow-2xl text-xs"
            >
              <div className="flex items-center gap-2 text-emerald-400">
                <Zap className="w-3 h-3" />
                Real-time Sync
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deployment Guide Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-accent/20 to-purple-500/20 border border-white/10 rounded-[40px] p-8 md:p-16 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Deployment Guide</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Why your project needs more than just static hosting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {deploymentSteps.map((step, i) => (
              <div key={i} className="space-y-4 p-6 bg-bg-primary/50 rounded-3xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-xs text-red-400 text-center">
              <strong>Note on GitHub Pages:</strong> GitHub Pages is designed for static websites (HTML/CSS/JS only). Since Nexus Forge projects often include a Node.js backend for AI processing and real-time features, they require a full-stack host like Google Cloud Run or Vercel.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Code2 className="w-5 h-5 text-accent" />
          <span className="font-bold tracking-tighter">Nexus Forge</span>
        </div>
        <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
          Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for the developer community.
        </p>
      </footer>
    </div>
  );
}
