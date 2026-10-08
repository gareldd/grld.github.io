import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.BASE_PATH || '/',
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/skinview3d/') || id.includes('/three/') || id.includes('/skinview-utils/')) return 'player';
  } } } },
});
