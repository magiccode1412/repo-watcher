/**
 * 鉴权中间件辅助函数
 */

import { verifyToken, extractBearer, initEnv } from './jwt.js';
import { sessionExists } from './admin.js';

/**
 * 校验 access token，要求 type === 'access' 且 jti 会话存在
 * @param {Request} request
 * @param {Object} [env] EdgeOne context.env（用于注入 JWT_SECRET 等环境变量）
 * @returns {Promise<{ok: boolean, status?: number, message?: string, payload?: Object}>}
 */
export async function requireAccess(request, env) {
  if (env) initEnv(env);
  const token = extractBearer(request);
  if (!token) return { ok: false, status: 401, message: '缺少访问令牌' };
  try {
    const payload = await verifyToken(token);
    if (payload.type !== 'access') return { ok: false, status: 401, message: '令牌类型错误' };
    if (!(await sessionExists(payload.jti))) return { ok: false, status: 401, message: '会话已失效，请重新登录' };
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, status: 401, message: e.message || '令牌无效' };
  }
}

/**
 * 校验 refresh token，要求 type === 'refresh'
 */
export async function requireRefresh(request, env) {
  if (env) initEnv(env);
  const token = extractBearer(request);
  if (!token) return { ok: false, status: 401, message: '缺少刷新令牌' };
  try {
    const payload = await verifyToken(token);
    if (payload.type !== 'refresh') return { ok: false, status: 401, message: '令牌类型错误' };
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, status: 401, message: e.message || '刷新令牌无效' };
  }
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
