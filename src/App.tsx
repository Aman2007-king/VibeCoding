import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Bug, 
  Mic, 
  MicOff, 
  Github, 
  Share2, 
  Terminal, 
  Code2, 
  Layers, 
  Sparkles,
  ChevronRight,
  Loader2,
  RefreshCw,
  Layout,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateCode, debugCode, processVoiceCommand } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'html', name: 'HTML/CSS' },
  { id: 'cpp', name: 'C++' },
  { id: 'java', name: 'Java' },
];

export default function App() {
  const [code, setCode] = useState('// Start coding or use AI to generate...\nconsole.log("Welcome to Nexus Forge");');
  const [language, setLanguage] = useState('javascript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'ai'>('editor');
  const [prompt, setPrompt] = useState('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleVoiceCommand(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubToken(event.data.token);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleVoiceCommand = async (text: string) => {
    setIsGenerating(true);
    setActiveTab('ai');
    try {
      const command = await processVoiceCommand(text);
      setAiResponse(`Voice Command Interpreted: ${command.description}`);
      
      if (command.intent === 'build') {
        const generated = await generateCode(command.description, command.suggestedLanguage);
        setCode(generated);
        setLanguage(command.suggestedLanguage);
        if (command.suggestedLanguage === 'html') {
          setPreviewContent(generated);
        }
      }
    } catch (error) {
      console.error(error);
      setAiResponse('Failed to process voice command.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setActiveTab('ai');
    try {
      const generated = await generateCode(prompt, language);
      setCode(generated);
      setAiResponse(`Successfully generated code for: ${prompt}`);
      if (language === 'html') {
        setPreviewContent(generated);
      }
      confetti({
        particleCount: 50,
        spread: 60,
      });
    } catch (error) {
      setAiResponse('Error generating code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDebug = async () => {
    setIsDebugging(true);
    setActiveTab('ai');
    try {
      const debugResult = await debugCode(code, language);
      setAiResponse(debugResult);
    } catch (error) {
      setAiResponse('Error debugging code.');
    } finally {
      setIsDebugging(false);
    }
  };

  const handleGithubConnect = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const { url } = await response.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    alert('Project link copied to clipboard!');
  };

  return (
    <div className="flex h-screen w-full bg-[#0A0A0B] text-zinc-300 font-sans overflow-hidden">
      {/* Sidebar - Navigation */}
      <aside className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-[#0D0D0E]">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <Code2 className="w-6 h-6 text-emerald-400" />
        </div>
        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => setActiveTab('editor')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'editor' ? "bg-white/10 text-white" : "hover:bg-white/5")}
          >
            <Layout className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'ai' ? "bg-white/10 text-white" : "hover:bg-white/5")}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Layers className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Terminal className="w-5 h-5" />
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-6">
          <button 
            onClick={handleGithubConnect}
            className={cn("p-2 rounded-lg transition-colors", githubToken ? "text-emerald-400" : "hover:bg-white/5")}
          >
            <Github className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Left Side - Preview (As requested by user) */}
      <section className="w-1/3 border-r border-white/5 flex flex-col bg-[#0D0D0E]">
        <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-[#0A0A0B]">
          <span className="text-xs font-mono uppercase tracking-widest opacity-50">Live Preview</span>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>
        <div className="flex-1 bg-white relative overflow-hidden">
          {previewContent ? (
            <iframe
              srcDoc={previewContent}
              title="preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-[#0D0D0E]">
              <Layout className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium opacity-40">No preview available</p>
              <p className="text-xs opacity-30 mt-1">Generate HTML/CSS to see it here</p>
            </div>
          )}
        </div>
      </section>

      {/* Main Content - Editor & AI */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-12 border-b border-white/5 flex items-center px-6 justify-between bg-[#0D0D0E]">
          <div className="flex items-center gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-mono border-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-[#0D0D0E]">{lang.name}</option>
              ))}
            </select>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-xs opacity-40 font-mono">nexus_forge_v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button 
              onClick={handleDebug}
              disabled={isDebugging}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {isDebugging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
              Debug
            </button>
            <button 
              onClick={() => {
                if (language === 'html') setPreviewContent(code);
                else alert('Execution for non-web languages coming soon!');
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              minimap: { enabled: false },
              padding: { top: 20 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
            }}
          />
        </div>

        {/* Bottom Panel - AI & Prompt */}
        <footer className="h-64 border-t border-white/5 flex flex-col bg-[#0D0D0E]">
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setActiveTab('ai')}
              className={cn(
                "px-6 py-2 text-xs font-mono uppercase tracking-widest transition-colors relative",
                activeTab === 'ai' ? "text-emerald-400" : "opacity-40 hover:opacity-100"
              )}
            >
              AI Assistant
              {activeTab === 'ai' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400" />}
            </button>
            <button 
              onClick={() => setActiveTab('editor')}
              className={cn(
                "px-6 py-2 text-xs font-mono uppercase tracking-widest transition-colors relative",
                activeTab === 'editor' ? "text-emerald-400" : "opacity-40 hover:opacity-100"
              )}
            >
              Console
              {activeTab === 'editor' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400" />}
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* AI Console */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
              <AnimatePresence mode="wait">
                {activeTab === 'ai' ? (
                  <motion.div
                    key="ai-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="prose prose-invert prose-sm max-w-none"
                  >
                    {isGenerating || isDebugging ? (
                      <div className="flex items-center gap-3 text-emerald-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Nexus AI is processing...</span>
                      </div>
                    ) : aiResponse ? (
                      <Markdown>{aiResponse}</Markdown>
                    ) : (
                      <div className="text-zinc-600 italic">
                        Ready for commands. Try "Build a login page" or "Fix this code".
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="console-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-zinc-500"
                  >
                    <div className="flex gap-2 mb-1">
                      <span className="text-emerald-500">[system]</span>
                      <span>Nexus Forge initialized.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-500">[info]</span>
                      <span>Ready for input.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prompt Input */}
            <div className="w-96 border-l border-white/5 p-4 flex flex-col gap-3 bg-[#0A0A0B]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-tighter opacity-40">Command Center</span>
                <div className="flex gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", isListening ? "bg-red-500 animate-pulse" : "bg-zinc-700")} />
                </div>
              </div>
              <div className="relative flex-1">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what to build or fix..."
                  className="w-full h-full bg-white/5 rounded-xl p-3 text-sm border border-white/10 focus:border-emerald-500/50 focus:ring-0 resize-none transition-all placeholder:opacity-20"
                />
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "absolute bottom-3 right-3 p-2 rounded-full transition-all",
                    isListening ? "bg-red-500 text-white" : "bg-white/10 text-zinc-400 hover:bg-white/20"
                  )}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Execute Command
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
