import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ['react', 'react-dom'],
          
          // Router
          router: ['react-router'],
          
          // UI libraries - split to reduce initial load
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx'
          ],
          
          // Authentication
          auth: ['@react-oauth/google', 'jwt-decode'],
          
          // Admin components - heavy, load only when needed
          admin: [
            './src/app/pages/AdminDashboardPage',
            './src/app/components/admin/UserManagement',
            './src/app/components/admin/GroupManagement',
            './src/app/components/admin/PaymentManagement',
            './src/app/components/admin/AuditLogs'
          ],
          
          // Homepage sections - lazy loaded
          homepage: [
            './src/app/components/sections/HeroSection',
            './src/app/components/sections/FeaturesSection',
            './src/app/components/sections/HowItWorksSection',
            './src/app/components/sections/PricingSection',
            './src/app/components/sections/ContactSection'
          ]
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router'
    ],
    exclude: [
      // Exclude large dependencies from pre-bundling
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ]
  },
  // Enable compression for static assets
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
});
