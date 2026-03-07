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
  ChevronDown,
  ChevronUp,
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
  Search,
  Settings,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  History,
  Check,
  Plus,
  ArrowRight,
  Database,
  BarChart3,
  ShieldCheck,
  TestTube2,
  BookOpen,
  Key,
  Command,
  Maximize2,
  Minimize2,
  Split,
  Copy,
  ExternalLink,
  MoreVertical,
  LogOut,
  Moon,
  Sun,
  Monitor,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateCode, generateCodeStream, debugCode, processVoiceCommand, manipulateCode, fastFix, chatWithAI, chatWithAIStream, generateProject, getGhostText } from './services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Blog from './components/Blog';
import About from './components/About';
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
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'chat' | 'live' | 'command' | 'debugger' | 'database' | 'analytics' | 'review' | 'tests' | 'docs'>('editor');
  const [prompt, setPrompt] = useState('');
  const [useThinking, setUseThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [breakpoints, setBreakpoints] = useState<Record<number, number[]>>({});
  const [conditionalBreakpoints, setConditionalBreakpoints] = useState<Record<number, Record<number, string>>>({});
  const [debuggerStatus, setDebuggerStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [pausedLine, setPausedLine] = useState<{ fileId: number, line: number } | null>(null);
  const [inspectedVariables, setInspectedVariables] = useState<Record<string, any>>({});
  const editorRefs = useRef<Record<number, any>>({});
  const monacoRef = useRef<any>(null);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isSourceControlOpen, setIsSourceControlOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<Set<number>>(new Set());
  const [commitMessage, setCommitMessage] = useState('');
  const [isGitInitialized, setIsGitInitialized] = useState(false);
  const [commitHistory, setCommitHistory] = useState<{ id: string, message: string, date: string }[]>([]);
  const [user, setUser] = useState<any>({ name: 'Developer' });
  const [view, setView] = useState<'ide' | 'blog' | 'about'>('ide');
  const [userApiKey, setUserApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [steppingMode, setSteppingMode] = useState<'over' | 'into' | 'out' | null>(null);
  const [callStack, setCallStack] = useState<{ name: string, fileId: number, line: number }[]>([]);
  const [targetDepth, setTargetDepth] = useState<number | null>(null);
  const [currentDepth, setCurrentDepth] = useState(0);

  // Database Explorer State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM sqlite_master;');
  const [sqlResults, setSqlResults] = useState<any[]>([]);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [dbTables, setDbTables] = useState<string[]>([]);

  // Analytics State
  const [projectStats, setProjectStats] = useState({
    totalLines: 0,
    fileCount: 0,
    aiInteractions: 0,
    healthScore: 85
  });

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update Monaco theme and register Ghost Text
    loader.init().then(monaco => {
      monacoRef.current = monaco;
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

      // Register Inline Completions Provider (Ghost Text)
      const provider = monaco.languages.registerInlineCompletionsProvider(['javascript', 'typescript', 'html', 'css'], {
        provideInlineCompletions: async (model, position) => {
          const textBefore = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });
          const textAfter = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: model.getLineCount(),
            endColumn: model.getLineMaxColumn(model.getLineCount())
          });

          // Only trigger if typing at the end of a line or after a space/punctuation
          const lastChar = textBefore.slice(-1);
          if (!/[ \n\t.,;({]/.test(lastChar) && textBefore.length > 0) return;

          try {
            const suggestion = await getGhostText(
              textBefore.slice(-500), // Context window
              textAfter.slice(0, 200),
              model.getLanguageId(),
              userApiKey
            );

            if (!suggestion) return;

            return {
              items: [{
                insertText: suggestion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column
                }
              }]
            };
          } catch (err) {
            console.error('Ghost Text Error:', err);
            return;
          }
        },
        freeInlineCompletions: () => {}
      });

      return () => provider.dispose();
    });
  }, [currentTheme, userApiKey]);

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
        handleVoiceCommand(text).then(() => {
          setTimeout(() => setTranscript(''), 3000);
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubToken(event.data.token);
        setUser(event.data.user);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setUser(event.data.user);
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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsExplorerOpen(false);
        setIsSourceControlOpen(false);
        setIsThemePanelOpen(false);
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
      } else if (command.intent === 'fix') {
        await handleFastFix();
      } else if (command.intent === 'run') {
        handleRun();
        setAiResponse('Debugger and Preview started.');
      } else if (command.intent === 'save') {
        // In this IDE, files are auto-saved in state, but we can show a confirmation
        setAiResponse('Project state saved to local workspace.');
        confetti({ particleCount: 20, spread: 40 });
      } else if (command.intent === 'open') {
        const fileName = command.description.toLowerCase();
        const fileToOpen = files.find(f => f.name.toLowerCase().includes(fileName));
        if (fileToOpen) {
          setActiveFileId(fileToOpen.id);
          setIsExplorerOpen(true);
          setAiResponse(`Opened file: ${fileToOpen.name}`);
        } else {
          setAiResponse(`Could not find file: ${command.description}`);
        }
      } else if (command.intent === 'search') {
        setGlobalSearchQuery(command.description);
        setIsSearchOpen(true);
        setIsExplorerOpen(false);
        setAiResponse(`Searching for: ${command.description}`);
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
      if (isProjectMode) {
        setAiResponse('Generating full project structure...');
        const project = await generateProject(prompt, files, useThinking, userApiKey);
        
        // Update existing files and create new ones
        const newFiles = [...files];
        project.files.forEach((aiFile: any) => {
          const existingIdx = newFiles.findIndex(f => f.name === aiFile.name);
          if (existingIdx !== -1) {
            newFiles[existingIdx] = { ...newFiles[existingIdx], code: aiFile.code, language: aiFile.language };
          } else {
            const newId = Math.max(...newFiles.map(f => f.id), 0) + 1;
            newFiles.push({
              id: newId,
              name: aiFile.name,
              code: aiFile.code,
              language: aiFile.language
            });
          }
        });
        
        setFiles(newFiles);
        setAiResponse(`Project generated successfully! Created/Updated ${project.files.length} files.`);
        handleRun();
      } else {
        const generated = await generateCodeStream(prompt, activeFile.language, useThinking, (text) => {
          setAiResponse(text);
        }, userApiKey);
        
        // Strip markdown code blocks if present
        const cleanCode = generated.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();
        
        updateFile(activeFileId, { code: cleanCode });
        handleRun();
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

  const toggleBreakpoint = useCallback((fileId: number, line: number) => {
    setBreakpoints(prev => {
      const current = prev[fileId] || [];
      const next = current.includes(line) 
        ? current.filter(l => l !== line) 
        : [...current, line];
      
      const editor = editorRefs.current[fileId];
      if (editor && monacoRef.current) {
        const decorations = next.map(l => ({
          range: new monacoRef.current.Range(l, 1, l, 1),
          options: {
            isWholeLine: true,
            glyphMarginClassName: 'breakpoint-glyph',
            glyphMarginHoverMessage: { value: 'Breakpoint' }
          }
        }));
        
        editor.breakpointDecorations = editor.deltaDecorations(editor.breakpointDecorations || [], decorations);
      }
      
      return { ...prev, [fileId]: next };
    });
  }, [breakpoints]);

  const handleEditorMount = useCallback((editor: any, monaco: any, fileId: number) => {
    editorRefs.current[fileId] = editor;
    monacoRef.current = monaco;

    editor.onMouseDown((e: any) => {
      if (e.target.type === 2) { // Glyph margin
        const line = e.target.position.lineNumber;
        toggleBreakpoint(fileId, line);
      }
    });

    const currentBreakpoints = breakpoints[fileId] || [];
    if (currentBreakpoints.length > 0) {
      const decorations = currentBreakpoints.map(l => ({
        range: new monaco.Range(l, 1, l, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'breakpoint-glyph',
          glyphMarginHoverMessage: { value: 'Breakpoint' }
        }
      }));
      editor.breakpointDecorations = editor.deltaDecorations([], decorations);
    }
  }, [breakpoints, toggleBreakpoint]);

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
    const htmlFileObj = files.find(f => f.name.toLowerCase() === 'index.html') || files.find(f => f.language === 'html');
    const htmlCode = htmlFileObj?.code || '';
    
    const cssCode = files
      .filter(f => f.language === 'css' || f.name.toLowerCase().endsWith('.css'))
      .map(f => f.code)
      .join('\n');
      
    const jsFiles = files.filter(f => 
      ['javascript', 'typescript'].includes(f.language) || 
      f.name.toLowerCase().endsWith('.js') || 
      f.name.toLowerCase().endsWith('.ts')
    );

    const instrumentedJs = jsFiles.map(file => {
      const lines = file.code.split('\n');
      const instrumentedLines = lines.map((line, idx) => {
        const lineNum = idx + 1;
        if (!line.trim() || line.trim().startsWith('//')) return line;
        return `await window.nexusDebugger.sync(${file.id}, ${lineNum}, typeof window !== 'undefined' ? window : {}); ${line}`;
      });
      return `/* File: ${file.name} */\n(async () => {\n  try {\n    ${instrumentedLines.join('\n')}\n  } catch (e) {\n    console.error('Debugger Error in ${file.name}:', e);\n  }\n})();`;
    }).join('\n\n');

    const combined = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${cssCode}
          </style>
          <script>
            // Debugger bridge
            window.nexusDebugger = {
              sync: async (fileId, line, scope) => {
                // Use Error stack to get real depth
                const depth = new Error().stack.split('\n').length;
                
                // Get condition for this line if any
                window.parent.postMessage({ type: 'GET_BREAKPOINT_CONDITION', fileId, line, depth }, '*');
                
                const shouldPause = await new Promise(resolve => {
                  const handler = (e) => {
                    if (e.data.type === 'BREAKPOINT_CONDITION_RESULT') {
                      window.removeEventListener('message', handler);
                      const condition = e.data.condition;
                      if (condition === 'false') resolve(false);
                      if (condition === '') resolve(true);
                      try {
                        const func = new Function(...Object.keys(scope), 'return ' + condition);
                        resolve(!!func(...Object.values(scope)));
                      } catch (err) {
                        console.error('Error evaluating condition:', err);
                        resolve(true);
                      }
                    }
                  };
                  window.addEventListener('message', handler);
                });

                if (shouldPause) {
                  window.parent.postMessage({ 
                    type: 'DEBUGGER_SYNC', 
                    fileId, 
                    line, 
                    scope, 
                    depth 
                  }, '*');
                  
                  return new Promise(resolve => {
                    window.addEventListener('message', function handler(e) {
                      if (e.data.type === 'DEBUGGER_CONTINUE') {
                        window.removeEventListener('message', handler);
                        resolve();
                      }
                    });
                  });
                }
              }
            };
          </script>
        </head>
        <body>
          ${htmlCode}
          <script>
            ${instrumentedJs}
          </script>
        </body>
      </html>
    `;
    
    setPreviewContent(combined);
    setDebuggerStatus('running');
    setPausedLine(null);
    setInspectedVariables({});
    
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.8 }
    });
  }, [files, breakpoints]);

  const [stepping, setStepping] = useState(false);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'GET_BREAKPOINT_CONDITION') {
        const { fileId, line, depth } = e.data;
        const fileBreakpoints = breakpoints[fileId] || [];
        const fileCondBreakpoints = conditionalBreakpoints[fileId] || {};
        
        const isBreakpoint = fileBreakpoints.includes(line);
        const condition = fileCondBreakpoints[line] || null;
        
        let shouldPauseStepping = false;
        if (steppingMode === 'into') {
          shouldPauseStepping = true;
        } else if (steppingMode === 'over') {
          if (depth <= (targetDepth || 0)) shouldPauseStepping = true;
        } else if (steppingMode === 'out') {
          if (depth < (targetDepth || 0)) shouldPauseStepping = true;
        } else if (stepping) {
          shouldPauseStepping = true;
        }

        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          if (isBreakpoint || shouldPauseStepping) {
            iframe.contentWindow.postMessage({ 
              type: 'BREAKPOINT_CONDITION_RESULT', 
              condition: isBreakpoint ? condition : '' 
            }, '*');
          } else {
            iframe.contentWindow.postMessage({ 
              type: 'BREAKPOINT_CONDITION_RESULT', 
              condition: 'false' 
            }, '*');
          }
        }
      }

      if (e.data.type === 'DEBUGGER_SYNC') {
        const { fileId, line, scope, depth } = e.data;
        
        setDebuggerStatus('paused');
        setPausedLine({ fileId, line });
        setInspectedVariables(scope);
        setCurrentDepth(depth);
        setActiveFileId(fileId);
        setActiveTab('debugger');
        setStepping(false);
        setSteppingMode(null);
        setTargetDepth(null);
        
        // Highlight the paused line in the editor
        const editor = editorRefs.current[fileId];
        if (editor && monacoRef.current) {
          const decorations = [{
            range: new monacoRef.current.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: 'paused-line-decoration',
              glyphMarginClassName: 'paused-line-glyph'
            }
          }];
          editor.pausedDecorations = editor.deltaDecorations(editor.pausedDecorations || [], decorations);
          editor.revealLineInCenter(line);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [breakpoints, conditionalBreakpoints, stepping, steppingMode, targetDepth]);

  const handleContinue = () => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'DEBUGGER_CONTINUE' }, '*');
      setDebuggerStatus('running');
      setStepping(false);
      setSteppingMode(null);
      
      if (pausedLine) {
        const editor = editorRefs.current[pausedLine.fileId];
        if (editor) {
          editor.pausedDecorations = editor.deltaDecorations(editor.pausedDecorations || [], []);
        }
      }
      setPausedLine(null);
    }
  };

  const handleStepInto = () => {
    setSteppingMode('into');
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'DEBUGGER_CONTINUE' }, '*');
      setDebuggerStatus('running');
      
      if (pausedLine) {
        const editor = editorRefs.current[pausedLine.fileId];
        if (editor) {
          editor.pausedDecorations = editor.deltaDecorations(editor.pausedDecorations || [], []);
        }
      }
      setPausedLine(null);
    }
  };

  const handleStepOver = () => {
    setSteppingMode('over');
    setTargetDepth(currentDepth);
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'DEBUGGER_CONTINUE' }, '*');
      setDebuggerStatus('running');
      
      if (pausedLine) {
        const editor = editorRefs.current[pausedLine.fileId];
        if (editor) {
          editor.pausedDecorations = editor.deltaDecorations(editor.pausedDecorations || [], []);
        }
      }
      setPausedLine(null);
    }
  };

  const executeQuery = async () => {
    setSqlError(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      if (data.success) {
        setSqlResults(Array.isArray(data.results) ? data.results : [data.results]);
        fetchTables();
      } else {
        setSqlError(data.error);
      }
    } catch (err: any) {
      setSqlError(err.message);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/db/tables');
      const data = await res.json();
      if (data.success) {
        setDbTables(data.tables.map((t: any) => t.name));
      }
    } catch (err) {
      console.error('Fetch tables error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'database') {
      fetchTables();
    }
    if (activeTab === 'analytics') {
      const lines = files.reduce((acc, f) => acc + f.code.split('\n').length, 0);
      setProjectStats(prev => ({
        ...prev,
        totalLines: lines,
        fileCount: files.length,
      }));
    }
  }, [activeTab, files]);

  const COMMANDS = [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'search', name: 'Global Search', icon: Search, action: () => { setIsSearchOpen(true); setIsExplorerOpen(false); setIsSourceControlOpen(false); setIsThemePanelOpen(false); } },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
  ];

  const filteredCommands = useMemo(() => [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'search', name: 'Global Search', icon: Search, action: () => { setIsSearchOpen(true); setIsExplorerOpen(false); setIsSourceControlOpen(false); setIsThemePanelOpen(false); } },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
  ].filter(cmd => 
    cmd.name.toLowerCase().includes(paletteSearch.toLowerCase())
  ), [paletteSearch, handleGenerate, handleDebug, handleFastFix, handleShare]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const results: { fileId: number, fileName: string, line: number, text: string }[] = [];
    files.forEach(file => {
      const lines = file.code.split('\n');
      lines.forEach((lineText, index) => {
        if (lineText.toLowerCase().includes(globalSearchQuery.toLowerCase())) {
          results.push({
            fileId: file.id,
            fileName: file.name,
            line: index + 1,
            text: lineText.trim()
          });
        }
      });
    });
    return results;
  }, [files, globalSearchQuery]);

  // Removed login check

  if (view === 'blog') {
    return <Blog onBack={() => setView('ide')} onNavigateAbout={() => setView('about')} />;
  }

  if (view === 'about') {
    return <About onBack={() => setView('ide')} />;
  }

  return (
    <div className="flex h-screen w-full bg-bg-primary text-text-secondary font-sans overflow-hidden relative flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-14 border-b border-border-custom flex items-center px-4 justify-between bg-bg-secondary z-50">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-accent" />
          <span className="font-black tracking-tighter uppercase text-sm">Nexus Forge</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <ChevronRight className="w-5 h-5 rotate-90" /> : <Layout className="w-5 h-5" />}
        </button>
      </header>

      {/* Command Palette */}
      <AnimatePresence>
        {isPaletteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center pt-10 md:pt-32 bg-black/60 backdrop-blur-sm p-4"
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

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Navigation */}
      <aside className={cn(
        "w-16 flex-col items-center py-6 gap-8 z-30 transition-all duration-300 overflow-y-auto glass-sidebar",
        "fixed md:relative inset-y-0 left-0 md:flex",
        isMobileMenuOpen ? "flex translate-x-0 w-16 pt-20" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="p-2 bg-accent/10 rounded-xl hidden md:block">
            <Code2 className="w-6 h-6 text-accent" />
          </div>
          <button 
            onClick={handleRun}
            className="p-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-all shadow-lg shadow-accent/20"
            title="Run Project"
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
        </div>
        <nav className="flex flex-col gap-6">
          <SidebarButton 
            icon={Folder} 
            active={isExplorerOpen} 
            onClick={() => {
              setIsExplorerOpen(!isExplorerOpen);
              setIsSearchOpen(false);
              setIsSourceControlOpen(false);
              setIsThemePanelOpen(false);
            }} 
            title="Explorer" 
          />
          <SidebarButton 
            icon={Search} 
            active={isSearchOpen} 
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsExplorerOpen(false);
              setIsSourceControlOpen(false);
              setIsThemePanelOpen(false);
            }} 
            title="Global Search" 
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
            title="Blog" 
          />
          <SidebarButton 
            icon={User} 
            active={false} 
            onClick={() => setView('about')} 
            title="About Us" 
          />
          <SidebarButton 
            icon={Key} 
            active={isApiKeyModalOpen} 
            onClick={() => setIsApiKeyModalOpen(true)} 
            title="API Key Settings" 
          />
        </nav>
        <div className="mt-auto flex flex-col gap-6 shrink-0">
          <SidebarButton 
            icon={Github} 
            active={!!githubToken} 
            onClick={handleGithubConnect} 
            title="Connect GitHub" 
            className={githubToken ? "text-emerald-400" : ""}
          />
          <SidebarButton 
            icon={Settings} 
            onClick={() => setView('about')} 
            title="Settings" 
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
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  onClick={() => {
                    setUserApiKey('');
                    setIsApiKeyModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-sm transition-all"
                >
                  Clear Key
                </button>
                <button 
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsApiKeyModalOpen(false);
                    if (userApiKey) alert('Custom API key is now active!');
                  }}
                  className="flex-1 py-3 bg-accent text-accent-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                >
                  Save & Close
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
            animate={{ width: window.innerWidth < 768 ? '100%' : 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "flex flex-col overflow-hidden z-40 glass-panel",
              "fixed md:relative inset-y-0 left-16 md:left-0 right-0 md:right-auto"
            )}
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
            animate={{ width: window.innerWidth < 768 ? '100%' : 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "flex flex-col overflow-hidden z-40 glass-panel",
              "fixed md:relative inset-y-0 left-16 md:left-0 right-0 md:right-auto"
            )}
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
            animate={{ width: window.innerWidth < 768 ? '100%' : 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "flex flex-col overflow-hidden z-40 glass-panel",
              "fixed md:relative inset-y-0 left-16 md:left-0 right-0 md:right-auto"
            )}
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

      {/* Global Search Panel */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: window.innerWidth < 768 ? '100%' : 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "flex flex-col overflow-hidden z-40 glass-panel",
              "fixed md:relative inset-y-0 left-16 md:left-0 right-0 md:right-auto"
            )}
          >
            <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Search</span>
              <button onClick={() => setIsSearchOpen(false)} className="p-1 hover:bg-white/5 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 border-b border-border-custom">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input 
                  autoFocus
                  placeholder="Search in files..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-accent outline-none"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <p className="px-2 text-[10px] uppercase tracking-widest opacity-40 font-bold">
                    {searchResults.length} results in {new Set(searchResults.map(r => r.fileId)).size} files
                  </p>
                  <div className="space-y-1">
                    {searchResults.map((result, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setActiveFileId(result.fileId);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FileCode className="w-3 h-3 opacity-40" />
                          <span className="text-[10px] font-bold text-accent truncate">{result.fileName}</span>
                          <span className="text-[10px] opacity-30 ml-auto">Line {result.line}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary truncate opacity-70 group-hover:opacity-100">
                          {result.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : globalSearchQuery ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-4">
                  <Search className="w-12 h-12 mb-4" />
                  <p className="text-xs">No results found for "{globalSearchQuery}"</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-4">
                  <Search className="w-12 h-12 mb-4" />
                  <p className="text-xs">Enter a query to search across all files</p>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Left Side - Preview (As requested by user) */}
      <section className="w-full md:w-1/3 h-64 md:h-full border-b md:border-b-0 md:border-r border-border-custom flex flex-col bg-bg-secondary shrink-0">
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
        <header className="h-16 border-b border-border-custom flex items-center px-4 md:px-6 justify-between bg-bg-secondary shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 md:gap-4 min-w-max">
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 overflow-x-auto no-scrollbar max-w-[300px] md:max-w-none">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-mono transition-all flex items-center gap-1.5 md:gap-2 min-w-max",
                    activeFileId === file.id ? "bg-accent text-accent-foreground font-bold" : "hover:bg-white/5 text-text-secondary"
                  )}
                >
                  <Code2 className="w-3 h-3" />
                  <span className="max-w-[100px] truncate">{file.name}</span>
                </button>
              ))}
            </div>
            <div className="hidden md:block h-6 w-[1px] bg-white/10" />
            <select 
              value={activeFile.language}
              onChange={(e) => updateFile(activeFileId, { language: e.target.value })}
              className="hidden md:block bg-transparent text-xs font-mono border-none focus:ring-0 cursor-pointer hover:text-text-primary transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-bg-secondary">{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <button 
              onClick={() => setIsApiKeyModalOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-tighter transition-all bg-white/5 text-text-secondary border border-transparent hover:bg-white/10",
                userApiKey && "text-accent border-accent/30 bg-accent/5"
              )}
              title="Configure API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{userApiKey ? 'Key Active' : 'API Key'}</span>
            </button>
            <button 
              onClick={() => setUseThinking(!useThinking)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-tighter transition-all relative overflow-hidden group",
                useThinking ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-white/5 text-text-secondary border border-transparent"
              )}
            >
              {useThinking && (
                <motion.div 
                  layoutId="thinking-glow"
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              )}
              <Brain className={cn("w-3.5 h-3.5 relative z-10", useThinking && "animate-pulse")} />
              <span className="relative z-10 hidden sm:inline">Thinking Mode</span>
            </button>
            <button 
              onClick={handleRun}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Run Project</span>
            </button>
          </div>
        </header>

        {/* Single Editor View */}
        <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">
          <div className="h-8 bg-bg-secondary border-b border-border-custom flex items-center px-4 justify-between z-20 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-widest">{activeFile.name}</span>
              <span className="text-[9px] font-mono text-text-secondary opacity-40">Editing</span>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={activeFile.language}
                onChange={(e) => updateFile(activeFileId, { language: e.target.value })}
                className="bg-transparent text-[10px] font-mono border-none focus:ring-0 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id} className="bg-bg-secondary">{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 relative">
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-bg-primary text-text-secondary animate-pulse">Loading Editor...</div>}>
              <Editor
                height="100%"
                language={activeFile.language}
                theme="nexus-theme"
                value={activeFile.code}
                onChange={(val) => updateFile(activeFileId, { code: val || '' })}
                onMount={(editor, monaco) => handleEditorMount(editor, monaco, activeFileId)}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: true, scale: 0.75, side: 'right' },
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  glyphMargin: true,
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: {
                    other: true,
                    comments: true,
                    strings: true
                  },
                  wordBasedSuggestions: "allDocuments",
                  parameterHints: {
                    enabled: true
                  },
                  formatOnPaste: true,
                  formatOnType: true,
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  autoSurround: 'languageDefined',
                  bracketPairColorization: {
                    enabled: true
                  },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on'
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* Bottom Panel - AI & Prompt */}
        <footer className="h-80 border-t border-border-custom flex flex-col bg-bg-secondary shrink-0">
          <div className="flex border-b border-border-custom overflow-x-auto no-scrollbar shrink-0">
            {['ai', 'chat', 'live', 'editor', 'debugger', 'database', 'analytics', 'review', 'tests', 'docs', 'command'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 md:px-6 py-3 md:py-2 text-[10px] font-mono uppercase tracking-widest transition-colors relative min-w-max",
                  activeTab === tab ? "text-accent" : "opacity-40 hover:opacity-100",
                  tab === 'command' && "md:hidden"
                )}
              >
                {tab === 'ai' ? 'AI Assistant' : tab === 'live' ? 'Live AI' : tab}
                {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-bg-secondary/50 backdrop-blur-md">
            {/* Content Area */}
            <div className={cn(
              "flex-1 overflow-y-auto p-4 font-mono text-sm custom-scrollbar",
              activeTab === 'command' ? "hidden md:block" : "block"
            )}>
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

                {activeTab === 'debugger' && (
                  <motion.div
                    key="debugger-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            debuggerStatus === 'paused' ? "bg-yellow-500 animate-pulse" : debuggerStatus === 'running' ? "bg-green-500" : "bg-zinc-600"
                          )} />
                          <span className="text-xs font-bold uppercase tracking-widest">{debuggerStatus}</span>
                        </div>
                        {pausedLine && (
                          <span className="text-xs text-text-secondary">
                            Paused at line <span className="text-accent">{pausedLine.line}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleContinue}
                          disabled={debuggerStatus !== 'paused'}
                          className="flex items-center gap-2 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                          title="Continue (F8)"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Continue
                        </button>
                        <button 
                          onClick={handleStepOver}
                          disabled={debuggerStatus !== 'paused'}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-white/20"
                          title="Step Over (F10)"
                        >
                          <ArrowRight className="w-3 h-3" />
                          Step Over
                        </button>
                        <button 
                          onClick={handleStepInto}
                          disabled={debuggerStatus !== 'paused'}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-white/20"
                          title="Step Into (F11)"
                        >
                          <ChevronDown className="w-3 h-3" />
                          Step Into
                        </button>
                        <button 
                          onClick={handleStepOut}
                          disabled={debuggerStatus !== 'paused'}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-white/20"
                          title="Step Out (Shift+F11)"
                        >
                          <ChevronUp className="w-3 h-3" />
                          Step Out
                        </button>
                        <button 
                          onClick={handleRun}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                          title="Restart"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restart
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                      <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Variables</span>
                          <span className="text-[9px] font-mono opacity-30">Global Scope</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                          {Object.entries(inspectedVariables).length > 0 ? (
                            Object.entries(inspectedVariables)
                              .filter(([key]) => !['nexusDebugger', 'parent', 'opener', 'top', 'self', 'window', 'document', 'location', 'history', 'navigator', 'screen', 'chrome', 'speechSynthesis'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1 text-[11px] font-mono group border-b border-white/5 pb-2 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 shrink-0 font-bold">{key}:</span>
                                    <span className="text-zinc-500 text-[9px] italic">({typeof value})</span>
                                  </div>
                                  <div className="text-text-secondary break-all pl-2 border-l border-white/10">
                                    {typeof value === 'object' && value !== null 
                                      ? <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(value, (k, v) => typeof v === 'function' ? '[Function]' : v, 2)}</pre> 
                                      : String(value)}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-zinc-600 italic text-xs">No variables to inspect. Set a breakpoint and run.</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Breakpoints</span>
                          <span className="text-[9px] font-mono opacity-30">Conditional</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                          {Object.entries(breakpoints).map(([fId, lines]) => (
                            <div key={fId} className="space-y-2">
                              <div className="text-[10px] font-bold text-accent opacity-60 truncate">
                                {files.find(f => f.id === Number(fId))?.name}
                              </div>
                              {lines.map(line => (
                                <div key={line} className="bg-white/5 p-2 rounded-lg border border-white/5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] opacity-50">Line {line}</span>
                                    <button 
                                      onClick={() => toggleBreakpoint(Number(fId), line)}
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] uppercase tracking-widest opacity-30">Condition</label>
                                    <input 
                                      placeholder="e.g. x > 10"
                                      value={conditionalBreakpoints[Number(fId)]?.[line] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setConditionalBreakpoints(prev => ({
                                          ...prev,
                                          [Number(fId)]: {
                                            ...(prev[Number(fId)] || {}),
                                            [line]: val
                                          }
                                        }));
                                      }}
                                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] focus:ring-1 focus:ring-accent outline-none"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                          {Object.keys(breakpoints).length === 0 && (
                            <div className="text-zinc-600 italic text-xs">No breakpoints set. Click the editor margin to add one.</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Call Stack</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                          {pausedLine ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 text-[11px] font-mono text-accent bg-accent/10 p-2 rounded-lg border border-accent/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <div className="flex flex-col">
                                  <span className="font-bold">(anonymous)</span>
                                  <span className="text-[9px] opacity-60">line {pausedLine.line} • depth {currentDepth}</span>
                                </div>
                              </div>
                              {currentDepth > 0 && Array.from({ length: currentDepth }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 text-[11px] font-mono opacity-30 pl-4 border-l border-white/10">
                                  <span>caller_{currentDepth - i}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-zinc-600 italic text-xs">Stack empty.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'database' && (
                  <motion.div
                    key="database-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full gap-4"
                  >
                    <div className="flex gap-4 h-full overflow-hidden">
                      <div className="w-48 bg-black/20 rounded-xl border border-white/5 p-3 overflow-y-auto custom-scrollbar shrink-0">
                        <div className="flex items-center gap-2 mb-4 opacity-50">
                          <Database className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Tables</span>
                        </div>
                        <div className="space-y-1">
                          {dbTables.map(table => (
                            <button 
                              key={table}
                              onClick={() => setSqlQuery(`SELECT * FROM ${table} LIMIT 10;`)}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-[11px] transition-colors truncate"
                            >
                              {table}
                            </button>
                          ))}
                          {dbTables.length === 0 && <div className="text-[10px] opacity-30 italic">No tables found</div>}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">SQL Query</span>
                            <button 
                              onClick={executeQuery}
                              className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                            >
                              Run Query
                            </button>
                          </div>
                          <textarea 
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-mono focus:ring-1 focus:ring-accent outline-none resize-none"
                            placeholder="Enter SQL query..."
                          />
                        </div>
                        <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                          <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Results</span>
                            {sqlResults.length > 0 && <span className="text-[9px] opacity-30">{sqlResults.length} rows</span>}
                          </div>
                          <div className="flex-1 overflow-auto custom-scrollbar p-4">
                            {sqlError ? (
                              <div className="text-red-400 text-[11px] font-mono bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                Error: {sqlError}
                              </div>
                            ) : sqlResults.length > 0 ? (
                              <table className="w-full text-[11px] font-mono border-collapse">
                                <thead>
                                  <tr className="border-b border-white/10">
                                    {Object.keys(sqlResults[0]).map(key => (
                                      <th key={key} className="text-left p-2 opacity-50 font-medium">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sqlResults.map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                      {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="p-2 truncate max-w-[200px]">{String(val)}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="h-full flex items-center justify-center text-[11px] opacity-30 italic">
                                No results to display
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full overflow-y-auto custom-scrollbar"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                        <div className="flex items-center justify-between opacity-50">
                          <span className="text-[10px] font-bold uppercase tracking-widest">Lines of Code</span>
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div className="text-3xl font-bold tracking-tight">{projectStats.totalLines}</div>
                        <div className="text-[10px] text-green-400">+12% from last session</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                        <div className="flex items-center justify-between opacity-50">
                          <span className="text-[10px] font-bold uppercase tracking-widest">Total Files</span>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="text-3xl font-bold tracking-tight">{projectStats.fileCount}</div>
                        <div className="text-[10px] text-zinc-500">Distributed across 3 directories</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                        <div className="flex items-center justify-between opacity-50">
                          <span className="text-[10px] font-bold uppercase tracking-widest">AI Interactions</span>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-3xl font-bold tracking-tight">{projectStats.aiInteractions}</div>
                        <div className="text-[10px] text-accent">Top 5% of power users</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                        <div className="flex items-center justify-between opacity-50">
                          <span className="text-[10px] font-bold uppercase tracking-widest">Code Health</span>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-green-400">{projectStats.healthScore}%</div>
                        <div className="text-[10px] text-green-400/70">Optimized & Secure</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-50">File Distribution</h4>
                        <div className="space-y-4">
                          {['JavaScript', 'TypeScript', 'HTML', 'CSS'].map(lang => {
                            const count = files.filter(f => f.language === lang.toLowerCase()).length;
                            const percentage = Math.round((count / files.length) * 100) || 0;
                            return (
                              <div key={lang} className="space-y-1">
                                <div className="flex justify-between text-[11px]">
                                  <span>{lang}</span>
                                  <span className="opacity-50">{percentage}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className="h-full bg-accent"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-50">Recent Activity</h4>
                        <div className="space-y-4">
                          {[
                            { action: 'Refactored handleRun', time: '2 mins ago', type: 'AI' },
                            { action: 'Added Database Explorer', time: '15 mins ago', type: 'User' },
                            { action: 'Fixed debugger depth bug', time: '1 hour ago', type: 'AI' },
                            { action: 'Initial commit', time: '3 hours ago', type: 'User' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] border-b border-white/5 pb-3 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  item.type === 'AI' ? "bg-accent" : "bg-zinc-500"
                                )} />
                                <span>{item.action}</span>
                              </div>
                              <span className="opacity-30">{item.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

            {/* Prompt Input */}
            <div className={cn(
              "w-full md:w-96 border-t md:border-t-0 md:border-l border-border-custom p-4 flex flex-col gap-3 bg-bg-primary shrink-0",
              activeTab === 'command' ? "flex" : "hidden md:flex"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-tighter opacity-40">Command Center</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setIsProjectMode(!isProjectMode)}
                      className={cn(
                        "w-7 h-4 rounded-full transition-all relative border border-white/10",
                        isProjectMode ? "bg-accent" : "bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                        isProjectMode ? "left-3.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">Project</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setUseThinking(!useThinking)}
                      className={cn(
                        "w-7 h-4 rounded-full transition-all relative border border-white/10",
                        useThinking ? "bg-accent" : "bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                        useThinking ? "left-3.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">Think</span>
                  </label>
                </div>
              </div>
              <div className="relative h-24 md:h-32 md:flex-1">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what to build..."
                  className="w-full h-full bg-white/5 rounded-xl p-3 text-xs md:text-sm border border-white/10 focus:border-accent/50 focus:ring-0 resize-none transition-all placeholder:opacity-20"
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
                className="w-full py-2.5 md:py-3 bg-accent text-accent-foreground rounded-lg text-[10px] md:text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Execute Command
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* Voice Status Indicator */}
      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 bg-bg-secondary border border-accent/30 rounded-full shadow-2xl backdrop-blur-xl"
          >
            <div className={cn(
              "w-3 h-3 rounded-full",
              isListening ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-accent"
            )} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                {isListening ? "Listening..." : "Interpreting..."}
              </span>
              <span className="text-sm font-bold text-white max-w-[300px] truncate italic">
                {transcript || "Speak now..."}
              </span>
            </div>
            {isListening && (
              <button 
                onClick={toggleListening}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <MicOff className="w-4 h-4 text-red-400" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
