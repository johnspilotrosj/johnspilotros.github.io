import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built site works at any URL (root domain, subfolder, or file://)
export default defineConfig({
  plugins: [react()],
  base: './',
});
