import { requireAccess, json } from '../../lib/auth/middleware.js';
import { changePassword, deleteAllSessions } from '../../lib/auth/admin.js';

/**
 * PUT /api/admin/password
 * 修改管理员密码。需要先登录（access token）。
 * 成功后会吊销所有会话（包括当前设备），前端应清除 token 并跳转重新登录。
 */
export async function onRequestPut(context) {
  const { request } = context;

  const auth = await requireAccess(request, context.env);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: 400, message: '请求体格式错误' }, 400);
  }

  const oldPassword = body.oldPassword || '';
  const newPassword = body.newPassword || '';

  try {
    await changePassword(oldPassword, newPassword);
  } catch (e) {
    return json({ code: 400, message: e.message }, 400);
  }

  // 密码已更新，吊销所有会话（含当前设备），强制重新登录
  await deleteAllSessions();

  return json({ code: 200, message: '密码已修改，请重新登录' });
}
