// 听力精听页：左侧原文、右侧竖排解析；逐句播放与逐句自检
import { LISTENING } from '../data/index.js';
import { store, recordListening, addMistake } from './state.js';
import { judgeListening, diffWords } from '../core/listening.js';
import { esc, qs, qsa, toast, speak, hasGermanVoice } from './util.js';

let rootEl = null;
let level = '全部';
let currentId = LISTENING[0].id;
let input = '';
let result = null;
let hideText = false;

export function render(root) {
  rootEl = root;
  if (!LISTENING.some((s) => s.id === currentId)) currentId = LISTENING[0].id;
  paint();
}

function current() {
  return LISTENING.find((s) => s.id === currentId) || LISTENING[0];
}

function visible() {
  return LISTENING.filter((s) => level === '全部' || s.level === level);
}

function paint() {
  const db = store.data;
  const s = current();
  const rate = db.settings.ttsRate || 0.9;
  const stat = db.listeningStats[s.id] || { plays: 0, best: 0 };
  const words = result ? diffWords(s.de, input) : null;

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>听力精听</h1>
      <p>共 ${LISTENING.length} 句（B1 / B2 分级）。流程：播放 → 听写 → 自检 → 对照竖排解析。${hasGermanVoice() ? '' : '（提示：若听不到德语语音，请在系统中安装德语语音包，或对照原文自行朗读练习。）'}</p>
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
          ${hideText ? '' : `<div class="small muted mt8">中文：${esc(s.zh)}</div>`}

          <div class="field mt16">
            <label>听写本句（不区分大小写与句末标点）</label>
            <input id="dictation" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px" placeholder="把你听到的句子写在这里" value="${esc(input)}">
          </div>
          <div class="row">
            <button class="btn primary" id="check-btn">自检</button>
            <button class="btn ghost" id="clear-btn">清空</button>
            <span class="small muted">已自检 ${stat.plays} 次　${stat.best >= 100 ? '曾通过' : '尚未通过'}</span>
          </div>

          ${result ? `
            <div class="feedback ${result.passed ? 'ok' : 'no'} mt16">
              <div class="title">${result.passed ? '通过：' : '未通过：'}${esc(result.label)}（相似度 ${Math.round(result.score * 100)}%）</div>
              <div class="explain">${esc(result.hint)}</div>
              ${words ? `<div class="listen-text mt8">${renderWords(words, s.de)}</div><div class="small muted">红色为未听出的词。</div>` : ''}
            </div>` : ''}
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

  qs('#level-filter').addEventListener('change', (e) => { level = e.target.value; paint(); });
  qs('#toggle-hide').addEventListener('click', () => { hideText = !hideText; paint(); });
  qsa('[data-id]', rootEl).forEach((b) => b.addEventListener('click', () => {
    currentId = b.getAttribute('data-id');
    input = '';
    result = null;
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
  box.addEventListener('input', () => { input = box.value; });
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  qs('#check-btn').addEventListener('click', () => check());
  qs('#clear-btn').addEventListener('click', () => { input = ''; result = null; paint(); });
}

function play(rate) {
  const s = current();
  const r = speak(s.de, rate);
  if (!r.ok) toast(r.msg);
}

function check() {
  const s = current();
  result = judgeListening(s.de, input);
  recordListening(s.id, result.passed);
  if (!result.passed && !result.empty) {
    addMistake({
      source: 'listening',
      module: `听力精听（${s.level}）`,
      refId: s.id,
      stem: s.de,
      userAnswer: result.userText,
      correctAnswer: s.de,
      explanation: `${s.grammar}　相似度为 ${Math.round(result.score * 100)}%。`,
    });
  }
  paint();
}

function mask(text) {
  return String(text).replace(/[^\s.,!?]/g, '●');
}

function renderWords(words, text) {
  if (!words) return esc(text);
  return words.map((w) => `<span class="w ${w.hit ? 'hit' : 'miss'}">${esc(w.word)}</span>`).join(' ');
}
