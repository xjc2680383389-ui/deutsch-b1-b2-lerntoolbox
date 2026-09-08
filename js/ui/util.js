// 界面层小工具（仅此文件及 js/ui 下文件允许操作 DOM）
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function qs(sel, root) {
  return (root || document).querySelector(sel);
}

export function qsa(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel));
}

let toastTimer = null;
export function toast(msg) {
  let node = qs('#toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'toast';
    node.className = 'toast';
    document.body.appendChild(node);
  }
  node.textContent = msg;
  node.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1800);
}

export function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDay(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtPercent(x) {
  if (x == null) return '—';
  return Math.round(x * 100) + '%';
}

// 语音合成（浏览器内置，不依赖任何在线服务）
export function speak(text, rate) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { ok: false, msg: '当前浏览器不支持语音合成，请改用系统朗读功能对照原文练习。' };
  }
  try {
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = rate || 0.9;
    window.speechSynthesis.speak(u);
    return { ok: true, msg: '' };
  } catch (err) {
    return { ok: false, msg: '朗读失败：' + (err && err.message ? err.message : err) };
  }
}

export function hasGermanVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices() || [];
  return voices.some((v) => /de[-_]/i.test(v.lang || ''));
}
