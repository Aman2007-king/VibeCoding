import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { Code2, Github, Mail, Sparkles, ShieldCheck, Box, Layers, Zap } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ redirectUri?: string } | null>(null);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      
      if (!response.ok) {
        alert(`${data.error}\n\n${data.details || ''}`);
        setIsLoading(null);
        return;
      }
      
      setDebugInfo({ redirectUri: data.redirectUri });
      window.open(data.url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
      setIsLoading(null);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading('github');
    try {
      const response = await fetch('/api/auth/github/url');
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to initialize GitHub Login');
        setIsLoading(null);
        return;
      }

      window.open(data.url, 'github_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 overflow-hidden relative perspective-1000">
      {/* Immersive 3D Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full animate-pulse delay-700" />
        
        {/* Grid Pattern with 3D perspective */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(#ffffff11 1px, transparent 1px), linear-gradient(90deg, #ffffff11 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px)',
            transformOrigin: 'top'
          }}
        />
      </div>

      <motion.div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, z: -100 }}
        animate={{ opacity: 1, z: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0D0D0F]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Floating Elements for Depth */}
        <div className="absolute -top-6 -right-6 p-4 bg-accent/20 backdrop-blur-md rounded-2xl border border-white/10 transform translate-z-20 shadow-xl">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <div className="absolute -bottom-6 -left-6 p-4 bg-purple-500/20 backdrop-blur-md rounded-2xl border border-white/10 transform translate-z-20 shadow-xl">
          <Zap className="w-6 h-6 text-purple-400" />
        </div>

        <div className="flex flex-col items-center text-center space-y-8 transform translate-z-30">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl border border-accent/20 shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]"
          >
            <Code2 className="w-14 h-14 text-accent" />
          </motion.div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
              NEXUS FORGE
            </h1>
            <p className="text-text-secondary text-sm font-medium tracking-wide opacity-70">
              ENTER THE NEXT DIMENSION OF DEVELOPMENT
            </p>
          </div>

          <div className="w-full space-y-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-4 bg-white text-black font-black py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all relative overflow-hidden group"
            >
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>CONTINUE WITH GOOGLE</span>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGithubLogin}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-4 bg-[#1B1B1F] text-white font-bold py-4 rounded-2xl hover:bg-[#252529] border border-white/10 transition-all shadow-lg group"
            >
              {isLoading === 'github' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span>CONTINUE WITH GITHUB</span>
                </>
              )}
            </motion.button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-6">
            <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              <Box className="w-4 h-4 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">3D Engine</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Multi-Stack</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 w-full">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="text-[10px] text-text-secondary hover:text-accent transition-colors uppercase tracking-widest font-bold"
            >
              {showHelp ? 'Hide Config Help' : 'Having trouble logging in?'}
            </button>
            
            <AnimatePresence>
              {showHelp && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden text-left space-y-3 pt-4"
                >
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-text-secondary font-bold uppercase">Required Redirect URI:</p>
                    <code className="block text-[9px] bg-black/40 p-2 rounded border border-white/5 break-all text-accent select-all">
                      {debugInfo?.redirectUri || `${window.location.origin}/auth/google/callback`}
                    </code>
                    <p className="text-[9px] text-text-secondary leading-relaxed">
                      Copy this URL to your Google Cloud Console under "Authorized redirect URIs".
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-text-secondary font-bold uppercase">Troubleshooting Tips:</p>
                    <ul className="text-[9px] text-text-secondary list-disc list-inside space-y-1">
                      <li>Ensure your Client ID is for a "Web application".</li>
                      <li>Check that GOOGLE_CLIENT_ID is set in Secrets.</li>
                      <li>Verify your project is in "Production" or you are an "Added User" in Testing.</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: 0 
          }}
          animate={{ 
            y: [null, Math.random() * -100, null],
            opacity: [0, 0.3, 0]
          }}
          transition={{ 
            duration: 5 + Math.random() * 5, 
            repeat: Infinity,
            delay: Math.random() * 5
          }}
          className="absolute w-1 h-1 bg-white rounded-full z-0"
        />
      ))}
    </div>
  );
}
