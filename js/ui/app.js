// 路由与页面挂载
import { render as renderHome } from './page_home.js';
import { render as renderCards } from './page_cards.js';
import { render as renderGrammar } from './page_grammar.js';
import { render as renderListening, dispose as disposeListening, refresh as refreshListening } from './page_listening.js';
import { store, STORAGE_KEY } from './state.js';
import { render as renderMistakes } from './page_mistakes.js';
import { render as renderStats } from './page_stats.js';
import { render as renderData } from './page_data.js';
import { seedDemo } from './demo.js';
import { icon } from './icons.js';

document.querySelectorAll('.nav a[data-icon]').forEach((a) => {
  a.insertAdjacentHTML('afterbegin', icon(a.dataset.icon));
});
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('workspace').focus();
});

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
let previousKey = '';

function currentKey() {
  const raw = (location.hash || '').replace(/^#\/?/, '').trim();
  return VALID.indexOf(raw) >= 0 ? raw : 'home';
}

function route() {
  const key = currentKey();
  if (previousKey === 'listening' && key !== 'listening') disposeListening();
  previousKey = key;
  VALID.forEach((k) => {
    const node = document.getElementById('view-' + k);
    if (node) node.classList.toggle('active', k === key);
  });
  document.querySelectorAll('.nav a').forEach((a) => {
    const selected = a.getAttribute('href') === '#/' + key;
    a.classList.toggle('active', selected);
    if (selected) {
      a.setAttribute('aria-current', 'page');
      document.getElementById('workspace-title').textContent = a.textContent;
      document.title = a.textContent + ' · 德语学习助手';
    } else a.removeAttribute('aria-current');
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
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY && e.key !== null) return;
  store.load();
  const key = currentKey();
  if (key === 'listening') refreshListening();
  else if (key === 'stats' || key === 'home') route();
});
if (!location.hash) location.hash = '#/home';
// 地址栏带 ?demo=1 时写入一次演示数据，便于冒烟与截图
if (location.search.indexOf('demo=1') >= 0) seedDemo();
route();
