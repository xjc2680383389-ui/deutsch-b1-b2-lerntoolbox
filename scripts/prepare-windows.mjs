// Windows 安装包只携带运行资源，不携带题库测试、设计原图或开发产物。
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'desktop/windows/www');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'splash.html', 'manifest.webmanifest', 'css', 'js', 'assets/brand']) {
  await cp(path.join(root, name), path.join(output, name), {
    recursive: true,
    filter: source => {
      const relative = path.relative(root, source).split(path.sep).join('/');
      return !relative.startsWith('js/selftest') && !relative.startsWith('assets/brand/masters')
        && !relative.endsWith('/README.md') && !relative.endsWith('/splash-concept.webp');
    },
  });
}
for (const file of ['index.html','js/ui/app.js','assets/brand/icon-512.webp']) await stat(path.join(output,file));
console.log('Windows bundled assets prepared.');
