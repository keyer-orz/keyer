import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    renderer(),
    // 开发环境下提供 extensions 目录的静态文件服务
    {
      name: 'serve-extensions',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/extensions/')) {
            const filePath = path.join(__dirname, req.url.split('?')[0])
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath)

              // 对 JS 文件进行 Vite 转换以解析 bare imports
              if (ext === '.js') {
                try {
                  const result = await server.transformRequest(req.url)
                  if (result) {
                    res.setHeader('Content-Type', 'application/javascript')
                    res.end(result.code)
                    return
                  }
                } catch (error) {
                  console.error('Error transforming extension file:', error)
                }
              }

              // 其他文件直接返回
              const contentTypes: Record<string, string> = {
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.css': 'text/css'
              }
              res.setHeader('Content-Type', contentTypes[ext] || 'text/plain')
              fs.createReadStream(filePath).pipe(res)
              return
            }
          }
          next()
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    fs: {
      // 允许访问项目根目录及 extensions 目录
      allow: [
        path.resolve(__dirname, '.'),
        path.resolve(__dirname, 'extensions')
      ]
    }
  }
})
