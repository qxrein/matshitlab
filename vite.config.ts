import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = new URL('.', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  root: './',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': `${__dirname}/src`,
    },
  },
});
