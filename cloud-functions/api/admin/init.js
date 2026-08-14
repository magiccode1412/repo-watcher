/**
 * Cloud Functions (Node 运行时) 管理后台接口 —— 与 edge-functions 对齐实现
 * 共享 lib 层位于 ../edge-functions/lib
 *
 *   GET  /api/admin/init  -> 查询是否已初始化
 *   POST /api/admin/init  -> 首次设置管理员账号
 */

import { isInitialized, initAdmin } from '../../../edge-functions/lib/auth/admin.js';
import { json } from '../../../edge-functions/lib/auth/middleware.js';

export async function onRequestGet() {
  const initialized = await isInitialized();
  return json({ code: 200, data: { initialized } });
}

export async function onRequestPost(context) {
  const { request } = context;

  if (await isInitialized()) {
    return json({ code: 409, message: '管理员已初始化' }, 409);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: 400, message: '请求体格式错误' }, 400);
  }

  const username = (body.username || 'admin').toString().trim();
  const password = body.password || '';
  if (!username || password.length < 6) {
    return json({ code: 400, message: '用户名不能为空，密码至少 6 位' }, 400);
  }

  await initAdmin(username, password);
  return json({ code: 200, message: '初始化成功', data: { username } });
}
