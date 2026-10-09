// 数据管理页：自建卡组与词条、学习目标、时间机器、导入导出、清空
import { store, nowTs, allDecks, cardsOfDeck, advanceDays } from './state.js';
import { esc, qs, qsa, toast } from './util.js';

let rootEl = null;
let activeDeck = '';
let draft = { term: '', pos: '', zh: '', example: '', exZh: '' };

export function render(root) {
  rootEl = root;
  if (!activeDeck) {
    const custom = store.data.userDecks[0];
    activeDeck = custom ? custom.id : '';
  }
  paint();
}

function paint() {
  const db = store.data;
  const decks = allDecks();
  const offsetDays = Math.round((db.settings.timeOffsetMs || 0) / 86400000);
  const cards = activeDeck ? cardsOfDeck(activeDeck) : [];

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>数据管理</h1>
      <p>全部数据保存在本机浏览器存储中（键名 dwt.db.v1），不上传任何服务器。</p>
    </div>

    <div class="grid cols-2">
      <div class="panel">
        <h2>学习目标与时间机器</h2>
        <div class="field">
          <label>每日学习目标（次）</label>
          <input id="goal" type="number" min="5" max="500" value="${db.settings.dailyGoal}">
        </div>
        <div class="row">
          <div class="field" style="width:140px">
            <label>时间机器：推进天数</label>
            <input id="adv-days" type="number" min="1" max="365" value="1">
          </div>
          <button class="btn primary" id="adv-btn" style="margin-top:18px">推进</button>
          <button class="btn ghost" id="adv-reset" style="margin-top:18px">归零</button>
        </div>
        <p class="small muted">当前时间偏移：<b>${offsetDays}</b> 天。推进后到期卡片会立即进入复习队列，可用于模拟跨天复习，无需真的等待。</p>
      </div>

      <div class="panel">
        <h2>自建卡组</h2>
        <div class="row">
          <div class="field" style="flex:1">
            <label>新卡组名称</label>
            <input id="new-deck-name" placeholder="例如：我的易错词">
          </div>
          <div class="field" style="width:120px">
            <label>等级</label>
            <select id="new-deck-level">
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="自定义">自定义</option>
            </select>
          </div>
          <button class="btn primary" id="add-deck" style="margin-top:18px">新建</button>
        </div>
        <div class="row">
          <select id="deck-picker" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;min-width:200px">
            <option value="">选择一个卡组</option>
            ${decks.filter((d) => d.custom).map((d) => `<option value="${esc(d.id)}" ${d.id === activeDeck ? 'selected' : ''}>${esc(d.name)}（${esc(d.level)}）</option>`).join('')}
          </select>
          <button class="btn danger small" id="del-deck" ${activeDeck ? '' : 'disabled'}>删除该卡组</button>
        </div>
      </div>
    </div>

    ${activeDeck ? `
      <div class="panel">
        <h2>添加词条到「${esc((decks.find((d) => d.id === activeDeck) || {}).name || '')}」</h2>
        <div class="grid cols-2">
          <div class="field"><label>单词</label><input id="d-term" value="${esc(draft.term)}" placeholder="例如：die Entscheidung"></div>
          <div class="field"><label>词性</label><input id="d-pos" value="${esc(draft.pos)}" placeholder="例如：名词·阴性（复 -en）"></div>
          <div class="field"><label>中文释义</label><input id="d-zh" value="${esc(draft.zh)}" placeholder="例如：决定"></div>
          <div class="field"><label>例句中文</label><input id="d-exzh" value="${esc(draft.exZh)}" placeholder="例如：这个决定是最终的。"></div>
        </div>
        <div class="field"><label>例句（德语）</label><input id="d-ex" value="${esc(draft.example)}" placeholder="例如：Die Entscheidung ist endgültig."></div>
        <div class="row">
          <button class="btn primary" id="add-card">添加词条</button>
          <span class="small muted">当前卡组共 ${cards.length} 个词条</span>
        </div>
      </div>

      <div class="panel">
        <h2>词条列表（${cards.length}）</h2>
        ${cards.length ? `<table>
          <thead><tr><th>单词</th><th>词性</th><th>释义</th><th>例句</th><th class="right">操作</th></tr></thead>
          <tbody>
            ${cards.map((c) => `
              <tr>
                <td>${esc(c.term)}</td>
                <td class="small">${esc(c.pos)}</td>
                <td>${esc(c.zh)}</td>
                <td class="small">${esc(c.example)}</td>
                <td class="right"><button class="btn small danger" data-delcard="${esc(c.id)}">删除</button></td>
              </tr>`).join('')}
          </tbody>
        </table>` : `<div class="empty">该卡组还没有词条。</div>`}
      </div>
    ` : `<div class="panel"><div class="empty">请先新建一个自建卡组，然后向其中添加词条。</div></div>`}

    <div class="panel">
      <h2>备份与恢复</h2>
      <div class="row mb8">
        <button class="btn" id="export-btn">导出备份文本</button>
        <button class="btn" id="copy-btn">复制到剪贴板</button>
        <button class="btn primary" id="import-btn">导入备份文本</button>
        <button class="btn danger" id="wipe-btn">清空全部数据</button>
      </div>
      <textarea id="json-box" class="mono" placeholder="点击「导出备份文本」后内容会出现在这里；粘贴备份内容后点击「导入备份文本」即可恢复。"></textarea>
      <p class="small muted">当前记录：学习事件 ${db.events.length} 条 · 错题 ${db.mistakes.length} 条 · 卡片状态 ${Object.keys(db.states).length} 个 · 自建词条 ${Object.keys(db.customCards).length} 个。</p>
    </div>
  `;

  qs('#goal').addEventListener('change', (e) => {
    const v = parseInt(e.target.value, 10);
    store.update((db) => { db.settings.dailyGoal = Number.isFinite(v) && v > 0 ? v : 30; return db; });
    toast('每日目标已保存');
  });
  qs('#adv-btn').addEventListener('click', () => {
    const v = parseInt(qs('#adv-days').value, 10);
    if (!Number.isFinite(v) || v <= 0) { toast('请输入正整数天数'); return; }
    advanceDays(v);
    toast(`时间已推进 ${v} 天`);
    paint();
  });
  qs('#adv-reset').addEventListener('click', () => {
    store.update((db) => { db.settings.timeOffsetMs = 0; return db; });
    toast('时间偏移已归零');
    paint();
  });
  qs('#add-deck').addEventListener('click', () => {
    const name = qs('#new-deck-name').value.trim();
    if (!name) { toast('请填写卡组名称'); return; }
    const level = qs('#new-deck-level').value;
    const id = 'u' + Date.now().toString(36);
    store.update((db) => { db.userDecks.push({ id, name, level }); return db; });
    activeDeck = id;
    toast('卡组已创建');
    paint();
  });
  qs('#deck-picker').addEventListener('change', (e) => { activeDeck = e.target.value; paint(); });
  qs('#del-deck').addEventListener('click', () => {
    if (!activeDeck) return;
    store.update((db) => {
      db.userDecks = db.userDecks.filter((d) => d.id !== activeDeck);
      Object.keys(db.customCards).forEach((k) => { if (db.customCards[k].deckId === activeDeck) delete db.customCards[k]; });
      Object.keys(db.states).forEach((k) => { if (k.indexOf(activeDeck + ':') === 0) delete db.states[k]; });
      return db;
    });
    activeDeck = '';
    toast('卡组已删除');
    paint();
  });
  const addCard = qs('#add-card');
  if (addCard) {
    addCard.addEventListener('click', () => {
      draft = {
        term: qs('#d-term').value.trim(),
        pos: qs('#d-pos').value.trim(),
        zh: qs('#d-zh').value.trim(),
        example: qs('#d-ex').value.trim(),
        exZh: qs('#d-exzh').value.trim(),
      };
      if (!draft.term || !draft.zh) { toast('至少填写单词与中文释义'); return; }
      const id = activeDeck + ':' + draft.term;
      store.update((db) => {
        db.customCards[id] = {
          id, deckId: activeDeck,
          term: draft.term, pos: draft.pos || '自定义', zh: draft.zh,
          example: draft.example, exZh: draft.exZh, level: (db.userDecks.find((d) => d.id === activeDeck) || {}).level || '自定义',
        };
        return db;
      });
      draft = { term: '', pos: '', zh: '', example: '', exZh: '' };
      toast('词条已添加');
      paint();
    });
  }
  qsa('[data-delcard]', rootEl).forEach((b) => b.addEventListener('click', () => {
    const id = b.getAttribute('data-delcard');
    store.update((db) => { delete db.customCards[id]; delete db.states[id]; return db; });
    paint();
  }));
  qs('#export-btn').addEventListener('click', () => {
    qs('#json-box').value = store.exportJson();
    toast('已导出到下方文本框');
  });
  qs('#copy-btn').addEventListener('click', async () => {
    const box = qs('#json-box');
    if (!box.value) box.value = store.exportJson();
    try {
      await navigator.clipboard.writeText(box.value);
      toast('已复制到剪贴板');
    } catch (err) {
      box.select();
      toast('请按 Ctrl+C 复制');
    }
  });
  qs('#import-btn').addEventListener('click', () => {
    const text = qs('#json-box').value.trim();
    if (!text) { toast('请先粘贴备份内容'); return; }
    const r = store.importJson(text);
    if (r.ok) { toast('导入成功'); paint(); }
    else toast('导入失败：' + r.error);
  });
  qs('#wipe-btn').addEventListener('click', () => {
    if (!window.confirm('确定要清空全部学习数据吗？该操作不可撤销，建议先导出备份。')) return;
    store.reset();
    if (!store.lastSaveOk) return;
    activeDeck = '';
    toast('数据已清空');
    paint();
  });
}
