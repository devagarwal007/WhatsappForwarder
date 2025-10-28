import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true
      }
    },
    allowedHosts: ['*'],
    port: 8095,
    host: '0.0.0.0'
  },
});
