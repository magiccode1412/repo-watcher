/**
 * KV 存储操作工具 (EdgeOne Makers 适配版)
 * 
 * EdgeOne Makers 中 KV 是全局变量（在控制台绑定后自动注入）
 * 不再需要通过 env 参数传递，直接访问 KV_DEFAULT 全局变量
 * 
 * 使用前请确保:
 * 1. 在 EdgeOne Makers 控制台启用 KV Storage
 * 2. 创建命名空间并绑定到项目，变量名设为 KV_DEFAULT
 */

// 所有 KV 存储键统一加上的前缀，避免与其他应用共用命名空间时键冲突
const KV_KEY_PREFIX = 'repo_watcher_';

function withPrefix(key) {
  return `${KV_KEY_PREFIX}${key}`;
}

/**
 * 从KV读取仓库数据（兼容旧格式）
 * @param {string} key 存储键
 * @param {string} platform 平台类型 (github/gitee/gitlab/cnb)
 * @returns {Promise<Object|null>} 解析后的数据对象
 */
export async function getRepoData(key, platform) {
  const data = await KV_DEFAULT.get(withPrefix(key), 'json');
  if (!data) return null;

  // 数据已经是 JSON 对象，无需再次解析
  // 兼容旧格式: 如果 data 是字符串，尝试解析
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      // 旧格式兼容：纯字符串视为 SHA 或 BuildId
      if (platform === 'cnb') {
        return { buildId: data, updatedAt: null };
      }
      return { sha: data, updatedAt: null };
    }
  }

  return data;
}

/**
 * 保存仓库数据到KV
 * @param {string} key 存储键
 * @param {Object} data 数据对象
 * @returns {Promise<Object>}
 */
export async function saveRepoData(key, data) {
  const dataToSave = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  await KV_DEFAULT.put(withPrefix(key), JSON.stringify(dataToSave));
  return dataToSave;
}
