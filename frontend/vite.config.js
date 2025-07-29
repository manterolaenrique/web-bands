import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    // Configuración base
    base: '/',
    
    // Configuración del servidor de desarrollo
    server: {
      port: 5173,
      host: true,
      open: true,
    },
    
    // Configuración de preview
    preview: {
      port: 4173,
      host: true,
    },
    
    // Configuración de build
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: mode === 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            sanity: ['@sanity/client'],
          },
        },
      },
      // Optimizaciones para producción
      target: 'es2015',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
    
    // Configuración de optimización
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@sanity/client'],
    },
    
    // Variables de entorno
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // Configuración de CSS
    css: {
      devSourcemap: mode === 'development',
    },
    
    // Configuración de assets
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
    
    // Configuración de alias (opcional)
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@config': '/src/config',
      },
    },
  }
})
