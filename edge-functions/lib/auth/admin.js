/**
 * 管理员凭据与会话管理
 *
 * - 管理员哈希存于 KV: repo_watcher_admin（{ username, hash }）
 * - 使用 PBKDF2（Web Crypto）替代 bcrypt，Edge / Node 通用
 * - refresh token 的 jti 存于 repo_watcher_session:<jti>，登出/改密时删除即吊销
 */

import { kvGetJSON, kvPutJSON, kvDelete } from '../utils/kv.js';

// 统一获取全局 crypto（EdgeOne/Workers 中以 globalThis.crypto 暴露）
const crypto = globalThis.crypto;

const ADMIN_KEY = 'admin';
const SESSION_PREFIX = 'session:';

function b64(buf) {
  const arr = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function b64ToBytes(str) {
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${b64(salt)}$${b64(bits)}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const [, saltB64, hashB64] = stored.split('$');
  const salt = b64ToBytes(saltB64);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return b64(bits) === hashB64;
}

export async function getAdmin() {
  return kvGetJSON(ADMIN_KEY);
}

export async function isInitialized() {
  const admin = await getAdmin();
  return !!admin;
}

export async function initAdmin(username, password) {
  const hash = await hashPassword(password);
  await kvPutJSON(ADMIN_KEY, { username, hash, createdAt: new Date().toISOString() });
}

export async function verifyAdmin(username, password) {
  const admin = await getAdmin();
  if (!admin) return false;
  if (admin.username !== username) return false;
  return verifyPassword(password, admin.hash);
}

// ---- 会话（refresh token 吊销） ----

export async function saveSession(jti) {
  await kvPutJSON(SESSION_PREFIX + jti, { createdAt: new Date().toISOString() });
}

export async function sessionExists(jti) {
  const s = await kvGetJSON(SESSION_PREFIX + jti);
  return !!s;
}

export async function deleteSession(jti) {
  await kvDelete(SESSION_PREFIX + jti);
}

export async function deleteAllSessions() {
  // 简易实现：依赖 jti 删除粒度，登出/改密时逐个删除。
  // 如需全量吊销，可额外维护 repo_watcher_sessions 列表；当前按 jti 粒度即可。
}
