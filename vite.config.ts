import { defineConfig } from 'vite';

const DEV_HOST = process.env.VITE_DEV_HOST || '0.0.0.0';
const DEV_PORT = Number(process.env.VITE_DEV_PORT || 5173);
const PUBLIC_HOST = process.env.VITE_PUBLIC_HOST;
const PUBLIC_PORT = Number(process.env.VITE_PUBLIC_PORT || 443);
const PUBLIC_PROTOCOL = (process.env.VITE_PUBLIC_PROTOCOL || '').toLowerCase();

// Disable HMR when accessed externally to avoid WebSocket connection issues
// HMR will still work when accessing via localhost
const hmrConfig = false;

export default defineConfig({
  server: {
    host: DEV_HOST,
    port: DEV_PORT,
    strictPort: true,
    hmr: hmrConfig
  },
  preview: {
    host: DEV_HOST,
    port: Number(process.env.VITE_PREVIEW_PORT || 4173)
  }
});
