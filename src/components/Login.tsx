import React from 'react';
import { motion } from 'motion/react';
import { Code2, Github, Mail, Sparkles, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      const authWindow = window.open(url, 'google_oauth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          onLogin(event.data.user);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0B] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121214] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-accent/10 rounded-2xl">
            <Code2 className="w-12 h-12 text-accent" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Nexus Forge</h1>
            <p className="text-text-secondary text-sm max-w-[280px] mx-auto">
              The professional AI-powered IDE for modern developers.
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              <Mail className="w-5 h-5" />
              Continue with Google
            </button>
            
            <button className="w-full flex items-center justify-center gap-3 bg-white/5 text-white font-medium py-3.5 rounded-xl hover:bg-white/10 border border-white/10 transition-all active:scale-[0.98] opacity-50 cursor-not-allowed">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-6 pt-8 text-[10px] uppercase tracking-widest font-bold opacity-30">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Secure
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Accents */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-2 h-2 bg-accent rounded-full opacity-20"
      />
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-purple-500 rounded-full opacity-20"
      />
    </div>
  );
}
