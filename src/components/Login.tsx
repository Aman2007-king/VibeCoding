import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Github, Chrome, Sparkles, ShieldCheck, Zap, Globe, 
  ArrowRight, Code2, Cpu, Layers, Rocket
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function Login() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    signInWithGoogle();
    setTimeout(() => setIsGoogleLoading(false), 10000);
  };

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    try {
      const response = await fetch(
        `/api/auth/github/url?origin=${encodeURIComponent(window.location.origin)}`
      );
      const { url } = await response.json();
      const popup = window.open(url, 'github_oauth', 'width=600,height=700');
      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'AUTH_SUCCESS') {
          window.removeEventListener('message', handler);
          popup?.close();
          setIsGithubLoading(false);
        }
      };
      window.addEventListener('message', handler);
      setTimeout(() => {
        window.removeEventListener('message', handler);
        setIsGithubLoading(false);
      }, 120000);
    } catch (error) {
      console.error("GitHub login failed:", error);
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Side - Hidden on mobile, shown on desktop */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white">Nexus Forge</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-none uppercase">
              The Future of <br />
              <span className="text-accent">Development.</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-md leading-relaxed">
              Experience the next generation of cloud-native development. Build, deploy, and scale with AI-powered precision.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, label: "Lightning Fast", desc: "Sub-second deployments" },
              { icon: ShieldCheck, label: "Enterprise Grade", desc: "Bank-level security" },
              { icon: Globe, label: "Global Edge", desc: "14+ edge locations" },
              { icon: Cpu, label: "AI Powered", desc: "Intelligent code gen" }
            ].map((feature, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:bg-white/10 transition-colors group">
                <feature.icon className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">{feature.label}</h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest opacity-60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full"
        >
          {/* Mobile Logo - Only on small screens */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-white">Nexus Forge</span>
          </div>

          <div className="bg-[#0D0D0E] border border-white/10 rounded-[2rem] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Welcome Back.</h2>
              <p className="text-sm text-text-secondary opacity-60">Sign in to access your workspace and projects.</p>
            </div>

            {/* Mobile features grid - Only on small screens */}
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {[
                { icon: Zap, label: "Lightning Fast" },
                { icon: ShieldCheck, label: "Enterprise Grade" },
                { icon: Globe, label: "Global Edge" },
                { icon: Cpu, label: "AI Powered" }
              ].map((f, i) => (
                <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                  <f.icon className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-tight">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {/* Google Button */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isGithubLoading}
                className="w-full bg-white text-black h-12 sm:h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-xl group disabled:opacity-50 text-sm sm:text-base"
              >
                {isGoogleLoading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <><Chrome className="w-5 h-5" />Continue with Google</>
                )}
                {!isGoogleLoading && <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />}
              </button>

              {/* GitHub Button */}
              <button 
                onClick={handleGithubLogin}
                disabled={isGoogleLoading || isGithubLoading}
                className="w-full bg-[#24292e] text-white h-12 sm:h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#2f363d] transition-all shadow-xl group disabled:opacity-50 text-sm sm:text-base border border-white/10"
              >
                {isGithubLoading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <><Github className="w-5 h-5" />Continue with GitHub</>
                )}
                {!isGithubLoading && <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
                <span className="bg-[#0D0D0E] px-4 text-text-secondary opacity-40">Trusted by Developers</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 sm:gap-8 opacity-20">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-20 whitespace-nowrap">
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>© 2026 Nexus Forge</span>
      </div>
    </div>
  );
}
