import { ref, onMounted, onUnmounted } from 'vue'

// 配置：如需跨域访问 Worker，可设置 VITE_API_BASE_URL，例如 https://your-worker.workers.dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function useRepos() {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastUpdate = ref('')

  async function loadData() {
    loading.value = true
    error.value = null
    try {
      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/repos` : '/api/repos'
      const response = await fetch(apiUrl)
      const result = await response.json()

      if (result.code !== 200) {
        throw new Error(result.message)
      }

      data.value = result.data
      lastUpdate.value = '最后更新: ' + new Date().toLocaleString('zh-CN')
    } catch (err) {
      console.error('加载数据失败:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  let timer
  onMounted(() => {
    loadData()
    // 每 30 秒自动刷新
    timer = setInterval(loadData, 30000)
  })
  onUnmounted(() => clearInterval(timer))

  return { data, loading, error, lastUpdate, loadData }
}
