/**
 * 管理员登录
 *   POST /api/admin/login -> { username, password } 返回双 Token
 */

import { verifyAdmin } from '../../lib/auth/admin.js';
import { issueTokens } from '../../lib/auth/jwt.js';
import { saveSession } from '../../lib/auth/admin.js';
import { json } from '../../lib/auth/middleware.js';

export async function onRequestPost(context) {
  const { request } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: 400, message: '请求体格式错误' }, 400);
  }

  const username = (body.username || '').toString().trim();
  const password = body.password || '';

  if (!(await verifyAdmin(username, password))) {
    return json({ code: 401, message: '用户名或密码错误' }, 401);
  }

  const { accessToken, refreshToken, jti } = await issueTokens(username);
  await saveSession(jti);

  return json({
    code: 200,
    message: '登录成功',
    data: { accessToken, refreshToken, username }
  });
}

export async function onRequest(context) {
  try {
    const method = (context.request.method || 'GET').toUpperCase();
    if (method === 'POST') return await onRequestPost(context);
    return json({ code: 405, message: '方法不允许' }, 405);
  } catch (e) {
    // 未捕获异常统一返回 500，避免边缘网关返回私有码（如 545）掩盖真实错误
    return json({ code: 500, message: '服务器内部错误', detail: e.message }, 500);
  }
}
