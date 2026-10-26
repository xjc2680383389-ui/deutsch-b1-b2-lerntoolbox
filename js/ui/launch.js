// 手机每个标签会话展示一次开屏；独立 splash.html 始终可预览。
// 此脚本独立于学习模块运行，模块加载异常也不会让开屏一直遮挡页面。
(() => {
  const screen = document.getElementById('launch-screen');
  const shell = document.getElementById('app-shell');
  const skip = document.getElementById('launch-skip');
  if (!screen || !shell || !skip) return;
  const forced = new URLSearchParams(location.search).get('splash') === '1';
  const mobile = window.matchMedia('(max-width: 600px), (display-mode: standalone)').matches;
  const key = 'dwt.launch.seen.v1';
  let seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; } catch { /* 存储不可用仍可打开与关闭。 */ }
  if (!forced && (!mobile || seen)) return;

  let closed = false;
  let readyTimer;
  const started = Date.now();
  const timeout = window.setTimeout(close, 3000);
  const wasInert = shell.inert;
  const previousFocus = document.activeElement;

  function close() {
    if (closed) return;
    closed = true;
    window.clearTimeout(timeout);
    window.clearTimeout(readyTimer);
    window.removeEventListener('dwt:ready', ready);
    screen.hidden = true;
    shell.inert = wasInert;
    document.body.classList.remove('launch-open');
    if (!forced) {
      try { sessionStorage.setItem(key, '1'); } catch { /* 不影响学习数据。 */ }
    }
    const target = previousFocus && previousFocus !== document.body ? previousFocus : document.getElementById('workspace');
    if (target) target.focus({ preventScroll: true });
  }

  function ready() {
    if (closed) return;
    window.clearTimeout(readyTimer);
    readyTimer = window.setTimeout(close, Math.max(0, 900 - (Date.now() - started)));
  }

  screen.hidden = false;
  shell.inert = true;
  document.body.classList.add('launch-open');
  screen.focus({ preventScroll: true });
  skip.addEventListener('click', close);
  screen.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  });
  window.addEventListener('dwt:ready', ready, { once: true });
})();
