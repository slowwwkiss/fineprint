import { defineConfig } from 'vite';

// Relative base so the built site works from any static host path
// (GitHub Pages project site, Firebase Hosting, or a plain folder).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022'
  },
  server: {
    port: 5173
  }
});
