// 页面模块按需加载；异步路由用序号避免快速切页后旧页面覆盖新页面。
import { store, STORAGE_KEY } from './state.js';
import { icon } from './icons.js';
import { esc } from './util.js';
import { initSelects, closeSelect } from './selects.js';

const PAGES = {
  home: () => import('./page_home.js'),
  cards: () => import('./page_cards.js'),
  grammar: () => import('./page_grammar.js'),
  listening: () => import('./page_listening.js'),
  mistakes: () => import('./page_mistakes.js'),
  stats: () => import('./page_stats.js'),
  data: () => import('./page_data.js'),
};
const VALID = Object.keys(PAGES);
let currentModule = null;
let mountedKey = '';
let navigation = 0;
let booted = false;

document.querySelectorAll('.nav a[data-icon]').forEach((a) => a.insertAdjacentHTML('afterbegin', icon(a.dataset.icon)));
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('workspace').focus();
});
initSelects(document.getElementById('workspace'));

function currentKey() {
  const raw = (location.hash || '').replace(/^#\/?/, '').trim();
  return VALID.includes(raw) ? raw : 'home';
}

async function route() {
  const key = currentKey();
  const turn = ++navigation;
  closeSelect();
  if (mountedKey && mountedKey !== key) {
    currentModule?.dispose?.();
    // 页面内部状态保留在模块中，离页时释放隐藏的表格、选项及图表 DOM。
    document.getElementById('view-' + mountedKey).replaceChildren();
    currentModule = null;
    mountedKey = '';
  }
  VALID.forEach((name) => document.getElementById('view-' + name)?.classList.toggle('active', name === key));
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
  container.setAttribute('aria-busy', 'true');
  try {
    const page = await PAGES[key]();
    if (turn !== navigation) return;
    page.render(container);
    currentModule = page;
    mountedKey = key;
  } catch (error) {
    if (turn !== navigation) return;
    container.innerHTML = `<div class="panel"><div class="empty">页面打开失败：${esc(error?.message || error)}。请重新打开本页。</div></div>`;
  } finally {
    container.removeAttribute('aria-busy');
    if (turn === navigation) {
      window.scrollTo(0, 0);
      if (!booted) { booted = true; window.dispatchEvent(new Event('dwt:ready')); }
    }
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  store.load();
  const key = currentKey();
  if (key === 'listening' && mountedKey === key) currentModule?.refresh?.();
  else if (key === 'stats' || key === 'home') route();
});
async function boot() {
  if (new URLSearchParams(location.search).get('demo') === '1') {
    const { seedDemo } = await import('./demo.js');
    seedDemo();
  }
  // 修改首个地址而不触发 hashchange，避免启动首页重复渲染。
  if (!location.hash) history.replaceState(null, '', '#/home');
  route();
}
boot();
