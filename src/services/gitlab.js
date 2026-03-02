import { getRepoData, saveRepoData } from '../utils/index.js';

/**
 * 解析单个 GitLab 仓库字符串（格式：owner/repo 或 owner/repo@branch）
 * @param {string} repoStr 单个仓库字符串
 * @param {string} defaultBranch 默认分支
 * @returns {{owner: string, repo: string, branch: string}|null}
 */
export function parseGitLabRepoString(repoStr, defaultBranch) {
  const parts = repoStr.split('@');
  const repoParts = parts[0].split('/');

  if (repoParts.length !== 2) return null;

  return {
    owner: repoParts[0].trim(),
    repo: repoParts[1].trim(),
    branch: parts.length > 1 ? parts[1].trim() : defaultBranch
  };
}

/**
 * 解析 GitLab 仓库列表字符串（支持逗号或换行分隔）
 * @param {string} repoStr 仓库列表字符串
 * @param {string} defaultBranch 默认分支
 * @returns {Array<{owner: string, repo: string, branch: string}>}
 */
export function parseGitLabRepoList(repoStr, defaultBranch) {
  if (!repoStr) return [];

  const delimiter = repoStr.includes('\n') ? '\n' : ',';

  return repoStr.split(delimiter)
    .map(repo => repo.trim())
    .filter(repo => repo)
    .map(repo => parseGitLabRepoString(repo, defaultBranch))
    .filter(repo => repo !== null);
}

/**
 * 检测单个 GitLab 仓库是否有更新
 * @param {{owner: string, repo: string, branch: string}} repoInfo 仓库信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function checkGitLabRepoUpdate(repoInfo, env) {
  const { owner, repo, branch } = repoInfo;
  const repoKey = `gitlab:${owner}/${repo}@${branch}`;
  const cacheTtl = parseInt(env.GITLAB_CACHE_TTL || '300', 10) || 300;
  const apiBase = env.GITLAB_API_BASE || 'https://gitlab.com';
  const gitlabHost = env.GITLAB_HOST || 'gitlab.com';
  const repoUrl = `https://${gitlabHost}/${owner}/${repo}`;

  // URL 编码项目路径 (owner/repo -> owner%2Frepo)
  const encodedPath = encodeURIComponent(`${owner}/${repo}`);

  // 构建 GitLab API 请求
  // GitLab API: GET /api/v4/projects/:id/repository/commits/:sha
  const apiUrl = `${apiBase}/api/v4/projects/${encodedPath}/repository/commits/${branch}`;
  const requestHeaders = {
    'User-Agent': 'GitLab-Repo-Watcher-Cloudflare-Worker',
  };

  // GitLab 使用 PRIVATE-TOKEN header 认证
  if (env.GITLAB_TOKEN) {
    requestHeaders['PRIVATE-TOKEN'] = env.GITLAB_TOKEN;
  }

  // 尝试从 Cache API 获取缓存
  const cacheKey = new Request(apiUrl, { headers: requestHeaders });
  const cache = caches.default;
  let response;

  try {
    let cachedResponse = await cache.match(cacheKey);
    if (!cachedResponse) {
      // 缓存未命中，调用 GitLab API
      response = await fetch(apiUrl, { headers: requestHeaders });

      // 检查 API 响应状态
      if (!response.ok) {
        throw new Error(`GitLab API 请求失败: ${response.status} ${response.statusText}`);
      }

      // 缓存响应结果
      const cacheResponse = new Response(response.body, response);
      cacheResponse.headers.set('Cache-Control', `s-maxage=${cacheTtl}`);
      await cache.put(cacheKey, cacheResponse.clone());
      response = cacheResponse;
    } else {
      response = cachedResponse;
    }

    // 解析 API 响应
    const data = await response.json();
    const latestSha = data.id;
    const latestDate = data.created_at || data.committed_date || new Date().toISOString();
    const commitMessage = data.message || '';

    // 从 KV 获取上次记录的数据
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'gitlab');
    const previousSha = previousData ? (previousData.sha || previousData) : null;

    // 判断是否有更新
    const hasUpdate = previousSha && previousSha.length > 0 ? previousSha !== latestSha : false;

    // 判断是否首次检测
    const isFirstCheck = !previousSha || previousSha.length === 0;

    // 更新 KV 中的数据
    if (isFirstCheck || hasUpdate) {
      await saveRepoData(env.KV_DEFAULT, repoKey, {
        sha: latestSha,
        date: latestDate,
        message: commitMessage,
        url: repoUrl,
        branch: branch
      });
    }

    return {
      repo: repoKey,
      platform: 'gitlab',
      hasUpdate,
      latestSha,
      latestDate,
      commitMessage,
      previousSha,
      isFirstCheck,
      url: repoUrl
    };
  } catch (error) {
    console.error(`检测 GitLab 仓库 ${repoKey} 失败:`, error);
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'gitlab');
    const previousSha = previousData ? (previousData.sha || previousData) : null;
    return {
      repo: repoKey,
      platform: 'gitlab',
      hasUpdate: false,
      latestSha: '',
      latestDate: '',
      previousSha,
      url: repoUrl,
      error: error.message
    };
  }
}

/**
 * 获取 GitLab API 限流信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function getGitLabRateLimitInfo(env) {
  const apiBase = env.GITLAB_API_BASE || 'https://gitlab.com';
  const requestHeaders = {
    'User-Agent': 'GitLab-Repo-Watcher-Cloudflare-Worker',
  };

  if (env.GITLAB_TOKEN) {
    requestHeaders['PRIVATE-TOKEN'] = env.GITLAB_TOKEN;
  }

  try {
    // GitLab 不提供专门的 rate limit API，通过请求 headers 获取限流信息
    // 这里使用一个简单的项目列表请求来获取限流头
    const response = await fetch(`${apiBase}/api/v4/projects?per_page=1`, { headers: requestHeaders });

    // GitLab 在响应头中返回限流信息
    const rateLimitLimit = response.headers.get('ratelimit-limit') || response.headers.get('x-ratelimit-limit') || '未知';
    const rateLimitRemaining = response.headers.get('ratelimit-remaining') || response.headers.get('x-ratelimit-remaining') || '未知';
    const rateLimitReset = response.headers.get('ratelimit-reset') || response.headers.get('x-ratelimit-reset');

    return {
      limit: rateLimitLimit,
      remaining: rateLimitRemaining,
      reset: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : '未知'
    };
  } catch (error) {
    return { limit: '未知', remaining: '未知', reset: '未知' };
  }
}
