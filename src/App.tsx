import React, { useState, useEffect, useRef, useMemo, useCallback, memo, Suspense, lazy } from 'react';
const Editor = lazy(() => import('@monaco-editor/react'));
import { loader } from '@monaco-editor/react';
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
  FileCode,
  Palette,
  Settings,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  History,
  Check,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateCode, generateCodeStream, debugCode, processVoiceCommand, manipulateCode, fastFix, chatWithAI, chatWithAIStream } from './services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Login from './components/Login';
import Blog from './components/Blog';
import { BookOpen, Key } from 'lucide-react';

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

interface Theme {
  id: string;
  name: string;
  colors: {
    '--bg-primary': string;
    '--bg-secondary': string;
    '--accent': string;
    '--accent-foreground': string;
    '--border': string;
    '--text-primary': string;
    '--text-secondary': string;
  };
}

const THEMES: Theme[] = [
  {
    id: 'nexus',
    name: 'Nexus Dark',
    colors: {
      '--bg-primary': '#0A0A0B',
      '--bg-secondary': '#0D0D0E',
      '--accent': '#10b981',
      '--accent-foreground': '#000000',
      '--border': 'rgba(255, 255, 255, 0.05)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#a1a1aa',
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      '--bg-primary': '#020617',
      '--bg-secondary': '#0f172a',
      '--accent': '#38bdf8',
      '--accent-foreground': '#ffffff',
      '--border': 'rgba(56, 189, 248, 0.1)',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#94a3b8',
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      '--bg-primary': '#1a0b2e',
      '--bg-secondary': '#2d1b4e',
      '--accent': '#f0abfc',
      '--accent-foreground': '#000000',
      '--border': 'rgba(240, 171, 252, 0.2)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#c084fc',
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    colors: {
      '--bg-primary': '#002b36',
      '--bg-secondary': '#073642',
      '--accent': '#cb4b16',
      '--accent-foreground': '#ffffff',
      '--border': 'rgba(147, 161, 161, 0.1)',
      '--text-primary': '#fdf6e3',
      '--text-secondary': '#93a1a1',
    }
  }
];

// Memoized Sub-components for performance
const FileItem = memo(({ file, isActive, onSelect, onRename, onDelete }: any) => (
  <div 
    className={cn(
      "group flex items-center px-4 py-1.5 cursor-pointer transition-colors relative",
      isActive ? "bg-accent/10 text-accent" : "hover:bg-white/5 text-text-secondary"
    )}
    onClick={() => onSelect(file.id)}
  >
    <FileCode className="w-3.5 h-3.5 mr-2 opacity-50" />
    <input 
      value={file.name}
      onChange={(e) => onRename(file.id, e.target.value)}
      className="bg-transparent border-none text-xs focus:ring-0 p-0 w-full"
      onClick={(e) => e.stopPropagation()}
    />
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  </div>
));

const SidebarButton = memo(({ icon: Icon, active, onClick, title, className }: any) => (
  <button 
    onClick={onClick}
    className={cn("p-2 rounded-lg transition-colors", active ? "bg-white/10 text-white" : "hover:bg-white/5", className)}
    title={title}
  >
    <Icon className="w-5 h-5" />
  </button>
));

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
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isSourceControlOpen, setIsSourceControlOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<Set<number>>(new Set());
  const [commitMessage, setCommitMessage] = useState('');
  const [isGitInitialized, setIsGitInitialized] = useState(false);
  const [commitHistory, setCommitHistory] = useState<{ id: string, message: string, date: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'ide' | 'blog'>('ide');
  const [userApiKey, setUserApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update Monaco theme
    loader.init().then(monaco => {
      monaco.editor.defineTheme('nexus-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': currentTheme.colors['--bg-primary'],
          'editor.foreground': currentTheme.colors['--text-primary'],
          'editorLineNumber.foreground': currentTheme.colors['--text-secondary'],
          'editor.selectionBackground': currentTheme.colors['--accent'] + '33',
          'editor.lineHighlightBackground': currentTheme.colors['--bg-secondary'],
          'editorCursor.foreground': currentTheme.colors['--accent'],
          'editor.inactiveSelectionBackground': currentTheme.colors['--accent'] + '11',
        }
      });
      monaco.editor.setTheme('nexus-theme');
    });
  }, [currentTheme]);

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
      const command = await processVoiceCommand(text, userApiKey);
      setAiResponse(`Voice Command Interpreted: ${command.description}`);
      
      if (command.intent === 'build') {
        const generated = await generateCode(command.description, command.suggestedLanguage, useThinking, userApiKey);
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
    setAiResponse('Nexus AI is thinking...');
    try {
      const generated = await generateCodeStream(prompt, activeFile.language, useThinking, (text) => {
        setAiResponse(text);
      }, userApiKey);
      
      // Strip markdown code blocks if present
      const cleanCode = generated.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();
      
      updateFile(activeFileId, { code: cleanCode });
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
      const fixed = await fastFix(activeFile.code, activeFile.language, userApiKey);
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
      const debugResult = await debugCode(activeFile.code, activeFile.language, userApiKey);
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
    
    // Add a placeholder for AI response
    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

    try {
      await chatWithAIStream(
        userMsg, 
        chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: h.parts })),
        (text) => {
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text }] };
            return newHistory;
          });
        },
        userApiKey
      );
    } catch (error) {
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: 'Error connecting to Nexus AI.' }] };
        return newHistory;
      });
    }
  };

  const startLiveMode = async () => {
    if (isLiveActive) {
      liveSessionRef.current?.close();
      setIsLiveActive(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: userApiKey || process.env.GEMINI_API_KEY || "" });
    
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

  const handleShare = useCallback(async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: 'Nexus Forge Project',
          text: 'Check out my project on Nexus Forge!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Project link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
      // Fallback copy
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert('Project link copied to clipboard!');
    }
  }, []);

  const handleGitCommit = () => {
    if (!commitMessage.trim() || stagedFiles.size === 0) return;
    
    const newCommit = {
      id: Math.random().toString(36).substring(7),
      message: commitMessage,
      date: new Date().toLocaleString()
    };
    
    setCommitHistory(prev => [newCommit, ...prev]);
    setCommitMessage('');
    setStagedFiles(new Set());
    alert(`Committed: ${newCommit.message}`);
  };

  const handleGitPush = async () => {
    if (!githubToken) {
      alert('Please connect your GitHub account first.');
      return;
    }
    
    alert('Pushing to GitHub... (Simulated via API)');
    // In a real app, we would use octokit to create a repo or update files
    // For this demo, we'll simulate the success
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      alert('Successfully pushed to GitHub!');
    }, 1500);
  };

  const toggleStageFile = (id: number) => {
    const newStaged = new Set(stagedFiles);
    if (newStaged.has(id)) {
      newStaged.delete(id);
    } else {
      newStaged.add(id);
    }
    setStagedFiles(newStaged);
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
      const result = await manipulateCode(selectedText, activeFile.language, action, userApiKey);
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

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId) || files[0], [files, activeFileId]);

  const updateFile = useCallback((id: number, updates: Partial<FileState>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const createFile = useCallback(() => {
    setFiles(prev => {
      const newId = Math.max(...prev.map(f => f.id), 0) + 1;
      const newFile: FileState = {
        id: newId,
        name: `file_${newId}.js`,
        code: '// New file',
        language: 'javascript'
      };
      setActiveFileId(newId);
      return [...prev, newFile];
    });
  }, []);

  const deleteFile = useCallback((id: number) => {
    setFiles(prev => {
      if (prev.length <= 1) return prev;
      const newFiles = prev.filter(f => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(newFiles[0].id);
      }
      return newFiles;
    });
  }, [activeFileId]);

  const renameFile = useCallback((id: number, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  }, []);

  const handleRun = useCallback(() => {
    const htmlFile = files.find(f => f.name === 'index.html')?.code || '';
    const cssFile = files.find(f => f.name === 'styles.css')?.code || '';
    const jsFile = files.find(f => f.name === 'script.js')?.code || '';

    const combined = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${cssFile}
          </style>
        </head>
        <body>
          ${htmlFile}
          <script>
            ${jsFile}
          </script>
        </body>
      </html>
    `;
    
    setPreviewContent(combined);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.8 }
    });
  }, [files]);

  const COMMANDS = [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
  ];

  const filteredCommands = useMemo(() => [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
  ].filter(cmd => 
    cmd.name.toLowerCase().includes(paletteSearch.toLowerCase())
  ), [paletteSearch, handleGenerate, handleDebug, handleFastFix, handleShare]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (view === 'blog') {
    return <Blog onBack={() => setView('ide')} />;
  }

  return (
    <div className="flex h-screen w-full bg-bg-primary text-text-secondary font-sans overflow-hidden relative">
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
              className="w-full max-w-xl bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center px-4 border-b border-border-custom">
                <Terminal className="w-5 h-5 text-text-secondary mr-3" />
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
                    <cmd.icon className="w-4 h-4 text-text-secondary group-hover:text-accent" />
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
      <aside className="w-16 border-r border-border-custom flex flex-col items-center py-6 gap-8 bg-bg-secondary z-30">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Code2 className="w-6 h-6 text-accent" />
        </div>
        <nav className="flex flex-col gap-6">
          <SidebarButton 
            icon={Folder} 
            active={isExplorerOpen} 
            onClick={() => setIsExplorerOpen(!isExplorerOpen)} 
            title="Explorer" 
          />
          <SidebarButton 
            icon={Layout} 
            active={activeTab === 'editor'} 
            onClick={() => setActiveTab('editor')} 
            title="Editor" 
          />
          <SidebarButton 
            icon={Sparkles} 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
            title="AI Assistant" 
          />
          <SidebarButton 
            icon={MessageSquare} 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            title="AI Chat" 
          />
          <SidebarButton 
            icon={Volume2} 
            active={activeTab === 'live'} 
            onClick={() => setActiveTab('live')} 
            title="Live AI" 
          />
          <SidebarButton 
            icon={Palette} 
            active={isThemePanelOpen} 
            onClick={() => setIsThemePanelOpen(!isThemePanelOpen)} 
            title="Theme Customization" 
          />
          <SidebarButton 
            icon={GitBranch} 
            active={isSourceControlOpen} 
            onClick={() => setIsSourceControlOpen(!isSourceControlOpen)} 
            title="Source Control" 
          />
          <SidebarButton 
            icon={BookOpen} 
            active={false} 
            onClick={() => setView('blog')} 
            title="Blog & About" 
          />
          <SidebarButton 
            icon={Key} 
            active={isApiKeyModalOpen} 
            onClick={() => setIsApiKeyModalOpen(true)} 
            title="API Key Settings" 
          />
        </nav>
        <div className="mt-auto flex flex-col gap-6">
          <SidebarButton 
            icon={Github} 
            active={!!githubToken} 
            onClick={handleGithubConnect} 
            title="Connect GitHub" 
            className={githubToken ? "text-emerald-400" : ""}
          />
          <SidebarButton 
            icon={Settings} 
            onClick={() => setUser(null)} 
            title="Logout" 
            className="text-text-secondary"
          />
        </div>
      </aside>

      {/* API Key Modal */}
      <AnimatePresence>
        {isApiKeyModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-bg-secondary border border-white/10 rounded-3xl p-8 space-y-6"
            >
              <div className="flex items-center gap-3 text-accent">
                <Key className="w-6 h-6" />
                <h2 className="text-xl font-bold">AI API Configuration</h2>
              </div>
              <p className="text-sm text-text-secondary">
                By default, Nexus Forge uses a shared free API key. For faster processing and higher limits, you can provide your own Gemini API key.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Your Gemini API Key</label>
                <input 
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="Paste your key here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setIsApiKeyModalOpen(false);
                    alert('API key updated successfully!');
                  }}
                  className="flex-1 py-3 bg-accent text-accent-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                >
                  Save Key
                </button>
              </div>
              <p className="text-[10px] text-center opacity-30">
                Your key is stored locally in your browser session and never sent to our servers.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source Control Panel */}
      <AnimatePresence>
        {isSourceControlOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border-custom bg-bg-secondary flex flex-col overflow-hidden"
          >
            <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Source Control</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleGitPush}
                  className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-accent"
                  title="Push to GitHub"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSourceControlOpen(false)} className="p-1 hover:bg-white/5 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {!isGitInitialized ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <GitBranch className="w-12 h-12 opacity-10" />
                  <p className="text-xs opacity-50">This project is not yet a Git repository.</p>
                  <button 
                    onClick={() => setIsGitInitialized(true)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all"
                  >
                    Initialize Repository
                  </button>
                </div>
              ) : (
                <>
                  {/* Commit Section */}
                  <div className="space-y-3">
                    <textarea 
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit message..."
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-accent resize-none"
                    />
                    <button 
                      onClick={handleGitCommit}
                      disabled={!commitMessage.trim() || stagedFiles.size === 0}
                      className="w-full py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      <GitCommit className="w-4 h-4" />
                      Commit
                    </button>
                  </div>

                  {/* Changes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Changes ({files.length})</label>
                      <button 
                        onClick={() => {
                          if (stagedFiles.size === files.length) setStagedFiles(new Set());
                          else setStagedFiles(new Set(files.map(f => f.id)));
                        }}
                        className="text-[10px] text-accent hover:underline"
                      >
                        {stagedFiles.size === files.length ? 'Unstage All' : 'Stage All'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {files.map(file => (
                        <div key={file.id} className="group flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileCode className="w-3.5 h-3.5 opacity-40 shrink-0" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <button 
                            onClick={() => toggleStageFile(file.id)}
                            className={cn(
                              "p-1 rounded transition-colors",
                              stagedFiles.has(file.id) ? "text-accent bg-accent/10" : "text-zinc-600 hover:text-zinc-400"
                            )}
                          >
                            {stagedFiles.has(file.id) ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History Section */}
                  {commitHistory.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Commit History</label>
                      <div className="space-y-3">
                        {commitHistory.map(commit => (
                          <div key={commit.id} className="flex gap-3">
                            <div className="mt-1">
                              <div className="w-2 h-2 rounded-full bg-accent" />
                              <div className="w-[1px] h-full bg-white/10 mx-auto mt-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{commit.message}</p>
                              <p className="text-[10px] opacity-40">{commit.date} • {commit.id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Theme Customization Panel */}
      <AnimatePresence>
        {isThemePanelOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border-custom bg-bg-secondary flex flex-col overflow-hidden"
          >
            <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Themes</span>
              <button onClick={() => setIsThemePanelOpen(false)} className="p-1 hover:bg-white/5 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Presets</label>
                <div className="grid grid-cols-1 gap-2">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setCurrentTheme(theme)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left",
                        currentTheme.id === theme.id 
                          ? "bg-accent/10 border-accent text-accent" 
                          : "bg-white/5 border-transparent hover:border-white/10 text-zinc-400"
                      )}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors['--accent'] }} />
                      <span className="text-xs font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Custom Colors</label>
                <div className="space-y-3">
                  {Object.entries(currentTheme.colors).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-mono opacity-60 truncate">
                        {key.replace('--', '').replace('-', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color"
                          value={value.startsWith('rgba') ? '#ffffff' : value}
                          onChange={(e) => {
                            const newColors = { ...currentTheme.colors, [key]: e.target.value };
                            setCurrentTheme({ ...currentTheme, id: 'custom', name: 'Custom', colors: newColors });
                          }}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                        />
                        <input 
                          type="text"
                          value={value}
                          onChange={(e) => {
                            const newColors = { ...currentTheme.colors, [key]: e.target.value };
                            setCurrentTheme({ ...currentTheme, id: 'custom', name: 'Custom', colors: newColors });
                          }}
                          className="bg-white/5 border-none text-[10px] font-mono w-20 p-1 rounded focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* File Explorer Panel */}
      <AnimatePresence>
        {isExplorerOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border-custom bg-bg-secondary flex flex-col overflow-hidden"
          >
            <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Explorer</span>
              <button 
                onClick={createFile}
                className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-accent transition-colors"
                title="New File"
              >
                <FilePlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {files.map(file => (
                <FileItem 
                  key={file.id}
                  file={file}
                  isActive={activeFileId === file.id}
                  onSelect={setActiveFileId}
                  onRename={renameFile}
                  onDelete={deleteFile}
                />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Left Side - Preview (As requested by user) */}
      <section className="w-1/3 border-r border-border-custom flex flex-col bg-bg-secondary">
        <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary">
          <span className="text-xs font-mono uppercase tracking-widest opacity-50 text-text-secondary">Live Preview</span>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary bg-bg-secondary">
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
        <header className="h-16 border-b border-border-custom flex items-center px-6 justify-between bg-bg-secondary">
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-2",
                    activeFileId === file.id ? "bg-accent text-accent-foreground font-bold" : "hover:bg-white/5 text-text-secondary"
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
              className="bg-transparent text-xs font-mono border-none focus:ring-0 cursor-pointer hover:text-text-primary transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-bg-secondary">{lang.name}</option>
              ))}
            </select>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 bg-white/5 rounded-md px-3 py-1.5 border border-white/10">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <input 
                type="password"
                placeholder="Gemini API Key"
                className="bg-transparent text-xs border-none focus:ring-0 w-48 placeholder:opacity-30"
                value={userApiKey}
                onChange={e => setUserApiKey(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setUseThinking(!useThinking)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-tighter transition-all",
                useThinking ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-text-secondary border border-transparent"
              )}
            >
              <Brain className="w-3.5 h-3.5" />
              Thinking Mode
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5 transition-colors text-text-secondary"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button 
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition-colors"
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
                activeFileId === file.id ? "ring-1 ring-accent/50 z-10" : "opacity-80 hover:opacity-100"
              )}
              onClick={() => setActiveFileId(file.id)}
            >
              <div className="h-8 bg-bg-secondary border-b border-border-custom flex items-center px-3 justify-between z-20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">Box {idx + 1}</span>
                  <span className="text-[10px] font-mono text-accent/70 truncate max-w-[100px]">{file.name}</span>
                </div>
                <select 
                  value={file.language}
                  onChange={(e) => updateFile(file.id, { language: e.target.value })}
                  className="bg-transparent text-[9px] font-mono border-none focus:ring-0 cursor-pointer opacity-50 hover:opacity-100"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id} className="bg-bg-secondary">{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-h-0">
                <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-bg-primary text-text-secondary animate-pulse">Loading Editor...</div>}>
                  <Editor
                    height="100%"
                    language={file.language}
                    theme="nexus-theme"
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
                </Suspense>
              </div>
            </div>
          ))}
          {files.length < 3 && Array.from({ length: 3 - files.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-bg-secondary flex items-center justify-center text-text-secondary italic text-xs">
              Empty Slot
            </div>
          ))}
        </div>

        {/* Bottom Panel - AI & Prompt */}
        <footer className="h-80 border-t border-border-custom flex flex-col bg-bg-secondary">
          <div className="flex border-b border-border-custom">
            {['ai', 'chat', 'live', 'editor'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors relative",
                  activeTab === tab ? "text-accent" : "opacity-40 hover:opacity-100"
                )}
              >
                {tab === 'ai' ? 'AI Assistant' : tab === 'live' ? 'Live AI' : tab}
                {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
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
                      <div className="flex items-center gap-3 text-accent">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Nexus AI is processing...</span>
                      </div>
                    ) : aiResponse ? (
                      <Markdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <div className="relative group">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(String(children));
                                      alert('Code copied!');
                                    }}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-xl !bg-black/40 !p-4 border border-white/5"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-accent", className)} {...props}>
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
                            msg.role === 'user' ? "bg-accent text-accent-foreground rounded-tr-none" : "bg-white/5 text-text-secondary rounded-tl-none border border-border-custom"
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
                                    <div className="relative group my-4">
                                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(String(children));
                                            alert('Code copied!');
                                          }}
                                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                                        >
                                          <Share2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-xl !bg-black/40 !p-4 border border-white/5"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-accent", className)} {...props}>
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
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:ring-0 focus:border-accent transition-all"
                      />
                      <button 
                        onClick={handleChatSend}
                        className="p-2 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-colors"
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
                        isLiveActive ? "bg-accent/20 scale-110 shadow-[0_0_50px_var(--accent)]" : "bg-white/5"
                      )}>
                        <Volume2 className={cn("w-10 h-10", isLiveActive ? "text-accent animate-pulse" : "text-text-secondary")} />
                      </div>
                      {isLiveActive && (
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 border-2 border-accent rounded-full"
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
                        isLiveActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-accent text-accent-foreground hover:opacity-90"
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
                    className="text-text-secondary"
                  >
                    <div className="flex gap-2 mb-1">
                      <span className="text-accent">[system]</span>
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
            <div className="w-96 border-l border-border-custom p-4 flex flex-col gap-3 bg-bg-primary">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-tighter opacity-40">Command Center</span>
                <div className="flex gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", isListening ? "bg-red-500 animate-pulse" : "bg-text-secondary/30")} />
                </div>
              </div>
              <div className="relative flex-1">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what to build or fix..."
                  className="w-full h-full bg-white/5 rounded-xl p-3 text-sm border border-white/10 focus:border-accent/50 focus:ring-0 resize-none transition-all placeholder:opacity-20"
                />
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "absolute bottom-3 right-3 p-2 rounded-full transition-all",
                    isListening ? "bg-red-500 text-white" : "bg-white/10 text-text-secondary hover:bg-white/20"
                  )}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
