import { getRepoData, saveRepoData, parseCnbRepoString, parseCnbRepoList } from '../utils/index.js';

/**
 * 检测 CNB 仓库代码提交更新
 * @param {{owner: string, repo: string, branch: string}} repoInfo CNB 仓库信息
 * @param {Object} env 环境变量
 * @returns {Promise<Object>}
 */
export async function checkCnbBuildUpdate(repoInfo, env) {
  const { owner, repo, branch } = repoInfo;
  const repoKey = `cnb:${owner}/${repo}@${branch}`;
  const apiBase = env.CNB_API_BASE || 'https://api.cnb.cool';
  const cacheTtl = parseInt(env.CNB_CACHE_TTL || '300', 10) || 300;
  const repoUrl = `https://cnb.cool/${owner}/${repo}`;

  // 验证必需的 CNB Token
  if (!env.CNB_TOKEN) {
    console.error('CNB_TOKEN 未配置，无法检测 CNB 仓库');
    return {
      repo: repoKey,
      platform: 'cnb',
      hasUpdate: false,
      latestSha: '',
      latestDate: '',
      previousSha: '',
      isFirstCheck: false,
      url: repoUrl,
      branch: branch,
      error: 'CNB_TOKEN 未配置'
    };
  }

  // 构建 CNB API 请求（获取提交记录）
  const encodedPath = encodeURIComponent(`${owner}/${repo}`);
  const apiUrl = `${apiBase}/api/v4/projects/${encodedPath}/repository/commits?ref_name=${encodeURIComponent(branch)}&per_page=1`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.CNB_TOKEN}`
  };

  // 尝试从 Cache API 获取缓存
  const cacheKey = new Request(apiUrl, { headers: requestHeaders });
  const cache = caches.default;
  let response;

  try {
    let cachedResponse = await cache.match(cacheKey);
    if (!cachedResponse) {
      // 缓存未命中，调用 CNB API
      response = await fetch(apiUrl, { headers: requestHeaders });

      // 检查 API 响应状态
      if (!response.ok) {
        throw new Error(`CNB API 请求失败: ${response.status} ${response.statusText}`);
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

    // 获取最新提交信息
    if (!data || data.length === 0) {
      console.log(`CNB 仓库 ${repoKey} 暂无提交记录`);
      return {
        repo: repoKey,
        platform: 'cnb',
        hasUpdate: false,
        latestSha: '',
        latestDate: '',
        previousSha: '',
        isFirstCheck: true,
        url: repoUrl,
        branch: branch,
        error: '暂无提交记录'
      };
    }

    const latestCommit = data[0];
    const latestSha = latestCommit.id || latestCommit.sha;
    const latestDate = latestCommit.created_at || latestCommit.committed_date || new Date().toISOString();
    const latestMessage = latestCommit.title || latestCommit.message || '';
    const authorName = latestCommit.author_name || latestCommit.author?.name || '';

    // 从 KV 获取上次记录的数据（兼容旧格式）
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'cnb');
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
        message: latestMessage,
        author: authorName,
        url: repoUrl
      });
    }

    return {
      repo: repoKey,
      platform: 'cnb',
      hasUpdate,
      latestSha,
      latestDate,
      latestMessage,
      authorName,
      previousSha,
      isFirstCheck,
      url: repoUrl,
      branch: branch
    };
  } catch (error) {
    console.error(`检测 CNB 仓库 ${repoKey} 失败:`, error);
    const previousData = await getRepoData(env.KV_DEFAULT, repoKey, 'cnb');
    const previousSha = previousData ? (previousData.sha || previousData) : null;
    return {
      repo: repoKey,
      platform: 'cnb',
      hasUpdate: false,
      latestSha: '',
      latestDate: '',
      previousSha,
      url: repoUrl,
      branch: branch,
      error: error.message
    };
  }
}

export { parseCnbRepoString, parseCnbRepoList };
