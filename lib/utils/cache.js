/**
 * Cache API 封装 (EdgeOne Makers 适配版)
 * 
 * EdgeOne Makers 使用标准 Cache API (caches.open()) 替代 Cloudflare 的 caches.default
 * 此模块封装统一的缓存操作，处理 cache 实例获取逻辑
 */

let cacheInstance = null;

/**
 * 获取缓存实例（单例模式）
 * @returns {Promise<Cache>} 缓存实例
 */
async function getCache() {
  if (!cacheInstance) {
    cacheInstance = await caches.open('api-cache');
  }
  return cacheInstance;
}

/**
 * 从缓存获取响应
 * @param {Request|string} cacheKey 缓存键（Request 对象或 URL 字符串）
 * @returns {Promise<Response|null>} 缓存的响应，未命中返回 null
 */
export async function getCached(cacheKey) {
  const cache = await getCache();
  return await cache.match(cacheKey);
}

/**
 * 将响应存入缓存
 * @param {Request|string} cacheKey 缓存键
 * @param {Response} response 要缓存的响应
 * @param {number} ttl 缓存过期时间（秒）
 * @returns {Promise<void>}
 */
export async function setCached(cacheKey, response, ttl = 300) {
  const cache = await getCache();
  const cacheResponse = new Response(response.body, response);
  cacheResponse.headers.set('Cache-Control', `s-maxage=${ttl}`);
  await cache.put(cacheKey, cacheResponse.clone());
}
