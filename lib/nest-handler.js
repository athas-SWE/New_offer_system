'use strict';

/**
 * Shared Nest bootstrap for Vercel. Compiled output lives in dist/
 * (created by `vercel-build` / `nest build` before functions are packed).
 */
let cachedHandler;

async function getHandler() {
  if (!cachedHandler) {
    const { createNestExpressHandler } = require('../dist/create-app');
    cachedHandler = await createNestExpressHandler();
  }
  return cachedHandler;
}

module.exports = async function nestHandler(req, res) {
  const app = await getHandler();
  return app(req, res);
};
