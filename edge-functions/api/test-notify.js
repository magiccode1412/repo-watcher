/**
 * 通知测试接口
 * 
 * 访问路径: GET /api/test-notify
 * 用于测试 MagicPush 通知配置是否正常工作
 */

import { sendMagicPushNotification } from '../lib/services/notify.js';

export async function onRequestGet(context) {
  const { env } = context;

  const mockResult = {
    repo: 'test/repo@main',
    hasUpdate: true,
    latestSha: 'abc1234567890',
    latestDate: new Date().toISOString(),
    previousSha: 'def0987654321',
    isFirstCheck: false,
    url: 'https://example.com/test/repo'
  };

  const results = [];

  // MagicPush 测试
  if (env.MAGICPUSH_TOKEN && env.MAGICPUSH_URL) {
    await sendMagicPushNotification(mockResult, env);
    results.push({ channel: 'magicpush', status: 'success' });
  } else {
    results.push({ channel: 'magicpush', status: 'skipped', reason: '未配置 MAGICPUSH_TOKEN 或 MAGICPUSH_URL' });
  }

  return new Response(JSON.stringify({
    code: 200,
    message: '通知测试完成',
    data: results
  }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
