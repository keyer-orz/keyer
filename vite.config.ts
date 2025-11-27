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
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173
  }
})
