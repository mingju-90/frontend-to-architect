import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Vite 开发与构建配置。
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
