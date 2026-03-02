/**
 * 从KV读取仓库数据（兼容旧格式）
 * @param {KVNamespace} kv KV命名空间
 * @param {string} key 存储键
 * @param {string} platform 平台类型 (github/cnb)
 * @returns {Promise<Object|null>} 解析后的数据对象
 */
export async function getRepoData(kv, key, platform) {
  const data = await kv.get(key);
  if (!data) return null;

  try {
    // 尝试解析JSON格式（新格式）
    return JSON.parse(data);
  } catch {
    // 旧格式兼容：纯字符串视为 SHA 或 BuildId
    if (platform === 'cnb') {
      return { buildId: data, updatedAt: null };
    }
    return { sha: data, updatedAt: null };
  }
}

/**
 * 保存仓库数据到KV（新格式）
 * @param {KVNamespace} kv KV命名空间
 * @param {string} key 存储键
 * @param {Object} data 数据对象
 * @returns {Promise<Object>}
 */
export async function saveRepoData(kv, key, data) {
  const dataToSave = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  await kv.put(key, JSON.stringify(dataToSave));
  return dataToSave;
}
