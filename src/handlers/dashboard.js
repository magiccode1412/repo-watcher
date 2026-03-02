/**
 * 仪表盘处理器
 * @param {Request} request HTTP请求
 * @param {Object} env 环境变量
 * @returns {Promise<Response>}
 */
export async function handleDashboard(request, env) {
  // 读取静态 HTML 文件
  const htmlContent = await env.ASSETS.fetch(new URL('file://dashboard.html'));
  const html = await htmlContent.text();
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
