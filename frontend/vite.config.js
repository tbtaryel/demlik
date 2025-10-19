server.allowedHosts 6ef70a92-d051-41c6-bf9b-326fc540a85d-00-y9z8dpbsfr6e.sisko.replit.dev

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  publicDir: 'pwa',
});
