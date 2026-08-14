/**
 * Cloud Functions (Node 运行时) 登出接口 —— 与 edge-functions 对齐
 */

import { requireAccess } from '../../../edge-functions/lib/auth/middleware.js';
import { deleteSession } from '../../../edge-functions/lib/auth/admin.js';
import { json } from '../../../edge-functions/lib/auth/middleware.js';

export async function onRequestPost(context) {
  const { request } = context;

  const auth = await requireAccess(request);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  await deleteSession(auth.payload.jti);
  return json({ code: 200, message: '已登出' });
}
