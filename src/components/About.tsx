import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Code2, Cpu, Globe, Heart, ArrowLeft } from 'lucide-react';

export default function About({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-y-auto custom-scrollbar">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/tech-team/1920/1080?blur=3" 
            alt="Team Background" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/50 to-bg-primary" />
        </div>

        <div className="relative z-10 text-center space-y-6 px-4">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-accent hover:text-white transition-colors mb-8 font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forge
          </button>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter uppercase"
          >
            About <span className="text-accent">Us.</span>
          </motion.h1>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg font-medium">
            We are a collective of engineers and designers dedicated to pushing the boundaries of human-machine collaboration.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Our Mission</h2>
            <h3 className="text-4xl font-black tracking-tight uppercase">Democratizing Intelligence.</h3>
          </div>
          <p className="text-text-secondary leading-relaxed text-lg">
            Nexus Forge was born from a simple idea: that coding should be as intuitive as speaking. We've built a platform that doesn't just "help" you code, but understands your vision and helps you manifest it into reality.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Machine First</span>
              </div>
              <p className="text-xs text-text-secondary">Optimized for the next generation of AI hardware.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Global Reach</span>
              </div>
              <p className="text-xs text-text-secondary">Empowering developers in over 150 countries.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <img src="https://picsum.photos/seed/ai-robot/600/800" alt="AI Robot" className="rounded-3xl border border-white/10 shadow-2xl translate-y-12" referrerPolicy="no-referrer" />
          <img src="https://picsum.photos/seed/tech-circuit/600/800" alt="Circuit" className="rounded-3xl border border-white/10 shadow-2xl" referrerPolicy="no-referrer" />
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-bg-secondary py-32">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Get In Touch</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tight uppercase">Let's Build Together.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-bg-primary border border-white/5 rounded-[2rem] space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Email Us</h4>
              <p className="text-sm font-bold text-white break-all">ry650506@gmail.com</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-bg-primary border border-white/5 rounded-[2rem] space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Call Us</h4>
              <p className="text-sm font-bold text-white">8788168434</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-bg-primary border border-white/5 rounded-[2rem] space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Location</h4>
              <p className="text-sm font-bold text-white">Global Neural Network</p>
            </motion.div>
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
          Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by the Nexus Team.
        </p>
      </footer>
    </div>
  );
}
