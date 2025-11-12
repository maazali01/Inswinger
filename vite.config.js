import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    // Enable minification with esbuild (default and faster than terser)
    minify: 'esbuild',
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['react-icons'],
        },
      },
    },
    // Asset optimization
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    // Improve build performance
    target: 'es2020',
    cssCodeSplit: true,
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  // Server options
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },
})
