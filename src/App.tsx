import React, { useState, useEffect, useRef, useMemo, useCallback, memo, Suspense, lazy } from 'react';
const Editor = lazy(() => import('@monaco-editor/react'));
import { io, Socket } from 'socket.io-client';
import { loader } from '@monaco-editor/react';
// Add getRedirectResult to the firebase/auth import
import { User as FirebaseUser, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
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
  LogOut,
  LogIn,
  Chrome,
  Key,
  Command,
  Maximize2,
  Minimize2,
  Eye,
  Split,
  Copy,
  ExternalLink,
  MoreVertical,
  Moon,
  Sun,
  Monitor,
  Tablet,
  Smartphone,
  Lightbulb,
  X,
  Info,
  Globe,
  Cloud,
  PenTool,
  Server,
  FileText,
  Lock,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { generateCode, generateCodeStream, debugCode, processVoiceCommand, manipulateCode, fastFix, chatWithAI, chatWithAIStream, generateProject, getGhostText, getSmartSuggestions, detectDependencies } from './services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { Octokit } from "octokit";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Blog from './components/Blog';
import About from './components/About';
import VercelClone from './components/VercelClone';
import Login from './components/Login';
import { ApiPlayground } from './components/ApiPlayground';
import { Whiteboard } from './components/Whiteboard';

import { 
  auth, 
  signInWithGoogle, 
  logOut, 
  db, 
  handleFirestoreError, 
  OperationType,
} from './lib/firebase';
import { 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  addDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || '{}');
        if (parsed.error) {
          displayMessage = `Firestore Error: ${parsed.error} (Op: ${parsed.operationType})`;
        }
      } catch (e) {
        displayMessage = this.state.errorInfo || displayMessage;
      }

      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <Bug className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-white">Application Error</h1>
          <p className="text-text-secondary max-w-md">{displayMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
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

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return 'javascript';
  const mapping: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'py': 'python',
    'cpp': 'cpp',
    'cc': 'cpp',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'sql': 'sql',
    'md': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'scss': 'scss',
    'less': 'less'
  };
  return mapping[ext] || 'javascript';
};

interface FileState {
  id: number;
  name: string;
  code: string;
  language: string;
  type: 'file' | 'folder';
  parentId: number | null;
  isOpen?: boolean;
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
const FileItem = memo(({ file, isActive, onSelect, onRename, onDelete, onToggleFolder, onDragStart, onDragOver, onDrop }: any) => {
  const isFolder = file.type === 'folder';
  
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, file.id)}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e, file.id)}
      className={cn(
        "group flex flex-col cursor-pointer transition-colors relative",
        isActive && !isFolder ? "bg-accent/10 text-accent" : "hover:bg-white/5 text-text-secondary"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (isFolder) {
          onToggleFolder(file.id);
        } else {
          onSelect(file.id);
        }
      }}
    >
      <div className="flex items-center px-4 py-1.5">
        {isFolder ? (
          <Folder className={cn("w-3.5 h-3.5 mr-2 transition-transform", file.isOpen ? "text-accent" : "opacity-50")} />
        ) : (
          <FileCode className="w-3.5 h-3.5 mr-2 opacity-50" />
        )}
        <input 
          id={`file-name-${file.id}`}
          name={`file-name-${file.id}`}
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
    </div>
  );
});

const SidebarButton = memo(({ icon: Icon, active, onClick, title, className }: any) => (
  <button 
    onClick={onClick}
    className={cn("p-2 rounded-lg transition-colors", active ? "bg-white/10 text-white" : "hover:bg-white/5", className)}
    title={title}
  >
    <Icon className="w-5 h-5" />
  </button>
));

const VariableItem = ({ name, value, depth = 0 }: { name: string, value: any, depth?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  
  return (
    <div className={cn(
      "flex flex-col gap-1 text-[11px] font-mono group border-b border-white/5 pb-2 last:border-0",
      depth > 0 && "ml-3 border-l border-white/10 pl-2"
    )}>
      <div className="flex items-center gap-2">
        {isObject && Object.keys(value).length > 0 && (
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-0.5 hover:bg-white/10 rounded text-accent transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
        <span className="text-blue-400 shrink-0 font-bold">{name}:</span>
        <span className="text-zinc-500 text-[9px] italic">
          ({isArray ? `Array(${value.length})` : typeof value})
        </span>
        {!isObject && (
          <span className={cn(
            "truncate",
            typeof value === 'string' ? "text-green-400" : 
            typeof value === 'number' ? "text-orange-400" : 
            typeof value === 'boolean' ? "text-purple-400" : "text-text-secondary"
          )}>
            {typeof value === 'string' ? `"${value}"` : String(value)}
          </span>
        )}
      </div>
      {isObject && isOpen && (
        <div className="space-y-1 mt-1">
          {Object.entries(value).map(([k, v]) => (
            <VariableItem key={k} name={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  console.log("App component rendering...");
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [files, setFiles] = useState<FileState[]>([]);
  const [activeFileId, setActiveFileId] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  const [isDebugging, setIsDebugging] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(() => {
    const saved = localStorage.getItem('selected_repo');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedRepo) {
      localStorage.setItem('selected_repo', JSON.stringify(selectedRepo));
    } else {
      localStorage.removeItem('selected_repo');
    }
  }, [selectedRepo]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'chat' | 'live' | 'command' | 'debugger' | 'database' | 'analytics' | 'review' | 'tests' | 'docs' | 'terminal' | 'assets' | 'npm'>('editor');
  const [aiPrompt, setAiPrompt] = useState('');
  const [useThinking, setUseThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [breakpoints, setBreakpoints] = useState<Record<number, number[]>>({});
  const [conditionalBreakpoints, setConditionalBreakpoints] = useState<Record<number, Record<number, string>>>({});
  const [debuggerStatus, setDebuggerStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [pausedLine, setPausedLine] = useState<{ fileId: number, line: number } | null>(null);
  const [inspectedVariables, setInspectedVariables] = useState<Record<string, any>>({});
  const [watchExpressions, setWatchExpressions] = useState<string[]>([]);
  const [watchResults, setWatchResults] = useState<Record<string, any>>({});
  const [variableSearch, setVariableSearch] = useState('');
  const editorRefs = useRef<Record<number, any>>({});
  const monacoRef = useRef<any>(null);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [floatingChatInput, setFloatingChatInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  const availableModels = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Fastest & Balanced' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: 'Most Capable & Reasoning' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', desc: 'Lightweight & Efficient' },
  ];

  const fetchRepos = useCallback(async () => {
    if (!githubToken) return;
    setIsFetchingRepos(true);
    try {
      // Try direct fetch first as it's more reliable in some browser environments
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setRepositories(data);
        if (data.length > 0) {
          showToast(`Fetched ${data.length} repositories`, 'success');
        } else {
          showToast('No repositories found in your account', 'info');
        }
      } else {
        throw new Error('Invalid response from GitHub');
      }
    } catch (error: any) {
      console.error('Failed to fetch repositories:', error);
      showToast(`Failed to fetch repositories: ${error.message}`, 'error');
      
      // Fallback to Octokit if direct fetch fails for some reason
      try {
        const octokit = new Octokit({ auth: githubToken });
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 100
        });
        setRepositories(data);
      } catch (octoError: any) {
        console.error('Octokit fallback also failed:', octoError);
      }
    } finally {
      setIsFetchingRepos(false);
    }
  }, [githubToken]);

  useEffect(() => {
    if (githubToken) {
      fetchRepos();
    } else {
      setRepositories([]);
      setSelectedRepo(null);
    }
  }, [githubToken, fetchRepos]);
 // Firebase Auth Listener
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
    setIsAuthReady(true);
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: Timestamp.now(),
        role: 'user'
      }, { merge: true }).catch(err =>
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`)
      );
    }
  });
  return () => unsubscribe();
}, []);
  // Firestore Sync: Projects
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const projectData = snapshot.docs[0].data();
        if (projectData.files) {
          // Only update if files are different to avoid loops
          // For simplicity in this demo, we'll just set them if they exist
          // In a real app, you'd want a more robust sync strategy
          // setFiles(projectData.files);
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    return () => unsubscribe();
  }, [currentUser]);

  // Firestore Sync: Chat History
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'chats'), 
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        role: doc.data().role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
        parts: [{ text: doc.data().content }]
      }));
      if (history.length > 0) {
        setChatHistory(history);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/chats`));

    return () => unsubscribe();
  }, [currentUser]);

 // ✅ Fixed code
const handleSignIn = () => {
  signInWithGoogle(); // No await - redirect happens immediately
};
  const handleSignOut = async () => {
    try {
      await logOut();
      setGithubToken(null);
      localStorage.removeItem('github_token');
      showToast("Signed out successfully!", "info");
    } catch (error) {
      showToast("Sign out failed", "error");
    }
  };

  const saveProjectToFirestore = async () => {
    if (!currentUser) {
      showToast("Sign in to save projects", "info");
      return;
    }

    try {
      const projectId = "default-project"; // For demo, use a single project
      const projectRef = doc(db, 'projects', projectId);
      await setDoc(projectRef, {
        id: projectId,
        ownerId: currentUser.uid,
        name: "My Nexus Project",
        files: files,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now() // In real app, check if exists first
      }, { merge: true });
      showToast("Project saved to cloud", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'projects/default-project');
    }
  };

  const saveChatMessageToFirestore = async (role: 'user' | 'assistant', content: string) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'chats'), {
        id: Math.random().toString(36).substring(7),
        userId: currentUser.uid,
        role,
        content,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/chats`);
    }
  };
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isApiPlaygroundOpen, setIsApiPlaygroundOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [apiUrl, setApiUrl] = useState('');
  const [apiHeaders, setApiHeaders] = useState<{ key: string, value: string }[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [apiBody, setApiBody] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isSourceControlOpen, setIsSourceControlOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<Set<number>>(new Set());
  const [commitMessage, setCommitMessage] = useState('');
  const [isGitInitialized, setIsGitInitialized] = useState(false);
  const [commitHistory, setCommitHistory] = useState<{ id: string, message: string, date: string }[]>([]);
  const [user, setUser] = useState<any>({
    id: 'guest',
    name: 'Guest User',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
    provider: 'guest'
  });
  const [view, setView] = useState<'ide' | 'blog' | 'about' | 'dashboard' | 'vercel-clone'>('ide');
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isDebuggerEnabled, setIsDebuggerEnabled] = useState(true);
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
  
  // Assets State
  const [assets, setAssets] = useState<{ id: string, name: string, url: string, type: string }[]>([
    { id: '1', name: 'Nexus Logo', url: 'https://picsum.photos/seed/nexus-logo/400/400', type: 'image' },
    { id: '2', name: 'Cyber Background', url: 'https://picsum.photos/seed/cyber-bg/1920/1080', type: 'image' },
    { id: '3', name: 'Abstract Tech', url: 'https://picsum.photos/seed/tech-abstract/800/600', type: 'image' },
    { id: '4', name: 'Neural Network', url: 'https://picsum.photos/seed/neural/1000/1000', type: 'image' }
  ]);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', url: '' });

  // NPM State
  const [npmQuery, setNpmQuery] = useState('');
  const [npmResults, setNpmResults] = useState<any[]>([]);
  const [isSearchingNpm, setIsSearchingNpm] = useState(false);
  const [dbTables, setDbTables] = useState<string[]>([]);

  // Analytics State
  const [projectStats, setProjectStats] = useState({
    totalLines: 0,
    fileCount: 0,
    aiInteractions: 0,
    healthScore: 85
  });

  // Collaboration State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { fileId: number, position: any, color: string }>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Terminal State
  const [terminalHistory, setTerminalHistory] = useState<{ cmd?: string, output?: string, type?: string, content?: string, timestamp?: string }[]>([]);
  const [terminalInput, setTerminalInput] = useState('');

  // AI Review/Tests/Docs State
  const [reviewResult, setReviewResult] = useState<string>('');
  const [testResults, setTestResults] = useState<{ name: string, status: 'pass' | 'fail' | 'pending', error?: string }[]>([]);
  const [docsContent, setDocsContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const searchNpm = async (query: string) => {
    if (!query) return;
    setIsSearchingNpm(true);
    try {
      const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`);
      const data = await response.json();
      setNpmResults(data.objects || []);
    } catch (err) {
      console.error('NPM search error:', err);
    } finally {
      setIsSearchingNpm(false);
    }
  };

  const handleAddAsset = () => {
    if (newAsset.name && newAsset.url) {
      setAssets(prev => [...prev, { id: Date.now().toString(), name: newAsset.name, url: newAsset.url, type: 'image' }]);
      setNewAsset({ name: '', url: '' });
      setIsAddingAsset(false);
      confetti({ particleCount: 30, spread: 50 });
    }
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };
  const [smartSuggestions, setSmartSuggestions] = useState<{ title: string, description: string, type: string, impact: string, suggestedCode?: string }[]>([]);

  const [detectedDeps, setDetectedDeps] = useState<string[]>([]);
  const [isReviewingDeps, setIsReviewingDeps] = useState(false);

  const reviewDependencies = async () => {
    if (!activeFile) return;
    setIsReviewingDeps(true);
    try {
      const deps = await detectDependencies(activeFile.code, activeFile.language, userApiKey, selectedModel);
      setDetectedDeps(deps);
      if (deps.length > 0) {
        showToast(`Detected ${deps.length} dependencies!`, "info");
      } else {
        showToast("No new dependencies detected.", "info");
      }
    } catch (err) {
      console.error('Review deps error:', err);
      showToast("Failed to review dependencies", "error");
    } finally {
      setIsReviewingDeps(false);
    }
  };

  const installDependency = (pkg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalHistory(prev => [...prev, { cmd: `npm install ${pkg}`, output: `Installing ${pkg}...`, type: "info", timestamp }]);
    setTimeout(() => {
      setTerminalHistory(prev => [...prev, { output: `+ ${pkg}@latest installed successfully.`, type: "success", timestamp }]);
      showToast(`${pkg} installed!`, "success");
    }, 1500);
  };

  const generateFullStackProject = async () => {
    setIsGenerating(true);
    try {
      const result = await generateProject(`
        Create a full-stack application that connects to a real backend database.
        The backend is already provided at the following endpoints:
        - POST /api/user-db/my-project/tasks (to create a task)
        - GET /api/user-db/my-project/tasks (to list tasks)
        - DELETE /api/user-db/my-project/tasks/:id (to delete a task)
        
        Generate:
        1. index.html: A clean UI with a task list and input field.
        2. script.js: JavaScript that uses fetch() to interact with these endpoints.
        3. styles.css: Modern styling for the task manager.
      `, [], useThinking, userApiKey, selectedModel);
      if (result && result.files) {
        const newFiles = result.files.map((f: any, idx: number) => ({
          id: Date.now() + idx,
          name: f.name,
          code: f.code,
          language: f.language,
          type: "file",
          parentId: null
        }));
        setFiles(newFiles);
        setActiveFileId(newFiles[0].id);
        showToast("Full-stack project generated!", "success");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Generate project error:', err);
      showToast("Failed to generate project", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchSmartSuggestions = async () => {
    if (!activeFile) return;
    setIsAnalyzing(true);
    setActiveTab('ai'); // Switch to AI tab to show loading
    try {
      const suggestions = await getSmartSuggestions(activeFile.code, activeFile.language, userApiKey, selectedModel);
      setSmartSuggestions(suggestions);
      setActiveTab('ai'); // Keep it on AI tab, but we'll render suggestions there
    } catch (err) {
      console.error('Fetch suggestions error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("init", (state) => {
      console.log("Initial state received:", state);
    });

    newSocket.on("file:update", ({ fileId, code }) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, code } : f));
    });

    newSocket.on("cursor:move", ({ userId, fileId, position }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [userId]: { fileId, position, color: `hsl(${Math.random() * 360}, 70%, 50%)` }
      }));
    });

    newSocket.on("user:leave", (userId) => {
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Sync local changes to socket
  const handleFileChange = (fileId: number, code: string) => {
    updateFile(fileId, { code });
    socket?.emit("file:update", { fileId, code });
  };

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update Monaco theme and register Ghost Text
    let provider: any;
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
      provider = monaco.languages.registerInlineCompletionsProvider(['javascript', 'typescript', 'html', 'css'], {
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

          // Simple debounce: wait 500ms before calling the API
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if the model has changed since we started waiting (optional but good)
          // For simplicity in this context, we'll just proceed.

          try {
            const suggestion = await getGhostText(
              textBefore.slice(-500), // Context window
              textAfter.slice(0, 200),
              model.getLanguageId(),
              userApiKey,
              selectedModel
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
          } catch (err: any) {
            // Don't spam the console with quota errors
            if (err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
              return; 
            }
            console.error('Ghost Text Error:', err);
            return;
          }
        },
        freeInlineCompletions: () => {}
      });
    }).catch(err => {
      console.error('Monaco loader error:', err);
    });

    return () => {
      if (provider) provider.dispose();
    };
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
      if (event.data?.type === 'AUTH_SUCCESS') {
        const { user } = event.data;
        setUser(user);
        if (user.provider === 'github' && user.accessToken) {
          setGithubToken(user.accessToken);
          localStorage.setItem('github_token', user.accessToken);
          setIsSourceControlOpen(true);
          setIsExplorerOpen(false);
          setIsSearchOpen(false);
        }
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      if (event.data?.type === 'PREVIEW_ERROR') {
        console.error('Preview Script Error:', event.data.error);
        setTerminalHistory(prev => [...prev, { 
          cmd: 'preview-runtime', 
          output: `Runtime Error: ${event.data.error.msg}\nAt: ${event.data.error.url}:${event.data.error.line}:${event.data.error.col}` 
        }]);
      }
    };

    window.addEventListener('message', handleMessage);

    // Fetch saved keys if any (for guest or previous session)
    fetch('/api/keys')
      .then(res => res.json())
      .then(keyData => {
        if (keyData.success) {
          const geminiKey = keyData.keys.find((k: any) => k.key_name === 'GEMINI_API_KEY');
          if (geminiKey) {
            setUserApiKey(geminiKey.key_value);
          }
        }
      })
      .catch(() => {});

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

  const saveApiKey = async (key: string) => {
    if (!user) return;
    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'GEMINI_API_KEY', value: key })
      });
    } catch (err) {
      console.error('Error saving API key:', err);
    }
  };

  const handleMagicRefactor = async () => {
    if (!activeFile) return;
    setIsGenerating(true);
    try {
      const refactored = await manipulateCode(activeFile.code, "Refactor this code for better performance, readability, and modern standards. Keep the logic the same but improve the implementation.", activeFile.language, userApiKey, selectedModel);
      updateFile(activeFileId, { code: refactored });
      setAiResponse(`Refactored ${activeFile.name} successfully.`);
      confetti({ 
        particleCount: 50, 
        spread: 60,
        colors: ['#00ff00', '#00ffff', '#ff00ff']
      });
    } catch (err) {
      console.error('Refactor error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceCommand = async (text: string) => {
    setIsGenerating(true);
    setActiveTab('ai');
    try {
      const command = await processVoiceCommand(text, userApiKey, selectedModel);
      setAiResponse(`Voice Command Interpreted: ${command.description}`);
      
      if (command.intent === 'build') {
        const generated = await generateCode(command.description, command.suggestedLanguage, useThinking, userApiKey, selectedModel);
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
      } else if (command.intent === 'create') {
        const newId = Math.max(...files.map(f => f.id), 0) + 1;
        const newFile: FileState = { 
          id: newId, 
          name: command.description || 'untitled.js', 
          code: '', 
          language: command.suggestedLanguage || 'javascript',
          type: 'file',
          parentId: null
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newId);
        setAiResponse(`Created new file: ${newFile.name}`);
      } else if (command.intent === 'delete') {
        const fileName = command.description.toLowerCase();
        const fileToDelete = files.find(f => f.name.toLowerCase().includes(fileName));
        if (fileToDelete) {
          setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
          setAiResponse(`Deleted file: ${fileToDelete.name}`);
        } else {
          setAiResponse(`Could not find file to delete: ${command.description}`);
        }
      } else if (command.intent === 'theme') {
        const themeName = command.description.toLowerCase();
        const foundTheme = THEMES.find(t => t.name.toLowerCase().includes(themeName));
        if (foundTheme) {
          setCurrentTheme(foundTheme);
          setAiResponse(`Switched theme to: ${foundTheme.name}`);
        } else {
          setAiResponse(`Could not find theme: ${command.description}`);
        }
      } else if (command.intent === 'clear') {
        setTerminalHistory([]);
        setAiResponse('Terminal history cleared.');
      } else if (command.intent === 'explain') {
        setActiveTab('ai');
        setAiResponse('Explaining current code...');
        const explanation = await chatWithAI(`Explain the following ${activeFile.language} code:\n\n${activeFile.code}`, [], userApiKey, undefined, selectedModel);
        setAiResponse(explanation);
      } else if (command.intent === 'review') {
        setActiveTab('review');
        setAiResponse('Opening Project Review & Security Audit...');
      } else if (command.intent === 'test') {
        setActiveTab('tests');
        setAiResponse('Opening Automated Unit Testing...');
      } else if (command.intent === 'dictate') {
        const editor = editorRefs.current[activeFileId];
        if (editor) {
          const selection = editor.getSelection();
          const range = new monacoRef.current.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          );
          editor.executeEdits('voice-dictation', [{
            range,
            text: command.description,
            forceMoveMarkers: true
          }]);
          setAiResponse(`Dictated: ${command.description}`);
        }
      } else if (command.intent === 'format') {
        const editor = editorRefs.current[activeFileId];
        if (editor) {
          editor.getAction('editor.action.formatDocument').run();
          setAiResponse('Document formatted.');
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
    if (!aiPrompt) return;
    setIsGenerating(true);
    setActiveTab('ai');
    setAiResponse('Nexus AI is thinking...');
    try {
      if (isProjectMode) {
        setAiResponse('Generating full project structure...');
        const project = await generateProject(aiPrompt, files, useThinking, userApiKey, selectedModel);
        
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
              language: aiFile.language,
              type: 'file',
              parentId: null
            });
          }
        });
        
        setFiles(newFiles);
        setAiResponse(`Project generated successfully! Created/Updated ${project.files.length} files.`);
        handleRun();
      } else {
        const generated = await generateCodeStream(aiPrompt, activeFile.language, useThinking, (text) => {
          setAiResponse(text);
        }, userApiKey, selectedModel);
        
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
      const fixed = await fastFix(activeFile.code, activeFile.language, userApiKey, selectedModel);
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
      const debugResult = await debugCode(activeFile.code, activeFile.language, userApiKey, selectedModel);
      setAiResponse(debugResult);
    } catch (error) {
      setAiResponse('Error debugging code.');
    } finally {
      setIsDebugging(false);
    }
  };

  const handleChatSend = async (customInput?: string) => {
    const input = customInput || chatInput;
    if (!input.trim() || isChatStreaming) return;
    const userMsg = input;
    if (!customInput) setChatInput('');
    setIsChatStreaming(true);
    
    // Create the history for the AI (everything before this message)
    const historyForAI = chatHistory.map(h => ({ 
      role: h.role === 'user' ? 'user' : 'model', 
      parts: h.parts 
    }));

    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    saveChatMessageToFirestore('user', userMsg);
    
    // Add a placeholder for AI response
    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

    const systemInstruction = `You are Nexus AI, a professional coding assistant. You help developers build, debug, and optimize their code. Be concise, technical, and helpful.
    Current File: ${activeFile.name}
    Code Context:
    ${activeFile.code}`;

    try {
      let fullAiResponse = '';
      await chatWithAIStream(
        userMsg, 
        historyForAI,
        (text) => {
          fullAiResponse = text;
          setChatHistory(prev => {
            const newHistory = [...prev];
            if (newHistory.length > 0) {
              newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text }] };
            }
            return newHistory;
          });
        },
        userApiKey,
        systemInstruction,
        selectedModel
      );
      saveChatMessageToFirestore('assistant', fullAiResponse);
    } catch (error) {
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: 'Error connecting to Nexus AI. Please check your API key and connection.' }] };
        }
        return newHistory;
      });
    } finally {
      setIsChatStreaming(false);
    }
  };

  const clearChatHistory = async () => {
    setChatHistory([]);
    if (currentUser) {
      try {
        const q = query(collection(db, 'users', currentUser.uid, 'chats'));
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid)); // Just a check
        // In real app, you'd batch delete. For now, just clear local.
        // Actually, let's just clear local for now to avoid complex batch logic in this demo.
        showToast('Chat history cleared locally', 'info');
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('Chat history cleared', 'info');
    }
  };

  const handleApplyBoilerplate = async (pattern: string) => {
    setAiPrompt(`Generate boilerplate for: ${pattern}`);
    setIsGenerating(true);
    setActiveTab('ai');
    setAiResponse('');
    
    try {
      let fullResponse = '';
      await generateCodeStream(
        `Generate a high-quality, production-ready boilerplate for: ${pattern}. 
         Include best practices, error handling, and modern syntax. 
         Provide only the code block if possible, or a brief explanation followed by the code.`,
        activeFile?.language || 'javascript',
        useThinking,
        (chunk) => {
          fullResponse += chunk;
          setAiResponse(fullResponse);
        },
        userApiKey,
        selectedModel
      );
      showToast(`${pattern} boilerplate generated!`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
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
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Nexus AI, a real-time coding companion. Talk to the developer naturally about their code and provide guidance.
          Current File: ${activeFile.name}
          Code:
          ${activeFile.code}`,
        },
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setLiveTranscription(prev => [...prev, "Nexus AI: Connected. How can I help you today?"]);
          },
          onmessage: (message: any) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBlob = b64toBlob(base64Audio, 'audio/pcm');
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              audio.play();
            }

            // Handle transcriptions
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setLiveTranscription(prev => [...prev, `Nexus AI: ${message.serverContent.modelTurn.parts[0].text}`]);
            }
            if (message.serverContent?.userTurn?.parts?.[0]?.text) {
              setLiveTranscription(prev => [...prev, `You: ${message.serverContent.userTurn.parts[0].text}`]);
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
      const response = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(window.location.origin)}`);
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
      showToast('Project link copied to clipboard!', 'success');
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
      showToast('Project link copied to clipboard!', 'success');
    }
  }, []);

  const handleImportRepo = async () => {
    if (!githubToken || !selectedRepo) return;
    
    showToast(`Importing ${selectedRepo.name}...`, 'info');
    setIsFetchingRepos(true);
    
    try {
      const octokit = new Octokit({ auth: githubToken });
      
      // Get the default branch
      const { data: repoData } = await octokit.rest.repos.get({
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
      });
      
      const defaultBranch = repoData.default_branch;
      
      // Get the full tree recursively
      const { data: treeData } = await octokit.rest.git.getTree({
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        tree_sha: defaultBranch,
        recursive: 'true'
      });
      
      const newFiles: FileState[] = [];
      let nextId = Date.now();
      
      // Map paths to IDs for parent tracking
      const pathToId: Record<string, number> = {};
      
      // Sort by path length to ensure parents are processed before children
      const sortedTree = [...treeData.tree].sort((a, b) => (a.path?.length || 0) - (b.path?.length || 0));
      
      // Filter for files and folders (limit to 150 items for performance)
      const items = sortedTree.slice(0, 150);
      
      // First pass: Create all items (folders and file placeholders)
      for (const item of items) {
        if (!item.path) continue;
        
        const pathParts = item.path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentId = parentPath ? pathToId[parentPath] : null;
        
        const id = nextId++;
        pathToId[item.path] = id;
        
        if (item.type === 'blob') {
          newFiles.push({
            id,
            name: fileName,
            code: '', // Will be filled in second pass
            language: getLanguageFromFilename(fileName),
            type: 'file',
            parentId
          });
        } else if (item.type === 'tree') {
          newFiles.push({
            id,
            name: fileName,
            code: '',
            language: '',
            type: 'folder',
            parentId,
            isOpen: true
          });
        }
      }

      // Second pass: Fetch file contents in parallel with concurrency limit
      const fileItems = items.filter(item => item.type === 'blob');
      const concurrencyLimit = 10;
      for (let i = 0; i < fileItems.length; i += concurrencyLimit) {
        const batch = fileItems.slice(i, i + concurrencyLimit);
        await Promise.all(batch.map(async (item) => {
          try {
            const { data: fileContent } = await octokit.rest.repos.getContent({
              owner: selectedRepo.owner.login,
              repo: selectedRepo.name,
              path: item.path!,
            });
            
            if (!Array.isArray(fileContent) && fileContent.type === 'file') {
              const fileId = pathToId[item.path!];
              const fileIndex = newFiles.findIndex(f => f.id === fileId);
              if (fileIndex !== -1) {
                try {
                  // Use TextDecoder for better UTF-8 support
                  const binaryString = atob(fileContent.content);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                  }
                  newFiles[fileIndex].code = new TextDecoder().decode(bytes);
                } catch (e) {
                  newFiles[fileIndex].code = '// Binary or non-UTF8 file content';
                }
              }
            }
          } catch (error) {
            console.error(`Failed to fetch content for ${item.path}:`, error);
          }
        }));
      }
      
      if (newFiles.length > 0) {
        setFiles(newFiles);
        setIsGitInitialized(true);
        const firstFile = newFiles.find(f => f.type === 'file');
        if (firstFile) {
          setActiveFileId(firstFile.id);
        }
        showToast(`Successfully imported ${newFiles.length} items from ${selectedRepo.name}`, 'success');
      } else {
        showToast('Repository appears to be empty', 'info');
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      showToast(`Import failed: ${error.message}`, 'error');
    } finally {
      setIsFetchingRepos(false);
    }
  };

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
    showToast(`Committed: ${newCommit.message}`, 'success');
  };

  const handleGitPush = async () => {
    if (!githubToken) {
      showToast('Please connect your GitHub account first.', 'error');
      return;
    }
    
    if (!selectedRepo) {
      showToast('Please select a repository first.', 'error');
      return;
    }
    
    showToast(`Pushing to ${selectedRepo.name}...`, 'info');
    
    try {
      const octokit = new Octokit({ auth: githubToken });
      
      // For each staged file, we'll try to update it in the repo
      // This is a simplified version: we'll just update the first staged file
      const stagedFileIds = Array.from(stagedFiles);
      if (stagedFileIds.length === 0) {
        showToast('No files staged for push.', 'error');
        return;
      }
      
      const fileToPush = files.find(f => f.id === stagedFileIds[0]);
      if (!fileToPush) return;

      // Get the current file content from GitHub to get the SHA
      let sha: string | undefined;
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          path: fileToPush.name,
        });
        if (!Array.isArray(fileData)) {
          sha = fileData.sha;
        }
      } catch (e) {
        // File might not exist yet, which is fine
      }

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        path: fileToPush.name,
        message: commitMessage || `Update ${fileToPush.name}`,
        content: btoa(fileToPush.code),
        sha: sha,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast(`Successfully pushed ${fileToPush.name} to ${selectedRepo.name}!`, 'success');
      setStagedFiles(new Set());
      setCommitMessage('');
    } catch (error: any) {
      console.error('Push failed:', error);
      showToast(`Push failed: ${error.message}`, 'error');
    }
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
      showToast('Please select some code first.', 'error');
      return;
    }

    setIsGenerating(true);
    setActiveTab('ai');
    setAiResponse(`AI is performing: ${action}...`);

    try {
      const result = await manipulateCode(selectedText, activeFile.language, action, userApiKey, selectedModel);
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

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId) || files[0] || { id: 0, name: '', code: '', language: 'javascript', type: 'file', parentId: null }, [files, activeFileId]);

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

    // Add AI Refactor Action
    editor.addAction({
      id: 'nexus-ai-refactor',
      label: 'Nexus AI: Refactor Selection',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: async (ed: any) => {
        const selection = ed.getSelection();
        if (selection) {
          const selectedText = ed.getModel().getValueInRange(selection);
          if (selectedText) {
            setIsGenerating(true);
            try {
              const currentFile = files.find(f => f.id === fileId);
              const refactored = await manipulateCode(
                selectedText, 
                "Refactor this code for better performance, readability, and modern standards. Keep the logic the same but improve the implementation.", 
                currentFile?.language || 'javascript', 
                userApiKey,
                selectedModel
              );
              ed.executeEdits('nexus-ai', [{
                range: selection,
                text: refactored,
                forceMoveMarkers: true
              }]);
              confetti({ particleCount: 30, spread: 50 });
            } catch (err) {
              console.error('Refactor selection error:', err);
            } finally {
              setIsGenerating(false);
            }
          }
        }
      }
    });

    // Add AI Explain Action
    editor.addAction({
      id: 'nexus-ai-explain',
      label: 'Nexus AI: Explain Selection',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      run: async (ed: any) => {
        const selection = ed.getSelection();
        const selectedText = selection ? ed.getModel().getValueInRange(selection) : ed.getValue();
        if (selectedText) {
          setIsGenerating(true);
          setActiveTab('ai');
          try {
            const explanation = await chatWithAI(`Explain this code snippet in detail:\n\n${selectedText}`, [], userApiKey, undefined, selectedModel);
            setAiResponse(explanation);
          } catch (err) {
            console.error('Explain selection error:', err);
          } finally {
            setIsGenerating(false);
          }
        }
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
  }, [breakpoints, toggleBreakpoint, files, userApiKey]);

  const createFile = useCallback(() => {
    setFiles(prev => {
      const newId = Math.max(...prev.map(f => f.id), 0) + 1;
      const newFile: FileState = {
        id: newId,
        name: `file_${newId}.js`,
        code: '// New file',
        language: 'javascript',
        type: 'file',
        parentId: null
      };
      setActiveFileId(newId);
      return [...prev, newFile];
    });
  }, []);

  const createFolder = useCallback(() => {
    setFiles(prev => {
      const newId = Math.max(...prev.map(f => f.id), 0) + 1;
      const newFolder: FileState = {
        id: newId,
        name: 'new-folder',
        code: '',
        language: '',
        type: 'folder',
        parentId: null,
        isOpen: true
      };
      return [...prev, newFolder];
    });
  }, []);

  const toggleFolder = useCallback((id: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  }, []);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('fileId', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const sourceId = parseInt(e.dataTransfer.getData('fileId'));
    const targetFile = files.find(f => f.id === targetId);
    
    if (sourceId === targetId) return;
    
    setFiles(prev => prev.map(f => {
      if (f.id === sourceId) {
        return { ...f, parentId: targetFile?.type === 'folder' ? targetId : targetFile?.parentId || null };
      }
      return f;
    }));
  };

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
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const language = getLanguageFromFilename(newName);
        return { ...f, name: newName, language };
      }
      return f;
    }));
  }, []);

  const handleApiRequest = async () => {
    setIsApiLoading(true);
    setApiResponse(null);
    try {
      const headersObj = apiHeaders.reduce((acc, h) => {
        if (h.key) acc[h.key] = h.value;
        return acc;
      }, {} as Record<string, string>);

      const options: RequestInit = {
        method: apiMethod,
        headers: headersObj,
      };

      if (apiMethod !== 'GET' && apiBody) {
        options.body = apiBody;
      }

      const startTime = performance.now();
      const response = await fetch(apiUrl, options);
      const endTime = performance.now();
      
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        time: Math.round(endTime - startTime),
        data,
        headers: Object.fromEntries(response.headers.entries())
      });
      showToast(`Request completed: ${response.status}`, response.ok ? 'success' : 'error');
    } catch (err: any) {
      setApiResponse({ error: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleRun = useCallback((arg?: boolean | React.MouseEvent) => {
    if (files.length === 0) return;
    const showConfetti = typeof arg === 'boolean' ? arg : true;
    const htmlFileObj = files.find(f => f.name.toLowerCase() === 'index.html') || files.find(f => f.language === 'html');
    const htmlCode = htmlFileObj?.code || `
      <div style="padding: 2rem; font-family: ui-sans-serif, system-ui, sans-serif; background: #0A0A0B; color: #ffffff; min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; background: #0D0D0E;">
          <h1 style="color: #10b981; margin-top: 0; font-size: 1.5rem;">Nexus Forge Preview</h1>
          <p style="color: #a1a1aa; font-size: 0.875rem;">No <code>index.html</code> found. Your scripts are running in the background.</p>
          <div style="margin-top: 2rem; padding: 1rem; background: #000; border-radius: 0.5rem; font-family: monospace; font-size: 0.75rem; color: #10b981; border: 1px solid #10b981/20;">
            <div style="opacity: 0.5; margin-bottom: 0.5rem;">// Console Output</div>
            <div id="nexus-console"></div>
          </div>
        </div>
      </div>
    `;

    const handleExecuteCode = async () => {
  if (!activeFile) return;
  
  const executableLanguages = ['python', 'javascript', 'typescript', 'cpp', 'c', 'java'];
  
  if (!executableLanguages.includes(activeFile.language)) {
    showToast(`${activeFile.language} execution not supported yet`, 'error');
    return;
  }
  
  setIsGenerating(true);
  setActiveTab('command');
  
  const timestamp = new Date().toLocaleTimeString();
  setTerminalHistory(prev => [...prev, { 
    cmd: `run ${activeFile.name}`, 
    output: `Executing ${activeFile.name}...`,
    type: 'info',
    timestamp 
  }]);
  
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code: activeFile.code, 
        language: activeFile.language 
      })
    });
    
    const result = await response.json();
    
    if (result.output) {
      setTerminalHistory(prev => [...prev, { 
        output: result.output,
        type: 'success',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    if (result.error) {
      setTerminalHistory(prev => [...prev, { 
        output: result.error,
        type: 'error',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    if (!result.output && !result.error) {
      setTerminalHistory(prev => [...prev, { 
        output: 'Program exited with no output.',
        type: 'info',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    showToast(`${activeFile.name} executed!`, 'success');
    
  } catch (err: any) {
    setTerminalHistory(prev => [...prev, { 
      output: `Failed to execute: ${err.message}`,
      type: 'error',
      timestamp: new Date().toLocaleTimeString()
    }]);
    showToast('Execution failed', 'error');
  } finally {
    setIsGenerating(false);
  }
};
    const cssCode = files
      .filter(f => f.language === 'css' || f.name.toLowerCase().endsWith('.css'))
      .map(f => f.code)
      .join('\n');
      
    const jsFiles = files.filter(f => 
      f.id !== htmlFileObj?.id && (
        ['javascript', 'typescript', 'json'].includes(f.language) || 
        f.name.toLowerCase().endsWith('.js') || 
        f.name.toLowerCase().endsWith('.ts') ||
        f.name.toLowerCase().endsWith('.json')
      )
    );

    const allImports: string[] = [];
    const instrumentedJs = jsFiles.map(file => {
      // Handle JSON files by making them available as global objects
      if (file.language === 'json' || file.name.toLowerCase().endsWith('.json')) {
        try {
          // Validate JSON before injecting
          JSON.parse(file.code);
          return `/* File: ${file.name} (JSON) */\nwindow["${file.name}"] = ${file.code};`;
        } catch (e) {
          return `/* File: ${file.name} (Invalid JSON) */\nconsole.error('Invalid JSON in ${file.name}');`;
        }
      }

      // Escape </script> to prevent breaking the injection
      let code = file.code.replace(/<\/script>/g, '<\\/script>');
      
      // Extract static imports (basic multi-line support)
      const importRegex = /^import\s+[\s\S]*?from\s+['"].*?['"];?/gm;
      code = code.replace(importRegex, (match) => {
        allImports.push(match);
        return `/* Moved import */`;
      });

      // Remove export keywords for combined script
      code = code.replace(/^export\s+default\s+/gm, '/* export default */ ');
      code = code.replace(/^export\s+/gm, '/* export */ ');

      const lines = code.split('\n');
      const fileBody: string[] = [];
      
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          fileBody.push(line);
          return;
        }
        
        // Skip lines that are likely continuations of previous lines
        if (trimmed.startsWith('.') || trimmed.startsWith(',') || trimmed.startsWith('?') || trimmed.startsWith(':')) {
          fileBody.push(line);
          return;
        }
        
        if (isDebuggerEnabled) {
          fileBody.push(`await window.nexusDebugger.sync(${file.id}, ${lineNum}, {}); ${line}`);
        } else {
          fileBody.push(line);
        }
      });

      return `/* --- Start of File: ${file.name} --- */\n${fileBody.join('\n')}\n/* --- End of File: ${file.name} --- */`;
    }).join('\n\n');

    const finalJs = `
      ${Array.from(new Set(allImports)).join('\n')}

      try {
        ${instrumentedJs}
      } catch (e) {
        console.error('Runtime Error in combined scripts:', e);
        window.parent.postMessage({ 
          type: 'PREVIEW_ERROR', 
          error: { msg: e.message, stack: e.stack }
        }, '*');
      }
    `;
    // Final safety check for the combined content
    const safeInstrumentedJs = finalJs.replace(/<\/script>/g, '<\\/script>');

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
            // Console redirection for the fallback view
            const originalLog = console.log;
            console.log = function(...args) {
              originalLog.apply(console, args);
              const consoleDiv = document.getElementById('nexus-console');
              if (consoleDiv) {
                const entry = document.createElement('div');
                entry.style.marginBottom = '4px';
                entry.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                consoleDiv.appendChild(entry);
              }
            };

            window.onerror = function(msg, url, line, col, error) {
              const errorMessage = msg === 'Script error.' 
                ? 'Script error: The browser restricted details for a cross-origin script error. This often happens with syntax errors in injected scripts.' 
                : msg;
              window.parent.postMessage({ 
                type: 'PREVIEW_ERROR', 
                error: { msg: errorMessage, url, line, col, stack: error?.stack }
              }, '*');
              return false;
            };
            window.onunhandledrejection = function(event) {
              window.parent.postMessage({ 
                type: 'PREVIEW_ERROR', 
                error: { msg: 'Unhandled Promise Rejection: ' + event.reason, stack: event.reason?.stack }
              }, '*');
            };
            // Override console to capture logs
            ['log', 'error', 'warn', 'info'].forEach(method => {
              const original = console[method];
              console[method] = (...args) => {
                window.parent.postMessage({ type: 'PREVIEW_LOG', method, args: args.map(a => String(a)) }, '*');
                original.apply(console, args);
              };
            });
            // Debugger bridge
            window.nexusDebugger = {
              sync: async (fileId, line, scope) => {
                // Use Error stack to get real depth
                const stack = new Error().stack || '';
                const depth = stack.split('\n').length;
                
                // Get condition for this line if any
                if (window.parent) {
                  window.parent.postMessage({ type: 'GET_BREAKPOINT_CONDITION', fileId, line, depth }, '*');
                }
                
                const shouldPause = await new Promise(resolve => {
                  const timeout = setTimeout(() => resolve(true), 1000); // Fail-safe
                  const handler = (e) => {
                    if (e.data.type === 'BREAKPOINT_CONDITION_RESULT') {
                      clearTimeout(timeout);
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

                if (shouldPause && window.parent) {
                  window.parent.postMessage({ 
                    type: 'DEBUGGER_SYNC', 
                    fileId, 
                    line, 
                    scope, 
                    depth 
                  }, '*');
                  
                  return new Promise(resolve => {
                    const handler = (e) => {
                      if (e.data.type === 'DEBUGGER_CONTINUE') {
                        window.removeEventListener('message', handler);
                        resolve();
                      }
                    };
                    window.addEventListener('message', handler);
                  });
                }
              }
            };
          </script>
        </head>
        <body>
          ${htmlCode}
          <script type="module">
            ${safeInstrumentedJs}
          </script>
        </body>
      </html>
    `;
    
    setPreviewContent(combined);
    setDebuggerStatus('running');
    setPausedLine(null);
    setInspectedVariables({});
    
    if (showConfetti) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 }
      });
    }
  }, [files, breakpoints, isDebuggerEnabled]);

  const handleStartDebug = useCallback(() => {
    if (debuggerStatus === 'running') {
      setStepping(true);
      setActiveTab('debugger');
      showToast('Pausing execution...', 'info');
    } else {
      const debuggableLanguages = ['javascript', 'typescript'];
      if (!debuggableLanguages.includes(activeFile.language)) {
        showToast('Please select a JavaScript or TypeScript file to debug.', 'error');
        return;
      }

      // Find first executable line
      const lines = activeFile.code.split('\n');
      let firstLine = 1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
          firstLine = i + 1;
          break;
        }
      }
      
      // Set breakpoint if none exists
      const currentBreakpoints = breakpoints[activeFileId] || [];
      if (!currentBreakpoints.includes(firstLine)) {
        toggleBreakpoint(activeFileId, firstLine);
      }
      
      // Ensure debugger is enabled
      setIsDebuggerEnabled(true);
      setActiveTab('debugger');
      
      // Small delay to ensure state updates if needed, though handleRun uses current state
      setTimeout(() => {
        handleRun(false);
      }, 0);
      
      showToast('Starting debug session...', 'success');
    }
  }, [debuggerStatus, activeFile, activeFileId, breakpoints, toggleBreakpoint, handleRun]);

  // Debounced auto-run when files change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRun(false); // Run without confetti for auto-updates
    }, 1500);
    return () => clearTimeout(timer);
  }, [files, handleRun]);

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

        // Evaluate watch expressions
        const results: Record<string, any> = {};
        watchExpressions.forEach(expr => {
          try {
            const func = new Function(...Object.keys(scope), `return ${expr}`);
            results[expr] = func(...Object.values(scope));
          } catch (err) {
            results[expr] = 'Error';
          }
        });
        setWatchResults(results);
        
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

      if (e.data.type === 'PREVIEW_ERROR') {
        const { error } = e.data;
        setTerminalHistory(prev => [...prev, {
          type: 'error',
          content: `[Preview Error] ${error.msg}${error.line ? ` (Line ${error.line})` : ''}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        setActiveTab('terminal');
      }

      if (e.data.type === 'PREVIEW_LOG') {
        const { method, args } = e.data;
        setTerminalHistory(prev => [...prev, {
          type: method === 'error' ? 'error' : method === 'warn' ? 'warn' : 'info',
          content: `[Preview ${method.toUpperCase()}] ${args.join(' ')}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [breakpoints, conditionalBreakpoints, stepping, steppingMode, targetDepth, watchExpressions]);

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

  const handleStepOut = () => {
    setSteppingMode('out');
    setTargetDepth(Math.max(0, currentDepth - 1));
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (debuggerStatus !== 'paused') return;
      
      if (e.key === 'F8') {
        e.preventDefault();
        handleContinue();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleStepOver();
      } else if (e.key === 'F11') {
        e.preventDefault();
        if (e.shiftKey) {
          handleStepOut();
        } else {
          handleStepInto();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debuggerStatus, handleContinue, handleStepOver, handleStepInto, handleStepOut]);

  const [projectData, setProjectData] = useState<any[]>([]);
  const [isFetchingProjectData, setIsFetchingProjectData] = useState(false);

  const fetchProjectData = async (collectionName: string = 'tasks') => {
    setIsFetchingProjectData(true);
    try {
      const response = await fetch(`/api/user-db/my-project/${collectionName}`);
      const data = await response.json();
      if (data.success) {
        setProjectData(data.results);
      }
    } catch (err) {
      console.error('Fetch project data error:', err);
    } finally {
      setIsFetchingProjectData(false);
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

  const runSecurityAudit = async () => {
    setIsAnalyzing(true);
    try {
      const allCode = files.map(f => `FILE: ${f.name}\n${f.code}`).join('\n---\n');
      const result = await chatWithAI(`Perform a security and performance audit on this project. Identify vulnerabilities, bottlenecks, and suggest improvements.\n\n${allCode}`, [], userApiKey, undefined, selectedModel);
      setReviewResult(result);
      setActiveTab('review');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateTests = async () => {
    setIsAnalyzing(true);
    try {
      const activeFile = files.find(f => f.id === activeFileId);
      if (!activeFile) return;
      const result = await chatWithAI(`Generate Vitest unit tests for the following code. Return ONLY the test code.\n\n${activeFile.code}`, [], userApiKey, undefined, selectedModel);
      // In a real app, we'd save this to a file and run it. 
      // For demo, we'll simulate running it.
      setTestResults([
        { name: 'Initial Render Test', status: 'pending' },
        { name: 'Data Processing Logic', status: 'pending' },
        { name: 'Edge Case Handling', status: 'pending' }
      ]);
      setTimeout(() => {
        setTestResults([
          { name: 'Initial Render Test', status: 'pass' },
          { name: 'Data Processing Logic', status: 'pass' },
          { name: 'Edge Case Handling', status: 'fail', error: 'Expected 10, got 11' }
        ]);
      }, 2000);
      setActiveTab('tests');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDocs = async () => {
    setIsAnalyzing(true);
    try {
      const allCode = files.map(f => `FILE: ${f.name}\n${f.code}`).join('\n---\n');
      const result = await chatWithAI(`Generate comprehensive API documentation for this project in Markdown format. Include endpoint descriptions, data models, and usage examples.\n\n${allCode}`, [], userApiKey, undefined, selectedModel);
      setDocsContent(result);
      setActiveTab('docs');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTerminalCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = terminalInput.trim();
      let output = '';
      if (cmd === 'ls') output = files.map(f => f.name).join('  ');
      else if (cmd === 'npm install') output = 'Installing dependencies... Done.';
      else if (cmd === 'help') output = 'Available commands: ls, npm install, clear, date, whoami, help';
      else if (cmd === 'date') output = new Date().toLocaleString();
      else if (cmd === 'whoami') output = user.name;
      else if (cmd === 'clear') { setTerminalHistory([]); setTerminalInput(''); return; }
      else output = `Command not found: ${cmd}. Type 'help' for available commands.`;
      
      setTerminalHistory(prev => [...prev, { cmd, output }]);
      setTerminalInput('');
    }
  };

  const COMMANDS = [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setAiPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'search', name: 'Global Search', icon: Search, action: () => { setIsSearchOpen(true); setIsExplorerOpen(false); setIsSourceControlOpen(false); setIsThemePanelOpen(false); } },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
    { id: 'boilerplate', name: 'Generate Boilerplate', icon: Layers, action: () => { setActiveTab('ai'); setAiResponse(''); showToast('Select a pattern from the AI Assistant tab', 'info'); } },
  ];

  const filteredCommands = useMemo(() => [
    { id: 'build', name: 'Build Web App', icon: Sparkles, action: () => { setAiPrompt('Build a modern landing page'); handleGenerate(); } },
    { id: 'debug', name: 'Debug Code', icon: Bug, action: handleDebug },
    { id: 'fix', name: 'Fast Fix', icon: Zap, action: handleFastFix },
    { id: 'share', name: 'Share Project', icon: Share2, action: handleShare },
    { id: 'search', name: 'Global Search', icon: Search, action: () => { setIsSearchOpen(true); setIsExplorerOpen(false); setIsSourceControlOpen(false); setIsThemePanelOpen(false); } },
    { id: 'live', name: 'Live AI Session', icon: Volume2, action: () => setActiveTab('live') },
    { id: 'boilerplate', name: 'Generate Boilerplate', icon: Layers, action: () => { setActiveTab('ai'); setAiResponse(''); showToast('Select a pattern from the AI Assistant tab', 'info'); } },
  ].filter(cmd => 
    cmd.name.toLowerCase().includes(paletteSearch.toLowerCase())
  ), [paletteSearch, handleGenerate, handleDebug, handleFastFix, handleShare]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const revealLine = useCallback((fileId: number, line: number) => {
    setActiveFileId(fileId);
    setTimeout(() => {
      const editor = editorRefs.current[fileId];
      if (editor && monacoRef.current) {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
        
        // Temporary highlight
        const decorations = [{
          range: new monacoRef.current.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: 'search-result-highlight'
          }
        }];
        const oldDecorations = editor.searchDecorations || [];
        editor.searchDecorations = editor.deltaDecorations(oldDecorations, decorations);
        setTimeout(() => {
          if (editor.searchDecorations) {
            editor.searchDecorations = editor.deltaDecorations(editor.searchDecorations, []);
          }
        }, 2000);
      }
    }, 100);
  }, []);

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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-accent/20 animate-bounce">
          <Code2 className="w-10 h-10 text-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-secondary opacity-40">Initializing Workspace</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (view === 'blog') {
    return <Blog onBack={() => setView('ide')} onNavigateAbout={() => setView('about')} />;
  }

  if (view === 'about') {
    return <About onBack={() => setView('ide')} />;
  }

  if (view === 'vercel-clone') {
    return <VercelClone onBack={() => setView('ide')} currentUser={currentUser} />;
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
                  id="palette-search"
                  name="palette-search"
                  autoFocus
                  placeholder="Search commands... (Esc to close)"
                  className="flex-1 bg-transparent py-4 text-sm border-none focus:ring-0"
                  value={paletteSearch}
                  onChange={e => setPaletteSearch(e.target.value)}
                />
              </div>
              <div className="p-2 max-h-96 custom-scrollbar">
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
      {/* Bottom Navigation (Mobile Only) */}
      {view === 'ide' && (
        <nav className="md:hidden h-16 bg-bg-secondary border-t border-border-custom flex items-center justify-around px-2 z-50 fixed bottom-0 left-0 w-full">
          <button 
            onClick={() => { setActiveTab('editor'); setIsPreviewOpen(false); }}
            className={cn("flex flex-col items-center gap-1 p-2 transition-colors", activeTab === 'editor' && !isPreviewOpen ? "text-accent" : "text-text-secondary")}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Editor</span>
          </button>
          <button 
            onClick={() => { setActiveTab('ai'); setIsPreviewOpen(false); }}
            className={cn("flex flex-col items-center gap-1 p-2 transition-colors", activeTab === 'ai' && !isPreviewOpen ? "text-accent" : "text-text-secondary")}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">AI</span>
          </button>
          <button 
            onClick={() => { setActiveTab('chat'); setIsPreviewOpen(false); }}
            className={cn("flex flex-col items-center gap-1 p-2 transition-colors", activeTab === 'chat' && !isPreviewOpen ? "text-accent" : "text-text-secondary")}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Chat</span>
          </button>
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className={cn("flex flex-col items-center gap-1 p-2 transition-colors", isPreviewOpen ? "text-accent" : "text-text-secondary")}
          >
            <Play className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Preview</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-text-secondary"
          >
            <Layout className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
          </button>
        </nav>
      )}

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
        "w-16 flex-col items-center py-6 gap-8 z-30 transition-all duration-300 custom-scrollbar glass-sidebar",
        "fixed md:relative inset-y-0 left-0 md:flex",
        isMobileMenuOpen ? "flex translate-x-0 w-16 pt-20 pb-20" : "-translate-x-full md:translate-x-0"
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
        <nav className="flex flex-col gap-6 custom-scrollbar py-4">
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
            icon={Layout} 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            title="Project Dashboard" 
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
            onClick={() => {
              setIsSourceControlOpen(!isSourceControlOpen);
              setIsApiPlaygroundOpen(false);
              setIsWhiteboardOpen(false);
              setIsExplorerOpen(false);
              setIsSearchOpen(false);
            }} 
            title="Source Control" 
          />
          <SidebarButton 
            icon={Globe} 
            active={isApiPlaygroundOpen} 
            onClick={() => {
              setIsApiPlaygroundOpen(!isApiPlaygroundOpen);
              setIsWhiteboardOpen(false);
              setIsSourceControlOpen(false);
              setIsExplorerOpen(false);
              setIsSearchOpen(false);
            }} 
            title="API Playground" 
          />
          <SidebarButton 
            icon={PenTool} 
            active={isWhiteboardOpen} 
            onClick={() => {
              setIsWhiteboardOpen(!isWhiteboardOpen);
              setIsApiPlaygroundOpen(false);
              setIsSourceControlOpen(false);
              setIsExplorerOpen(false);
              setIsSearchOpen(false);
            }} 
            title="Collaborative Whiteboard" 
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
            icon={Cloud} 
            active={false} 
            onClick={() => setView('vercel-clone')} 
            title="Vercel Clone Architecture" 
          />
        </nav>
        <div className="mt-auto flex flex-col gap-6 shrink-0">
          
          <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-4">
            {currentUser ? (
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={saveProjectToFirestore}
                  className="p-2 rounded-lg hover:bg-white/5 text-accent"
                  title="Save to Cloud"
                >
                  <Database className="w-5 h-5" />
                </button>
                <div className="relative group">
                  <img 
                    src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=random`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute left-full ml-2 px-2 py-1 bg-bg-secondary border border-white/10 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {currentUser.displayName || currentUser.email}
                  </div>
                </div>
                <SidebarButton 
                  icon={LogOut} 
                  onClick={handleSignOut} 
                  title="Sign Out" 
                  className="text-red-400 hover:bg-red-400/10"
                />
              </div>
            ) : (
              <SidebarButton 
                icon={LogIn} 
                onClick={handleSignIn} 
                title="Sign In with Google" 
                className="text-accent hover:bg-accent/10"
              />
            )}
          </div>
        </div>
      </aside>

      {/* Auth Modal */}
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Source Control</span>
                {githubToken && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 rounded text-[8px] text-accent font-bold uppercase tracking-wider">
                    <Github className="w-2.5 h-2.5" />
                    GitHub
                  </div>
                )}
              </div>
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
            
            <div className="flex-1 p-4 space-y-6 custom-scrollbar">
              {!githubToken ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Github className="w-12 h-12 opacity-10" />
                  <p className="text-xs opacity-50">GitHub integration is currently disabled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">GitHub Repository</label>
                    <div className="flex items-center gap-2">
                      {isFetchingRepos && <Loader2 className="w-3 h-3 animate-spin opacity-40" />}
                      <button 
                        onClick={fetchRepos}
                        disabled={isFetchingRepos}
                        className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-accent disabled:opacity-30"
                        title="Refresh Repositories"
                      >
                        <RefreshCw className={cn("w-3 h-3", isFetchingRepos && "animate-spin")} />
                      </button>
                    </div>
                  </div>
                  
                  {!selectedRepo && (
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                      <input 
                        type="text"
                        value={repoSearchQuery}
                        onChange={(e) => setRepoSearchQuery(e.target.value)}
                        placeholder="Search repositories..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-7 pr-2 text-[10px] focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  )}
                  
                  {selectedRepo ? (
                    <div className="flex flex-col gap-2">
                      <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-between group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Github className="w-4 h-4 text-accent shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold truncate">{selectedRepo.name}</span>
                            <span className="text-[9px] opacity-40 truncate">{selectedRepo.full_name}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedRepo(null)}
                          className="p-1 hover:bg-white/5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={handleImportRepo}
                        disabled={isFetchingRepos}
                        className="w-full py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                      >
                        <RefreshCw className={cn("w-3 h-3", isFetchingRepos && "animate-spin")} />
                        Import Repository
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 pr-1 custom-scrollbar">
                      {repositories.filter(r => r.name.toLowerCase().includes(repoSearchQuery.toLowerCase())).length > 0 ? (
                        repositories
                          .filter(r => r.name.toLowerCase().includes(repoSearchQuery.toLowerCase()))
                          .map(repo => (
                            <div key={repo.id} className="group flex items-center gap-2 p-2 hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-all">
                              <button 
                                onClick={() => setSelectedRepo(repo)}
                                className="flex-1 text-left flex items-center gap-2 overflow-hidden"
                              >
                                <Folder className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs truncate">{repo.name}</span>
                                {repo.private && <Lock className="w-2.5 h-2.5 opacity-20 ml-auto" />}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRepo(repo);
                                  setTimeout(handleImportRepo, 0);
                                }}
                                className="px-3 py-1 bg-accent text-accent-foreground text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-90"
                                title="Import this repository"
                              >
                                Import
                              </button>
                            </div>
                          ))
                      ) : (
                        <p className="text-[10px] opacity-40 text-center py-8 italic">
                          {isFetchingRepos ? 'Loading repositories...' : repoSearchQuery ? 'No matching repositories' : 'No repositories found'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {githubToken && !isGitInitialized ? (
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

      {/* API Playground Panel */}
      <AnimatePresence>
        {isApiPlaygroundOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: window.innerWidth < 768 ? '100%' : 450, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "flex flex-col overflow-hidden z-40 glass-panel",
              "fixed md:relative inset-y-0 left-16 md:left-0 right-0 md:right-auto"
            )}
          >
            <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">API Playground</span>
              </div>
              <button onClick={() => setIsApiPlaygroundOpen(false)} className="p-1 hover:bg-white/5 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <ApiPlayground 
              method={apiMethod} setMethod={setApiMethod}
              url={apiUrl} setUrl={setApiUrl}
              headers={apiHeaders} setHeaders={setApiHeaders}
              body={apiBody} setBody={setApiBody}
              response={apiResponse}
              isLoading={isApiLoading}
              onSend={handleApiRequest}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Whiteboard Panel */}
      <AnimatePresence>
        {isWhiteboardOpen && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: window.innerWidth < 768 ? '100%' : 'calc(100vw - 64px)', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "flex flex-col overflow-hidden z-[60] glass-panel",
              "fixed inset-y-0 left-16 right-0"
            )}
          >
            <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-white">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-black/50">Collaborative Whiteboard</span>
              </div>
              <button onClick={() => setIsWhiteboardOpen(false)} className="p-1 hover:bg-black/5 rounded text-black/60">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 relative">
              <Whiteboard socket={socket} />
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
            <div className="flex-1 p-4 space-y-6 custom-scrollbar">
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
              <div className="flex items-center gap-1">
                <button 
                  onClick={createFile}
                  className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-accent transition-colors"
                  title="New File"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
                <button 
                  onClick={createFolder}
                  className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-accent transition-colors"
                  title="New Folder"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 py-2 custom-scrollbar">
              {files.filter(f => f.parentId === null).map(file => (
                <div key={file.id}>
                  <FileItem 
                    file={file}
                    isActive={activeFileId === file.id}
                    onSelect={setActiveFileId}
                    onRename={renameFile}
                    onDelete={deleteFile}
                    onToggleFolder={toggleFolder}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                  {file.type === 'folder' && file.isOpen && (
                    <div className="pl-4 border-l border-white/5 ml-4">
                      {files.filter(f => f.parentId === file.id).map(child => (
                        <FileItem 
                          key={child.id}
                          file={child}
                          isActive={activeFileId === child.id}
                          onSelect={setActiveFileId}
                          onRename={renameFile}
                          onDelete={deleteFile}
                          onToggleFolder={toggleFolder}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
                  id="global-search"
                  name="global-search"
                  autoFocus
                  placeholder="Search in files..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-accent outline-none"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 p-2 space-y-4 custom-scrollbar">
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
                          revealLine(result.fileId, result.line);
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
      <section className={cn(
        "border-border-custom flex flex-col bg-bg-secondary shrink-0 transition-all duration-300",
        isPreviewFullScreen 
          ? "fixed inset-0 z-[100] w-full h-full" 
          : isPreviewOpen 
            ? "fixed inset-0 z-[60] w-full h-full md:relative md:inset-auto md:z-auto md:w-1/3 md:flex border-r" 
            : "hidden"
      )}>
        <div className="h-12 border-b border-border-custom flex items-center px-4 justify-between bg-bg-primary overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest opacity-50 text-text-secondary">Live Preview</span>
            {(isPreviewFullScreen || (isPreviewOpen && window.innerWidth < 768)) && (
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-[8px] font-bold rounded uppercase tracking-widest">Full Screen</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPreviewOpen && (
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => setPreviewViewport('desktop')}
              className={cn("p-1.5 rounded-lg transition-all", previewViewport === 'desktop' ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-text-secondary")}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setPreviewViewport('tablet')}
              className={cn("p-1.5 rounded-lg transition-all", previewViewport === 'tablet' ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-text-secondary")}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setPreviewViewport('mobile')}
              className={cn("p-1.5 rounded-lg transition-all", previewViewport === 'mobile' ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-text-secondary")}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button 
              onClick={() => setIsPreviewFullScreen(!isPreviewFullScreen)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-text-secondary hover:text-accent transition-all"
              title={isPreviewFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isPreviewFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <div className="hidden md:flex gap-1.5 ml-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center">
          <div 
            className="transition-all duration-500 shadow-2xl overflow-hidden bg-white h-full"
            style={{ 
              width: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
              maxWidth: '100%'
            }}
          >
            {previewContent ? (
              <iframe
                srcDoc={previewContent}
                title="preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary bg-bg-secondary">
                <Layout className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium opacity-40">No preview available</p>
                <p className="text-xs opacity-30 mt-1">Generate HTML/CSS to see it here</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content - Editor & AI */}
      <main className="flex-1 flex flex-col min-w-0">
        {view === 'dashboard' && (
          <div className="flex-1 bg-bg-primary p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-8">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Project Dashboard</h1>
                  <p className="text-text-secondary">Overview of your current workspace and AI interactions.</p>
                </div>
                <button onClick={() => setView('ide')} className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                  Back to Editor
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-secondary border border-white/10 rounded-3xl p-6 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Total Files</span>
                  <div className="text-3xl font-bold text-white">{files.length}</div>
                  <div className="text-[10px] text-emerald-400">+2 since last session</div>
                </div>
                <div className="bg-bg-secondary border border-white/10 rounded-3xl p-6 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Lines of Code</span>
                  <div className="text-3xl font-bold text-white">{files.reduce((acc, f) => acc + f.code.split('\n').length, 0)}</div>
                  <div className="text-[10px] text-accent">Optimized by AI</div>
                </div>
                <div className="bg-bg-secondary border border-white/10 rounded-3xl p-6 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">AI Interactions</span>
                  <div className="text-3xl font-bold text-white">{projectStats.aiInteractions}</div>
                  <div className="text-[10px] text-blue-400">85% success rate</div>
                </div>
                <div className="bg-bg-secondary border border-white/10 rounded-3xl p-6 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Health Score</span>
                  <div className="text-3xl font-bold text-white">{projectStats.healthScore}%</div>
                  <div className="w-full bg-white/5 h-1 rounded-full mt-2">
                    <div className="bg-accent h-full rounded-full" style={{ width: `${projectStats.healthScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-bg-secondary border border-white/10 rounded-3xl p-8 space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest">Recent Activity</h3>
                  <div className="space-y-4">
                    {commitHistory.slice(0, 5).map(commit => (
                      <div key={commit.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="p-2 bg-accent/20 rounded-xl">
                          <GitCommit className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{commit.message}</p>
                          <p className="text-[10px] opacity-40">{commit.date} • {commit.id}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-20" />
                      </div>
                    ))}
                    {commitHistory.length === 0 && (
                      <div className="text-center py-12 opacity-20 italic text-xs">No recent activity</div>
                    )}
                  </div>
                </div>
                <div className="bg-bg-secondary border border-white/10 rounded-3xl p-8 space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest">AI Insights</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl">
                      <p className="text-[11px] text-emerald-400 font-medium">Performance Tip</p>
                      <p className="text-[10px] opacity-70 mt-1">Your loops in main.js could be optimized using memoization.</p>
                    </div>
                    <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                      <p className="text-[11px] text-accent font-medium">Security Alert</p>
                      <p className="text-[10px] opacity-70 mt-1">Found 2 potential vulnerabilities in your dependency tree.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'ide' && (
          <>
            {/* Top Header */}
            <header className="h-16 border-b border-border-custom flex items-center px-4 md:px-6 justify-between bg-bg-secondary shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 md:gap-4 min-w-max">
            <button 
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                isPreviewOpen ? "bg-accent text-accent-foreground" : "bg-white/10 text-white hover:bg-white/20"
              )}
              title="Toggle Live Preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 overflow-x-auto custom-scrollbar max-w-[300px] md:max-w-none">
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
              onClick={handleStartDebug}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                debuggerStatus === 'running' ? "bg-yellow-500 text-black hover:bg-yellow-400" : "bg-white/10 text-white hover:bg-white/20"
              )}
              title={debuggerStatus === 'running' ? "Pause Execution" : "Start Debug Session"}
            >
              {debuggerStatus === 'running' ? <Bug className="w-3.5 h-3.5 animate-pulse" /> : <Bug className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{debuggerStatus === 'running' ? 'Pause' : 'Debug'}</span>
            </button>
            <button 
              onClick={generateFullStackProject}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Full Stack Template</span>
            </button>
            {/* Add this BEFORE the Run Project button */}
<button 
  onClick={handleExecuteCode}
  disabled={isGenerating}
  className={cn(
    "flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
    ['python', 'javascript', 'typescript', 'cpp', 'c', 'java'].includes(activeFile?.language || '')
      ? "bg-blue-600 text-white hover:bg-blue-500"
      : "bg-white/5 text-text-secondary cursor-not-allowed opacity-50"
  )}
  title="Execute code server-side"
>
  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
  <span className="hidden sm:inline">Execute</span>
</button>
            <button 
              onClick={handleRun}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Run Project</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 ml-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1 pr-2 py-1">
                <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full border border-white/20" />
                <span className="text-[10px] font-bold text-text-secondary pr-1 hidden sm:inline">{user.name}</span>
              </div>
            </div>
          </div>
        </header>

          {/* Single Editor View */}
          {files.length > 0 ? (
            <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">
              <div className="h-8 bg-bg-secondary border-b border-border-custom flex items-center px-4 justify-between z-20 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-widest">{activeFile.name}</span>
                <span className="text-[9px] font-mono text-text-secondary opacity-40">Editing</span>
              </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchSmartSuggestions}
                disabled={isAnalyzing}
                className="p-1.5 hover:bg-white/5 rounded-lg text-accent transition-all group relative"
                title="AI Smart Suggestions"
              >
                {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-bg-secondary border border-white/10 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Smart Suggestions</span>
              </button>
              <button 
                onClick={handleMagicRefactor}
                disabled={isGenerating}
                className="p-1.5 hover:bg-white/5 rounded-lg text-accent transition-all group relative"
                title="AI Magic Refactor"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-bg-secondary border border-white/10 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Magic Refactor</span>
              </button>
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
            <AnimatePresence>
              {debuggerStatus === 'paused' && (
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-bg-secondary/90 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <button 
                    onClick={handleContinue}
                    className="p-2 hover:bg-white/10 rounded-full text-green-400 transition-colors"
                    title="Continue (F8)"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button 
                    onClick={handleStepOver}
                    className="p-2 hover:bg-white/10 rounded-full text-blue-400 transition-colors"
                    title="Step Over (F10)"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleStepInto}
                    className="p-2 hover:bg-white/10 rounded-full text-purple-400 transition-colors"
                    title="Step Into (F11)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleStepOut}
                    className="p-2 hover:bg-white/10 rounded-full text-yellow-400 transition-colors"
                    title="Step Out (Shift+F11)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button 
                    onClick={handleRun}
                    className="p-2 hover:bg-white/10 rounded-full text-red-400 transition-colors"
                    title="Restart"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary text-text-secondary p-8 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
              <Code2 className="w-12 h-12 opacity-20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to Nexus Forge</h2>
            <p className="text-sm opacity-50 max-w-xs mb-8">Start your next full-stack project by creating a new file or using a template.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={createFile}
                className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New File
              </button>
              <button 
                onClick={generateFullStackProject}
                className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Full Stack Template
              </button>
            </div>
          </div>
        )}

        {/* Bottom Panel - AI & Prompt */}
        <footer className="h-64 md:h-96 border-t border-border-custom flex flex-col bg-bg-secondary shrink-0">
          <div className="flex border-b border-border-custom overflow-x-auto custom-scrollbar shrink-0 items-center justify-between pr-4">
            <div className="flex">
              {['ai', 'chat', 'live', 'editor', 'debugger', 'database', 'analytics', 'review', 'tests', 'docs', 'assets', 'npm', 'command'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 md:px-6 py-3 md:py-2 text-[10px] font-mono uppercase tracking-widest transition-colors relative min-w-max",
                    activeTab === tab ? "text-accent" : "opacity-40 hover:opacity-100",
                    tab === 'command' && "md:hidden"
                  )}
                >
                  {tab === 'ai' ? 'AI Assistant' : tab === 'live' ? 'Live AI' : tab === 'npm' ? 'NPM Search' : tab}
                  {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Model:</span>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-accent focus:outline-none focus:border-accent/50 transition-all cursor-pointer"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id} className="bg-bg-primary text-text-primary">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-bg-secondary/50 backdrop-blur-md">
            {/* Content Area */}
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden p-4 font-mono text-sm",
              activeTab === 'command' ? "hidden md:block" : "block"
            )}>
              <AnimatePresence mode="wait">
                {activeTab === 'ai' && (
                  <motion.div
                    key="ai-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 custom-scrollbar prose prose-invert prose-sm max-w-none"
                  >
                    {isGenerating || isDebugging || isAnalyzing ? (
                      <div className="flex items-center gap-3 text-accent">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Nexus AI is processing...</span>
                      </div>
                    ) : smartSuggestions.length > 0 ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Smart Suggestions for {activeFile?.name}
                          </h3>
                          <button 
                            onClick={() => setSmartSuggestions([])}
                            className="text-[10px] opacity-40 hover:opacity-100 uppercase tracking-widest"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {smartSuggestions.map((suggestion, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-accent/30 transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                  "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                                  suggestion.type === 'bug' ? "bg-red-500/20 text-red-400" :
                                  suggestion.type === 'performance' ? "bg-yellow-500/20 text-yellow-400" :
                                  suggestion.type === 'security' ? "bg-purple-500/20 text-purple-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {suggestion.type}
                                </span>
                                <span className={cn(
                                  "text-[8px] font-bold uppercase tracking-widest",
                                  suggestion.impact === 'high' ? "text-red-400" :
                                  suggestion.impact === 'medium' ? "text-yellow-400" :
                                  "text-green-400"
                                )}>
                                  {suggestion.impact} impact
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white mb-1">{suggestion.title}</h4>
                              <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">{suggestion.description}</p>
                              {suggestion.suggestedCode && (
                                <div className="relative">
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={activeFile?.language || 'javascript'}
                                    className="!bg-black/40 !p-3 rounded-lg !text-[10px] border border-white/5"
                                  >
                                    {suggestion.suggestedCode}
                                  </SyntaxHighlighter>
                                  <button 
                                    onClick={() => {
                                      if (activeFile && suggestion.suggestedCode) {
                                        // Simple insertion for now, or we could replace
                                        updateFile(activeFileId, { code: activeFile.code + '\n\n' + suggestion.suggestedCode });
                                        showToast('Code added to file!', 'success');
                                      }
                                    }}
                                    className="absolute bottom-2 right-2 p-1.5 bg-accent text-accent-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Apply Suggestion"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : aiResponse ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-accent">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">AI Response</span>
                          </div>
                          <button 
                            onClick={() => setAiResponse('')}
                            className="text-[9px] opacity-40 hover:opacity-100 uppercase tracking-widest"
                          >
                            Clear
                          </button>
                        </div>
                        <Markdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <div className="relative group">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                  <button 
                                    onClick={() => {
                                      if (activeFile) {
                                        updateFile(activeFileId, { code: activeFile.code + '\n\n' + String(children) });
                                        showToast('Code inserted into file!', 'success');
                                      }
                                    }}
                                    className="p-1.5 bg-accent text-accent-foreground hover:opacity-90 rounded-md backdrop-blur-sm shadow-lg"
                                    title="Insert into File"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(String(children));
                                      showToast('Code copied!', 'success');
                                    }}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                                    title="Copy to Clipboard"
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
                    </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-accent opacity-60 mb-4">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-[10px] uppercase tracking-widest font-bold">Boilerplate & Patterns</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { id: 'api', name: 'API Fetch Hook', icon: Globe, desc: 'React hook with loading/error states' },
                            { id: 'comp', name: 'React Component', icon: Layout, desc: 'Functional component with Tailwind' },
                            { id: 'schema', name: 'Database Schema', icon: Database, desc: 'Prisma/SQL schema for common models' },
                            { id: 'route', name: 'Express Route', icon: Server, desc: 'REST API endpoint with validation' },
                            { id: 'form', name: 'Formik/Zod Form', icon: FileText, desc: 'Validated form with error messages' },
                            { id: 'auth', name: 'Auth Context', icon: Lock, desc: 'React context for user authentication' }
                          ].map((pattern) => (
                            <button
                              key={pattern.id}
                              onClick={() => handleApplyBoilerplate(pattern.name)}
                              className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent/40 transition-all group text-left"
                            >
                              <div className="p-2 bg-accent/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                                <pattern.icon className="w-4 h-4 text-accent" />
                              </div>
                              <span className="text-xs font-bold text-white mb-1">{pattern.name}</span>
                              <span className="text-[10px] text-text-secondary leading-tight">{pattern.desc}</span>
                            </button>
                          ))}
                        </div>

                        <div className="mt-8 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                          <p className="text-[11px] text-text-secondary italic">
                            Tip: You can also use natural language in the prompt bar below to request specific patterns like "Generate a bento grid layout" or "Create a Stripe payment integration".
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    key="chat-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Conversation History</span>
                      <button 
                        onClick={clearChatHistory}
                        className="text-[9px] text-red-400 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Clear Chat
                      </button>
                    </div>
                    <div className="flex-1 space-y-4 mb-4 pr-2 custom-scrollbar">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed group relative",
                            msg.role === 'user' ? "bg-accent text-accent-foreground rounded-tr-none" : "bg-white/5 text-text-secondary rounded-tl-none border border-border-custom"
                          )}>
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <div className="flex items-center gap-2 opacity-50 font-bold uppercase tracking-tighter text-[9px]">
                                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                {msg.role === 'user' ? 'You' : 'Nexus AI'}
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.parts[0].text);
                                  showToast('Message copied!', 'success');
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                                title="Copy message"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="markdown-body">
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
                                              showToast('Code copied!', 'success');
                                            }}
                                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                                          >
                                            <Copy className="w-3 h-3" />
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
                        </div>
                      ))}
                      {isChatStreaming && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 text-text-secondary p-3 rounded-2xl rounded-tl-none border border-border-custom flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin text-accent" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Nexus AI is typing...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="flex gap-2 relative">
                      <input 
                        id="chat-input"
                        name="chat-input"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask anything about coding..."
                        disabled={isChatStreaming}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:ring-0 focus:border-accent transition-all disabled:opacity-50"
                      />
                      <button 
                        onClick={() => handleChatSend()}
                        disabled={isChatStreaming || !chatInput.trim()}
                        className="p-2.5 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-colors disabled:opacity-50"
                      >
                        {isChatStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'live' && (
                  <motion.div
                    key="live-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-start gap-6 p-6 custom-scrollbar"
                  >
                    <div className="w-full flex flex-col items-center gap-6">
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
                    </div>

                    {isLiveActive && (
                      <div className="w-full flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 opacity-50">
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Live Transcription</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                          {liveTranscription.map((text, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "text-[11px] p-2 rounded-lg",
                                text.startsWith('You:') ? "bg-accent/10 text-accent ml-4" : "bg-white/5 text-text-secondary mr-4"
                              )}
                            >
                              {text}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'debugger' && (
                  <motion.div
                    key="debugger-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col overflow-hidden"
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
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={isDebuggerEnabled}
                              onChange={(e) => setIsDebuggerEnabled(e.target.checked)}
                            />
                            <div className={cn(
                              "w-8 h-4 rounded-full transition-colors",
                              isDebuggerEnabled ? "bg-accent" : "bg-white/10"
                            )} />
                            <div className={cn(
                              "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                              isDebuggerEnabled ? "translate-x-4" : "translate-x-0"
                            )} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                            Enable Debugger
                          </span>
                        </label>
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
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Watch</span>
                          <button 
                            onClick={() => {
                              const expr = window.prompt('Enter expression to watch:');
                              if (expr) setWatchExpressions(prev => [...prev, expr]);
                            }}
                            className="p-1 hover:bg-white/5 rounded text-accent"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 p-4 space-y-2 custom-scrollbar">
                          {watchExpressions.map((expr, i) => (
                            <div key={i} className="flex flex-col gap-1 text-[11px] font-mono group border-b border-white/5 pb-2 last:border-0">
                              <div className="flex items-center justify-between">
                                <span className="text-purple-400 font-bold truncate">{expr}</span>
                                <button 
                                  onClick={() => setWatchExpressions(prev => prev.filter((_, idx) => idx !== i))}
                                  className="opacity-0 group-hover:opacity-100 text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-text-secondary break-all pl-2 border-l border-white/10 text-[10px]">
                                {debuggerStatus === 'paused' ? `${watchResults[expr] ?? 'Evaluating...'}` : '---'}
                              </div>
                            </div>
                          ))}
                          {watchExpressions.length === 0 && (
                            <div className="text-zinc-600 italic text-xs">No watch expressions.</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Variables</span>
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-500" />
                              <input 
                                placeholder="Search..."
                                value={variableSearch}
                                onChange={(e) => setVariableSearch(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-full pl-6 pr-2 py-0.5 text-[9px] w-24 focus:w-32 transition-all focus:ring-1 focus:ring-accent outline-none"
                              />
                            </div>
                          </div>
                          <span className="text-[9px] font-mono opacity-30">Local Scope</span>
                        </div>
                        <div className="flex-1 p-4 space-y-1 custom-scrollbar">
                          {Object.entries(inspectedVariables).length > 0 ? (
                            Object.entries(inspectedVariables)
                              .filter(([key]) => !['nexusDebugger', 'parent', 'opener', 'top', 'self', 'window', 'document', 'location', 'history', 'navigator', 'screen', 'chrome', 'speechSynthesis'].includes(key))
                              .filter(([key]) => key.toLowerCase().includes(variableSearch.toLowerCase()))
                              .map(([key, value]) => (
                                <VariableItem key={key} name={key} value={value} />
                              ))
                          ) : (
                            <div className="text-zinc-600 italic text-xs">No variables to inspect. Set a breakpoint and run.</div>
                          )}
                          {Object.entries(inspectedVariables).length > 0 && 
                           Object.entries(inspectedVariables).filter(([key]) => key.toLowerCase().includes(variableSearch.toLowerCase())).length === 0 && (
                            <div className="text-zinc-600 italic text-xs text-center py-4">No variables matching "{variableSearch}"</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Breakpoints</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono opacity-30">Conditional</span>
                            <button 
                              onClick={() => {
                                setBreakpoints({});
                                setConditionalBreakpoints({});
                              }}
                              className="text-[9px] text-red-400 hover:underline"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 p-4 space-y-3 custom-scrollbar">
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
                        <div className="flex-1 p-4 space-y-2 custom-scrollbar">
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
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex gap-4 h-full overflow-hidden">
                      <div className="w-48 bg-black/20 rounded-xl border border-white/5 p-3 custom-scrollbar shrink-0 flex flex-col gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-4 opacity-50">
                            <Database className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">System Tables</span>
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

                        <div>
                          <div className="flex items-center gap-2 mb-4 opacity-50">
                            <Layers className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Project Data</span>
                          </div>
                          <div className="space-y-1">
                            <button 
                              onClick={() => fetchProjectData('tasks')}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-[11px] transition-colors truncate text-accent"
                            >
                              Collection: tasks
                            </button>
                          </div>
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
                            id="sql-query"
                            name="sql-query"
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-mono focus:ring-1 focus:ring-accent outline-none resize-none"
                            placeholder="Enter SQL query..."
                          />
                        </div>
                        <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                          <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Results</span>
                              <button 
                                onClick={() => {
                                  setSqlResults([]);
                                  setProjectData([]);
                                }}
                                className="text-[9px] text-accent hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                            {(sqlResults.length > 0 || projectData.length > 0) && (
                              <span className="text-[9px] opacity-30">
                                {sqlResults.length || projectData.length} rows
                              </span>
                            )}
                          </div>
                          <div className="flex-1 custom-scrollbar p-4">
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
                                        <td key={j} className="p-2 truncate max-w-[200px]">{`${val}`}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : projectData.length > 0 ? (
                              <table className="w-full text-[11px] font-mono border-collapse">
                                <thead>
                                  <tr className="border-b border-white/10">
                                    {Object.keys(projectData[0]).map(key => (
                                      <th key={key} className="text-left p-2 opacity-50 font-medium">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {projectData.map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                      {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="p-2 truncate max-w-[200px]">{`${val}`}</td>
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
                    className="flex-1 custom-scrollbar"
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

                {activeTab === 'review' && (
                  <motion.div
                    key="review-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">AI Security & Performance Audit</h3>
                      </div>
                      <button 
                        onClick={runSecurityAudit}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Run Full Audit
                      </button>
                    </div>
                    <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 custom-scrollbar prose prose-invert prose-sm max-w-none">
                      {reviewResult ? (
                        <Markdown>{reviewResult}</Markdown>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                          <ShieldCheck className="w-12 h-12" />
                          <p className="text-xs max-w-xs">Run an audit to analyze your project for security vulnerabilities and performance bottlenecks.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tests' && (
                  <motion.div
                    key="tests-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TestTube2 className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Automated Unit Testing</h3>
                      </div>
                      <button 
                        onClick={generateTests}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Generate & Run Tests
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                      <div className="bg-black/20 rounded-2xl border border-white/5 p-6 custom-scrollbar">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">Test Suite</h4>
                        <div className="space-y-3">
                          {testResults.map((test, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {test.status === 'pass' && <Check className="w-4 h-4 text-green-400" />}
                                {test.status === 'fail' && <X className="w-4 h-4 text-red-400" />}
                                {test.status === 'pending' && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
                                <span className="text-xs">{test.name}</span>
                              </div>
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                                test.status === 'pass' ? "bg-green-400/10 text-green-400" : 
                                test.status === 'fail' ? "bg-red-400/10 text-red-400" : "bg-accent/10 text-accent"
                              )}>
                                {test.status}
                              </span>
                            </div>
                          ))}
                          {testResults.length === 0 && (
                            <div className="h-full flex items-center justify-center text-[11px] opacity-30 italic">
                              No tests run yet
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-2xl border border-white/5 p-6 custom-scrollbar">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">Test Output</h4>
                        <div className="font-mono text-[11px] space-y-2">
                          {testResults.some(t => t.status === 'fail') && (
                            <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                              {testResults.find(t => t.status === 'fail')?.error}
                            </div>
                          )}
                          <div className="opacity-50">
                            {testResults.length > 0 ? (
                              <pre>
                                {`RUN  v0.34.6 /src\n\n`}
                                {testResults.map(t => `${t.status === 'pass' ? '✓' : '✗'} ${t.name}`).join('\n')}
                                {`\n\nTest Files  1 passed (1)\nTests       ${testResults.filter(t => t.status === 'pass').length} passed | ${testResults.filter(t => t.status === 'fail').length} failed\nTime        ${(Math.random() * 2).toFixed(2)}s`}
                              </pre>
                            ) : "Waiting for tests..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'docs' && (
                  <motion.div
                    key="docs-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Interactive API Documentation</h3>
                      </div>
                      <button 
                        onClick={generateDocs}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Regenerate Docs
                      </button>
                    </div>
                    <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-8 custom-scrollbar prose prose-invert prose-sm max-w-none">
                      {docsContent ? (
                        <Markdown>{docsContent}</Markdown>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                          <BookOpen className="w-12 h-12" />
                          <p className="text-xs max-w-xs">Generate documentation to see an interactive guide for your project's APIs and logic.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'assets' && (
                  <motion.div
                    key="assets-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Asset Manager</h3>
                      </div>
                      <button 
                        onClick={() => setIsAddingAsset(!isAddingAsset)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                          isAddingAsset ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                        )}
                      >
                        {isAddingAsset ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {isAddingAsset ? "Cancel" : "Add Asset"}
                      </button>
                    </div>

                    {isAddingAsset && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest opacity-40">Asset Name</label>
                            <input 
                              value={newAsset.name}
                              onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Hero Image"
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest opacity-40">Asset URL</label>
                            <input 
                              value={newAsset.url}
                              onChange={(e) => setNewAsset(prev => ({ ...prev, url: e.target.value }))}
                              placeholder="https://..."
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleAddAsset}
                          disabled={!newAsset.name || !newAsset.url}
                          className="w-full py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-30"
                        >
                          Confirm Add Asset
                        </button>
                      </motion.div>
                    )}

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 custom-scrollbar p-1">
                      {assets.map((asset) => (
                        <div key={asset.id} className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-accent/50 transition-all aspect-square">
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 p-2 bg-black/80 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-[9px] font-bold text-white truncate mb-2">{asset.name}</p>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`<img src="${asset.url}" alt="${asset.name}" referrerPolicy="no-referrer" />`);
                                }}
                                className="flex-1 py-1 bg-accent text-accent-foreground rounded text-[8px] font-bold uppercase hover:opacity-90 transition-all active:scale-95"
                              >
                                Tag
                              </button>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(asset.url);
                                }}
                                className="flex-1 py-1 bg-white/10 text-white rounded text-[8px] font-bold uppercase hover:bg-white/20 transition-all active:scale-95"
                              >
                                URL
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'npm' && (
                  <motion.div
                    key="npm-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                        <input 
                          placeholder="Search NPM packages..."
                          className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                          value={npmQuery}
                          onChange={(e) => setNpmQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchNpm(npmQuery)}
                        />
                      </div>
                      <button 
                        onClick={() => searchNpm(npmQuery)}
                        disabled={isSearchingNpm}
                        className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        {isSearchingNpm ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                      </button>
                      <button 
                        onClick={reviewDependencies}
                        disabled={isReviewingDeps}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isReviewingDeps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        AI Review Deps
                      </button>
                    </div>

                    {detectedDeps.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            AI Detected Dependencies
                          </h3>
                          <button 
                            onClick={() => {
                              detectedDeps.forEach(dep => installDependency(dep));
                              setDetectedDeps([]);
                            }}
                            className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                          >
                            Install All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {detectedDeps.map(dep => (
                            <div key={dep} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
                              <span className="text-xs font-mono text-white">{dep}</span>
                              <button 
                                onClick={() => {
                                  installDependency(dep);
                                  setDetectedDeps(prev => prev.filter(d => d !== dep));
                                }}
                                className="p-1 hover:text-accent transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div className="flex-1 custom-scrollbar space-y-2">
                      {npmResults.map((result: any) => (
                        <div key={result.package.name} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-bold text-white">{result.package.name}</h4>
                              <span className="text-[10px] opacity-40">v{result.package.version}</span>
                            </div>
                            <p className="text-xs text-text-secondary line-clamp-1 max-w-xl">{result.package.description}</p>
                          </div>
                          <button 
                            onClick={() => installDependency(result.package.name)}
                            className="px-4 py-1.5 bg-white/5 hover:bg-accent hover:text-accent-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            Install
                          </button>
                        </div>
                      ))}
                      {npmResults.length === 0 && !isSearchingNpm && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">
                          <Search className="w-12 h-12 mb-4" />
                          <p>Search for packages to add to your project</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

     {activeTab === 'command' && (
  <motion.div key="terminal-content" ...>
    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5">
      <Terminal className="w-3 h-3 opacity-50" />
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Terminal</span>
      <button 
        onClick={() => setTerminalHistory([])}
        className="ml-auto text-[9px] text-red-400 hover:underline"
      >
        Clear
      </button>
    </div>
    <div className="flex-1 p-4 space-y-2 text-[11px] custom-scrollbar overflow-y-auto">
      <div className="text-accent opacity-50 mb-4">Nexus Forge Terminal v1.0.0</div>
      {terminalHistory.map((entry, i) => (
        <div key={i} className="space-y-1">
          {entry.cmd && (
            <div className="flex items-center gap-2">
              <span className="text-green-400">➜</span>
              <span className="text-blue-400">~/project</span>
              <span className="text-white">{entry.cmd}</span>
            </div>
          )}
          {(entry.output || entry.content) && (
            <div className={cn(
              "whitespace-pre-wrap pl-4 font-mono",
              entry.type === 'error' ? "text-red-400" :
              entry.type === 'success' ? "text-green-400" :
              entry.type === 'warn' ? "text-yellow-400" :
              "text-text-secondary opacity-80"
            )}>
              {entry.output || entry.content}
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="text-green-400">➜</span>
        <span className="text-blue-400">~/project</span>
        <input 
          id="terminal-input"
          name="terminal-input"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          onKeyDown={handleTerminalCommand}
          className="flex-1 bg-transparent outline-none border-none p-0 text-[11px] text-white"
          placeholder="type a command..."
        />
      </div>
    </div>
  </motion.div>
)}
                )}
              </AnimatePresence>
            </div>

            {/* Prompt Input */}
            <div className={cn(
              "w-full md:w-96 border-t md:border-t-0 md:border-l border-border-custom p-4 flex flex-col gap-3 bg-bg-primary shrink-0 custom-scrollbar",
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
                  id="ai-prompt"
                  name="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
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
                disabled={isGenerating || !aiPrompt}
                className="w-full py-2.5 md:py-3 bg-accent text-accent-foreground rounded-lg text-[10px] md:text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Execute Command
              </button>
            </div>
          </div>
        </footer>
      </>
      )}
    </main>

      {/* Voice Status Indicator */}
      <AnimatePresence>
        {toasts.map((toast, i) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={cn(
              "fixed top-4 right-4 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl",
              toast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
              toast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-400" :
              "bg-accent/20 border-accent/30 text-accent"
            )}
            style={{ top: `${16 + i * 60}px` }}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : 
             toast.type === 'error' ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

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

      {/* Floating Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isFloatingChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-80 h-[450px] bg-bg-primary border border-border-custom rounded-2xl shadow-2xl flex flex-col overflow-hidden glass-sidebar"
            >
              <div className="p-4 border-b border-border-custom flex items-center justify-between bg-accent/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Nexus Live Chat</span>
                </div>
                <button 
                  onClick={() => setIsFloatingChatOpen(false)}
                  className="p-1 hover:bg-white/5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <MessageSquare className="w-8 h-8" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Start a conversation about your code</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex flex-col gap-1",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-accent text-accent-foreground rounded-tr-none" 
                          : "bg-white/5 text-text-secondary rounded-tl-none border border-border-custom"
                      )}>
                        {msg.parts[0].text}
                      </div>
                    </div>
                  ))
                )}
                {isChatStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 text-text-secondary p-2 rounded-xl rounded-tl-none border border-border-custom flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-accent" />
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border-custom bg-black/20">
                <div className="relative">
                  <input
                    type="text"
                    value={floatingChatInput}
                    onChange={(e) => setFloatingChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && floatingChatInput.trim()) {
                        handleChatSend(floatingChatInput);
                        setFloatingChatInput('');
                      }
                    }}
                    placeholder="Ask Nexus anything..."
                    className="w-full bg-white/5 border border-border-custom rounded-xl py-2 pl-4 pr-10 text-[11px] focus:outline-none focus:border-accent transition-all"
                  />
                  <button 
                    onClick={() => {
                      if (floatingChatInput.trim()) {
                        handleChatSend(floatingChatInput);
                        setFloatingChatInput('');
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-accent hover:bg-accent/10 rounded-lg transition-all"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
            isFloatingChatOpen ? "bg-red-500 rotate-90" : "bg-accent hover:scale-110"
          )}
        >
          {isFloatingChatOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-accent-foreground" />}
        </button>
      </div>
    </div>
  );
}
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
