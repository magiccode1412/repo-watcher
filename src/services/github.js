import { getRepoData, saveRepoData, parseRepoString, parseRepoList } from '../utils/index.js';

/**
 * 检测单个仓库是否有更新
 * @param {{owner: string, repo: string, branch: string}} repoInfo 仓库信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function checkRepoUpdate(repoInfo, env) {
  const { owner, repo, branch } = repoInfo;
  const repoKey = `${owner}/${repo}@${branch}`;
  const cacheTtl = parseInt(env.GITHUB_CACHE_TTL || '300', 10) || 300;
  const repoUrl = `https://github.com/${owner}/${repo}`;

  // 构建 GitHub API 请求
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`;
  const requestHeaders = {
    'User-Agent': 'GitHub-Repo-Watcher-Cloudflare-Worker',
  };

  // 判断是否启用认证
  if (env.GITHUB_TOKEN) {
    requestHeaders['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
  }

  // 尝试从 Cache API 获取缓存
  const cacheKey = new Request(apiUrl, { headers: requestHeaders });
  const cache = caches.default;
  let response;

  try {
    let cachedResponse = await cache.match(cacheKey);
    if (!cachedResponse) {
      // 缓存未命中，调用 GitHub API
      response = await fetch(apiUrl, { headers: requestHeaders });

      // 检查 API 响应状态
      if (!response.ok) {
        throw new Error(`GitHub API 请求失败: ${response.status} ${response.statusText}`);
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
    const latestDate = data.commit.author.date;
    const commitMessage = data.commit.message;

    // 从 KV 获取上次记录的数据（兼容旧格式）
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'github');
    const previousSha = previousData ? (previousData.sha || previousData) : null;

    // 判断是否有更新
    const hasUpdate = previousSha && previousSha.length > 0 ? previousSha !== latestSha : false;

    // 判断是否首次检测（用于通知控制）
    const isFirstCheck = !previousSha || previousSha.length === 0;

    // 更新 KV 中的数据（首次检测或有更新时）
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
      platform: 'github',
      hasUpdate,
      latestSha,
      latestDate,
      commitMessage,
      previousSha,
      isFirstCheck,
      url: repoUrl
    };
  } catch (error) {
    console.error(`检测仓库 ${repoKey} 失败:`, error);
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'github');
    const previousSha = previousData ? (previousData.sha || previousData) : null;
    return {
      repo: repoKey,
      platform: 'github',
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
 * 获取 GitHub API 限流信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function getRateLimitInfo(env) {
  const requestHeaders = {
    'User-Agent': 'GitHub-Repo-Watcher-Cloudflare-Worker',
  };

  if (env.GITHUB_TOKEN) {
    requestHeaders['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch('https://api.github.com/rate_limit', { headers: requestHeaders });
    const data = await response.json();
    return {
      limit: data.rate.limit.toString(),
      remaining: data.rate.remaining.toString(),
      reset: new Date(data.rate.reset * 1000).toISOString()
    };
  } catch (error) {
    return { limit: '未知', remaining: '未知', reset: '未知' };
  }
}

export { parseRepoString, parseRepoList };
