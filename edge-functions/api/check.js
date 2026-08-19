/**
 * 检测接口
 *
 * 访问路径:
 *   - GET /api/check - 手动检测
 *   - POST /api/check - 定时任务触发
 *
 * 参数:
 *   - repo: 指定仓库名称 (owner/repo 或 owner/repo@branch)
 *   - type: 指定平台 (all/github/gitee/gitlab/cnb)
 *   - notify=true: 检测后发送通知
 *
 * 调用鉴权：config.checkToken（存于 KV，加密），通过环境变量 CHECK_TOKEN 兜底。
 */

import { parseRepoString, parseRepoList, parseCnbRepoString, parseCnbRepoList } from '../lib/utils/index.js';
import { checkRepoUpdate, checkGiteeRepoUpdate, parseGiteeRepoString, parseGiteeRepoList, checkGitLabRepoUpdate, parseGitLabRepoString, parseGitLabRepoList, checkCnbBuildUpdate, getRateLimitInfo, notify } from '../lib/services/index.js';
import { getConfig } from '../lib/config.js';

// 核心检测逻辑
async function performCheck(config, options = {}) {
  const { targetRepo, enableNotify = false, platform = 'all' } = options;

  let results = [];

  // GitHub 仓库检测
  if (platform === 'all' || platform === 'github') {
    if (targetRepo && platform === 'github') {
      const repoInfo = parseRepoString(targetRepo, config.github?.branch || 'main');
      if (repoInfo) {
        results.push(await checkRepoUpdate(repoInfo, config));
      } else {
        return { error: '仓库格式错误，正确格式：owner/repo 或 owner/repo@branch', status: 400 };
      }
    } else if (!targetRepo) {
      const repos = parseRepoList(config.github?.repo, config.github?.branch || 'main');
      for (const repo of repos) {
        results.push(await checkRepoUpdate(repo, config));
      }
    }
  }

  // Gitee 仓库检测
  if (platform === 'all' || platform === 'gitee') {
    if (config.gitee?.repo) {
      if (targetRepo && platform === 'gitee') {
        const repoInfo = parseGiteeRepoString(targetRepo, config.gitee.branch || 'master');
        if (repoInfo) {
          results.push(await checkGiteeRepoUpdate(repoInfo, config));
        } else {
          return { error: 'Gitee 仓库格式错误', status: 400 };
        }
      } else if (!targetRepo) {
        const repos = parseGiteeRepoList(config.gitee.repo, config.gitee.branch || 'master');
        for (const repo of repos) {
          results.push(await checkGiteeRepoUpdate(repo, config));
        }
      }
    }
  }

  // GitLab 仓库检测
  if (platform === 'all' || platform === 'gitlab') {
    if (config.gitlab?.repo) {
      if (targetRepo && platform === 'gitlab') {
        const repoInfo = parseGitLabRepoString(targetRepo, config.gitlab.branch || 'main');
        if (repoInfo) {
          results.push(await checkGitLabRepoUpdate(repoInfo, config));
        } else {
          return { error: 'GitLab 仓库格式错误', status: 400 };
        }
      } else if (!targetRepo) {
        const repos = parseGitLabRepoList(config.gitlab.repo, config.gitlab.branch || 'main');
        for (const repo of repos) {
          results.push(await checkGitLabRepoUpdate(repo, config));
        }
      }
    }
  }

  // CNB 仓库检测
  if (platform === 'all' || platform === 'cnb') {
    if (config.cnb?.repo) {
      if (targetRepo && platform === 'cnb') {
        const repoInfo = parseCnbRepoString(targetRepo, config.cnb.branch || 'main');
        if (repoInfo) {
          results.push(await checkCnbBuildUpdate(repoInfo, config));
        } else {
          return { error: 'CNB 仓库格式错误', status: 400 };
        }
      } else if (!targetRepo) {
        const repos = parseCnbRepoList(config.cnb.repo, config.cnb.branch || 'main');
        for (const repo of repos) {
          results.push(await checkCnbBuildUpdate(repo, config));
        }
      }
    }
  }

  // 如果启用通知，发送通知
  if (enableNotify) {
    for (const result of results) {
      if (result.hasUpdate || (result.isFirstCheck && config.notifyOnFirstCheck === true)) {
        await notify(result, config);
      }
    }
  }

  return { results };
}

/**
 * 验证访问令牌
 * 令牌来源优先级：KV 配置 config.checkToken > 环境变量 CHECK_TOKEN
 */
function verifyToken(request, config, url) {
  const token = config.checkToken || globalThis.CHECK_TOKEN;
  if (!token) {
    return { error: '服务端未配置 CHECK_TOKEN，请在管理后台或环境变量中设置访问令牌', status: 500 };
  }

  const authHeader = request.headers.get('Authorization');
  let provided;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    provided = authHeader.slice(7).trim();
  } else {
    provided = url.searchParams.get('token');
  }

  if (!provided || provided !== token) {
    return { error: '访问令牌无效', status: 401 };
  }

  return null;
}

// GET 请求 - 手动检测
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const config = await getConfig();

  // 验证访问令牌
  const tokenError = verifyToken(request, config, url);
  if (tokenError) {
    return new Response(JSON.stringify({ code: tokenError.status, message: tokenError.error }), {
      status: tokenError.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  const targetRepo = url.searchParams.get('repo');
  const enableNotify = url.searchParams.get('notify') === 'true';
  const platform = url.searchParams.get('type') || 'all';

  try {
    const result = await performCheck(config, { targetRepo, enableNotify, platform });

    if (result.error) {
      return new Response(JSON.stringify({ code: 400, message: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({
      code: 200,
      message: enableNotify ? '检测完成，通知已发送' : '检测完成',
      data: result.results,
      rateLimit: await getRateLimitInfo(config)
    }, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      code: 500,
      message: '检测失败',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// POST 请求 - 定时任务触发
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const config = await getConfig();

  // 验证访问令牌
  const tokenError = verifyToken(request, config, url);
  if (tokenError) {
    return new Response(JSON.stringify({
      code: tokenError.status,
      message: tokenError.error,
      executedAt: new Date().toISOString()
    }), {
      status: tokenError.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  let options = {};

  try {
    // 解析 JSON body（定时任务 payload）
    const body = await request.json().catch(() => ({}));
    options = {
      enableNotify: body.notify === true || body.notify === 'true',
      platform: body.type || 'all',
      targetRepo: body.repo || null
    };
  } catch {
    // 无 body 时使用默认值
    options = { enableNotify: false, platform: 'all', targetRepo: null };
  }

  try {
    const result = await performCheck(config, options);

    if (result.error) {
      return new Response(JSON.stringify({
        code: 400,
        message: result.error,
        executedAt: new Date().toISOString()
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({
      code: 200,
      message: options.enableNotify ? '定时检测完成，通知已发送' : '定时检测完成',
      data: result.results,
      rateLimit: await getRateLimitInfo(config),
      executedAt: new Date().toISOString()
    }, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      code: 500,
      message: '定时检测失败',
      error: error.message,
      executedAt: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
