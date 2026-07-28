/**
 * 格式化相对时间（如：3天前、刚刚）
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`
  } else if (diffDays < 30) {
    return `${diffDays} 天前`
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} 个月前`
  } else {
    const diffYears = Math.floor(diffDays / 365)
    return `${diffYears} 年前`
  }
}
