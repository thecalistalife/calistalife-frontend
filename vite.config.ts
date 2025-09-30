import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    chunkSizeWarningLimit: 500, // Lower warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunk - most important
          vendor: ['react', 'react-dom'],
          // Router chunk - lazy loaded
          router: ['react-router-dom'],
          // UI libraries - separate chunk
          ui: ['framer-motion', 'lucide-react'],
          // Data fetching - separate chunk
          data: ['@tanstack/react-query', 'axios', 'zustand'],
          // Utils - small utilities
          utils: ['clsx'],
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // External dependencies to reduce bundle
      external: [],
    },
    // Optimize build for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple compression passes
      },
      mangle: {
        toplevel: true, // More aggressive minification
      },
    },
    // Additional optimizations
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline small assets
  },
})
