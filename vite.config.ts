import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/app-main.ts',
        async onstart(args) {
          if (args.reload) {
            await args.reload()
          } else {
            await args.startup()
          }
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      },
      renderer: {}
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        command: resolve(__dirname, 'command_index.html')
      }
    }
  },
  optimizeDeps: {
    include: ['keyerext'],
    force: true  
  },
  resolve: {
    dedupe: ['react', 'react-dom'], // 确保 React 单例
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    hmr: {
      overlay: true
    }
  },
  cacheDir: 'node_modules/.vite'
})
