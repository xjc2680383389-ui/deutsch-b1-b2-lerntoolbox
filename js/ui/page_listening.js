// 听力精听页：原文与解析横排；逐句播放与逐句自检
import { LISTENING } from '../data/index.js';
import { store, recordListening } from './state.js';
import { judgeListening, diffWords } from '../core/listening.js';
import { esc, qs, qsa, speak, stopSpeech, hasGermanVoice } from './util.js';

let rootEl = null;
let level = '全部';
let currentId = LISTENING[0].id;
let input = '';
let result = null;
let hideText = false;
let active = false;
let checking = false;
let saveError = '';
let voiceSource = null;
let speechStatus = '';
let inputRevision = 0;

export function render(root) {
  rootEl = root;
  active = true;
  if (voiceSource && voiceSource.removeEventListener) voiceSource.removeEventListener('voiceschanged', refreshVoiceHint);
  voiceSource = window.speechSynthesis;
  if (voiceSource && voiceSource.addEventListener) voiceSource.addEventListener('voiceschanged', refreshVoiceHint);
  if (!LISTENING.some((s) => s.id === currentId)) currentId = LISTENING[0].id;
  paint();
}

function current() {
  return LISTENING.find((s) => s.id === currentId) || LISTENING[0];
}

export function dispose() {
  active = false;
  stopSpeech();
  speechStatus = '';
  if (voiceSource && voiceSource.removeEventListener) voiceSource.removeEventListener('voiceschanged', refreshVoiceHint);
  voiceSource = null;
}

function setSpeechStatus(msg) {
  speechStatus = msg;
  if (active) qs('#tts-status', rootEl).textContent = msg;
}

function refreshVoiceHint() {
  if (!active) return;
  qs('#voice-hint', rootEl).textContent = hasGermanVoice() ? '' : '（提示：若听不到德语语音，请在系统中安装德语语音包，或对照原文自行朗读练习。）';
}

function feedbackHtml() {
  if (!result) return '';
  const words = diffWords(current().de, result.userText);
  return `<div class="feedback ${result.passed ? 'ok' : 'no'} mt16">
    <div class="title">${result.passed ? '通过：' : '未通过：'}${esc(result.label)}（相似度 ${Math.round(result.score * 100)}%）</div>
    <div class="explain">${esc(result.hint)}</div>
    <div class="listen-text mt8">${renderWords(words, current().de)}</div><div class="small muted">红色为未听出的词。</div>
  </div>`;
}

export function refresh() {
  if (!active) return;
  const s = current();
  const stat = store.data.listeningStats[s.id] || { plays: 0, best: 0 };
  qs('#listening-stat', rootEl).textContent = `已自检 ${stat.plays} 次　${stat.best >= 100 ? '曾通过' : '尚未通过'}`;
  qs('#de-text', rootEl).innerHTML = hideText ? esc(mask(s.de)) : renderWords(result ? diffWords(s.de, result.userText) : null, s.de);
  qs('#listening-feedback', rootEl).innerHTML = feedbackHtml();
  qs('#listening-save-error', rootEl).textContent = saveError;
  qs('#check-btn', rootEl).disabled = checking;
}

function visible() {
  return LISTENING.filter((s) => level === '全部' || s.level === level);
}

function paint() {
  const db = store.data;
  const s = current();
  const rate = db.settings.ttsRate || 0.9;
  const stat = db.listeningStats[s.id] || { plays: 0, best: 0 };
  const words = result ? diffWords(s.de, result.userText) : null;
  const syncHint = window.navigator && !window.navigator.locks ? '当前浏览器请只使用一个学习标签，避免同时保存覆盖记录。' : '';

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>听力精听</h1>
      <p>共 ${LISTENING.length} 句（B1 / B2 分级）。流程：播放 → 听写 → 自检 → 对照逐句解析。<span id="voice-hint"></span></p>
    </div>

    <div class="panel">
      <div class="row between mb8">
        <h2 style="margin:0">句库</h2>
        <div class="row">
          <select id="level-filter" style="padding:6px 10px;border:1px solid var(--line);border-radius:8px">
            ${['全部', 'B1', 'B2'].map((lv) => `<option value="${lv}" ${lv === level ? 'selected' : ''}>${lv}</option>`).join('')}
          </select>
          <button class="btn small ghost" id="toggle-hide">${hideText ? '显示原文' : '隐藏原文（听写模式）'}</button>
        </div>
      </div>
      <div class="sentence-list">
        ${visible().map((x) => `
          <button class="sentence-item ${x.id === currentId ? 'active' : ''}" data-id="${esc(x.id)}">
            <span class="tag ${x.level === 'B1' ? 'b1' : 'b2'}">${esc(x.level)}</span>
            ${esc(hideText ? mask(x.de) : x.de)}
          </button>`).join('')}
      </div>
    </div>

    <div class="panel">
      <div class="listen-wrap">
        <div class="listen-left">
          <div class="row between mb8">
            <div class="row">
              <button class="btn primary" id="play-btn">播放本句</button>
              <button class="btn" id="play-slow">慢速播放</button>
            </div>
            <div class="row">
              <span class="small muted">语速 ${rate.toFixed(2)}</span>
              <input id="rate" type="range" min="0.5" max="1.2" step="0.05" value="${rate}" style="width:120px">
            </div>
          </div>

          <div class="listen-text" id="de-text">${hideText ? esc(mask(s.de)) : renderWords(words, s.de)}</div>
          <div class="small muted mb8" id="tts-status" role="status" aria-live="polite">${esc(speechStatus)}</div>
          ${hideText ? '' : `<div class="small muted mt8">中文：${esc(s.zh)}</div>`}

          <div class="field mt16">
            <label for="dictation">听写本句（不区分大小写与句末标点）</label>
            <input id="dictation" style="width:100%;padding:8px 10px;font-size:16px;border:1px solid var(--line);border-radius:8px" placeholder="把你听到的句子写在这里" value="${esc(input)}">
          </div>
          <div class="row">
            <button class="btn primary" id="check-btn">自检</button>
            <button class="btn ghost" id="clear-btn">清空</button>
            <span class="small muted" id="listening-stat">已自检 ${stat.plays} 次　${stat.best >= 100 ? '曾通过' : '尚未通过'}</span>
          </div>

          <div class="small" style="color:var(--bad)" id="listening-save-error" role="alert"></div>
          <div class="small muted">${syncHint}</div>
          <div id="listening-feedback" aria-live="polite">${feedbackHtml()}</div>
        </div>

        <div class="listen-right">
          <div class="vr-title">逐句解析</div>
          ${s.points.map((p) => `<div class="vr-item"><b>${esc(p.w)}</b>　<span>${esc(p.zh)}</span></div>`).join('')}
          <div class="vr-item"><b>语法</b>　<span>${esc(s.grammar)}</span></div>
          <div class="vr-item"><b>译文</b>　<span>${esc(s.zh)}</span></div>
        </div>
      </div>
    </div>
  `;

  qs('#level-filter').addEventListener('change', (e) => {
    level = e.target.value;
    if (!visible().some((s) => s.id === currentId)) {
      currentId = visible()[0].id;
      input = ''; inputRevision += 1; result = null; saveError = '';
      stopSpeech(); speechStatus = '';
    }
    paint();
  });
  qs('#toggle-hide').addEventListener('click', () => { hideText = !hideText; paint(); });
  qsa('[data-id]', rootEl).forEach((b) => b.addEventListener('click', () => {
    currentId = b.getAttribute('data-id');
    stopSpeech(); speechStatus = '';
    input = '';
    inputRevision += 1;
    result = null;
    saveError = '';
    paint();
  }));
  qs('#play-btn').addEventListener('click', () => play(rate));
  qs('#play-slow').addEventListener('click', () => play(0.6));
  qs('#rate').addEventListener('change', (e) => {
    const v = parseFloat(e.target.value);
    store.update((db) => { db.settings.ttsRate = v; return db; });
    paint();
  });
  const box = qs('#dictation');
  let composing = false;
  box.addEventListener('compositionstart', () => { composing = true; });
  box.addEventListener('compositionend', () => { composing = false; input = box.value; inputRevision += 1; result = null; refresh(); });
  box.addEventListener('input', () => { input = box.value; inputRevision += 1; result = null; refresh(); });
  box.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || composing || e.isComposing || e.keyCode === 229 || e.repeat) return;
    e.preventDefault();
    return check();
  });
  qs('#check-btn').addEventListener('click', () => { if (!composing) return check(); });
  qs('#clear-btn').addEventListener('click', () => {
    input = ''; box.value = ''; inputRevision += 1; result = null; saveError = ''; refresh();
  });
  refreshVoiceHint();
  refresh();
}

function play(rate) {
  const s = current();
  const r = speak(s.de, rate, (msg) => { if (active && currentId === s.id) setSpeechStatus(msg); });
  if (!r.ok) setSpeechStatus(r.msg);
}

async function check() {
  if (checking) return;
  checking = true;
  const s = current();
  const answer = input;
  const revision = inputRevision;
  const judged = judgeListening(s.de, answer);
  const mistake = !judged.passed && !judged.empty ? {
    source: 'listening',
    module: `听力精听（${s.level}）`,
    refId: s.id,
    stem: s.de,
    userAnswer: judged.userText,
    correctAnswer: s.de,
    explanation: `${s.grammar}　相似度为 ${Math.round(judged.score * 100)}%。`,
  } : null;
  refresh();
  try {
    const saved = await recordListening(s.id, judged.passed, mistake);
    if (active && currentId === s.id && inputRevision === revision) {
      result = saved ? judged : null;
      saveError = saved ? '' : '本次自检未保存，请检查浏览器存储权限或可用空间后重试。';
    }
  } catch (err) {
    if (active && currentId === s.id) saveError = '本次自检未保存，请重试。';
  } finally {
    checking = false;
    refresh();
  }
}

function mask(text) {
  return String(text).replace(/[^\s.,!?]/g, '●');
}

function renderWords(words, text) {
  if (!words) return esc(text);
  return words.map((w) => `<span class="w ${w.hit ? 'hit' : 'miss'}">${esc(w.word)}</span>`).join(' ');
}
