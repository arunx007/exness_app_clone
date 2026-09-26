const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

const tradingViewDir = path.resolve(__dirname, 'assets/tradingview');

config.server = config.server || {};
const previousEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const currentMiddleware = previousEnhanceMiddleware
    ? previousEnhanceMiddleware(middleware, server)
    : middleware;

  return (req, res, next) => {
    if (req.url && (req.url.startsWith('/tradingview') || req.url.startsWith('/assets/tradingview'))) {
      const cleanUrl = req.url.split('?')[0].split('#')[0];
      const subPath = cleanUrl.replace(/^\/tradingview\/?/, '').replace(/^\/assets\/tradingview\/?/, '');
      const filePath = path.join(tradingViewDir, subPath === '' ? 'chart.html' : subPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.json': 'application/json',
          '.css': 'text/css; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.wasm': 'application/wasm',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
        };
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        return fs.createReadStream(filePath).pipe(res);
      }
    }
    return currentMiddleware(req, res, next);
  };
};

module.exports = config;
