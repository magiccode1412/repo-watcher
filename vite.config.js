import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base: '/' 必须使用绝对路径。原因：使用 vue-router（createWebHistory）后
// /、/admin、/admin/console 等页面由前端路由接管，靠 history 模式区分。若用相对路径 './'，
// 在 /admin/console 深层路径下资源会被解析成 /admin/assets/... 而 404，导致 JS 不执行、页面空白。
// 用 '/' 后资源恒为 /assets/...，任何路径层级都能正确加载（配合单文件内联后无此问题）。
// vite-plugin-singlefile：将 HTML/CSS/JS 全部内联进单个 dist/index.html。
// 原因：EdgeOne Makers full-stack 模式的静态托管不服务 Vite 默认的 dist/assets/ 子目录 hash 结构
//（所有 /assets/* 请求都会被 SPA fallback 成 index.html，导致 MIME 类型不匹配、页面空白）。
// 单文件自包含后，线上只有 / 返回该 HTML，/api/* 交给 edge-functions，不再有静态资源请求。
export default defineConfig({
  plugins: [vue(), tailwindcss(), viteSingleFile()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100000000,
  },
})
