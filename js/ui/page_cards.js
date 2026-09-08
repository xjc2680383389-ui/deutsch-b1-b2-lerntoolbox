// 背卡页：间隔重复复习，支持翻面、三档评分、跨天复习（配合时间机器）
import { store, nowTs, allDecks, cardsOfDeck, deckName, recordCardReview, addMistake } from './state.js';
import { createState, schedule, buildReviewQueue, previewInterval, RATING, RATING_LABEL } from '../core/srs.js';
import { deckOverview } from '../core/stats.js';
import { esc, qs, qsa, toast } from './util.js';

let rootEl = null;
let session = null; // {deckId, queue, idx, flipped, planned, done, againCount}
let limit = 20;
let finished = null; // 本轮结束汇总

export function render(root) {
  rootEl = root;
  // 演示模式（?demo=1）下直接进入一轮复习，便于冒烟与截图
  if (!session && !finished && location.search.indexOf('demo=1') >= 0) {
    start(store.data.settings.lastDeckId || 'b1');
    return;
  }
  paint();
}

function paint() {
  const decks = allDecks();
  const db = store.data;
  const deckId = session ? session.deckId : (db.settings.lastDeckId || 'b1');
  const cards = cardsOfDeck(deckId);
  const ov = deckOverview(cards, db.states, nowTs());

  if (finished) {
    rootEl.innerHTML = `
      <div class="page-head"><h1>背卡</h1><p>本轮已完成</p></div>
      <div class="panel center">
        <div class="grid cols-3">
          <div class="stat"><div class="label">本轮卡片</div><div class="value">${finished.total}</div></div>
          <div class="stat"><div class="label">评为“会”</div><div class="value">${finished.known}</div></div>
          <div class="stat"><div class="label">评为“不会”</div><div class="value">${finished.again}</div></div>
        </div>
        <p class="muted small mt8">评为“不会”的词条已自动进入错题本。</p>
        <div class="row center mt16" style="justify-content:center">
          <button class="btn primary" id="again-round">再来一轮</button>
          <button class="btn" data-go="#/mistakes">查看错题本</button>
          <button class="btn ghost" data-go="#/stats">学习统计</button>
        </div>
      </div>`;
    qs('#again-round').addEventListener('click', () => { finished = null; start(deckId); });
    qsa('[data-go]', rootEl).forEach((b) => b.addEventListener('click', () => { location.hash = b.getAttribute('data-go'); }));
    return;
  }

  if (!session) {
    rootEl.innerHTML = `
      <div class="page-head"><h1>背卡</h1><p>按间隔重复算法安排复习顺序：到期卡片优先，其次新卡。</p></div>
      <div class="panel">
        <div class="row">
          <div class="field" style="min-width:220px;flex:1">
            <label>选择卡组</label>
            <select id="deck-select">
              ${decks.map((d) => `<option value="${esc(d.id)}" ${d.id === deckId ? 'selected' : ''}>${esc(d.name)}（${esc(d.level)}，${cardsOfDeck(d.id).length} 词）</option>`).join('')}
            </select>
          </div>
          <div class="field" style="width:160px">
            <label>本轮上限</label>
            <input id="limit-input" type="number" min="5" max="100" value="${limit}">
          </div>
        </div>
        <div class="grid cols-3 mt8">
          <div class="stat"><div class="label">未学</div><div class="value">${ov.fresh}</div></div>
          <div class="stat"><div class="label">在学</div><div class="value">${ov.learning}</div></div>
          <div class="stat"><div class="label">待复习</div><div class="value">${ov.due}</div></div>
        </div>
        <div class="row mt16">
          <button class="btn primary" id="start-btn" ${ov.total === 0 ? 'disabled' : ''}>开始本轮复习</button>
          <span class="muted small">${ov.total === 0 ? '该卡组还没有词条，可在「数据管理」中新建卡组并添加词条。' : ''}</span>
        </div>
      </div>`;
    const sel = qs('#deck-select');
    const lim = qs('#limit-input');
    sel.addEventListener('change', () => {
      store.update((db) => { db.settings.lastDeckId = sel.value; return db; });
      paint();
    });
    lim.addEventListener('change', () => {
      const v = parseInt(lim.value, 10);
      limit = Number.isFinite(v) && v > 0 ? Math.min(100, v) : 20;
    });
    qs('#start-btn').addEventListener('click', () => start(db.settings.lastDeckId || 'b1'));
    return;
  }

  const card = session.queue[session.idx];
  const dbNow = store.data;
  const st = dbNow.states[card.id] || createState(card.id);
  const progress = Math.min(1, session.done / Math.max(1, session.planned));

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>背卡 · ${esc(deckName(session.deckId))}</h1>
      <p>进度 ${session.done} / ${session.planned}　剩余 ${Math.max(0, session.planned - session.done)} 张</p>
    </div>
    <div class="progress mb8"><i style="width:${(progress * 100).toFixed(1)}%"></i></div>
    <div class="card-box">
      <div class="card-term">${esc(card.term)}</div>
      <div class="card-pos">${esc(card.pos)}　<span class="tag ${card.level === 'B1' ? 'b1' : card.level === 'B2' ? 'b2' : 'gray'}">${esc(card.level)}</span></div>
      ${session.flipped ? `
        <div class="card-zh">${esc(card.zh)}</div>
        <div class="card-ex">${esc(card.example)}<div class="zh">${esc(card.exZh)}</div></div>
      ` : `<div class="muted mt16">想一想词义与用法，然后翻面对照。</div>`}
    </div>
    <div class="row center mt16" style="justify-content:center">
      ${session.flipped ? `
        <button class="btn danger rate-btn" data-rate="0">不会<span class="hint">本轮再来</span></button>
        <button class="btn rate-btn" data-rate="1">模糊<span class="hint">${previewInterval(st, RATING.FUZZY)} 天后再来</span></button>
        <button class="btn primary rate-btn" data-rate="2">会<span class="hint">${previewInterval(st, RATING.KNOWN)} 天后再来</span></button>
      ` : `<button class="btn primary" id="flip-btn">翻面（空格键）</button>`}
    </div>
    <div class="row center mt16" style="justify-content:center">
      <span class="muted small">已复习 ${st.totalReviews || 0} 次　连续答对 ${st.reps || 0} 次　遗忘 ${st.lapses || 0} 次</span>
      <button class="btn small ghost" id="end-btn">结束本轮</button>
    </div>
  `;

  if (!session.flipped) {
    qs('#flip-btn').addEventListener('click', () => { session.flipped = true; paint(); });
  } else {
    qsa('[data-rate]', rootEl).forEach((b) => b.addEventListener('click', () => rate(parseInt(b.getAttribute('data-rate'), 10))));
  }
  qs('#end-btn').addEventListener('click', () => {
    finished = { total: session.planned, known: session.known || 0, again: session.againCount };
    session = null;
    paint();
  });
}

function start(deckId) {
  const cards = cardsOfDeck(deckId);
  if (!cards.length) { toast('该卡组暂无词条'); return; }
  const now = nowTs();
  const queue = buildReviewQueue(cards, store.data.states, now, limit).map((c) => c);
  session = {
    deckId,
    queue,
    idx: 0,
    flipped: location.search.indexOf('flip=1') >= 0, // 演示截图用：直接展示背面
    planned: Math.min(limit, queue.length),
    done: 0,
    known: 0,
    againCount: 0,
  };
  finished = null;
  store.update((db) => { db.settings.lastDeckId = deckId; return db; });
  paint();
}

function rate(rating) {
  const card = session.queue[session.idx];
  if (!card) { finishRound(); return; }
  const now = nowTs();
  const st = store.data.states[card.id] || createState(card.id);
  const next = schedule(st, rating, now);
  store.update((db) => { db.states[card.id] = next; return db; });
  recordCardReview(card, rating, rating > 0);

  if (rating === RATING.AGAIN) {
    session.againCount += 1;
    addMistake({
      source: 'card',
      module: deckName(card.deckId),
      refId: card.id,
      stem: `${card.term}（${card.pos}）`,
      userAnswer: '不会（没想起来）',
      correctAnswer: card.zh,
      explanation: `${card.example} —— ${card.exZh}`,
    });
    // 本轮稍后再来：插到后面第 4 个位置
    session.queue.splice(session.idx, 1);
    const pos = Math.min(session.idx + 4, session.queue.length);
    session.queue.splice(pos, 0, card);
  } else {
    if (rating === RATING.KNOWN) session.known += 1;
    session.done += 1;
    session.idx += 1;
  }

  session.flipped = false;
  if (session.done >= session.planned || session.idx >= session.queue.length) {
    finishRound();
    return;
  }
  paint();
}

function finishRound() {
  finished = { total: session.planned, known: session.known || 0, again: session.againCount };
  session = null;
  paint();
}

// 空格键翻面
document.addEventListener('keydown', (e) => {
  if (location.hash.indexOf('#/cards') !== 0) return;
  if (!session || session.flipped) return;
  if (e.code === 'Space') {
    const active = document.activeElement;
    if (active && /input|textarea|select/i.test(active.tagName)) return;
    e.preventDefault();
    session.flipped = true;
    paint();
  }
});
