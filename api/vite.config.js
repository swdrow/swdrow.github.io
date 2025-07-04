import { defineConfig } from 'vite'

export default defineConfig({
  // Set root to parent directory for project root build
  root: '..',
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: '/index.html', // Open index.html by default
    // Proxy API requests to Flask backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Flask API server on port 5000
        changeOrigin: true,
        secure: false
      },
      // Also proxy direct routes that Flask handles
      '/dashboard': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/docs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/documentation': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Preview server configuration (for testing builds)
  preview: {
    port: 4173,
    host: true,
    // Proxy API requests to Flask backend during preview
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Build configuration for production
  build: {
    outDir: 'api/dist',
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps to avoid warnings
    // Generate manifest for Flask to reference built assets
    manifest: true
  },
  
  // CSS processing
  css: {
    devSourcemap: false // Disable CSS source maps to avoid warnings
  },
  
  // Static assets directory
  publicDir: 'assets'
})
