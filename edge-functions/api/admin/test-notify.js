/**
 * 通知测试接口（需鉴权，替代原公开 /api/test-notify）
 *   POST /api/admin/test-notify
 */

import { requireAccess } from '../../lib/auth/middleware.js';
import { getConfig } from '../../lib/config.js';
import { sendMagicPushNotification } from '../../lib/services/notify.js';
import { json } from '../../lib/auth/middleware.js';

export async function onRequestPost(context) {
  const { request } = context;
  const auth = await requireAccess(request, context.env);
  if (!auth.ok) return json({ code: auth.status, message: auth.message }, auth.status);

  const config = await getConfig(context.env);
  const results = [];

  const mockResult = {
    repo: 'test/repo@main',
    hasUpdate: true,
    latestSha: 'abc1234567890',
    latestDate: new Date().toISOString(),
    previousSha: 'def0987654321',
    isFirstCheck: false,
    url: 'https://example.com/test/repo',
    platform: 'github'
  };

  if (config.magicpush?.url && config.magicpush?.token) {
    await sendMagicPushNotification(mockResult, config);
    results.push({ channel: 'magicpush', status: 'success' });
  } else {
    results.push({ channel: 'magicpush', status: 'skipped', reason: '未配置 magicpush.url 或 magicpush.token' });
  }

  return json({ code: 200, message: '通知测试完成', data: results });
}
