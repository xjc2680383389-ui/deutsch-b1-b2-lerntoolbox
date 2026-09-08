// 首页：今日概览、快捷入口、卡组概览、未来 7 天到期分布
import { store, nowTs, allDecks, cardsOfDeck } from './state.js';
import { summarize, dueDistribution, deckOverview } from '../core/stats.js';
import { barChart } from './charts.js';
import { esc, fmtPercent, qs, qsa } from './util.js';

export function render(root) {
  const db = store.data;
  const now = nowTs();
  const decks = allDecks();
  const overview = decks.map((d) => ({
    deck: d,
    ov: deckOverview(cardsOfDeck(d.id), db.states, now),
  }));
  const sum = summarize(db.events, db.states, now);
  const due = dueDistribution(db.states, now, 7);
  const goal = db.settings.dailyGoal || 30;
  const goalRate = Math.min(1, sum.todayCount / goal);
  const offsetDays = Math.round((db.settings.timeOffsetMs || 0) / 86400000);

  root.innerHTML = `
    <div class="page-head">
      <h1>今日概览</h1>
      <p>共 ${decks.length} 个卡组、${overview.reduce((a, r) => a + r.ov.total, 0)} 张卡片；数据全部保存在本机浏览器中。${offsetDays ? `（时间机器已推进 ${offsetDays} 天）` : ''}</p>
    </div>

    <div class="grid cols-4 mb8">
      <div class="stat"><div class="label">今日已学</div><div class="value">${sum.todayCount}</div><div class="sub">目标 ${goal} 次</div></div>
      <div class="stat"><div class="label">待复习卡片</div><div class="value">${sum.dueToday}</div><div class="sub">在学 ${sum.learnedCards} 张</div></div>
      <div class="stat"><div class="label">连续学习</div><div class="value">${sum.streak}</div><div class="sub">天</div></div>
      <div class="stat"><div class="label">总正确率</div><div class="value">${fmtPercent(sum.accuracy)}</div><div class="sub">累计 ${sum.totalEvents} 次</div></div>
    </div>

    <div class="panel">
      <div class="row between">
        <h2 style="margin:0">今日目标进度</h2>
        <span class="small muted">${sum.todayCount} / ${goal} 次</span>
      </div>
      <div class="progress mt8"><i style="width:${(goalRate * 100).toFixed(1)}%"></i></div>
    </div>

    <div class="panel">
      <h2>快捷开始</h2>
      <div class="row">
        <button class="btn primary" data-go="#/cards">开始背卡</button>
        <button class="btn" data-go="#/grammar">语法练习</button>
        <button class="btn" data-go="#/listening">听力精听</button>
        <button class="btn" data-go="#/mistakes">错题本</button>
        <button class="btn ghost" data-go="#/stats">学习统计</button>
      </div>
    </div>

    <div class="grid cols-2">
      <div class="panel">
        <h2>卡组概览</h2>
        <table>
          <thead><tr><th>卡组</th><th>等级</th><th class="right">总词</th><th class="right">未学</th><th class="right">待复习</th></tr></thead>
          <tbody>
            ${overview.map((r) => `
              <tr>
                <td>${esc(r.deck.name)}</td>
                <td><span class="tag ${r.deck.level === 'B1' ? 'b1' : r.deck.level === 'B2' ? 'b2' : 'gray'}">${esc(r.deck.level)}</span></td>
                <td class="right">${r.ov.total}</td>
                <td class="right">${r.ov.fresh}</td>
                <td class="right">${r.ov.due}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="panel">
        <h2>未来 7 天到期分布</h2>
        <div class="chart">${barChart(due.map((d) => ({ label: d.date, value: d.count })), { height: 200, unit: ' 张' })}</div>
        <div class="legend">逾期未复习的卡片统一计入第一天。</div>
      </div>
    </div>
  `;

  qsa('[data-go]', root).forEach((btn) => {
    btn.addEventListener('click', () => { location.hash = btn.getAttribute('data-go'); });
  });
}
