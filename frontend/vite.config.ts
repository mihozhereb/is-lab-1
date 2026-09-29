import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В режиме разработки запросы к API и WebSocket проксируются на WildFly (контекст /islab).
const backend = process.env.BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  // Относительные пути: собранный фронтенд лежит в корне WAR и открывается по /islab/.
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        rewrite: (path) => `/islab${path}`,
        cookiePathRewrite: { '/islab': '/' },
      },
      '/ws': {
        target: backend,
        ws: true,
        changeOrigin: true,
        rewrite: (path) => `/islab${path}`,
      },
    },
  },
});
