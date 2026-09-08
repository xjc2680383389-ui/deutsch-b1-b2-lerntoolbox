// 错题本页：筛选、重练、标记已掌握
import { store } from './state.js';
import { filterMistakes, moduleList, markMastered, markUnmastered, removeMistake, buildRetrySession, SOURCE_LABEL, statsOf } from '../core/mistakes.js';
import { esc, qs, qsa, toast, fmtDate } from './util.js';

let rootEl = null;
let filter = { source: '', module: '', mastered: '', keyword: '' };
let retry = null; // {items, idx, revealed}

export function render(root) {
  rootEl = root;
  paint();
}

function paint() {
  const db = store.data;
  const stats = statsOf(db.mistakes);
  const modules = moduleList(db.mistakes);
  const f = {
    source: filter.source || undefined,
    module: filter.module || undefined,
    keyword: filter.keyword || undefined,
  };
  if (filter.mastered === 'yes') f.mastered = true;
  if (filter.mastered === 'no') f.mastered = false;
  const list = filterMistakes(db.mistakes, f);

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>错题本</h1>
      <p>自动收集语法练习的错题、背卡评为「不会」的词条、听力自检未通过的句子。</p>
    </div>

    <div class="grid cols-4 mb8">
      <div class="stat"><div class="label">错题总数</div><div class="value">${stats.total}</div></div>
      <div class="stat"><div class="label">未掌握</div><div class="value">${stats.unmastered}</div></div>
      <div class="stat"><div class="label">已掌握</div><div class="value">${stats.mastered}</div></div>
      <div class="stat"><div class="label">当前筛选</div><div class="value">${list.length}</div></div>
    </div>

    <div class="panel">
      <div class="row">
        <div class="field" style="width:130px">
          <label>来源</label>
          <select id="f-source">
            <option value="">全部</option>
            <option value="quiz" ${filter.source === 'quiz' ? 'selected' : ''}>语法练习</option>
            <option value="card" ${filter.source === 'card' ? 'selected' : ''}>背卡</option>
            <option value="listening" ${filter.source === 'listening' ? 'selected' : ''}>听力精听</option>
          </select>
        </div>
        <div class="field" style="width:190px">
          <label>模块</label>
          <select id="f-module">
            <option value="">全部</option>
            ${modules.map((m) => `<option value="${esc(m)}" ${filter.module === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="width:130px">
          <label>状态</label>
          <select id="f-mastered">
            <option value="">全部</option>
            <option value="no" ${filter.mastered === 'no' ? 'selected' : ''}>未掌握</option>
            <option value="yes" ${filter.mastered === 'yes' ? 'selected' : ''}>已掌握</option>
          </select>
        </div>
        <div class="field" style="flex:1;min-width:160px">
          <label>关键词（题干或答案）</label>
          <input id="f-keyword" value="${esc(filter.keyword)}" placeholder="例如 wurde、Haus">
        </div>
      </div>
      <div class="row">
        <button class="btn primary" id="retry-btn">重练未掌握（${filterMistakes(db.mistakes, { mastered: false }).length}）</button>
        <button class="btn ghost" id="reset-filter">重置筛选</button>
        <span class="spacer"></span>
        <button class="btn danger small" id="clear-mastered">删除已掌握</button>
      </div>
    </div>

    ${retry ? paintRetry() : paintList(list)}
  `;

  qs('#f-source').addEventListener('change', (e) => { filter.source = e.target.value; paint(); });
  qs('#f-module').addEventListener('change', (e) => { filter.module = e.target.value; paint(); });
  qs('#f-mastered').addEventListener('change', (e) => { filter.mastered = e.target.value; paint(); });
  qs('#f-keyword').addEventListener('input', (e) => { filter.keyword = e.target.value; paint(); });
  qs('#reset-filter').addEventListener('click', () => { filter = { source: '', module: '', mastered: '', keyword: '' }; paint(); });
  qs('#retry-btn').addEventListener('click', () => {
    const items = buildRetrySession(store.data.mistakes, { seed: 'retry-' + Date.now() });
    if (!items.length) { toast('没有未掌握的错题'); return; }
    retry = { items, idx: 0, revealed: false };
    paint();
  });
  qs('#clear-mastered').addEventListener('click', () => {
    store.update((db) => { db.mistakes = db.mistakes.filter((m) => !m.mastered); return db; });
    toast('已删除标记为掌握的错题');
    paint();
  });

  if (!retry) {
    qsa('[data-master]', rootEl).forEach((b) => b.addEventListener('click', () => {
      store.update((db) => { db.mistakes = markMastered(db.mistakes, b.getAttribute('data-master'), Date.now()); return db; });
      paint();
    }));
    qsa('[data-unmaster]', rootEl).forEach((b) => b.addEventListener('click', () => {
      store.update((db) => { db.mistakes = markUnmastered(db.mistakes, b.getAttribute('data-unmaster')); return db; });
      paint();
    }));
    qsa('[data-del]', rootEl).forEach((b) => b.addEventListener('click', () => {
      store.update((db) => { db.mistakes = removeMistake(db.mistakes, b.getAttribute('data-del')); return db; });
      paint();
    }));
  } else {
    qs('#retry-reveal').addEventListener('click', () => { retry.revealed = true; paint(); });
    qs('#retry-ok').addEventListener('click', () => {
      const id = retry.items[retry.idx].id;
      store.update((db) => { db.mistakes = markMastered(db.mistakes, id, Date.now()); return db; });
      next();
    });
    qs('#retry-no').addEventListener('click', () => next());
    qs('#retry-quit').addEventListener('click', () => { retry = null; paint(); });
  }
}

function paintList(list) {
  if (!list.length) {
    return `<div class="panel"><div class="empty">暂无符合条件的错题。去做一组练习或背卡，错项会自动出现在这里。</div></div>`;
  }
  return list.map((m) => `
    <div class="mistake ${m.mastered ? 'mastered' : ''}">
      <div class="row between">
        <div class="stem">${esc(m.stem)}</div>
        <span class="small muted">${esc(SOURCE_LABEL[m.source] || m.source)}　${esc(m.module || '')}　${esc(fmtDate(m.ts))}${m.wrongCount > 1 ? `　错 ${m.wrongCount} 次` : ''}</span>
      </div>
      <div class="kv"><span class="k">你的答案</span><span class="ua">${esc(m.userAnswer || '（空）')}</span></div>
      <div class="kv"><span class="k">正确答案</span><span class="ca">${esc(m.correctAnswer)}</span></div>
      ${m.explanation ? `<div class="ex">${esc(m.explanation)}</div>` : ''}
      <div class="row mt8">
        ${m.mastered
          ? `<button class="btn small" data-unmaster="${esc(m.id)}">取消掌握</button><span class="tag b1">已掌握</span>`
          : `<button class="btn small primary" data-master="${esc(m.id)}">标记已掌握</button>`}
        <button class="btn small ghost" data-del="${esc(m.id)}">删除</button>
      </div>
    </div>`).join('');
}

function paintRetry() {
  const item = retry.items[retry.idx];
  return `
    <div class="panel">
      <div class="row between mb8">
        <h2 style="margin:0">错题重练</h2>
        <span class="small muted">第 ${retry.idx + 1} / ${retry.items.length} 题</span>
      </div>
      <div class="q-stem">${esc(item.stem)}</div>
      ${retry.revealed ? `
        <div class="feedback ok">
          <div class="title">正确答案：${esc(item.correctAnswer)}</div>
          <div class="explain">${esc(item.explanation || '（无解析）')}</div>
        </div>
        <div class="row mt8">
          <button class="btn primary" id="retry-ok">已经会了（标记掌握）</button>
          <button class="btn" id="retry-no">还要再练</button>
        </div>
      ` : `<button class="btn primary" id="retry-reveal">显示答案</button>`}
      <div class="row mt16"><button class="btn small ghost" id="retry-quit">退出重练</button></div>
    </div>`;
}

function next() {
  retry.idx += 1;
  retry.revealed = false;
  if (retry.idx >= retry.items.length) { retry = null; toast('本轮重练完成'); }
  paint();
}
