import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AdminInit from '../views/AdminInit.vue'
import AdminLogin from '../views/AdminLogin.vue'
import AdminConsole from '../views/AdminConsole.vue'
import { useAdminAuth } from '../composables/useAdminAuth.js'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/admin', name: 'admin', component: AdminLogin, meta: { requiresAuth: false } },
  { path: '/admin/init', name: 'admin-init', component: AdminInit, meta: { requiresAuth: false } },
  { path: '/admin/console', name: 'admin-console', component: AdminConsole, meta: { requiresAuth: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// /admin 下判断后台是否已初始化：未初始化跳初始化向导，否则显示登录页
let initChecked = false
let initialized = false

router.beforeEach(async (to) => {
  const { apiUrl, isLoggedIn } = useAdminAuth()

  if (to.path === '/admin' && !initChecked) {
    try {
      const res = await fetch(apiUrl('/api/admin/init'))
      const data = await res.json()
      initialized = res.ok ? data.data.initialized : false
    } catch {
      initialized = false
    }
    initChecked = true
  }

  if (to.path === '/admin' && !initialized && to.name !== 'admin-init') {
    return { name: 'admin-init' }
  }
  if (to.path === '/admin/init' && initialized) {
    return { name: 'admin' }
  }

  // 受保护路由：未登录则跳登录页
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'admin' }
  }

  return true
})

export default router
