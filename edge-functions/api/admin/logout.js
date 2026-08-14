/**
 * 登出 -> 吊销 refresh token 会话
 *   POST /api/admin/logout
 */

import { requireAccess } from '../../lib/auth/middleware.js';
import { deleteSession } from '../../lib/auth/admin.js';
import { json } from '../../lib/auth/middleware.js';

export async function onRequestPost(context) {
  const { request } = context;

  const auth = await requireAccess(request);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  await deleteSession(auth.payload.jti);
  return json({ code: 200, message: '已登出' });
}
