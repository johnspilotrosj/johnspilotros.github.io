import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base '/' — path routing (spilo.xyz/boise) needs root-absolute asset URLs so
// nested pages load /assets/... instead of resolving relative to their folder.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
