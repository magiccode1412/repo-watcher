/**
 * 公开 API: 获取仓库列表和状态
 *
 * 访问路径: GET /api/repos
 * 无需鉴权，支持 CORS，供第三方应用集成
 * 配置来源：KV（repo_watcher_config，自动解密）
 */

import { normalizeRepos, getRepoData } from '../lib/utils/index.js';
import { getConfig } from '../lib/config.js';

export async function onRequestGet(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  try {
    const config = await getConfig();
    const repos = [];

    // 获取 GitHub 仓库列表
    const githubRepos = normalizeRepos(config.github?.repos, config.github?.branch || 'main');
    for (const repo of githubRepos) {
      const repoKey = `${repo.owner}/${repo.repo}@${repo.branch}`;
      const repoUrl = `https://github.com/${repo.owner}/${repo.repo}`;
      const repoData = await getRepoData(repoKey, 'github');

      repos.push({
        platform: 'github',
        name: `${repo.owner}/${repo.repo}`,
        branch: repo.branch,
        note: repo.note || null,
        key: repoKey,
        url: repoUrl,
        latestSha: repoData?.sha || null,
        latestDate: repoData?.date || null,
        updatedAt: repoData?.updatedAt || null,
        hasUpdate: false
      });
    }

    // 获取 Gitee 仓库列表
    const giteeRepos = normalizeRepos(config.gitee?.repos, config.gitee?.branch || 'master');
    for (const repo of giteeRepos) {
      const repoKey = `gitee:${repo.owner}/${repo.repo}@${repo.branch}`;
      const repoUrl = `https://gitee.com/${repo.owner}/${repo.repo}`;
      const repoData = await getRepoData(repoKey, 'gitee');

      repos.push({
        platform: 'gitee',
        name: `${repo.owner}/${repo.repo}`,
        branch: repo.branch,
        note: repo.note || null,
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

    // 获取 GitLab 仓库列表
    const gitlabHost = config.gitlab?.host || 'gitlab.com';
    const gitlabRepos = normalizeRepos(config.gitlab?.repos, config.gitlab?.branch || 'main');
    for (const repo of gitlabRepos) {
      const repoKey = `gitlab:${repo.owner}/${repo.repo}@${repo.branch}`;
      const repoUrl = `https://${gitlabHost}/${repo.owner}/${repo.repo}`;
      const repoData = await getRepoData(repoKey, 'gitlab');

      repos.push({
        platform: 'gitlab',
        name: `${repo.owner}/${repo.repo}`,
        branch: repo.branch,
        note: repo.note || null,
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

    // 获取 CNB 仓库列表
    const cnbRepos = normalizeRepos(config.cnb?.repos, config.cnb?.branch || 'main');
    for (const repo of cnbRepos) {
      const repoKey = `cnb:${repo.owner}/${repo.repo}@${repo.branch}`;
      const repoUrl = `https://cnb.cool/${repo.owner}/${repo.repo}`;
      const repoData = await getRepoData(repoKey, 'cnb');

      repos.push({
        platform: 'cnb',
        name: `${repo.owner}/${repo.repo}`,
        branch: repo.branch,
        note: repo.note || null,
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

// 处理预检请求
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
