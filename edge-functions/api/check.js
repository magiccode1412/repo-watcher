/**
 * 检测接口
 * 
 * 访问路径: 
 *   - GET /api/check - 手动检测（需开启 DEV_MODE）
 *   - POST /api/check - 定时任务触发
 * 
 * 参数:
 *   - repo: 指定仓库名称 (owner/repo 或 owner/repo@branch)
 *   - type: 指定平台 (all/github/gitee/gitlab/cnb)
 *   - notify=true: 检测后发送通知
 */

import { checkRepoUpdate, parseRepoString, parseRepoList, checkGiteeRepoUpdate, parseGiteeRepoString, parseGiteeRepoList, checkGitLabRepoUpdate, parseGitLabRepoString, parseGitLabRepoList, checkCnbBuildUpdate, parseCnbRepoString, parseCnbRepoList, getRateLimitInfo, notify } from '../../lib/services/index.js';

// 核心检测逻辑
async function performCheck(env, options = {}) {
  const { targetRepo, enableNotify = false, platform = 'all' } = options;
  
  let results = [];

  // GitHub 仓库检测
  if (platform === 'all' || platform === 'github') {
    if (targetRepo && platform === 'github') {
      const repoInfo = parseRepoString(targetRepo, env.GITHUB_BRANCH || 'main');
      if (repoInfo) {
        results.push(await checkRepoUpdate(repoInfo, env));
      } else {
        return { error: '仓库格式错误，正确格式：owner/repo 或 owner/repo@branch', status: 400 };
      }
    } else if (!targetRepo) {
      const repos = parseRepoList(env.GITHUB_REPO, env.GITHUB_BRANCH || 'main');
      for (const repo of repos) {
        results.push(await checkRepoUpdate(repo, env));
      }
    }
  }

  // Gitee 仓库检测
  if (platform === 'all' || platform === 'gitee') {
    if (env.GITEE_REPO) {
      if (targetRepo && platform === 'gitee') {
        const repoInfo = parseGiteeRepoString(targetRepo, env.GITEE_BRANCH || 'master');
        if (repoInfo) {
          results.push(await checkGiteeRepoUpdate(repoInfo, env));
        } else {
          return { error: 'Gitee 仓库格式错误', status: 400 };
        }
      } else if (!targetRepo) {
        const repos = parseGiteeRepoList(env.GITEE_REPO, env.GITEE_BRANCH || 'master');
        for (const repo of repos) {
          results.push(await checkGiteeRepoUpdate(repo, env));
        }
      }
    }
  }

  // GitLab 仓库检测
  if (platform === 'all' || platform === 'gitlab') {
    if (env.GITLAB_REPO) {
      if (targetRepo && platform === 'gitlab') {
        const repoInfo = parseGitLabRepoString(targetRepo, env.GITLAB_BRANCH || 'main');
        if (repoInfo) {
          results.push(await checkGitLabRepoUpdate(repoInfo, env));
        } else {
          return { error: 'GitLab 仓库格式错误', status: 400 };
        }
      } else if (!targetRepo) {
        const repos = parseGitLabRepoList(env.GITLAB_REPO, env.GITLAB_BRANCH || 'main');
        for (const repo of repos) {
          results.push(await checkGitLabRepoUpdate(repo, env));
        }
      }
    }
  }

  // CNB 仓库检测
  if (platform === 'all' || platform === 'cnb') {
    if (env.CNB_REPO) {
      if (targetRepo && platform === 'cnb') {
        const repoInfo = parseCnbRepoString(targetRepo, env.CNB_BRANCH || 'main');
        if (repoInfo) {
          results.push(await checkCnbBuildUpdate(repoInfo, env));
        } else {
          return { error: 'CNB 仓库格式错误', status: 400 };
        }
      } else if (!targetRepo) {
        const repos = parseCnbRepoList(env.CNB_REPO, env.CNB_BRANCH || 'main');
        for (const repo of repos) {
          results.push(await checkCnbBuildUpdate(repo, env));
        }
      }
    }
  }

  // 如果启用通知，发送通知
  if (enableNotify) {
    for (const result of results) {
      if (result.hasUpdate || (result.isFirstCheck && env.NOTIFY_ON_FIRST_CHECK === 'true')) {
        await notify(result, env);
      }
    }
  }

  return { results };
}

// GET 请求 - 手动检测（需开启 DEV_MODE）
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 检查是否开启开发模式
  if (env.DEV_MODE !== 'true') {
    return new Response('开发模式已关闭', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const targetRepo = url.searchParams.get('repo');
  const enableNotify = url.searchParams.get('notify') === 'true';
  const platform = url.searchParams.get('type') || 'all';

  try {
    const result = await performCheck(env, { targetRepo, enableNotify, platform });
    
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
      rateLimit: await getRateLimitInfo(env)
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

// POST 请求 - 定时任务触发（无需 DEV_MODE）
export async function onRequestPost(context) {
  const { request, env } = context;

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
    const result = await performCheck(env, options);
    
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
      rateLimit: await getRateLimitInfo(env),
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
