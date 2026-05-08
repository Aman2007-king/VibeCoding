import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    // ✅ Fixed - safe even if key missing
define: {
  'process.env': {
    NODE_ENV: JSON.stringify(mode),
    GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY || ''),
  },
  'global': 'globalThis',
},
    optimizeDeps: {
      include: [
        'react-syntax-highlighter',
        'react-syntax-highlighter/dist/esm/styles/prism',
        'socket.io-client',
        'canvas-confetti',
        'framer-motion',
        'motion',
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
