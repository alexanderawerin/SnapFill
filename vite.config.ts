import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    minify: 'esbuild',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: 'src/ui.html',
      output: {
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

