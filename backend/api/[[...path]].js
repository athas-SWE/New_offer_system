'use strict';

/**
 * Vercel catch-all (`/api/*`). Nest is compiled with `nest build` (decorators /
 * metadata) then loaded from dist — do not compile the Nest app with esbuild.
 */
let cachedHandler;

async function getHandler() {
  if (!cachedHandler) {
    const { createNestExpressHandler } = require('../dist/create-app');
    cachedHandler = await createNestExpressHandler();
  }
  return cachedHandler;
}

module.exports = async function handler(req, res) {
  const app = await getHandler();
  return app(req, res);
};
