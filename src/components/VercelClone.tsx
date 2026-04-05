import React from 'react';
import { motion } from 'framer-motion';
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
  Activity
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface VercelCloneProps {
  onBack: () => void;
}

export default function VercelClone({ onBack }: VercelCloneProps) {
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
    <div className="min-h-screen bg-bg-primary text-text-primary custom-scrollbar">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-accent hover:text-white transition-colors mb-8 font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forge
          </button>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest"
            >
              <Server className="w-3 h-3" />
              Cloud Infrastructure Blueprint
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none"
            >
              Vercel <span className="text-accent">Clone.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-text-secondary max-w-3xl text-lg md:text-xl font-medium opacity-80"
            >
              A high-performance architecture for automated frontend deployments, edge computing, and global infrastructure management.
            </motion.p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-32">
        
        {/* Architecture Pillars */}
        <section className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Core Foundation</h2>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Critical Architecture Pillars.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pillar, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-bg-secondary border border-white/5 rounded-3xl space-y-4 hover:border-accent/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  {i === 0 ? <Layers className="w-6 h-6" /> : i === 1 ? <Box className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight">{pillar.layer}</h4>
                <div className="text-[10px] font-mono text-accent uppercase tracking-widest opacity-60">{pillar.tech}</div>
                <p className="text-sm text-text-secondary leading-relaxed opacity-70">{pillar.responsibility}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* System Diagram */}
        <section className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Visual Logic</h2>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">System Architecture.</h3>
          </div>
          
          <div className="p-8 bg-bg-secondary border border-white/5 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-2 mb-6 text-xs font-mono opacity-40 uppercase tracking-widest">
              <Activity className="w-3 h-3 text-accent" />
              Mermaid.js Flowchart
            </div>
            <div className="bg-black/40 rounded-2xl p-6 overflow-x-auto custom-scrollbar">
              <pre className="text-xs font-mono text-emerald-400/80 leading-relaxed">
                {mermaidDiagram}
              </pre>
            </div>
          </div>
        </section>

        {/* Database Schema */}
        <section className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Data Layer</h2>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Prisma Schema.</h3>
          </div>
          
          <div className="rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="bg-bg-secondary px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">schema.prisma</span>
              </div>
            </div>
            <SyntaxHighlighter 
              language="prisma" 
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '2rem', fontSize: '13px', background: '#0D0D0E' }}
            >
              {prismaSchema}
            </SyntaxHighlighter>
          </div>
        </section>

        {/* Build Service Logic */}
        <section className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Core Engine</h2>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Build Service Logic.</h3>
          </div>
          
          <div className="rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="bg-bg-secondary px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">build-service.ts</span>
              </div>
            </div>
            <SyntaxHighlighter 
              language="typescript" 
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '2rem', fontSize: '13px', background: '#0D0D0E' }}
            >
              {buildServiceLogic}
            </SyntaxHighlighter>
          </div>
        </section>

        {/* Complexity Note */}
        <section className="relative p-12 bg-accent/5 border border-accent/20 rounded-[3rem] overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap className="w-32 h-32 text-accent" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 text-accent">
              <Shield className="w-6 h-6" />
              <h4 className="text-xl font-black uppercase tracking-tight">A Note on Complexity</h4>
            </div>
            <p className="text-lg text-text-secondary leading-relaxed opacity-80">
              The hardest part of Vercel isn't the dashboard; it's the <strong>Build Queue</strong>. If 100 people click "Deploy" at once, you need a system (like Redis or BullMQ) to ensure your server doesn't crash from 100 simultaneous Docker builds.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="px-4 py-2 bg-accent/10 rounded-xl border border-accent/20 text-[10px] font-black uppercase tracking-widest text-accent">
                Redis Caching
              </div>
              <div className="px-4 py-2 bg-accent/10 rounded-xl border border-accent/20 text-[10px] font-black uppercase tracking-widest text-accent">
                BullMQ Workers
              </div>
              <div className="px-4 py-2 bg-accent/10 rounded-xl border border-accent/20 text-[10px] font-black uppercase tracking-widest text-accent">
                Auto-Scaling ECS
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center bg-bg-secondary/50">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Code2 className="w-6 h-6 text-accent" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">Nexus Forge</span>
        </div>
        <p className="text-xs text-text-secondary font-black uppercase tracking-[0.2em] opacity-40">
          Architecting the Future of Deployment.
        </p>
      </footer>
    </div>
  );
}
