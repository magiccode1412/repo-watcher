/**
 * 刷新 access token
 *   POST /api/admin/refresh -> 携带 refresh token 返回新 access token
 */

import { requireRefresh } from '../../lib/auth/middleware.js';
import { sessionExists } from '../../lib/auth/admin.js';
import { signToken } from '../../lib/auth/jwt.js';
import { json } from '../../lib/auth/middleware.js';

export async function onRequestPost(context) {
  const { request } = context;

  const auth = await requireRefresh(request);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  // refresh 会话需有效
  if (!(await sessionExists(auth.payload.jti))) {
    return json({ code: 401, message: '会话已失效，请重新登录' }, 401);
  }

  const accessToken = await signToken(
    { sub: auth.payload.sub, type: 'access', jti: auth.payload.jti },
    15 * 60
  );

  return json({ code: 200, message: '刷新成功', data: { accessToken } });
}
