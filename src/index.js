/**
 * GitHub/Gitee/GitLab/CNB 仓库更新监控 - Cloudflare Worker
 * 功能：
 * 1. 从环境变量读取监控仓库和认证令牌（支持 GitHub、Gitee、GitLab 和 CNB）
 * 2. 封装可扩展的检测函数，支持多仓库多平台
 * 3. 使用 KV 存储记录上次检测的 commit SHA
 * 4. 检测到更新时调用 MagicPush 通知渠道
 * 5. 自动判断是否启用认证请求，集成缓存减少 API 调用
 * 6. 根据环境变量自动判断启用哪些通知渠道
 */

import { handleDashboard, handleGetRepos, handleCheck, handleTestNotify } from './handlers/index.js';
import { checkRepoUpdate, parseRepoList, checkGiteeRepoUpdate, parseGiteeRepoList, checkGitLabRepoUpdate, parseGitLabRepoList, checkCnbBuildUpdate, parseCnbRepoList, notify } from './services/index.js';
import dashboardHtml from '../static/dashboard.html';
import faviconSvg from '../static/favicon.svg';

export default {
  /**
   * 处理 HTTP 请求
   * @param {Request} request HTTP 请求
   * @param {Object} env 环境变量
   * @param {Object} ctx 执行上下文
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 处理 favicon 请求
    if (pathname === '/favicon.ico' || pathname === '/favicon.svg') {
      return new Response(faviconSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // 根路径返回监控仪表盘页面
    if (pathname === '/') {
      return new Response(dashboardHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 公开 API：获取仓库列表和状态
    if (pathname === '/api/repos') {
      return await handleGetRepos(request, env);
    }

    // 检查是否开启开发模式
    const devMode = env.DEV_MODE === 'true';
    if (!devMode) {
      return new Response('开发模式已关闭', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    try {
      // 测试通知
      if (pathname === '/test-notify') {
        return await handleTestNotify(url, env);
      }

      // 检测路径
      if (pathname !== '/check') {
        return new Response('路径不存在', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }

      return await handleCheck(url, env);
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
  },

  /**
   * 处理定时检测任务
   * @param {Object} event 定时事件
   * @param {Object} env 环境变量
   * @param {Object} ctx 执行上下文
   */
  async scheduled(event, env, ctx) {
    const notifyOnFirstCheck = env.NOTIFY_ON_FIRST_CHECK === 'true';
    const results = [];

    // 检测 GitHub 仓库
    const githubRepos = parseRepoList(env.GITHUB_REPO, env.GITHUB_BRANCH || 'main');
    for (const repo of githubRepos) {
      results.push(await checkRepoUpdate(repo, env));
    }

    // 检测 Gitee 仓库
    if (env.GITEE_REPO) {
      const giteeRepos = parseGiteeRepoList(env.GITEE_REPO, env.GITEE_BRANCH || 'master');
      for (const repo of giteeRepos) {
        results.push(await checkGiteeRepoUpdate(repo, env));
      }
    }

    // 检测 GitLab 仓库
    if (env.GITLAB_REPO) {
      const gitlabRepos = parseGitLabRepoList(env.GITLAB_REPO, env.GITLAB_BRANCH || 'main');
      for (const repo of gitlabRepos) {
        results.push(await checkGitLabRepoUpdate(repo, env));
      }
    }

    // 检测 CNB 仓库
    if (env.CNB_REPO) {
      const cnbRepos = parseCnbRepoList(env.CNB_REPO, env.CNB_BRANCH || 'main');
      for (const repo of cnbRepos) {
        results.push(await checkCnbBuildUpdate(repo, env));
      }
    }

    // 发送通知
    for (const result of results) {
      if (result.hasUpdate || (result.isFirstCheck && notifyOnFirstCheck)) {
        await notify(result, env);
      }
    }
  }
};
