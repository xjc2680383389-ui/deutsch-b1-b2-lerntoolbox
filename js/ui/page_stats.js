// 统计面板：每日学习量柱状图、正确率趋势折线图、未来 7 天到期分布
import { store, nowTs, allDecks, cardsOfDeck } from './state.js';
import { dailyVolume, dailyAccuracy, dueDistribution, summarize, deckOverview } from '../core/stats.js';
import { barChart, lineChart } from './charts.js';
import { esc, qs, qsa, fmtPercent } from './util.js';

let rootEl = null;
let days = 14;

export function render(root) {
  rootEl = root;
  paint();
}

function paint() {
  const db = store.data;
  const now = nowTs();
  const sum = summarize(db.events, db.states, now);
  const volume = dailyVolume(db.events, days, now);
  const accuracy = dailyAccuracy(db.events, days, now);
  const due = dueDistribution(db.states, now, 7);
  const decks = allDecks().map((d) => ({ deck: d, ov: deckOverview(cardsOfDeck(d.id), db.states, now) }));
  const answered = sum.totalEvents;

  rootEl.innerHTML = `
    <div class="page-head">
      <h1>学习统计</h1>
      <p>数据由学习记录实时聚合：每完成一次背卡评分、一道练习题或一次听力自检都会写入一条记录。</p>
    </div>

    <div class="grid cols-4 mb8">
      <div class="stat"><div class="label">累计学习</div><div class="value">${answered}</div><div class="sub">次</div></div>
      <div class="stat"><div class="label">今日学习</div><div class="value">${sum.todayCount}</div><div class="sub">目标 ${db.settings.dailyGoal} 次</div></div>
      <div class="stat"><div class="label">连续学习</div><div class="value">${sum.streak}</div><div class="sub">天</div></div>
      <div class="stat"><div class="label">总正确率</div><div class="value">${fmtPercent(sum.accuracy)}</div><div class="sub">包含背卡、语法练习和听力自检（按是否通过判定）</div></div>
    </div>

    <div class="panel">
      <div class="row between mb8">
        <h2 style="margin:0">每日学习量</h2>
        <div class="row">
          ${[7, 14, 30].map((d) => `<button class="btn small ${d === days ? 'primary' : ''}" data-days="${d}">近 ${d} 天</button>`).join('')}
        </div>
      </div>
      <div class="chart">${barChart(volume.map((v) => ({ label: v.date, value: v.count })), { height: 220, unit: ' 次' })}</div>
      <div class="legend">近 ${days} 天共 ${volume.reduce((a, b) => a + b.count, 0)} 次学习记录。</div>
    </div>

    <div class="grid cols-2">
      <div class="panel">
        <h2>正确率趋势</h2>
        <div class="chart">${lineChart(accuracy, { height: 200 })}</div>
        <div class="legend">无记录的日期不参与连线。</div>
      </div>
      <div class="panel">
        <h2>未来 7 天到期分布</h2>
        <div class="chart">${barChart(due.map((d) => ({ label: d.date, value: d.count })), { height: 200, color: '#b7791f', unit: ' 张' })}</div>
        <div class="legend">合计 ${due.reduce((a, b) => a + b.count, 0)} 张（含逾期）。</div>
      </div>
    </div>

    <div class="panel">
      <h2>卡组学习情况</h2>
      <table>
        <thead><tr><th>卡组</th><th>等级</th><th class="right">总词</th><th class="right">未学</th><th class="right">在学</th><th class="right">待复习</th></tr></thead>
        <tbody>
          ${decks.map((r) => `
            <tr>
              <td>${esc(r.deck.name)}</td>
              <td><span class="tag ${r.deck.level === 'B1' ? 'b1' : r.deck.level === 'B2' ? 'b2' : 'gray'}">${esc(r.deck.level)}</span></td>
              <td class="right">${r.ov.total}</td>
              <td class="right">${r.ov.fresh}</td>
              <td class="right">${r.ov.learning}</td>
              <td class="right">${r.ov.due}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="panel">
      <h2>最近学习记录</h2>
      ${db.events.length ? `
        <table>
          <thead><tr><th>时间</th><th>类型</th><th>内容</th><th>结果</th></tr></thead>
          <tbody>
            ${db.events.slice(-12).reverse().map((e) => `
              <tr>
                <td class="small">${esc(new Date(e.ts).toLocaleString('zh-CN'))}</td>
                <td>${esc(e.type === 'card' ? '背卡' : e.type === 'quiz' ? '语法练习' : '听力自检')}</td>
                <td>${esc(e.type === 'card' ? e.deck : e.type === 'quiz' ? e.topic : e.topic)}</td>
                <td>${e.correct ? '<span class="tag b1">正确</span>' : '<span class="tag" style="background:var(--bad-soft);color:var(--bad);border-color:#f0bdbb">错误</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>` : `<div class="empty">还没有学习记录。</div>`}
    </div>
  `;

  qsa('[data-days]', rootEl).forEach((b) => b.addEventListener('click', () => { days = parseInt(b.getAttribute('data-days'), 10); paint(); }));
}
