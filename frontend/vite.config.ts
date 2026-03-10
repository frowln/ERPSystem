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
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 20,
        branches: 20,
        functions: 20,
        statements: 20,
      },
      include: [
        'src/api/**/*.ts',
        'src/stores/**/*.ts',
        'src/hooks/**/*.ts',
        'src/lib/**/*.ts',
        'src/i18n/**/*.ts',
        'src/config/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/test/**',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
  server: {
    port: 4000,
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
      '/swagger-ui': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/v3/api-docs': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
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
          // --- Vendor chunks (node_modules) ---
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@tanstack/react-table')) return 'table';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('date-fns')) return 'date';
            if (id.includes('xlsx') || id.includes('exceljs')) return 'vendor-xlsx';
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
            if (id.includes('zustand')) return 'vendor-zustand';
            // React ecosystem: react, react-dom, react-router, scheduler, react-hot-toast
            if (
              id.includes('/react-router-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-dom/') ||
              id.includes('/react/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          }

          // --- i18n chunk (large translation files) ---
          if (id.includes('/src/i18n/ru.ts') || id.includes('/src/i18n/en.ts')) {
            return 'i18n-translations';
          }

          // --- Shared infrastructure: design system, stores, hooks, lib, api, components ---
          // These are used across all modules and should NOT be split into domain chunks
          // to avoid circular chunk dependencies.
          if (
            id.includes('/src/design-system/') ||
            id.includes('/src/stores/') ||
            id.includes('/src/hooks/') ||
            id.includes('/src/lib/') ||
            id.includes('/src/api/') ||
            id.includes('/src/config/') ||
            id.includes('/src/types/')
          ) {
            return 'app-core';
          }

          // Shared components (non-page-level)
          if (id.includes('/src/components/')) {
            return 'app-core';
          }

          // --- App shell: routes + layouts ---
          if (id.includes('/src/routes/') || id.includes('/src/layouts/')) {
            return 'app-core';
          }

          // --- Domain module chunks (split heavy modules into their own chunks) ---
          // Finance / FM / Budget
          if (id.includes('/src/modules/finance/') || id.includes('/src/modules/costManagement/')) {
            return 'mod-finance';
          }
          // Estimates
          if (id.includes('/src/modules/estimates/') || id.includes('/src/modules/pricing/')) {
            return 'mod-estimates';
          }
          // Analytics & reporting
          if (id.includes('/src/modules/analytics/')) {
            return 'mod-analytics';
          }
          // Projects, tasks, planning
          if (id.includes('/src/modules/projects/') || id.includes('/src/modules/planning/')) {
            return 'mod-projects';
          }
          // Specifications & commercial proposals
          if (id.includes('/src/modules/specifications/') || id.includes('/src/modules/commercialProposal/')) {
            return 'mod-specifications';
          }
          // Warehouse
          if (id.includes('/src/modules/warehouse/')) {
            return 'mod-warehouse';
          }
          // HR, safety, recruitment, leave
          if (
            id.includes('/src/modules/hr/') ||
            id.includes('/src/modules/hrRussian/') ||
            id.includes('/src/modules/safety/') ||
            id.includes('/src/modules/recruitment/') ||
            id.includes('/src/modules/leave/')
          ) {
            return 'mod-hr';
          }
          // Documents, CDE, PTO, closing, dailylog, russianDocs
          if (
            id.includes('/src/modules/documents/') ||
            id.includes('/src/modules/cde/') ||
            id.includes('/src/modules/pto/') ||
            id.includes('/src/modules/closing/') ||
            id.includes('/src/modules/dailylog/') ||
            id.includes('/src/modules/russianDocs/')
          ) {
            return 'mod-documents';
          }
          // Quality, punchlist, regulatory, defects
          if (
            id.includes('/src/modules/quality/') ||
            id.includes('/src/modules/punchlist/') ||
            id.includes('/src/modules/regulatory/') ||
            id.includes('/src/modules/defects/')
          ) {
            return 'mod-quality';
          }
          // Operations, fleet, IoT, maintenance, dispatch
          if (
            id.includes('/src/modules/operations/') ||
            id.includes('/src/modules/fleet/') ||
            id.includes('/src/modules/iot/') ||
            id.includes('/src/modules/maintenance/') ||
            id.includes('/src/modules/dispatch/')
          ) {
            return 'mod-operations';
          }
          // Settings, integrations, admin
          if (
            id.includes('/src/modules/settings/') ||
            id.includes('/src/modules/integrations/') ||
            id.includes('/src/modules/apiManagement/') ||
            id.includes('/src/modules/integration1c/') ||
            id.includes('/src/modules/isup/') ||
            id.includes('/src/modules/kep/') ||
            id.includes('/src/modules/subscription/')
          ) {
            return 'mod-settings';
          }
          // Portfolio, CRM, legal, portal
          if (
            id.includes('/src/modules/portfolio/') ||
            id.includes('/src/modules/crm/') ||
            id.includes('/src/modules/legal/') ||
            id.includes('/src/modules/portal/') ||
            id.includes('/src/modules/siteAssessment/') ||
            id.includes('/src/modules/prequalification/')
          ) {
            return 'mod-portfolio';
          }
          // BIM & design (already large, keep isolated)
          if (id.includes('/src/modules/bim/') || id.includes('/src/modules/design/')) {
            return 'mod-bim';
          }
          // Procurement
          if (id.includes('/src/modules/procurement/')) {
            return 'mod-procurement';
          }

          return undefined;
        },
      },
    },
  },
});
