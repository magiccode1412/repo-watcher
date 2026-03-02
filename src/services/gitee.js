import { getRepoData, saveRepoData } from '../utils/index.js';

/**
 * 解析单个 Gitee 仓库字符串（格式：owner/repo 或 owner/repo@branch）
 * @param {string} repoStr 单个仓库字符串
 * @param {string} defaultBranch 默认分支
 * @returns {{owner: string, repo: string, branch: string}|null}
 */
export function parseGiteeRepoString(repoStr, defaultBranch) {
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
 * 解析 Gitee 仓库列表字符串（支持逗号或换行分隔）
 * @param {string} repoStr 仓库列表字符串
 * @param {string} defaultBranch 默认分支
 * @returns {Array<{owner: string, repo: string, branch: string}>}
 */
export function parseGiteeRepoList(repoStr, defaultBranch) {
  if (!repoStr) return [];

  const delimiter = repoStr.includes('\n') ? '\n' : ',';

  return repoStr.split(delimiter)
    .map(repo => repo.trim())
    .filter(repo => repo)
    .map(repo => parseGiteeRepoString(repo, defaultBranch))
    .filter(repo => repo !== null);
}

/**
 * 检测单个 Gitee 仓库是否有更新
 * @param {{owner: string, repo: string, branch: string}} repoInfo 仓库信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function checkGiteeRepoUpdate(repoInfo, env) {
  const { owner, repo, branch } = repoInfo;
  const repoKey = `gitee:${owner}/${repo}@${branch}`;
  const cacheTtl = parseInt(env.GITEE_CACHE_TTL || '300', 10) || 300;
  const repoUrl = `https://gitee.com/${owner}/${repo}`;

  // 构建 Gitee API 请求
  // Gitee API: GET /repos/{owner}/{repo}/commits/{sha}
  const apiUrl = `https://gitee.com/api/v5/repos/${owner}/${repo}/commits/${branch}`;
  const requestHeaders = {
    'User-Agent': 'Gitee-Repo-Watcher-Cloudflare-Worker',
  };

  // 构建请求 URL（Gitee 使用 private_token 参数认证）
  let requestUrl = apiUrl;
  if (env.GITEE_TOKEN) {
    requestUrl = `${apiUrl}?private_token=${env.GITEE_TOKEN}`;
  }

  // 尝试从 Cache API 获取缓存
  const cacheKey = new Request(requestUrl, { headers: requestHeaders });
  const cache = caches.default;
  let response;

  try {
    let cachedResponse = await cache.match(cacheKey);
    if (!cachedResponse) {
      // 缓存未命中，调用 Gitee API
      response = await fetch(requestUrl, { headers: requestHeaders });

      // 检查 API 响应状态
      if (!response.ok) {
        throw new Error(`Gitee API 请求失败: ${response.status} ${response.statusText}`);
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
    const latestSha = data.sha;
    // Gitee API 返回 commit.author.date 或 commit.committer.date
    const latestDate = data.commit?.author?.date || data.commit?.committer?.date || new Date().toISOString();
    const commitMessage = data.commit?.message || '';

    // 从 KV 获取上次记录的数据
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'gitee');
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
      platform: 'gitee',
      hasUpdate,
      latestSha,
      latestDate,
      commitMessage,
      previousSha,
      isFirstCheck,
      url: repoUrl
    };
  } catch (error) {
    console.error(`检测 Gitee 仓库 ${repoKey} 失败:`, error);
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'gitee');
    const previousSha = previousData ? (previousData.sha || previousData) : null;
    return {
      repo: repoKey,
      platform: 'gitee',
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
 * 获取 Gitee API 限流信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function getGiteeRateLimitInfo(env) {
  const requestHeaders = {
    'User-Agent': 'Gitee-Repo-Watcher-Cloudflare-Worker',
  };

  let requestUrl = 'https://gitee.com/api/v5/rate_limit';
  if (env.GITEE_TOKEN) {
    requestUrl = `${requestUrl}?private_token=${env.GITEE_TOKEN}`;
  }

  try {
    const response = await fetch(requestUrl, { headers: requestHeaders });
    const data = await response.json();
    return {
      limit: data.rate?.limit?.toString() || '未知',
      remaining: data.rate?.remaining?.toString() || '未知',
      reset: data.rate?.reset ? new Date(data.rate.reset * 1000).toISOString() : '未知'
    };
  } catch (error) {
    return { limit: '未知', remaining: '未知', reset: '未知' };
  }
}
