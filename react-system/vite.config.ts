import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { existsSync, writeFileSync } from 'fs'

/**
 * 本地开发专用中间件：把页面生成器产出的 Flyway 脚本写入项目 db/migration/ 目录
 * - 仅 apply: 'serve'（vite dev）生效，生产构建不含此逻辑
 * - 项目红线：只写文件、不执行任何 DDL；脚本由研发评审后由 Flyway 启动时执行
 * - 文件名强校验（V{数字}__{描述}.sql），已存在时拒绝写入（409），防止覆盖
 */
function writeMigrationFilePlugin(): Plugin {
  return {
    name: 'dev-write-migration-file',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/write-migration-file', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ ok: false, message: '仅支持 POST' }))
          return
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          try {
            const { fileName, content } = JSON.parse(body || '{}') as {
              fileName?: string
              content?: string
            }

            // 文件名白名单：V26__dynamic_ren-wu-lie-biao_create.sql 这种格式（pageKey 可能带连字符）
            if (!fileName || !/^V\d+__[a-zA-Z0-9_-]+\.sql$/.test(fileName)) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: '文件名非法（应为 V{数字}__{描述}.sql）' }))
              return
            }
            if (!content || typeof content !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: '脚本内容不能为空' }))
              return
            }

            const targetPath = resolve(__dirname, '../material-system-server/src/main/resources/db/migration', fileName)
            if (existsSync(targetPath)) {
              res.statusCode = 409
              res.end(JSON.stringify({ ok: false, message: `文件已存在：${fileName}，请勿重复放入` }))
              return
            }

            writeFileSync(targetPath, content, 'utf-8')
            res.end(JSON.stringify({ ok: true, message: `已放入：${fileName}` }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, message: (e as Error).message || '写入失败' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), writeMigrationFilePlugin()],
  resolve: {
    dedupe: ['react', 'react-dom', 'antd', '@ant-design/icons'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
