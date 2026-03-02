import { sendTelegramNotification, sendWeComNotification, sendPushPlusNotification, sendMagicPushNotification } from '../services/notify.js';

/**
 * 处理通知测试请求
 * @param {URL} url 请求 URL
 * @param {Object} env 环境变量
 * @returns {Promise<Response>}
 */
export async function handleTestNotify(url, env) {
  const target = url.searchParams.get('target');
  const mockResult = {
    repo: 'test/repo@main',
    hasUpdate: true,
    latestSha: 'abc1234567890',
    latestDate: new Date().toISOString(),
    previousSha: 'def0987654321',
    isFirstCheck: false
  };

  const results = [];

  if (!target || target === 'all' || target === 'telegram') {
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      await sendTelegramNotification(mockResult, env);
      results.push({ channel: 'telegram', status: 'success' });
    } else {
      results.push({ channel: 'telegram', status: 'skipped', reason: '未配置 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID' });
    }
  }

  if (!target || target === 'all' || target === 'wecom') {
    if (env.WECOM_WEBHOOK_URL) {
      await sendWeComNotification(mockResult, env);
      results.push({ channel: 'wecom', status: 'success' });
    } else {
      results.push({ channel: 'wecom', status: 'skipped', reason: '未配置 WECOM_WEBHOOK_URL' });
    }
  }

  if (!target || target === 'all' || target === 'pushplus') {
    if (env.PUSHPLUS_TOKEN) {
      await sendPushPlusNotification(mockResult, env);
      results.push({ channel: 'pushplus', status: 'success' });
    } else {
      results.push({ channel: 'pushplus', status: 'skipped', reason: '未配置 PUSHPLUS_TOKEN' });
    }
  }

  if (!target || target === 'all' || target === 'magicpush') {
    if (env.MAGICPUSH_TOKEN && env.MAGICPUSH_URL) {
      await sendMagicPushNotification(mockResult, env);
      results.push({ channel: 'magicpush', status: 'success' });
    } else {
      results.push({ channel: 'magicpush', status: 'skipped', reason: '未配置 MAGICPUSH_TOKEN 或 MAGICPUSH_URL' });
    }
  }

  return new Response(JSON.stringify({
    code: 200,
    message: '通知测试完成',
    data: results
  }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
