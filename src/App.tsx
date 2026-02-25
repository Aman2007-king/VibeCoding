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
  MessageSquare,
  Zap,
  Brain,
  Send,
  User,
  Bot,
  Volume2,
  VolumeX,
  FilePlus,
  Trash2,
  Edit3,
  Folder,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateCode, debugCode, processVoiceCommand, manipulateCode, fastFix, chatWithAI } from './services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'cpp', name: 'C++' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'sql', name: 'SQL' },
  { id: 'r', name: 'R' },
  { id: 'shell', name: 'Shell' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'yaml', name: 'YAML' },
  { id: 'json', name: 'JSON' },
  { id: 'xml', name: 'XML' },
  { id: 'scss', name: 'SCSS' },
  { id: 'less', name: 'Less' },
];

interface FileState {
  id: number;
  name: string;
  code: string;
  language: string;
}

export default function App() {
  const [files, setFiles] = useState<FileState[]>([
    { id: 1, name: 'index.html', code: '<div class="container">\n  <h1>Nexus Forge</h1>\n  <p>Multi-language combination preview</p>\n  <button id="btn">Click Me</button>\n</div>', language: 'html' },
    { id: 2, name: 'styles.css', code: '.container {\n  padding: 2rem;\n  font-family: sans-serif;\n  text-align: center;\n  background: #f0f9ff;\n  border-radius: 1rem;\n}\nh1 { color: #0ea5e9; }', language: 'css' },
    { id: 3, name: 'script.js', code: 'document.getElementById("btn").onclick = () => {\n  alert("Hello from Nexus Forge!");\n};', language: 'javascript' },
    { id: 4, name: 'extra.js', code: 'console.log("Secondary script loaded");', language: 'javascript' },
  ]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'chat' | 'live'>('editor');
  const [prompt, setPrompt] = useState('');
  const [useThinking, setUseThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const [customApiKey, setCustomApiKey] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleVoiceCommand = async (text: string) => {
    setIsGenerating(true);
    setActiveTab('ai');
    try {
      const command = await processVoiceCommand(text);
      setAiResponse(`Voice Command Interpreted: ${command.description}`);
      
      if (command.intent === 'build') {
        const generated = await generateCode(command.description, command.suggestedLanguage, useThinking);
        // For multi-file, we'll just update the active file for now
        updateFile(activeFileId, { code: generated, language: command.suggestedLanguage });
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
      const generated = await generateCode(prompt, activeFile.language, useThinking);
      updateFile(activeFileId, { code: generated });
      setAiResponse(`Successfully generated code for: ${prompt}`);
      handleRun();
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

  const handleFastFix = async () => {
    setIsGenerating(true);
    setActiveTab('ai');
    try {
      const fixed = await fastFix(activeFile.code, activeFile.language, customApiKey);
      updateFile(activeFileId, { code: fixed });
      setAiResponse('Applied a fast fix using Gemini Flash-Lite.');
    } catch (error) {
      setAiResponse('Error applying fast fix.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDebug = async () => {
    setIsDebugging(true);
    setActiveTab('ai');
    try {
      const debugResult = await debugCode(activeFile.code, activeFile.language);
      setAiResponse(debugResult);
    } catch (error) {
      setAiResponse('Error debugging code.');
    } finally {
      setIsDebugging(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    
    try {
      const response = await chatWithAI(userMsg, chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: h.parts })));
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Error connecting to Nexus AI.' }] }]);
    }
  };

  const startLiveMode = async () => {
    if (isLiveActive) {
      liveSessionRef.current?.close();
      setIsLiveActive(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    try {
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Nexus AI, a real-time coding companion. Talk to the developer naturally about their code and provide guidance.",
        },
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setLiveTranscription(prev => [...prev, "Nexus AI: Connected. How can I help you today?"]);
          },
          onmessage: (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBlob = b64toBlob(base64Audio, 'audio/pcm');
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              audio.play();
            }
          },
          onclose: () => setIsLiveActive(false),
        }
      });
      liveSessionRef.current = session;
    } catch (error) {
      console.error("Live API Error:", error);
    }
  };

  const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
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

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      alert('Project link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for some browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert('Project link copied to clipboard!');
    }
  };

  const handleCodeManipulation = async (editor: any, action: string) => {
    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);
    
    if (!selectedText) {
      alert('Please select some code first.');
      return;
    }

    setIsGenerating(true);
    setActiveTab('ai');
    setAiResponse(`AI is performing: ${action}...`);

    try {
      const result = await manipulateCode(selectedText, activeFile.language, action);
      editor.executeEdits('ai-manipulation', [
        {
          range: selection,
          text: result,
          forceMoveMarkers: true,
        },
      ]);
      setAiResponse(`Successfully performed: ${action}`);
      confetti({
        particleCount: 30,
        spread: 50,
      });
    } catch (error) {
      setAiResponse('Error manipulating code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const createFile = () => {
    const newId = Math.max(...files.map(f => f.id), 0) + 1;
    const newFile: FileState = {
      id: newId,
      name: `file_${newId}.js`,
      code: '// New file',
      language: 'javascript'
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
  };

  const deleteFile = (id: number) => {
    if (files.length <= 1) return;
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id);
    }
  };

  const renameFile = (id: number, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const updateFile = (id: number, updates: Partial<FileState>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRun = () => {
    const htmlFile = files.find(f => f.language === 'html')?.code || '';
    const cssFiles = files.filter(f => f.language === 'css' || f.language === 'scss' || f.language === 'less').map(f => f.code).join('\n');
    const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript').map(f => f.code).join('\n');

    const combined = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssFiles}</style>
        </head>
        <body>
          ${htmlFile}
          <script>${jsFiles}</script>
        </body>
      </html>
    `;
    setPreviewContent(combined);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.8 }
    });
  };

  const COMMANDS = [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
  ];

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.name.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-[#0A0A0B] text-zinc-300 font-sans overflow-hidden relative">
      {/* Command Palette */}
      <AnimatePresence>
        {isPaletteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center pt-32 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPaletteOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="w-full max-w-xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center px-4 border-b border-white/5">
                <Terminal className="w-5 h-5 text-zinc-500 mr-3" />
                <input 
                  autoFocus
                  placeholder="Search commands... (Esc to close)"
                  className="flex-1 bg-transparent py-4 text-sm border-none focus:ring-0"
                  value={paletteSearch}
                  onChange={e => setPaletteSearch(e.target.value)}
                />
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {filteredCommands.map(cmd => (
                  <button 
                    key={cmd.id}
                    onClick={() => { cmd.action(); setIsPaletteOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                  >
                    <cmd.icon className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
                    <span className="text-sm">{cmd.name}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Navigation */}
      <aside className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-[#0D0D0E] z-30">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <Code2 className="w-6 h-6 text-emerald-400" />
        </div>
        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => setIsExplorerOpen(!isExplorerOpen)}
            className={cn("p-2 rounded-lg transition-colors", isExplorerOpen ? "bg-white/10 text-white" : "hover:bg-white/5")}
            title="Toggle File Explorer"
          >
            <Folder className="w-5 h-5" />
          </button>
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
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'chat' ? "bg-white/10 text-white" : "hover:bg-white/5")}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('live')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'live' ? "bg-white/10 text-white" : "hover:bg-white/5")}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-6">
          <button 
            onClick={handleGithubConnect}
            className={cn("p-2 rounded-lg transition-colors", githubToken ? "text-emerald-400" : "hover:bg-white/5")}
          >
            <Github className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* File Explorer Panel */}
      <AnimatePresence>
        {isExplorerOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/5 bg-[#0D0D0E] flex flex-col overflow-hidden"
          >
            <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-[#0A0A0B]">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Explorer</span>
              <button 
                onClick={createFile}
                className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
                title="New File"
              >
                <FilePlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {files.map(file => (
                <div 
                  key={file.id}
                  className={cn(
                    "group flex items-center px-4 py-1.5 cursor-pointer transition-colors relative",
                    activeFileId === file.id ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-white/5 text-zinc-400"
                  )}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <FileCode className="w-3.5 h-3.5 mr-2 opacity-50" />
                  <input 
                    value={file.name}
                    onChange={(e) => renameFile(file.id, e.target.value)}
                    className="bg-transparent border-none text-xs focus:ring-0 p-0 w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
        <header className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-[#0D0D0E]">
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-2",
                    activeFileId === file.id ? "bg-emerald-500 text-black font-bold" : "hover:bg-white/5 text-zinc-400"
                  )}
                >
                  <Code2 className="w-3 h-3" />
                  {file.name}
                </button>
              ))}
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <select 
              value={activeFile.language}
              onChange={(e) => updateFile(activeFileId, { language: e.target.value })}
              className="bg-transparent text-xs font-mono border-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-[#0D0D0E]">{lang.name}</option>
              ))}
            </select>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 bg-white/5 rounded-md px-3 py-1.5 border border-white/10">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <input 
                type="password"
                placeholder="Custom API Key (Gemini/DeepSeek)"
                className="bg-transparent text-xs border-none focus:ring-0 w-48 placeholder:opacity-30"
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setUseThinking(!useThinking)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-tighter transition-all",
                useThinking ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-zinc-500 border border-transparent"
              )}
            >
              <Brain className="w-3.5 h-3.5" />
              Thinking Mode
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button 
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Project
            </button>
          </div>
        </header>

        {/* Multi-Editor Grid - 3 Boxes Now */}
        <div className="flex-1 grid grid-cols-3 gap-[1px] bg-white/5 overflow-hidden">
          {files.slice(0, 3).map((file, idx) => (
            <div 
              key={file.id} 
              className={cn(
                "relative transition-all duration-300 flex flex-col",
                activeFileId === file.id ? "ring-1 ring-emerald-500/50 z-10" : "opacity-80 hover:opacity-100"
              )}
              onClick={() => setActiveFileId(file.id)}
            >
              <div className="h-8 bg-[#0D0D0E] border-b border-white/5 flex items-center px-3 justify-between z-20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Box {idx + 1}</span>
                  <span className="text-[10px] font-mono text-emerald-400/70 truncate max-w-[100px]">{file.name}</span>
                </div>
                <select 
                  value={file.language}
                  onChange={(e) => updateFile(file.id, { language: e.target.value })}
                  className="bg-transparent text-[9px] font-mono border-none focus:ring-0 cursor-pointer opacity-50 hover:opacity-100"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id} className="bg-[#0D0D0E]">{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={file.language}
                  theme="vs-dark"
                  value={file.code}
                  onChange={(val) => updateFile(file.id, { code: val || '' })}
                  options={{
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono, monospace',
                    minimap: { enabled: false },
                    padding: { top: 10 },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 2,
                  }}
                />
              </div>
            </div>
          ))}
          {files.length < 3 && Array.from({ length: 3 - files.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-[#0D0D0E] flex items-center justify-center text-zinc-700 italic text-xs">
              Empty Slot
            </div>
          ))}
        </div>

        {/* Bottom Panel - AI & Prompt */}
        <footer className="h-80 border-t border-white/5 flex flex-col bg-[#0D0D0E]">
          <div className="flex border-b border-white/5">
            {['ai', 'chat', 'live', 'editor'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors relative",
                  activeTab === tab ? "text-emerald-400" : "opacity-40 hover:opacity-100"
                )}
              >
                {tab === 'ai' ? 'AI Assistant' : tab === 'live' ? 'Live AI' : tab}
                {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400" />}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
              <AnimatePresence mode="wait">
                {activeTab === 'ai' && (
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
                      <Markdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {aiResponse}
                      </Markdown>
                    ) : (
                      <div className="text-zinc-600 italic">
                        Ready for commands. Try "Build a login page" or "Fix this code".
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    key="chat-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed",
                            msg.role === 'user' ? "bg-emerald-500 text-black rounded-tr-none" : "bg-white/5 text-zinc-300 rounded-tl-none border border-white/5"
                          )}>
                            <div className="flex items-center gap-2 mb-1 opacity-50 font-bold uppercase tracking-tighter text-[9px]">
                              {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                              {msg.role === 'user' ? 'You' : 'Nexus AI'}
                            </div>
                            <Markdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {msg.parts[0].text}
                            </Markdown>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask anything about coding..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:ring-0 focus:border-emerald-500 transition-all"
                      />
                      <button 
                        onClick={handleChatSend}
                        className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'live' && (
                  <motion.div
                    key="live-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-6"
                  >
                    <div className="relative">
                      <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                        isLiveActive ? "bg-emerald-500/20 scale-110 shadow-[0_0_50px_rgba(16,185,129,0.2)]" : "bg-white/5"
                      )}>
                        <Volume2 className={cn("w-10 h-10", isLiveActive ? "text-emerald-400 animate-pulse" : "text-zinc-600")} />
                      </div>
                      {isLiveActive && (
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 border-2 border-emerald-500 rounded-full"
                        />
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-white font-bold tracking-tight">Nexus Live AI</h3>
                      <p className="text-xs text-zinc-500 max-w-xs">
                        {isLiveActive ? "Connected. Start talking to Nexus AI for real-time guidance." : "Connect to start a real-time voice conversation with your AI coding companion."}
                      </p>
                    </div>
                    <button 
                      onClick={startLiveMode}
                      className={cn(
                        "px-8 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        isLiveActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-black hover:bg-emerald-400"
                      )}
                    >
                      {isLiveActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {isLiveActive ? "Disconnect Session" : "Start Live Session"}
                    </button>
                  </motion.div>
                )}

                {activeTab === 'editor' && (
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
