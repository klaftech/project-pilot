import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // production builds drop console.log/debug noise; console.warn/error are kept, dev server keeps everything
  esbuild: command === 'build' ? { pure: ['console.log', 'console.debug'] } : {},
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: "../client/dist"  // Ensure the output path matches the expected directory
  },
  preview: {
    port: 4000,
  },
  server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5555',
          changeOrigin: true,
          secure: false,
          //rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
  },
}))
