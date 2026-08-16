'use strict';

/**
 * Shared Nest bootstrap for Vercel. Compiled output lives in dist/
 * (created by `vercel-build` / `nest build` before functions are packed).
 */
let cachedHandler;

function withApiPrefix(url) {
  if (!url) return '/api';
  const [path, query] = String(url).split('?');
  if (path === '/api' || path.startsWith('/api/')) {
    return url;
  }
  const prefixed = '/api' + (path.startsWith('/') ? path : '/' + path);
  return query ? `${prefixed}?${query}` : prefixed;
}

/**
 * Vercel functions under /api strip that prefix from req.url.
 * Nest global prefix is `api`, so restore it or Swagger/routes 404 or render blank.
 */
function restoreVercelApiUrl(req) {
  if (!process.env.VERCEL) return;
  req.url = withApiPrefix(req.url);
  if (typeof req.originalUrl === 'string') {
    req.originalUrl = withApiPrefix(req.originalUrl);
  }
}

async function getHandler() {
  if (!cachedHandler) {
    const { createNestExpressHandler } = require('../dist/create-app');
    cachedHandler = await createNestExpressHandler();
  }
  return cachedHandler;
}

module.exports = async function nestHandler(req, res) {
  restoreVercelApiUrl(req);
  const app = await getHandler();
  return app(req, res);
};
