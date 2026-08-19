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

// EdgeOne Makers 控制台绑定 KV 命名空间后，变量以「全局变量」形式注入，
// 变量名大小写敏感（官方示例与默认值均为小写 my_kv）。
// 通过 globalThis 安全访问，避免直接引用裸标识符导致打包器「未定义外部符号」构建失败（返回 545）。
// 兼容优先级：my_kv（小写，官方约定）> MY_KV（大写，旧约定）
function getKV() {
  const g = (typeof globalThis !== 'undefined' && globalThis) ? globalThis : {};
  if (g.my_kv) return g.my_kv;
  if (g.MY_KV) return g.MY_KV;
  return undefined;
}

// KV 调用超时保护：避免客户端异常时请求永久 pending 导致 504 超时
const KV_TIMEOUT_MS = 8000;
function withTimeout(promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`KV ${label} timeout`)), KV_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function withPrefix(key) {
  return `${KV_KEY_PREFIX}${key}`;
}

export async function kvGet(key) {
  const kv = getKV();
  if (!kv) throw new Error('KV not bound (MY_KV/my_kv undefined)');
  return withTimeout(kv.get(withPrefix(key)), 'get');
}

export async function kvGetJSON(key) {
  const kv = getKV();
  if (!kv) throw new Error('KV not bound (MY_KV/my_kv undefined)');
  return withTimeout(kv.get(withPrefix(key), 'json'), 'getJSON');
}

export async function kvPut(key, value) {
  const kv = getKV();
  if (!kv) throw new Error('KV not bound (MY_KV/my_kv undefined)');
  return withTimeout(kv.put(withPrefix(key), value), 'put');
}

export async function kvPutJSON(key, value) {
  const kv = getKV();
  if (!kv) throw new Error('KV not bound (MY_KV/my_kv undefined)');
  return withTimeout(kv.put(withPrefix(key), JSON.stringify(value)), 'putJSON');
}

export async function kvDelete(key) {
  const kv = getKV();
  if (!kv) throw new Error('KV not bound (MY_KV/my_kv undefined)');
  return withTimeout(kv.delete(withPrefix(key)), 'delete');
}

/**
 * 列举指定前缀的 KV key（自动处理分页）。
 * 返回的 key 为「原始 key」（不含 KV_KEY_PREFIX），可直接传给 kvDelete/kvGet 复用。
 * @param {string} prefix 原始前缀，如 'session:'
 * @returns {Promise<string[]>}
 */
export async function kvList(prefix) {
  const kv = getKV();
  if (!kv) throw new Error('KV not bound (MY_KV/my_kv undefined)');
  const full = withPrefix(prefix);
  const out = [];
  let cursor;
  do {
    const result = await withTimeout(
      kv.list({ prefix: full, cursor, limit: 1000 }),
      'list'
    );
    for (const k of result.keys || []) {
      out.push(k.name.startsWith(full) ? k.name.slice(full.length) : k.name);
    }
    cursor = result.cursor;
  } while (!result.complete);
  return out;
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
