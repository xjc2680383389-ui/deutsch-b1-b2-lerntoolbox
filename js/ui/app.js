// 路由与页面挂载
import { render as renderHome } from './page_home.js';
import { render as renderCards } from './page_cards.js';
import { render as renderGrammar } from './page_grammar.js';
import { render as renderListening } from './page_listening.js';
import { render as renderMistakes } from './page_mistakes.js';
import { render as renderStats } from './page_stats.js';
import { render as renderData } from './page_data.js';
import { seedDemo } from './demo.js';

const PAGES = {
  home: renderHome,
  cards: renderCards,
  grammar: renderGrammar,
  listening: renderListening,
  mistakes: renderMistakes,
  stats: renderStats,
  data: renderData,
};

const VALID = Object.keys(PAGES);

function currentKey() {
  const raw = (location.hash || '').replace(/^#\/?/, '').trim();
  return VALID.indexOf(raw) >= 0 ? raw : 'home';
}

function route() {
  const key = currentKey();
  VALID.forEach((k) => {
    const node = document.getElementById('view-' + k);
    if (node) node.classList.toggle('active', k === key);
  });
  document.querySelectorAll('.nav a').forEach((a) => {
    a.classList.toggle('active', (a.getAttribute('href') || '').indexOf('#/' + key) >= 0);
  });
  const container = document.getElementById('view-' + key);
  if (!container) return;
  try {
    PAGES[key](container);
  } catch (err) {
    container.innerHTML = `<div class="panel"><div class="empty">页面渲染出错：${String(err && err.message ? err.message : err)}</div></div>`;
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
if (!location.hash) location.hash = '#/home';
// 地址栏带 ?demo=1 时写入一次演示数据，便于冒烟与截图
if (location.search.indexOf('demo=1') >= 0) seedDemo();
route();
