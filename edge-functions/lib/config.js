/**
 * 配置层：统一从 KV 读写整体配置（repo_watcher_config）
 *
 * - getConfig()：读取配置，自动解密敏感字段，返回明文 config 对象（仅服务端使用）
 * - saveConfig(input)：合并后写回 KV，敏感字段加密存储
 * - getMaskedConfig()：返回脱敏后的配置（敏感字段用掩码），供管理后台展示
 */

import { kvGetJSON, kvPutJSON } from './utils/kv.js';
import { encryptField, decryptField, isEncrypted } from './utils/crypto.js';

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
    github: { repo: '', branch: 'main', token: '' },
    gitee: { repo: '', branch: 'master', token: '' },
    gitlab: { repo: '', branch: 'main', token: '', apiBase: 'https://gitlab.com', host: 'gitlab.com' },
    cnb: { repo: '', branch: 'main', token: '', apiBase: 'https://api.cnb.cool' },
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
export async function getConfig() {
  const stored = await kvGetJSON(CONFIG_KEY);
  const config = { ...defaultConfig(), ...(stored || {}) };

  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(config, path);
    if (val && isEncrypted(val)) {
      setByPath(config, path, decryptField(val));
    }
  }
  return config;
}

/**
 * 合并并保存配置（加密敏感字段）
 * @param {Object} input 用户提交的部分/整体配置
 * @returns {Promise<Object>} 保存后的明文配置
 */
export async function saveConfig(input) {
  const current = await getConfig();
  const merged = deepMerge(current, input || {});

  // 加密敏感字段
  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(merged, path);
    if (val === '' || val == null) {
      // 空值表示不修改，保留原存储值：从已读 current 拷回
      const original = getByPath(current, path);
      if (original) {
        setByPath(merged, path, isEncrypted(original) ? original : encryptField(original));
      } else {
        setByPath(merged, path, '');
      }
      continue;
    }
    if (!isEncrypted(val)) {
      setByPath(merged, path, encryptField(val));
    }
  }

  await kvPutJSON(CONFIG_KEY, merged);
  return merged;
}

/**
 * 返回脱敏配置（敏感字段掩码）
 */
export async function getMaskedConfig() {
  const config = await getConfig();
  const masked = JSON.parse(JSON.stringify(config));
  for (const path of SENSITIVE_PATHS) {
    const val = getByPath(masked, path);
    if (val) setByPath(masked, path, '••••••');
  }
  return masked;
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
