import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// base: './' 使构建产物使用相对路径，便于部署到 EdgeOne Pages 等任意子路径
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
  },
})
