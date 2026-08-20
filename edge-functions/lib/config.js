/**
 * 配置层：统一从 KV 读写整体配置（repo_watcher_config）
 *
 * - getConfig()：读取配置，自动解密敏感字段，返回明文 config 对象（仅服务端使用）
 * - saveConfig(input)：合并后写回 KV，敏感字段加密存储
 * - getMaskedConfig()：返回脱敏后的配置（敏感字段用掩码），供管理后台展示
 */

import { kvGetJSON, kvPutJSON } from './utils/kv.js';
import { encryptField, decryptField, isEncrypted, initEnv as initCryptoEnv } from './utils/crypto.js';

const CONFIG_KEY = 'config';

// 标记为「敏感」的字段（见计划文档第二节）
const SENSITIVE_PATHS = [
  'github.token',
  'gitee.token',
  'gitlab.token',
  'cnb.token',
  'checkToken',
  'magicpush.url',
  'magicpush.token',
];

function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

function defaultConfig() {
  return {
    github: { repos: [], branch: 'main', token: '' },
    gitee: { repos: [], branch: 'master', token: '' },
    gitlab: { repos: [], branch: 'main', token: '', apiBase: 'https://gitlab.com', host: 'gitlab.com' },
    cnb: { repos: [], branch: 'main', token: '', apiBase: 'https://api.cnb.cool' },
    notifyOnFirstCheck: false,
    tz: 'UTC+8',
    checkToken: '',
    magicpush: { url: '', token: '' },
  };
}

/**
 * 读取配置并解密敏感字段
 * @returns {Promise<Object>} 明文配置
 */
export async function getConfig(env) {
  if (env) initCryptoEnv(env);
  const stored = await kvGetJSON(CONFIG_KEY);
  const config = { ...defaultConfig(), ...(stored || {}) };

  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(config, path);
    if (val && isEncrypted(val)) {
      setByPath(config, path, await decryptField(val));
    }
  }
  return config;
}

/**
 * 合并并保存配置（加密敏感字段）
 * @param {Object} input 用户提交的部分/整体配置
 * @returns {Promise<Object>} 保存后的明文配置
 */
export async function saveConfig(input, env) {
  if (env) initCryptoEnv(env);
  const current = await getConfig(env);
  const merged = deepMerge(current, input || {});

  // 清理：移除已废弃的旧版 repo 字符串字段（仅保留结构化 repos 数组）
  for (const k of ['github', 'gitee', 'gitlab', 'cnb']) {
    if (merged[k] && 'repo' in merged[k]) {
      delete merged[k].repo;
    }
  }

  // 加密敏感字段
  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(merged, path);
    if (val === '' || val == null) {
      // 空值表示不修改，保留原存储值：从已读 current 拷回
      const original = getByPath(current, path);
      if (original) {
        setByPath(merged, path, isEncrypted(original) ? original : await encryptField(original));
      } else {
        setByPath(merged, path, '');
      }
      continue;
    }
    if (!isEncrypted(val)) {
      setByPath(merged, path, await encryptField(val));
    }
  }

  await kvPutJSON(CONFIG_KEY, merged);
  return merged;
}

/**
 * 返回安全配置：敏感字段一律置空，绝不回传任何明文或脱敏字符
 */
export async function getMaskedConfig(env) {
  const config = await getConfig(env);
  const blanked = JSON.parse(JSON.stringify(config));
  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(blanked, path);
    if (val) setByPath(blanked, path, '');
  }
  return blanked;
}

/**
 * 返回敏感字段是否已配置的状态（仅布尔，不含任何密钥信息）
 */
export async function getSecretStatus(env) {
  const config = await getConfig(env);
  const status = {};
  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(config, path);
    const keys = path.split('.');
    if (keys.length === 2) {
      status[keys[0]] = status[keys[0]] || {};
      status[keys[0]][keys[1]] = !!val;
    } else {
      status[keys[0]] = !!val;
    }
  }
  return status;
}

function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    return override !== undefined ? override : base;
  }
  if (typeof base === 'object' && base !== null && typeof override === 'object' && override !== null) {
    const out = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = deepMerge(base[k], override[k]);
    }
    return out;
  }
  return override !== undefined ? override : base;
}
