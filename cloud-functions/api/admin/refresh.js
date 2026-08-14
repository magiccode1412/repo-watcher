/**
 * Cloud Functions (Node 运行时) 刷新接口 —— 与 edge-functions 对齐
 */

import { requireRefresh } from '../../../edge-functions/lib/auth/middleware.js';
import { sessionExists } from '../../../edge-functions/lib/auth/admin.js';
import { signToken } from '../../../edge-functions/lib/auth/jwt.js';
import { json } from '../../../edge-functions/lib/auth/middleware.js';

export async function onRequestPost(context) {
  const { request } = context;

  const auth = await requireRefresh(request);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  if (!(await sessionExists(auth.payload.jti))) {
    return json({ code: 401, message: '会话已失效，请重新登录' }, 401);
  }

  const accessToken = await signToken(
    { sub: auth.payload.sub, type: 'access', jti: auth.payload.jti },
    15 * 60
  );

  return json({ code: 200, message: '刷新成功', data: { accessToken } });
}
