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

      title = `CNB 构建更新 - ${result.repo}`;
      content = `- **仓库**：[${result.repo}](${result.url})\n` +
                `- **构建 ID**：\`${result.latestBuildId}\`\n` +
                `- **状态**：${emoji} ${result.latestStatus}\n` +
                `- **时间**：${formattedTime}`;
      if (result.buildUrl) {
        content += `\n- [查看构建详情](${result.buildUrl})`;
      }
    } else if (result.platform === 'gitee') {
      title = `Gitee 仓库更新 - ${result.repo}`;
      content = `- **仓库**：[${result.repo}](${result.url})\n` +
                `- **SHA**：\`${result.latestSha}\`\n` +
                `- **Commit**：${result.commitMessage || '无'}\n` +
                `- **时间**：${formattedTime}`;
    } else if (result.platform === 'gitlab') {
      title = `GitLab 仓库更新 - ${result.repo}`;
      content = `- **仓库**：[${result.repo}](${result.url})\n` +
                `- **SHA**：\`${result.latestSha}\`\n` +
                `- **Commit**：${result.commitMessage || '无'}\n` +
                `- **时间**：${formattedTime}`;
    } else {
      title = `GitHub 仓库更新 - ${result.repo}`;
      content = `- **仓库**：[${result.repo}](${result.url})\n` +
                `- **SHA**：\`${result.latestSha}\`\n` +
                `- **Commit**：${result.commitMessage || '无'}\n` +
                `- **时间**：${formattedTime}`;
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
        type: 'markdown'
      })
    });

    if (response.ok) {
      console.log(`[notify] MagicPush 通知发送成功 | repo=${result.repo}`);
    } else {
      const error = await response.text();
      console.error(`[notify] MagicPush 通知发送失败 | repo=${result.repo} | status=${response.status}`, error);
    }
  } catch (error) {
    console.error(`[notify] MagicPush 通知异常 | repo=${result.repo}:`, error);
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
    console.log(`[notify] 触发通知: ${result.repo} (CNB) | 构建状态: ${result.latestStatus}`);
  } else if (result.platform === 'gitee') {
    console.log(`[notify] 触发通知: ${result.repo} (Gitee) | SHA: ${result.latestSha}`);
  } else if (result.platform === 'gitlab') {
    console.log(`[notify] 触发通知: ${result.repo} (GitLab) | SHA: ${result.latestSha}`);
  } else {
    console.log(`[notify] 触发通知: ${result.repo} (GitHub) | SHA: ${result.latestSha}`);
  }

  // MagicPush 通知
  if (env.MAGICPUSH_TOKEN && env.MAGICPUSH_URL) {
    await sendMagicPushNotification(result, env);
  } else {
    console.log('[notify] 未配置 MagicPush 通知（MAGICPUSH_TOKEN / MAGICPUSH_URL），跳过发送');
  }
}
