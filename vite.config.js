import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true -> bisa dibuka dari HP lewat IP lokal (satu jaringan WiFi)
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, open: true },
  preview: { host: true, port: 4173 },
});
