// 零依赖本地静态服务器（仅用于本地打开页面；不联网、不上传任何数据）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const START_PORT = Number(process.env.PORT || 8123);
const HOST = '127.0.0.1';
const MAX_TRY = 25; // 端口被占用时最多顺延尝试的次数

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function handle(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const target = path.join(ROOT, path.normalize(urlPath).replace(/^([/\\])+/, ''));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('禁止访问');
    return;
  }
  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('未找到：' + urlPath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

function openBrowser(url) {
  if (process.env.DWT_NO_OPEN) return; // 截图等自动化场景不弹窗
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`, () => {});
  } else if (process.platform === 'darwin') {
    exec(`open "${url}"`, () => {});
  } else {
    exec(`xdg-open "${url}"`, () => {});
  }
}

// 端口被占用时自动顺延到下一个空闲端口，避免用户看到“窗口一闪而过”
function listen(port, attempt) {
  if (attempt > MAX_TRY) {
    console.error('');
    console.error(`  已尝试 ${MAX_TRY} 个端口均被占用，无法启动。`);
    console.error('  请关闭占用端口的程序后重试。');
    console.error('');
    process.exit(1);
  }
  const srv = http.createServer(handle);
  srv.once('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.log(`  端口 ${port} 已被占用，尝试 ${port + 1} ...`);
      listen(port + 1, attempt + 1);
      return;
    }
    console.error('');
    console.error('  启动失败：' + ((err && err.message) || err));
    console.error('');
    process.exit(1);
  });
  srv.once('listening', () => {
    const realPort = srv.address().port;
    const url = `http://${HOST}:${realPort}/index.html`;
    console.log('');
    console.log('  德语 B1/B2 学习工具箱已启动');
    console.log(`  访问地址：${url}`);
    console.log('  关闭本窗口即可停止服务。');
    console.log('');
    openBrowser(url);
  });
  srv.listen(port, HOST);
}

listen(START_PORT, 1);
