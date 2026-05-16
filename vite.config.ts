import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  build: {
    // ✅ Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    
    rollupOptions: {
      output: {
        // ✅ Split vendor chunks for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          
          // Monaco editor (heaviest chunk ~2MB)
          'monaco-editor': ['@monaco-editor/react'],
          
          // Animation libraries
          'motion': ['framer-motion'],
          
          // Firebase
          'firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore'
          ],
          
          // Google AI
          'google-ai': ['@google/genai'],
          
          // UI utilities
          'ui-utils': [
            'lucide-react',
            'canvas-confetti',
            'clsx',
            'tailwind-merge'
          ],
          
          // Socket.io
          'socket': ['socket.io-client'],
        }
      }
    },
    
    // ✅ Minification settings
    minify: 'esbuild',
    target: 'esnext',
    
    // ✅ Source maps only in development
    sourcemap: false,
  },
  
  // ✅ Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react',
    ],
    exclude: [
      '@monaco-editor/react',
    ]
  },

  server: {
    port: 5173,
    hmr: true,
  }
});
