/**
 * KV 存储操作工具 (EdgeOne Makers 适配版)
 *
 * EdgeOne Makers 中 KV 是全局变量（在控制台绑定后自动注入），
 * 变量名为 MY_KV（计划文档约定），所有键统一加 repo_watcher_ 前缀。
 *
 * 使用前请确保:
 * 1. 在 EdgeOne Makers 控制台启用 KV Storage
 * 2. 创建命名空间并绑定到项目，变量名设为 MY_KV
 */

// 所有 KV 存储键统一加上的前缀
const KV_KEY_PREFIX = 'repo_watcher_';

// MY_KV 全局变量（Edge Functions 与 Cloud Functions Node 运行时均通过全局变量访问）
const KV = MY_KV;

function withPrefix(key) {
  return `${KV_KEY_PREFIX}${key}`;
}

export async function kvGet(key) {
  return KV.get(withPrefix(key));
}

export async function kvGetJSON(key) {
  return KV.get(withPrefix(key), 'json');
}

export async function kvPut(key, value) {
  return KV.put(withPrefix(key), value);
}

export async function kvPutJSON(key, value) {
  return KV.put(withPrefix(key), JSON.stringify(value));
}

export async function kvDelete(key) {
  return KV.delete(withPrefix(key));
}

/**
 * 从KV读取仓库数据（兼容旧格式）
 * @param {string} key 存储键
 * @param {string} platform 平台类型 (github/gitee/gitlab/cnb)
 * @returns {Promise<Object|null>} 解析后的数据对象
 */
export async function getRepoData(key, platform) {
  const data = await kvGet(withPrefix(key));
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
  await kvPut(withPrefix(key), JSON.stringify(dataToSave));
  return dataToSave;
}
