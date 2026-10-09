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

let activeUtterance = null;

export function stopSpeech() {
  activeUtterance = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (err) { /* 取消失败不阻止页面切换 */ }
  }
}

// 返回值只表示请求已发出；实际播放结果由异步事件通知。
export function speak(text, rate, onStatus) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { ok: false, msg: '当前浏览器不支持语音合成，请改用系统朗读功能对照原文练习。' };
  }
  try {
    stopSpeech();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = rate || 0.9;
    const voices = window.speechSynthesis.getVoices() || [];
    const german = voices.find((v) => /^de-DE$/i.test(v.lang)) || voices.find((v) => /^de(?:[-_]|$)/i.test(v.lang));
    if (german) u.voice = german;
    activeUtterance = u;
    u.onstart = () => { if (activeUtterance === u && onStatus) onStatus('正在播放。'); };
    u.onend = () => {
      if (activeUtterance !== u) return;
      activeUtterance = null;
      if (onStatus) onStatus('播放结束。');
    };
    u.onerror = (e) => {
      if (activeUtterance !== u) return;
      activeUtterance = null;
      if (e.error === 'canceled' || e.error === 'interrupted') {
        if (onStatus) onStatus('播放已停止。');
        return;
      }
      const messages = {
        'language-unavailable': '没有可用的德语语音，请安装德语语音包。',
        'voice-unavailable': '所选语音不可用，请重试或检查系统语音包。',
        'not-allowed': '浏览器未允许朗读，请点击播放按钮重试。',
        'network': '语音服务连接失败，请检查网络或使用本地语音包。',
        'audio-busy': '音频设备忙，请稍后重试。',
        'audio-hardware': '音频设备不可用，请检查声音输出。',
      };
      const msg = '朗读失败：' + (messages[e.error] || '语音合成不可用，请重试或对照原文练习。');
      if (onStatus) onStatus(msg);
      else toast(msg);
    };
    if (onStatus) onStatus('正在准备语音…');
    window.speechSynthesis.speak(u);
    return { ok: true, msg: '' };
  } catch (err) {
    activeUtterance = null;
    return { ok: false, msg: '朗读失败：' + (err && err.message ? err.message : err) };
  }
}

export function hasGermanVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    return voices.some((v) => /^de(?:[-_]|$)/i.test(v.lang || ''));
  } catch (err) {
    return false;
  }
}
