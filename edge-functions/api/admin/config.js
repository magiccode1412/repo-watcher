/**
 * 配置读写接口（需鉴权）
 *   GET  /api/admin/config -> 脱敏配置
 *   PUT  /api/admin/config -> 合并并保存配置（敏感字段加密）
 */

import { requireAccess } from '../../lib/auth/middleware.js';
import { getMaskedConfig, saveConfig } from '../../lib/config.js';
import { json } from '../../lib/auth/middleware.js';

export async function onRequestGet(context) {
  const { request } = context;
  const auth = await requireAccess(request);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  const config = await getMaskedConfig();
  return json({ code: 200, message: '获取成功', data: config });
}

export async function onRequestPut(context) {
  const { request } = context;
  const auth = await requireAccess(request);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: 400, message: '请求体格式错误' }, 400);
  }

  await saveConfig(body);
  const masked = await getMaskedConfig();
  return json({ code: 200, message: '保存成功', data: masked });
}
