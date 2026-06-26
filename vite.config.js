import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'PrivateChat',
        short_name: 'PrivateChat',
        description: 'Real-time private messaging app',
        theme_color: '#0f0f13',
        background_color: '#0f0f13',
        display: 'standalone',
        icons: [
          { src: 'vite.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'vite.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor'
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux')) return 'redux'
          if (id.includes('node_modules/@tanstack')) return 'query'
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/socket.io')) return 'socket'
          if (id.includes('node_modules/react-icons')) return 'icons'
          if (id.includes('node_modules/framer-motion')) return 'motion'
        },
      },
    },
    chunkSizeWarningLimit: 300,
    sourcemap: false,
    minify: true,
    cssMinify: true,
    target: 'es2020',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
})
