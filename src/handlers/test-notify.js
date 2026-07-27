import { sendMagicPushNotification } from '../services/notify.js';

/**
 * 处理通知测试请求
 * @param {URL} url 请求 URL
 * @param {Object} env 环境变量
 * @returns {Promise<Response>}
 */
export async function handleTestNotify(url, env) {
  const mockResult = {
    repo: 'test/repo@main',
    hasUpdate: true,
    latestSha: 'abc1234567890',
    latestDate: new Date().toISOString(),
    previousSha: 'def0987654321',
    isFirstCheck: false
  };

  const results = [];

  // MagicPush 测试
  if (env.MAGICPUSH_TOKEN && env.MAGICPUSH_URL) {
    console.log('[test-notify] 开始测试 MagicPush 通知');
    await sendMagicPushNotification(mockResult, env);
    results.push({ channel: 'magicpush', status: 'success' });
    console.log('[test-notify] MagicPush 通知测试完成');
  } else {
    console.log('[test-notify] 未配置 MAGICPUSH_TOKEN 或 MAGICPUSH_URL，跳过测试');
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
