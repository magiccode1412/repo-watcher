import { formatDateTime } from '../utils/index.js';

/**
 * Telegram 通知
 * @param {Object} result 检测结果
 * @param {Object} env 环境变量
 */
export async function sendTelegramNotification(result, env) {
  try {
    const formattedTime = formatDateTime(result.latestDate, env.TZ);
    let message;

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

      message = `🚀 CNB 构建更新通知\n\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆕 新构建 ID：${result.latestBuildId}\n` +
                `${emoji} 构建状态：${result.latestStatus}\n` +
                `📅 构建时间：${formattedTime}`;
      if (result.buildUrl) {
        message += `\n🔗 <a href="${result.buildUrl}">查看构建详情</a>`;
      }
    } else if (result.platform === 'gitee') {
      message = `🚀 Gitee 仓库更新通知\n\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    } else if (result.platform === 'gitlab') {
      message = `🚀 GitLab 仓库更新通知\n\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    } else {
      message = `🚀 GitHub 仓库更新通知\n\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    }

    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    if (response.ok) {
      console.log('Telegram 通知发送成功');
    } else {
      const error = await response.text();
      console.error('Telegram 通知发送失败:', error);
    }
  } catch (error) {
    console.error('Telegram 通知异常:', error);
  }
}

/**
 * 企业微信机器人通知
 * @param {Object} result 检测结果
 * @param {Object} env 环境变量
 */
export async function sendWeComNotification(result, env) {
  try {
    const formattedTime = formatDateTime(result.latestDate, env.TZ);
    let content;

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

      content = `🚀 CNB 构建更新通知\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆕 新构建 ID：${result.latestBuildId}\n` +
                `${emoji} 构建状态：${result.latestStatus}\n` +
                `📅 构建时间：${formattedTime}`;
      if (result.buildUrl) {
        content += `\n🔗 <a href="${result.buildUrl}">查看构建详情</a>`;
      }
    } else if (result.platform === 'gitee') {
      content = `🚀 Gitee 仓库更新通知\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    } else if (result.platform === 'gitlab') {
      content = `🚀 GitLab 仓库更新通知\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    } else {
      content = `🚀 GitHub 仓库更新通知\n` +
                `📦 仓库：<a href="${result.url}">${result.repo}</a>\n` +
                `🆔 最新 SHA：${result.latestSha}\n` +
                `💬 Commit：${result.commitMessage || '无'}\n` +
                `📅 更新时间：${formattedTime}`;
    }

    const response = await fetch(env.WECOM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: content
        }
      })
    });

    const data = await response.json();

    if (data.errcode === 0) {
      console.log('企业微信通知发送成功');
    } else {
      console.error('企业微信通知发送失败:', data.errmsg);
    }
  } catch (error) {
    console.error('企业微信通知异常:', error);
  }
}

/**
 * PushPlus 通知
 * @param {Object} result 检测结果
 * @param {Object} env 环境变量
 */
export async function sendPushPlusNotification(result, env) {
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
      content = `📦 仓库：<a href="${result.url}">${result.repo}</a><br/>` +
                `🆕 新构建 ID：${result.latestBuildId}<br/>` +
                `${emoji} 构建状态：${result.latestStatus}<br/>` +
                `📅 构建时间：${formattedTime}`;
      if (result.buildUrl) {
        content += `<br/>🔗 <a href="${result.buildUrl}">查看构建详情</a>`;
      }
    } else if (result.platform === 'gitee') {
      title = `🚀 Gitee 仓库更新 - ${result.repo}`;
      content = `📦 仓库：<a href="${result.url}">${result.repo}</a><br/>` +
                `🆔 最新 SHA：${result.latestSha}<br/>` +
                `💬 Commit：${result.commitMessage || '无'}<br/>` +
                `📅 更新时间：${formattedTime}`;
    } else if (result.platform === 'gitlab') {
      title = `🚀 GitLab 仓库更新 - ${result.repo}`;
      content = `📦 仓库：<a href="${result.url}">${result.repo}</a><br/>` +
                `🆔 最新 SHA：${result.latestSha}<br/>` +
                `💬 Commit：${result.commitMessage || '无'}<br/>` +
                `📅 更新时间：${formattedTime}`;
    } else {
      title = `🚀 GitHub 仓库更新 - ${result.repo}`;
      content = `📦 仓库：<a href="${result.url}">${result.repo}</a><br/>` +
                `🆔 最新 SHA：${result.latestSha}<br/>` +
                `💬 Commit：${result.commitMessage || '无'}<br/>` +
                `📅 更新时间：${formattedTime}`;
    }

    const url = 'https://www.pushplus.plus/send';
    const requestBody = {
      token: env.PUSHPLUS_TOKEN,
      title: title,
      content: content,
      template: 'html'
    };

    // 可选参数
    if (env.PUSHPLUS_TOPIC) {
      requestBody.topic = env.PUSHPLUS_TOPIC;
    }
    if (env.PUSHPLUS_CHANNEL) {
      requestBody.channel = env.PUSHPLUS_CHANNEL;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.code === 200) {
      console.log('PushPlus 通知发送成功');
    } else {
      console.error('PushPlus 通知发送失败:', data.msg);
    }
  } catch (error) {
    console.error('PushPlus 通知异常:', error);
  }
}

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
 * 主通知函数 - 根据环境变量自动启用可用的通知渠道
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

  const notifyTasks = [];

  // Telegram 通知
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    notifyTasks.push(sendTelegramNotification(result, env));
  }

  // 企业微信机器人通知
  if (env.WECOM_WEBHOOK_URL) {
    notifyTasks.push(sendWeComNotification(result, env));
  }

  // PushPlus 通知
  if (env.PUSHPLUS_TOKEN) {
    notifyTasks.push(sendPushPlusNotification(result, env));
  }

  // MagicPush 通知
  if (env.MAGICPUSH_TOKEN && env.MAGICPUSH_URL) {
    notifyTasks.push(sendMagicPushNotification(result, env));
  }

  // 并发执行所有启用的通知
  if (notifyTasks.length > 0) {
    await Promise.allSettled(notifyTasks);
  } else {
    console.log('未配置任何通知渠道');
  }
}
