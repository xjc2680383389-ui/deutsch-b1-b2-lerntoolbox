// 将已验证的网页资源打入 APK，不依赖线上站点或远程代码。
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'android/app/src/main/assets/www');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'splash.html', 'manifest.webmanifest', 'css', 'js', 'assets/brand']) {
  await cp(path.join(root, name), path.join(output, name), {
    recursive: true,
    filter: source => !source.includes('/js/selftest') && !source.includes('/assets/brand/masters') && !source.endsWith('/README.md'),
  });
}
for (const file of ['index.html','js/ui/app.js','js/data/index.js','assets/brand/icon-512.webp']) await stat(path.join(output, file));
console.log('Android bundled assets prepared.');
