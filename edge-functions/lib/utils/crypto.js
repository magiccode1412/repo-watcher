/**
 * AES-256-GCM 加解密工具
 *
 * 用于加密 KV 中存储的敏感凭据（各平台 token、checkToken、magicpush 等）。
 * 密钥来源：受保护环境变量 CONFIG_ENC_KEY（仅服务端可用，不进 KV）。
 * 密文格式：enc::<iv>:<authTag>:<ciphertext>（base64）
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = CONFIG_ENC_KEY;
  if (!key) {
    throw new Error('服务端未配置 CONFIG_ENC_KEY，无法加解密凭据');
  }
  // 32 字节密钥（256 位）。支持 hex / utf8 原始字符串，统一 sha256 派生到 32 字节。
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  // 其它情况：对字符串取 sha256 得到 32 字节
  return createHash('sha256').update(key, 'utf8').digest();
}

const ENC_PREFIX = 'enc::';

/**
 * 加密字段明文
 * @param {string} plaintext 明文字符串
 * @returns {string} 密文（enc::<iv>:<authTag>:<ciphertext>）
 */
export function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined) return plaintext;
  if (typeof plaintext !== 'string') plaintext = String(plaintext);
  if (plaintext === '') return plaintext;

  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64');
  return `${ENC_PREFIX}${payload}`;
}

/**
 * 解密字段密文
 * @param {string} ciphertext 密文字符串（enc::...）
 * @returns {string} 明文字符串
 */
export function decryptField(ciphertext) {
  if (ciphertext === null || ciphertext === undefined) return ciphertext;
  if (typeof ciphertext !== 'string') return ciphertext;
  if (!ciphertext.startsWith(ENC_PREFIX)) return ciphertext;

  const key = getKey();
  const raw = ciphertext.slice(ENC_PREFIX.length);
  const buf = Buffer.from(raw, 'base64');

  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * 判断字符串是否为已加密字段
 * @param {string} value
 * @returns {boolean}
 */
export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}
