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
EOF
echo "vite.config.ts updated"
cat /home/claude/vibe4/VibeCoding-main/vite.config.ts
Output

vite.config.ts updated
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
