import { parseRepoList, getRepoData } from '../utils/index.js';
import { parseGiteeRepoList, parseGitLabRepoList, parseCnbRepoList } from '../services/index.js';

/**
 * 处理获取仓库列表请求（公开接口，无需鉴权，支持 CORS）
 * @param {Request} request HTTP请求
 * @param {Object} env 环境变量
 * @returns {Promise<Response>}
 */
export async function handleGetRepos(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const repos = [];

    // 获取 GitHub 仓库列表
    const githubRepos = parseRepoList(env.GITHUB_REPO, env.GITHUB_BRANCH || 'main');
    for (const repo of githubRepos) {
      const repoKey = `${repo.owner}/${repo.repo}@${repo.branch}`;
      const repoUrl = `https://github.com/${repo.owner}/${repo.repo}`;
      const repoData = await getRepoData(env.KV_DEFAULT, repoKey, 'github');

      repos.push({
        platform: 'github',
        name: `${repo.owner}/${repo.repo}`,
        branch: repo.branch,
        key: repoKey,
        url: repoUrl,
        latestSha: repoData?.sha || null,
        latestDate: repoData?.date || null,
        updatedAt: repoData?.updatedAt || null,
        hasUpdate: false
      });
    }

    // 获取 Gitee 仓库列表
    if (env.GITEE_REPO) {
      const giteeRepos = parseGiteeRepoList(env.GITEE_REPO, env.GITEE_BRANCH || 'master');
      for (const repo of giteeRepos) {
        const repoKey = `gitee:${repo.owner}/${repo.repo}@${repo.branch}`;
        const repoUrl = `https://gitee.com/${repo.owner}/${repo.repo}`;
        const repoData = await getRepoData(env.KV_DEFAULT, repoKey, 'gitee');

        repos.push({
          platform: 'gitee',
          name: `${repo.owner}/${repo.repo}`,
          branch: repo.branch,
          key: repoKey,
          url: repoUrl,
          latestSha: repoData?.sha || null,
          latestDate: repoData?.date || null,
          latestMessage: repoData?.message || null,
          authorName: repoData?.author || null,
          updatedAt: repoData?.updatedAt || null,
          hasUpdate: false
        });
      }
    }

    // 获取 GitLab 仓库列表
    if (env.GITLAB_REPO) {
      const gitlabHost = env.GITLAB_HOST || 'gitlab.com';
      const gitlabRepos = parseGitLabRepoList(env.GITLAB_REPO, env.GITLAB_BRANCH || 'main');
      for (const repo of gitlabRepos) {
        const repoKey = `gitlab:${repo.owner}/${repo.repo}@${repo.branch}`;
        const repoUrl = `https://${gitlabHost}/${repo.owner}/${repo.repo}`;
        const repoData = await getRepoData(env.KV_DEFAULT, repoKey, 'gitlab');

        repos.push({
          platform: 'gitlab',
          name: `${repo.owner}/${repo.repo}`,
          branch: repo.branch,
          key: repoKey,
          url: repoUrl,
          latestSha: repoData?.sha || null,
          latestDate: repoData?.date || null,
          latestMessage: repoData?.message || null,
          authorName: repoData?.author || null,
          updatedAt: repoData?.updatedAt || null,
          hasUpdate: false
        });
      }
    }

    // 获取 CNB 仓库列表
    if (env.CNB_REPO) {
      const cnbRepos = parseCnbRepoList(env.CNB_REPO, env.CNB_BRANCH || 'main');
      for (const repo of cnbRepos) {
        const repoKey = `cnb:${repo.owner}/${repo.repo}@${repo.branch}`;
        const repoUrl = `https://cnb.cool/${repo.owner}/${repo.repo}`;
        const repoData = await getRepoData(env.KV_DEFAULT, repoKey, 'cnb');

        repos.push({
          platform: 'cnb',
          name: `${repo.owner}/${repo.repo}`,
          branch: repo.branch,
          key: repoKey,
          url: repoUrl,
          latestSha: repoData?.sha || null,
          latestDate: repoData?.date || null,
          latestMessage: repoData?.message || null,
          authorName: repoData?.author || null,
          updatedAt: repoData?.updatedAt || null,
          hasUpdate: false
        });
      }
    }

    return new Response(JSON.stringify({
      code: 200,
      message: '获取成功',
      data: {
        total: repos.length,
        github: repos.filter(r => r.platform === 'github').length,
        gitee: repos.filter(r => r.platform === 'gitee').length,
        gitlab: repos.filter(r => r.platform === 'gitlab').length,
        cnb: repos.filter(r => r.platform === 'cnb').length,
        repos: repos
      }
    }, null, 2), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({
      code: 500,
      message: '获取失败',
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
