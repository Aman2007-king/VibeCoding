import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Database, 
  Cloud, 
  Zap, 
  Shield, 
  Globe, 
  Cpu, 
  Code2, 
  Rocket, 
  ArrowLeft, 
  Layers, 
  Terminal,
  Github,
  Box,
  Activity,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  MoreVertical,
  RefreshCw,
  History,
  ChevronRight,
  GitBranch,
  Settings
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Octokit } from 'octokit';

interface VercelCloneProps {
  onBack: () => void;
  currentUser: any;
}

interface Project {
  id: string;
  name: string;
  repo_url: string;
  subdomain: string;
  created_at: string;
}

interface Deployment {
  id: string;
  project_id: string;
  status: 'PENDING' | 'BUILDING' | 'READY' | 'FAILED';
  logs: string;
  created_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  updated_at: string;
}

export default function VercelClone({ onBack, currentUser }: VercelCloneProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'architecture'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRepo, setNewProjectRepo] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [deploymentDomain, setDeploymentDomain] = useState('nexuscloud.sh');
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
    fetchConfig();
    socketRef.current = io();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/vercel/config');
      if (res.data.success) {
        setDeploymentDomain(res.data.domain);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (isNewProjectModalOpen && currentUser?.provider === 'github' && currentUser?.accessToken) {
      fetchUserRepos();
    }
  }, [isNewProjectModalOpen, currentUser]);

  const fetchUserRepos = async () => {
    setRepoLoading(true);
    try {
      const octokit = new Octokit({ auth: currentUser.accessToken });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 10
      });
      setUserRepos(data as any);
    } catch (err) {
      console.error('Failed to fetch GitHub repos:', err);
    } finally {
      setRepoLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/vercel/projects');
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName || !newProjectRepo) return;
    try {
      const res = await axios.post('/api/vercel/projects', {
        name: newProjectName,
        repo_url: newProjectRepo
      });
      if (res.data.success) {
        setProjects([...projects, res.data.project]);
        setIsNewProjectModalOpen(false);
        setNewProjectName('');
        setNewProjectRepo('');
        // Automatically select the new project
        setSelectedProject(res.data.project);
        triggerDeployment(res.data.project.id);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const fetchDeployments = async (projectId: string) => {
    try {
      const res = await axios.get(`/api/vercel/projects/${projectId}/deployments`);
      if (res.data.success) {
        setDeployments(res.data.deployments);
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    }
  };

  const triggerDeployment = async (projectId: string) => {
    try {
      const res = await axios.post('/api/vercel/deployments', { project_id: projectId });
      if (res.data.success) {
        const depId = res.data.deployment_id;
        setLogs([]);
        
        // Listen for logs
        socketRef.current?.on(`vercel:logs:${depId}`, (data: { log: string }) => {
          setLogs(prev => [...prev, data.log]);
        });

        socketRef.current?.on(`vercel:status:${depId}`, (data: { status: string }) => {
          if (data.status === 'READY') {
            fetchDeployments(projectId);
          }
        });

        // Create a temporary active deployment for the UI
        setActiveDeployment({
          id: depId,
          project_id: projectId,
          status: 'BUILDING',
          logs: '',
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to trigger deployment:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'BUILDING': return 'text-accent bg-accent/10 border-accent/20';
      case 'FAILED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-text-secondary bg-white/5 border-white/10';
    }
  };

  const prismaSchema = `// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  projects  Project[]
  createdAt DateTime  @default(now())
}

model Project {
  id            String       @id @default(cuid())
  name          String
  gitRepoUrl    String
  subdomain     String       @unique
  ownerId       String
  owner         User         @relation(fields: [ownerId], references: [id])
  deployments   Deployment[]
  createdAt     DateTime     @default(now())
}

model Deployment {
  id          String           @id @default(cuid())
  projectId   String
  project     Project          @relation(fields: [projectId], references: [id])
  status      DeploymentStatus @default(PENDING)
  buildLogs   String?          @db.Text
  s3Url       String?
  createdAt   DateTime         @default(now())
}

enum DeploymentStatus {
  PENDING
  BUILDING
  READY
  FAILED
}`;

  const buildServiceLogic = `// build-service.ts
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function buildAndDeploy(repoUrl: string, deploymentId: string) {
  const buildPath = path.join(__dirname, 'builds', deploymentId);
  
  try {
    // 1. Clone the repository
    console.log(\`Cloning \${repoUrl}...\`);
    await execShellCommand(\`git clone \${repoUrl} \${buildPath}\`);

    // 2. Install dependencies and build
    console.log('Installing dependencies and building...');
    await execShellCommand(\`cd \${buildPath} && npm install && npm run build\`);

    // 3. Upload to S3
    const distPath = path.join(buildPath, 'dist'); // or 'build', 'out'
    await uploadFolderToS3(distPath, deploymentId);

    console.log('Deployment successful!');
    return { success: true, s3Url: \`https://\${process.env.S3_BUCKET}.s3.amazonaws.com/\${deploymentId}\` };
  } catch (error) {
    console.error('Build failed:', error);
    throw error;
  } finally {
    // Cleanup
    fs.rmSync(buildPath, { recursive: true, force: true });
  }
}

function execShellCommand(cmd: string) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout ? stdout : stderr);
    });
  });
}

async function uploadFolderToS3(folderPath: string, s3Prefix: string) {
  const files = fs.readdirSync(folderPath, { recursive: true }) as string[];
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isDirectory()) continue;

    const fileContent = fs.readFileSync(filePath);
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: \`\${s3Prefix}/\${file}\`,
      Body: fileContent,
      ContentType: getContentType(file)
    }));
  }
}

function getContentType(fileName: string) {
  if (fileName.endsWith('.html')) return 'text/html';
  if (fileName.endsWith('.js')) return 'application/javascript';
  if (fileName.endsWith('.css')) return 'text/css';
  return 'application/octet-stream';
}`;

  const mermaidDiagram = `graph TD
    A[User] -->|Connect GitHub| B[Next.js Orchestrator]
    B -->|Store Metadata| C[(PostgreSQL/Prisma)]
    B -->|Queue Build| D[Redis/BullMQ]
    D -->|Spawn Container| E[Docker Build Service]
    E -->|Clone & Build| F[Transient Container]
    F -->|Upload Static Files| G[AWS S3]
    H[Request: user.platform.com] -->|Route| I[Nginx Reverse Proxy]
    I -->|Fetch Content| G
    E -->|Stream Logs| J[WebSockets]
    J -->|Real-time Feedback| A`;

  const pillars = [
    { layer: 'The Orchestrator', tech: 'Next.js + Prisma', responsibility: 'Managing users, linking GitHub accounts via OAuth, and triggering builds.' },
    { layer: 'The Builder', tech: 'Docker + Node.js', responsibility: "Spawning a transient container to git clone the user's repo and execute npm install && npm run build." },
    { layer: 'The Edge/Proxy', tech: 'Wildcard DNS + Nginx', responsibility: "Routing incoming traffic from *.yourdomain.com to the specific static files stored in your cloud storage." },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary custom-scrollbar flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-bg-secondary/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-accent" />
              <span className="text-lg font-black tracking-tighter uppercase">Nexus Cloud</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all \${activeTab === 'dashboard' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('architecture')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all \${activeTab === 'architecture' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}
              >
                Architecture
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="bg-white text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-white/5"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {selectedProject ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          setSelectedProject(null);
                          setActiveDeployment(null);
                        }}
                        className="text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-2 hover:translate-x-[-4px] transition-transform"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Projects
                      </button>
                      <h2 className="text-3xl font-black tracking-tight uppercase leading-none">{selectedProject.name}</h2>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <a href={selectedProject.repo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                          <Github className="w-4 h-4" />
                          {selectedProject.repo_url.replace('https://github.com/', '')}
                        </a>
                        <a href={`https://${selectedProject.subdomain}.${deploymentDomain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                          <Globe className="w-4 h-4" />
                          {selectedProject.subdomain}.{deploymentDomain}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                        className="p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-text-secondary"
                        title="Project Settings"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => triggerDeployment(selectedProject.id)}
                        className="bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
                      >
                        <Rocket className="w-4 h-4" />
                        Redeploy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Active Deployment Logs */}
                      {activeDeployment && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-black rounded-3xl border border-white/5 overflow-hidden shadow-2xl"
                        >
                          <div className="bg-bg-secondary px-6 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-accent" />
                              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Build Logs - {activeDeployment.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {activeDeployment.status === 'BUILDING' && <Loader2 className="w-3 h-3 text-accent animate-spin" />}
                              <span className={`text-[10px] font-black uppercase tracking-widest \${activeDeployment.status === 'READY' ? 'text-emerald-400' : 'text-accent'}`}>
                                {activeDeployment.status}
                              </span>
                            </div>
                          </div>
                          <div className="p-6 h-[400px] overflow-y-auto font-mono text-[11px] custom-scrollbar bg-[#0D0D0E] selection:bg-accent/30">
                            {logs.map((log, i) => (
                              <div key={i} className="py-0.5 opacity-80 animate-in fade-in slide-in-from-left-2">
                                <span className="text-text-secondary mr-3 opacity-30">[{i + 1}]</span>
                                {log}
                              </div>
                            ))}
                            <div ref={logEndRef} />
                            {logs.length === 0 && (
                              <div className="h-full flex items-center justify-center text-text-secondary opacity-40 italic">
                                Waiting for build to start...
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Deployment History */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Deployment History
                        </h3>
                        <div className="space-y-3">
                          {deployments.map((dep) => (
                            <div key={dep.id} className="p-5 bg-bg-secondary border border-white/5 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all">
                              <div className="flex items-center gap-5">
                                <div className={`w-2.5 h-2.5 rounded-full \${dep.status === 'READY' ? 'bg-emerald-400' : dep.status === 'FAILED' ? 'bg-red-400' : 'bg-accent'}`} />
                                <div>
                                  <div className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                                    {dep.id}
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border \${getStatusColor(dep.status)}`}>
                                      {dep.status}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-text-secondary uppercase tracking-widest mt-1 opacity-60">
                                    {new Date(dep.created_at).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {dep.status === 'FAILED' && (
                                  <button 
                                    onClick={() => triggerDeployment(selectedProject.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-400/20 transition-colors flex items-center gap-1.5"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Retry
                                  </button>
                                )}
                                <a 
                                  href={`https://${selectedProject.subdomain}.${deploymentDomain}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-2.5 hover:bg-white/5 rounded-xl text-text-secondary hover:text-accent transition-all"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                          {deployments.length === 0 && !activeDeployment && (
                            <div className="text-center py-16 bg-bg-secondary/30 rounded-3xl border border-dashed border-white/10">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 opacity-20">
                                <Rocket className="w-6 h-6" />
                              </div>
                              <p className="text-sm text-text-secondary opacity-50">No deployments yet. Click redeploy to start.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="p-8 bg-bg-secondary border border-white/5 rounded-3xl space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">Project Details</h4>
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] uppercase tracking-widest opacity-40">Framework</div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <Box className="w-3 h-3 text-accent" />
                              Next.js
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] uppercase tracking-widest opacity-40">Build Command</div>
                            <div className="text-[11px] font-mono bg-black/40 px-2 py-1 rounded text-accent">npm run build</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] uppercase tracking-widest opacity-40">Output Dir</div>
                            <div className="text-[11px] font-mono bg-black/40 px-2 py-1 rounded">.next</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] uppercase tracking-widest opacity-40">Node Version</div>
                            <div className="text-xs font-bold">20.x</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-accent/5 border border-accent/20 rounded-3xl space-y-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                          <Globe className="w-20 h-20 text-accent" />
                        </div>
                        <div className="flex items-center gap-2 text-accent relative z-10">
                          <Zap className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-widest">Edge Network</h4>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed relative z-10 opacity-80">
                          Your project is being served from 14 global edge locations. Static assets are cached at the edge for sub-100ms latency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tight uppercase">Projects.</h2>
                      <p className="text-sm text-text-secondary opacity-60 uppercase tracking-widest text-[10px] font-black">Manage your global infrastructure</p>
                    </div>
                    <div className="flex items-center gap-2 bg-bg-secondary border border-white/5 rounded-xl px-4 py-2.5 focus-within:border-accent/50 transition-all group">
                      <Search className="w-4 h-4 text-text-secondary group-focus-within:text-accent transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Search projects..." 
                        className="bg-transparent border-none outline-none text-sm w-48 placeholder:opacity-30"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-56 bg-bg-secondary animate-pulse rounded-[2.5rem] border border-white/5" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((project) => (
                        <motion.div 
                          key={project.id}
                          whileHover={{ y: -6, scale: 1.02 }}
                          onClick={() => {
                            setSelectedProject(project);
                            fetchDeployments(project.id);
                          }}
                          className="p-8 bg-bg-secondary border border-white/5 rounded-[2.5rem] space-y-6 cursor-pointer hover:border-accent/30 transition-all group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors" />
                          
                          <div className="flex items-center justify-between relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                              <Box className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Active</span>
                            </div>
                          </div>
                          <div className="space-y-2 relative z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-accent transition-colors">{project.name}</h3>
                            <p className="text-xs text-text-secondary font-mono truncate opacity-50 flex items-center gap-1.5">
                              <Globe className="w-3 h-3" />
                              {project.subdomain}.{deploymentDomain}
                            </p>
                          </div>
                          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-text-secondary relative z-10">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                              <GitBranch className="w-3.5 h-3.5" />
                              Main
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-30">
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      <button 
                        onClick={() => setIsNewProjectModalOpen(true)}
                        className="p-8 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-accent/50 hover:bg-accent/5 transition-all group min-h-[224px]"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all group-hover:scale-110">
                          <Plus className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Create New Project</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="architecture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-24"
            >
              <section className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Core Foundation</h2>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">Critical Architecture Pillars.</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {pillars.map((pillar, i) => (
                    <div key={i} className="p-10 bg-bg-secondary border border-white/5 rounded-[2.5rem] space-y-6 hover:border-accent/30 transition-all group">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                        {i === 0 ? <Layers className="w-7 h-7" /> : i === 1 ? <Box className="w-7 h-7" /> : <Globe className="w-7 h-7" />}
                      </div>
                      <h4 className="text-2xl font-black uppercase tracking-tight">{pillar.layer}</h4>
                      <div className="text-[11px] font-mono text-accent uppercase tracking-widest opacity-60">{pillar.tech}</div>
                      <p className="text-sm text-text-secondary leading-relaxed opacity-70">{pillar.responsibility}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Visual Logic</h2>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">System Architecture.</h3>
                </div>
                <div className="p-10 bg-bg-secondary border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                   <div className="absolute top-0 left-0 w-full h-full bg-accent/5 pointer-events-none" />
                  <div className="bg-black/60 rounded-[2rem] p-8 overflow-x-auto custom-scrollbar relative z-10 border border-white/5">
                    <pre className="text-xs font-mono text-emerald-400/80 leading-relaxed">{mermaidDiagram}</pre>
                  </div>
                </div>
              </section>

              <section className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Data Layer</h2>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">Prisma Schema.</h3>
                </div>
                <div className="rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                  <SyntaxHighlighter language="prisma" style={vscDarkPlus} customStyle={{ margin: 0, padding: '3rem', fontSize: '14px', background: '#0D0D0E' }}>
                    {prismaSchema}
                  </SyntaxHighlighter>
                </div>
              </section>

              <section className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Core Engine</h2>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">Build Service Logic.</h3>
                </div>
                <div className="rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                  <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '3rem', fontSize: '14px', background: '#0D0D0E' }}>
                    {buildServiceLogic}
                  </SyntaxHighlighter>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* New Project Modal */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewProjectModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-bg-secondary border border-white/10 rounded-[3rem] p-12 shadow-2xl space-y-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Github className="w-32 h-32" />
              </div>
              
              <div className="space-y-3 relative z-10">
                <h3 className="text-4xl font-black tracking-tight uppercase leading-none">Import Project.</h3>
                <p className="text-sm text-text-secondary opacity-60 font-medium">Connect your GitHub repository to start deploying.</p>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Project Name</label>
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="my-awesome-app"
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:opacity-20"
                  />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">GitHub Repository</label>
                   
                   {currentUser?.provider === 'github' && userRepos.length > 0 ? (
                     <div className="space-y-3">
                        <div className="text-[10px] uppercase tracking-widest opacity-40 font-black mb-2">Your Repositories</div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          {userRepos.map(repo => (
                            <button 
                              key={repo.id}
                              onClick={() => {
                                setNewProjectRepo(repo.html_url);
                                if (!newProjectName) setNewProjectName(repo.name);
                              }}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all \${newProjectRepo === repo.html_url ? 'bg-accent/10 border-accent text-accent' : 'bg-black/40 border-white/5 hover:border-white/20 text-text-secondary hover:text-white'}`}
                            >
                              <div className="flex items-center gap-3">
                                <Github className="w-4 h-4" />
                                <span className="text-xs font-bold">{repo.full_name}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-40" />
                            </button>
                          ))}
                        </div>
                        <div className="text-center py-2">
                          <span className="text-[10px] uppercase tracking-widest opacity-30 font-black">OR</span>
                        </div>
                     </div>
                   ) : repoLoading ? (
                     <div className="py-8 flex flex-col items-center gap-3 opacity-40">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Fetching Repositories...</span>
                     </div>
                   ) : null}

                  <div className="relative">
                    <Github className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                      type="text" 
                      value={newProjectRepo}
                      onChange={(e) => setNewProjectRepo(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:opacity-20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 relative z-10">
                <button 
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="flex-1 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={createProject}
                  disabled={!newProjectName || !newProjectRepo}
                  className="flex-1 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white text-black hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                >
                  Deploy Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 text-center bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-accent" />
              <span className="text-sm font-black tracking-tighter uppercase">Nexus Cloud Infrastructure</span>
            </div>
          <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.4em] opacity-20">
            Architecting the Future of Deployment &copy; 2026
          </p>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">
            <a href="#" className="hover:text-accent transition-colors">Status</a>
            <a href="#" className="hover:text-accent transition-colors">Docs</a>
            <a href="#" className="hover:text-accent transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
