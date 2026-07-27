import { checkRepoUpdate, parseRepoString, parseRepoList, checkGiteeRepoUpdate, parseGiteeRepoString, parseGiteeRepoList, checkGitLabRepoUpdate, parseGitLabRepoString, parseGitLabRepoList, checkCnbBuildUpdate, parseCnbRepoString, parseCnbRepoList, getRateLimitInfo, notify } from '../services/index.js';

/**
 * 处理检测请求
 * @param {URL} url 请求 URL
 * @param {Object} env 环境变量
 * @returns {Promise<Response>}
 */
export async function handleCheck(url, env) {
  const startTime = Date.now();
  // 解析请求参数
  const targetRepo = url.searchParams.get('repo');
  const enableNotify = url.searchParams.get('notify') === 'true';
  const platform = url.searchParams.get('type') || 'all';

  console.log(`[check] 收到手动检测请求 | platform=${platform} | targetRepo=${targetRepo || '全部'} | notify=${enableNotify}`);

  let results = [];

  // GitHub 仓库检测
  if (platform === 'all' || platform === 'github') {
    if (targetRepo && platform === 'github') {
      const repoInfo = parseRepoString(targetRepo, env.GITHUB_BRANCH || 'main');
      if (repoInfo) {
        results.push(await checkRepoUpdate(repoInfo, env));
      } else {
        return new Response('仓库格式错误，正确格式：owner/repo 或 owner/repo@branch', { status: 400 });
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
          return new Response('Gitee 仓库格式错误，正确格式：owner/repo 或 owner/repo@branch', { status: 400 });
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
          return new Response('GitLab 仓库格式错误，正确格式：owner/repo 或 owner/repo@branch', { status: 400 });
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
          return new Response('CNB 仓库格式错误，正确格式：owner/repo 或 owner/repo@branch', { status: 400 });
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
    let notifyCount = 0;
    for (const result of results) {
      if (result.hasUpdate || (result.isFirstCheck && env.NOTIFY_ON_FIRST_CHECK === 'true')) {
        notifyCount++;
        await notify(result, env);
      }
    }
    console.log(`[check] 已发送通知 ${notifyCount} 条`);
  }

  const cost = Date.now() - startTime;
  console.log(`[check] 检测完成 | 总数=${results.length} | 更新=${results.filter(r => r.hasUpdate).length} | 失败=${results.filter(r => r.error).length} | 耗时=${cost}ms`);

  // 返回检测结果
  return new Response(JSON.stringify({
    code: 200,
    message: enableNotify ? '检测完成，通知已发送' : '检测完成',
    data: results,
    rateLimit: await getRateLimitInfo(env)
  }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
