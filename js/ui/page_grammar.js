// 语法练习页：专题列表 → 逐题作答 → 即时判分与解析 → 结束报告
import { store, recordQuiz, addMistake } from './state.js';
import { TOPICS } from '../data/index.js';
import { buildSession, judgeMc, judgeFill, TYPE_FILL } from '../core/quiz.js';
import { esc, qs, qsa, toast, fmtPercent } from './util.js';

let rootEl = null;
let session = null; // {topic, items, idx, answer, result, correct, wrong}

export function render(root) {
  rootEl = root;
  // 演示模式（?demo=1）下直接进入首个专题，便于冒烟与截图
  if (!session && location.search.indexOf('demo=1') >= 0) {
    start(TOPICS[0].id);
    return;
  }
  paint();
}

function paint() {
  if (!session) paintList();
  else paintSession();
}

function paintList() {
  const db = store.data;
  rootEl.innerHTML = `
    <div class="page-head">
      <h1>语法专题练习</h1>
      <p>共 ${TOPICS.length} 个专题，每个专题 21 题（四选一与填空混合），提交后立即判分并给出解析。</p>
    </div>
    <div class="grid cols-3">
      ${TOPICS.map((t) => {
        const st = db.quizStats[t.id] || { attempts: 0, correct: 0 };
        return `
          <div class="topic-card">
            <div class="row between">
              <strong>${esc(t.name)}</strong>
              <span class="tag ${t.level === 'B1' ? 'b1' : 'b2'}">${esc(t.level)}</span>
            </div>
            <div class="small muted">${esc(t.summary)}</div>
            <div class="meta">${t.questions.length} 题　已答 ${st.attempts} 次　正确率 ${st.attempts ? fmtPercent(st.correct / st.attempts) : '—'}</div>
            <button class="btn small primary" data-topic="${esc(t.id)}">开始练习</button>
          </div>`;
      }).join('')}
    </div>`;
  qsa('[data-topic]', rootEl).forEach((b) => b.addEventListener('click', () => start(b.getAttribute('data-topic'))));
}

function start(topicId) {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return;
  const items = buildSession(topic.questions, { seed: topic.id + '-' + Date.now(), count: 20 });
  session = { topic, items, idx: 0, answer: null, result: null, correct: 0, wrong: 0 };
  paint();
}

function paintSession() {
  const s = session;
  if (s.idx >= s.items.length) { paintReport(); return; }
  const item = s.items[s.idx];
  const q = item.raw;
  const isFill = item.type === TYPE_FILL;

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>${esc(s.topic.name)}</h1>
      <p>第 ${s.idx + 1} / ${s.items.length} 题　已答 ${s.correct + s.wrong} 题　正确 ${s.correct} 题</p>
    </div>
    <div class="progress mb8"><i style="width:${((s.idx / s.items.length) * 100).toFixed(1)}%"></i></div>
    <div class="panel">
      <div class="row between mb8">
        <span class="tag ${isFill ? 'gray' : 'b1'}">${isFill ? '填空' : '四选一'}</span>
        <span class="small muted">${esc(s.topic.level)}　${esc(s.topic.name)}</span>
      </div>
      <div class="q-stem">${esc(item.stem)}</div>
      ${isFill ? `
        <input id="fill-input" class="mono" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px" placeholder="请填入答案（不区分大小写与句末标点）" value="${esc(s.answer == null ? '' : s.answer)}" ${s.result ? 'disabled' : ''}>
        <div class="row mt8"><button class="btn primary" id="submit-btn" ${s.result ? 'disabled' : ''}>提交答案</button></div>
      ` : `
        <div id="options">
          ${item.options.map((opt, i) => {
            let cls = 'opt';
            if (s.result) {
              if (i === item.answerIndex) cls += ' correct';
              else if (i === s.answer) cls += ' wrong';
            }
            return `<button class="${cls}" data-opt="${i}" ${s.result ? 'disabled' : ''}>${String.fromCharCode(65 + i)}. ${esc(opt)}</button>`;
          }).join('')}
        </div>
      `}
      ${s.result ? `
        <div class="feedback ${s.result.correct ? 'ok' : 'no'}">
          <div class="title">${s.result.correct ? '回答正确' : '回答错误'}</div>
          ${s.result.correct ? '' : `<div>你的答案：${esc(s.result.userAnswer || '（空）')}</div><div>正确答案：${esc(s.result.correctAnswer)}</div>`}
          <div class="explain">解析：${esc(s.result.explanation)}</div>
        </div>
        <div class="row mt8"><button class="btn primary" id="next-btn">${s.idx + 1 >= s.items.length ? '查看报告' : '下一题'}</button></div>
      ` : ''}
    </div>
    <div class="row"><button class="btn small ghost" id="quit-btn">退出练习</button></div>
  `;

  if (isFill) {
    const input = qs('#fill-input');
    if (!s.result) {
      input.focus();
      const submit = () => {
        const v = input.value;
        if (!String(v).trim()) { toast('请先填写答案'); return; }
        grade(v);
      };
      qs('#submit-btn').addEventListener('click', submit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    }
  } else if (!s.result) {
    qsa('[data-opt]').forEach((b) => b.addEventListener('click', () => grade(parseInt(b.getAttribute('data-opt'), 10))));
  }

  if (s.result) qs('#next-btn').addEventListener('click', () => { s.idx += 1; s.answer = null; s.result = null; paint(); });
  qs('#quit-btn').addEventListener('click', () => { session = null; paint(); });
}

function grade(answer) {
  const s = session;
  const item = s.items[s.idx];
  s.answer = answer;
  const result = item.type === TYPE_FILL
    ? judgeFill(item.raw, answer)
    : judgeMc({ options: item.options, answer: item.answerIndex, explain: item.raw.explain }, answer);
  s.result = result;
  if (result.correct) s.correct += 1; else s.wrong += 1;
  recordQuiz(s.topic.id, item.type, result.correct);
  if (!result.correct) {
    addMistake({
      source: 'quiz',
      module: s.topic.name,
      topicId: s.topic.id,
      refId: item.id,
      stem: item.stem,
      userAnswer: result.userAnswer,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
    });
  }
  paint();
}

function paintReport() {
  const s = session;
  const total = s.items.length;
  rootEl.innerHTML = `
    <div class="page-head"><h1>${esc(s.topic.name)} · 练习报告</h1></div>
    <div class="panel center">
      <div class="grid cols-3">
        <div class="stat"><div class="label">答题数</div><div class="value">${total}</div></div>
        <div class="stat"><div class="label">答对</div><div class="value">${s.correct}</div></div>
        <div class="stat"><div class="label">正确率</div><div class="value">${fmtPercent(total ? s.correct / total : 0)}</div></div>
      </div>
      <p class="muted small mt8">错题已自动进入错题本，可在「错题本」中重练。</p>
      <div class="row center mt16" style="justify-content:center">
        <button class="btn primary" id="retry-btn">再练一次</button>
        <button class="btn" data-go="#/mistakes">查看错题本</button>
        <button class="btn ghost" data-go="#/grammar">返回专题</button>
      </div>
    </div>`;
  qs('#retry-btn').addEventListener('click', () => start(s.topic.id));
  qsa('[data-go]', rootEl).forEach((b) => b.addEventListener('click', () => { location.hash = b.getAttribute('data-go'); }));
}
