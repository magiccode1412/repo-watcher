/**
 * 格式化日期时间
 * @param {string} isoString ISO 格式的日期时间字符串
 * @param {string} timezone 时区，默认 UTC+8
 * @returns {string} 格式化后的时间字符串
 */
export function formatDateTime(isoString, timezone) {
  if (!isoString) return '未知';

  const date = new Date(isoString);

  // 默认 UTC+8（北京时间）
  const targetTimezone = timezone || 'UTC+8';

  // 转换为目标时区
  const offset = parseInt(targetTimezone.replace('UTC', ''));
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const targetDate = new Date(utcTime + (offset * 3600000));

  // 格式化为 YYYY-MM-DD HH:mm:ss
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const hours = String(targetDate.getHours()).padStart(2, '0');
  const minutes = String(targetDate.getMinutes()).padStart(2, '0');
  const seconds = String(targetDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
