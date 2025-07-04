import { defineConfig } from 'vite'

export default defineConfig({
  // Set root to parent directory to access main website files
  root: '..',
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: '/dashboard.html', // Open dashboard by default
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
  
  // Build configuration for production
  build: {
    outDir: 'api/dist',
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps to avoid warnings
    // Generate manifest for Flask to reference built assets
    manifest: true,
    rollupOptions: {
      input: {
        // Define entry points for your app
        dashboard: 'dashboard.html',
        documentation: 'api-documentation.html',
        main: 'index.html'
      },
      onwarn(warning, warn) {
        // Suppress source map warnings
        if (warning.code === 'SOURCEMAP_ERROR') return;
        warn(warning);
      }
    }
  },
  
  // CSS processing
  css: {
    devSourcemap: false // Disable CSS source maps to avoid warnings
  },
  
  // Static assets directory
  publicDir: 'assets'
})
