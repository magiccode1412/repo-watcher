/**
 * Cloud Functions (Node 运行时) 登录接口 —— 与 edge-functions 对齐
 */

import { verifyAdmin, saveSession } from '../../../edge-functions/lib/auth/admin.js';
import { issueTokens } from '../../../edge-functions/lib/auth/jwt.js';
import { json } from '../../../edge-functions/lib/auth/middleware.js';

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
