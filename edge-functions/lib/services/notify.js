import { formatDateTime } from '../utils/datetime.js';

/**
 * MagicPush 通知
 * @param {Object} result 检测结果
 * @param {Object} config 配置对象
 */
export async function sendMagicPushNotification(result, config) {
  try {
    const formattedTime = formatDateTime(result.latestDate, config?.tz);
    let title, content;

    // 根据 platform 生成不同的通知消息
    if (result.platform === 'cnb') {
      const statusEmoji = {
        'success': '\u2705',
        'failed': '\u274C',
        'running': '\uD83D\uDD04',
        'pending': '\u23F3',
        'unknown': '\u2753'
      };
      const emoji = statusEmoji[result.latestStatus] || '\u2753';

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

    const response = await fetch(config?.magicpush?.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config?.magicpush?.token}`
      },
      body: JSON.stringify({
        title: title,
        content: content,
        type: 'markdown'
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
 * @param {Object} config 配置对象
 */
export async function notify(result, config) {
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
  if (config?.magicpush?.token && config?.magicpush?.url) {
    await sendMagicPushNotification(result, config);
  } else {
    console.log('未配置 MagicPush 通知（magicpush.token / magicpush.url）');
  }
}
