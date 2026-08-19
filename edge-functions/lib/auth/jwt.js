/**
 * JWT 双 Token（access + refresh）认证
 *
 * 使用 Web Crypto (HMAC-SHA256) 实现，Edge Functions 与 Cloud Functions(Node) 通用，
 * 无需引入 jsonwebtoken / jose 依赖。
 *
 * 签名密钥：受保护环境变量 JWT_SECRET（仅服务端，不进 KV、不暴露 UI）。
 */

// 统一获取全局 crypto（EdgeOne/Workers 中以 globalThis.crypto 暴露，兜底避免运行时未定义）
const crypto = globalThis.crypto;

// EdgeOne 普通环境变量（JWT_SECRET 等）注入在 context.env，非全局变量。
// 由入口函数通过 initEnv(env) 注入，工具函数按需读取。
let runtimeEnv = null;
export function initEnv(env) {
  if (env) runtimeEnv = env;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(input) {
  if (typeof input === 'string') input = enc.encode(input);
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function getSecret() {
  // EdgeOne 普通环境变量注入在 context.env（JWT_SECRET），非全局变量。
  // 兼容多种命名/位置，便于排查配置问题。
  const env = runtimeEnv || globalThis;
  const s =
    (env && env.JWT_SECRET) ||
    (env && env.jwt_secret) ||
    globalThis.JWT_SECRET ||
    globalThis.jwt_secret;
  if (!s) throw new Error('服务端未配置 JWT_SECRET');
  return enc.encode(s);
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, data);
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlFromBytes(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function genJti() {
  return (crypto.randomUUID ? crypto.randomUUID() : b64url(crypto.getRandomValues(new Uint8Array(16))));
}

/**
 * 签发 token
 */
export async function signToken(payload, expiresInSeconds, env) {
  if (env) initEnv(env);
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(body));
  const secret = getSecret();
  const sig = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', sig, enc.encode(`${headerB64}.${payloadB64}`));
  return `${headerB64}.${payloadB64}.${base64UrlFromBytes(signature)}`;
}

export async function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid token format');
  const [headerB64, payloadB64, sigB64] = parts;

  const secret = getSecret();
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    b64urlDecode(sigB64),
    enc.encode(`${headerB64}.${payloadB64}`)
  );
  if (!valid) throw new Error('invalid signature');

  const payload = JSON.parse(dec.decode(b64urlDecode(payloadB64)));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('token expired');
  }
  return payload;
}

/**
 * 生成双 Token
 * @param {string} username 管理员用户名
 * @param {Object} [env] EdgeOne context.env（用于注入 JWT_SECRET 等环境变量）
 * @returns {Promise<{accessToken: string, refreshToken: string, jti: string}>}
 */
export async function issueTokens(username, env) {
  const jti = genJti();
  const accessToken = await signToken({ sub: username, type: 'access', jti }, 15 * 60, env);
  const refreshToken = await signToken({ sub: username, type: 'refresh', jti }, 7 * 24 * 60 * 60, env);
  return { accessToken, refreshToken, jti };
}

/**
 * 解析 Bearer token
 */
export function extractBearer(request) {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}
