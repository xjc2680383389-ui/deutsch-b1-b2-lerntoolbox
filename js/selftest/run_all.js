// 自检总入口：node js/selftest/run_all.js
import { results as rRandom, title as titleRandom } from './test_random.js';
import { results as rSrs, title as titleSrs } from './test_srs.js';
import { results as rQuiz, title as titleQuiz } from './test_quiz.js';
import { results as rMistakes, title as titleMistakes } from './test_mistakes.js';
import { results as rStats, title as titleStats } from './test_stats.js';
import { results as rStore, title as titleStore } from './test_store.js';
import { results as rListening, title as titleListening } from './test_listening.js';
import { results as rListeningUi, title as titleListeningUi } from './test_listening_ui.js';
import { results as rData, title as titleData } from './test_data.js';

const GROUPS = [
  [titleRandom, rRandom],
  [titleSrs, rSrs],
  [titleQuiz, rQuiz],
  [titleMistakes, rMistakes],
  [titleStats, rStats],
  [titleStore, rStore],
  [titleListening, rListening],
  [titleListeningUi, rListeningUi],
  [titleData, rData],
];

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const useColor = process.stdout && process.stdout.isTTY;

function paint(code, text) {
  return useColor ? code + text + RESET : text;
}

let total = 0;
let failed = 0;
let index = 0;

console.log('');
console.log(paint(BOLD, '德语 B1/B2 学习工具箱 · 自检'));
console.log(paint(DIM, '固定输入、虚拟时钟与固定种子；听力界面联动使用 DOM/TTS/localStorage 替身'));
console.log('');

GROUPS.forEach(([title, list]) => {
  const pass = list.filter((r) => r.pass).length;
  console.log(paint(BOLD, `【${title}】`) + `  ${pass}/${list.length} 通过`);
  list.forEach((r) => {
    index += 1;
    total += 1;
    const mark = r.pass ? paint(GREEN, '  ✔ 通过') : paint(RED, '  ✘ 失败');
    console.log(`  ${String(index).padStart(2, '0')} ${mark}  ${r.name}`);
    if (!r.pass) {
      failed += 1;
      console.log(paint(RED, `        原因：${r.detail}`));
    }
  });
  console.log('');
});

console.log(paint(DIM, '—'.repeat(56)));
if (failed === 0) {
  console.log(paint(GREEN + BOLD, `全部通过：${total} 项，0 失败`));
} else {
  console.log(paint(RED + BOLD, `失败 ${failed} 项，共 ${total} 项`));
}
console.log('');

process.exit(failed === 0 ? 0 : 1);
