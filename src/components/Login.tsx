import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  LogIn, 
  Github, 
  Chrome, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Rocket
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // 3D Card Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // ✅ Moved OUTSIDE the JSX return
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (!user) {
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  // ✅ Moved OUTSIDE the JSX return
  const handleGithubLogin = async () => {
    setIsLoading(true);
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
          setIsLoading(false);
        }
      };
      window.addEventListener('message', handler);

      setTimeout(() => {
        window.removeEventListener('message', handler);
        setIsLoading(false);
      }, 120000);
    } catch (error) {
      console.error("GitHub login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px' 
          }} 
        />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
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
              { icon: Zap,        label: "Lightning Fast",   desc: "Sub-second deployments" },
              { icon: ShieldCheck, label: "Enterprise Grade", desc: "Bank-level security" },
              { icon: Globe,      label: "Global Edge",      desc: "14+ edge locations" },
              { icon: Cpu,        label: "AI Powered",       desc: "Intelligent code gen" }
            ].map((feature, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:bg-white/10 transition-colors group">
                <feature.icon className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">{feature.label}</h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest opacity-60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: 3D Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          
          <div 
            style={{ transform: "translateZ(75px)" }}
            className="relative bg-[#0D0D0E] border border-white/10 rounded-[2.5rem] p-10 lg:p-16 shadow-2xl space-y-10"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-white uppercase">Welcome Back.</h2>
              <p className="text-sm text-text-secondary opacity-60">Sign in to access your workspace and projects.</p>
            </div>

            {/* ✅ Both buttons correctly inside this div */}
            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-black h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-xl shadow-white/5 group disabled:opacity-50"
              >
                {isLoading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Chrome className="w-5 h-5" />
                    Continue with Google
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* ✅ GitHub button now properly placed here */}
              <button 
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="w-full bg-[#24292e] text-white h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#2f363d] transition-all shadow-xl group disabled:opacity-50"
              >
                {isLoading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Github className="w-5 h-5" />
                    Continue with GitHub
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
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

            <div className="flex items-center justify-center gap-8 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <Layers className="w-6 h-6" />
              <Rocket className="w-6 h-6" />
              <Globe className="w-6 h-6" />
              <Zap className="w-6 h-6" />
            </div>

            <motion.div 
              style={{ transform: "translateZ(100px)" }}
              className="absolute -top-6 -right-6 w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 hidden lg:flex"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            
            <motion.div 
              style={{ transform: "translateZ(50px)" }}
              className="absolute -bottom-4 -left-4 p-3 bg-bg-secondary border border-white/10 rounded-xl shadow-xl hidden lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">System Online</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-20">
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>&copy; 2026 Nexus Forge</span>
      </div>
    </div>
  );
}
