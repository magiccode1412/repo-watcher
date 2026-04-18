import { formatDateTime } from '../utils/index.js';

/**
 * MagicPush 通知
 * @param {Object} result 检测结果
 * @param {Object} env 环境变量
 */
export async function sendMagicPushNotification(result, env) {
  try {
    const formattedTime = formatDateTime(result.latestDate, env.TZ);
    let title, content;

    // 根据 platform 生成不同的通知消息
    if (result.platform === 'cnb') {
      const statusEmoji = {
        'success': '✅',
        'failed': '❌',
        'running': '🔄',
        'pending': '⏳',
        'unknown': '❓'
      };
      const emoji = statusEmoji[result.latestStatus] || '❓';

      title = `🚀 CNB 构建更新 - ${result.repo}`;
      content = `📦 仓库：${result.repo}\n` +
                `🆕 新构建 ID：${result.latestBuildId}\n` +
                `${emoji} 构建状态：${result.latestStatus}\n` +
                `📅 构建时间：${formattedTime}`;
      if (result.buildUrl) {
        content += `\n🔗 查看构建详情: ${result.buildUrl}`;
      }
    } else if (result.platform === 'gitee') {
      title = `🚀 Gitee 仓库更新 - ${result.repo}`;
      content = `📦 仓库：${result.repo}\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    } else if (result.platform === 'gitlab') {
      title = `🚀 GitLab 仓库更新 - ${result.repo}`;
      content = `📦 仓库：${result.repo}\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    } else {
      title = `🚀 GitHub 仓库更新 - ${result.repo}`;
      content = `📦 仓库：${result.repo}\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    }

    const response = await fetch(env.MAGICPUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.MAGICPUSH_TOKEN}`
      },
      body: JSON.stringify({
        title: title,
        content: content,
        type: env.MAGICPUSH_TYPE || 'text'
      })
    });

    if (response.ok) {
      console.log('MagicPush 通知发送成功');
    } else {
      const error = await response.text();
      console.error('MagicPush 通知发送失败:', error);
    }
  } catch (error) {
    console.error('MagicPush 通知异常:', error);
  }
}

/**
 * 主通知函数 - 使用 MagicPush 发送通知
 * @param {Object} result 检测结果
 * @param {Object} env 环境变量
 */
export async function notify(result, env) {
  // 根据平台类型输出不同的日志
  if (result.platform === 'cnb') {
    console.log(`检测到 CNB 构建更新: ${result.repo}`);
    console.log(`最新构建 ID: ${result.latestBuildId}, 构建状态: ${result.latestStatus}, 更新时间: ${result.latestDate}`);
  } else if (result.platform === 'gitee') {
    console.log(`检测到 Gitee 仓库更新: ${result.repo}`);
    console.log(`最新 SHA: ${result.latestSha}, 更新时间: ${result.latestDate}`);
  } else if (result.platform === 'gitlab') {
    console.log(`检测到 GitLab 仓库更新: ${result.repo}`);
    console.log(`最新 SHA: ${result.latestSha}, 更新时间: ${result.latestDate}`);
  } else {
    console.log(`检测到 GitHub 仓库更新: ${result.repo}`);
    console.log(`最新 SHA: ${result.latestSha}, 更新时间: ${result.latestDate}`);
  }

  // MagicPush 通知
  if (env.MAGICPUSH_TOKEN && env.MAGICPUSH_URL) {
    await sendMagicPushNotification(result, env);
  } else {
    console.log('未配置 MagicPush 通知（MAGICPUSH_TOKEN / MAGICPUSH_URL）');
  }
}
