import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    setupFiles: ['./src/test-setup.ts'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['host.docker.internal'],
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Prevent backend CORS guard from rejecting proxied localhost:13000 Origin.
            proxyReq.removeHeader('origin');
          });
        },
      },
      '/ws': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        ws: true,
      },
      '/actuator': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@tanstack/react-table')) return 'table';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('date-fns')) return 'date';
            if (
              id.includes('/react-router-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-dom/') ||
              id.includes('/react/')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          }

          if (id.includes('/src/routes/') || id.includes('/src/layouts/')) {
            return 'app-shell';
          }

          if (id.includes('/src/design-system/components/StatusBadge/')) {
            return 'status-badges';
          }

          return undefined;
        },
      },
    },
  },
});
