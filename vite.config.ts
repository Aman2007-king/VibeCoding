import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    chunkSizeWarningLimit: 5000,
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: false,
  },
  server: {
    port: 5173,
  }
});
