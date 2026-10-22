// 学习首页：真实进度、快捷入口、卡组与复习计划。
import { store, nowTs, allDecks, cardsOfDeck } from './state.js';
import { summarize, dueDistribution, deckOverview } from '../core/stats.js';
import { barChart } from './charts.js';
import { esc, fmtPercent, qsa } from './util.js';
import { icon } from './icons.js';
import { selectDeck } from './page_cards.js';

function bookIllustration() {
  return `<svg class="hero-art" viewBox="0 0 300 220" fill="none" aria-hidden="true">
    <circle cx="162" cy="110" r="88" fill="#e0ebe0"/>
    <circle cx="233" cy="54" r="14" fill="#e8c77c"/>
    <path d="M37 180h225" stroke="#aec7b9" stroke-width="2" stroke-linecap="round"/>
    <path d="M58 171c0-22-22-29-18-50 23 6 29 25 18 50Z" fill="#7da68b"/>
    <path d="M60 178c-2-32 23-37 24-58-24 3-31 29-24 58Z" fill="#47816a"/>
    <g transform="rotate(-12 167 121)"><rect x="102" y="57" width="104" height="122" rx="9" fill="#f7f4e9" stroke="#a6bcab" stroke-width="1.5"/><path d="M114 58v120" stroke="#d5dfd2" stroke-width="2"/></g>
    <g transform="rotate(8 177 120)"><rect x="127" y="64" width="102" height="117" rx="9" fill="#fffdf6" stroke="#a6bcab" stroke-width="1.5"/><rect x="143" y="80" width="33" height="19" rx="5" fill="#e9efdf"/><text x="150" y="94" fill="#547550" font-size="12" font-family="sans-serif">B2</text><text x="145" y="136" fill="#23664f" font-size="35" font-family="Georgia,serif">Aa</text><path d="M146 150h56m-56 8h36" stroke="#cad6c4" stroke-width="3" stroke-linecap="round"/></g>
    <path d="m92 51 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#6f9981"/>
    <circle cx="253" cy="145" r="4" fill="#80a58c"/><circle cx="59" cy="87" r="3" fill="#c4ab71"/>
  </svg>`;
}

export function render(root) {
  const db = store.data;
  const now = nowTs();
  const decks = allDecks();
  const overview = decks.map((deck) => ({ deck, ov: deckOverview(cardsOfDeck(deck.id), db.states, now) }));
  const sum = summarize(db.events, db.states, now);
  const due = dueDistribution(db.states, now, 7);
  const goal = db.settings.dailyGoal || 30;
  const goalRate = Math.min(1, sum.todayCount / goal);
  const percent = Math.round(goalRate * 100);
  const remaining = Math.max(0, goal - sum.todayCount);
  const offsetDays = Math.round((db.settings.timeOffsetMs || 0) / 86400000);
  const total = overview.reduce((a, r) => a + r.ov.total, 0);
  const date = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(now));

  root.innerHTML = `
    <div class="page-head home-head">
      <div><div class="eyebrow">一点积累，一点进步</div><h1>欢迎回到你的德语学习空间</h1><p>不用急，今天也按自己的节奏来。</p></div>
      <span class="date-chip">${esc(date)}${offsetDays ? ` · 已推进 ${offsetDays} 天` : ''}</span>
    </div>

    <div class="home-intro">
      <section class="study-hero">
        <div class="hero-copy"><span class="hero-label">今日学习计划</span><h2>${remaining ? '今天，从一点点开始。' : '今天的积累，已完成。'}</h2><p>${remaining ? '温习熟悉的单词，也给新知识一点空间。' : '目标达成了。休息一下，或再探索一点新知识。'}<br>每一小步，都算数。</p><a class="btn primary" href="#/cards">${sum.dueToday ? '开始今日复习' : '开始背卡'} ${icon('arrow')}</a></div>
        ${bookIllustration()}
      </section>
      <section class="panel goal-panel" aria-labelledby="goal-title">
        <div class="row between"><h2 id="goal-title">今日目标</h2><a href="#/data" class="text-link">调整目标</a></div>
        <div class="goal-body"><div class="goal-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="51"/><circle class="ring-fill" cx="60" cy="60" r="51" pathLength="100" stroke-dasharray="${percent} 100"/></svg><strong>${percent}<small>%</small></strong></div><div><div class="goal-count">${sum.todayCount}<span> / ${goal} 次</span></div><p>${remaining ? `再积累 ${remaining} 次<br>就能达成今日目标` : '今日目标已达成<br>给自己的坚持点个赞'}</p></div></div>
        <div class="goal-foot">${icon('check')} 背卡、语法与听力自检均计入</div>
      </section>
    </div>

    <div class="grid cols-4 home-stats">
      ${[
        ['cards', '待复习卡片', sum.dueToday, '张', `已在学 ${sum.learnedCards} 张`, 'green'],
        ['fire', '连续学习', sum.streak, '天', sum.streak ? '保持属于自己的节奏' : '从今天开始积累', 'amber'],
        ['target', '总正确率', sum.totalEvents ? fmtPercent(sum.accuracy) : '—', '', '包含背卡、语法与听力', 'purple'],
        ['stats', '累计学习', sum.totalEvents, '次', `${decks.length} 个卡组 · ${total} 张卡片`, 'blue'],
      ].map(([name, label, value, unit, sub, color]) => `<div class="stat"><div class="stat-heading"><span class="label">${label}</span><span class="stat-icon ${color}">${icon(name)}</span></div><div class="value">${value}<small>${unit}</small></div><div class="sub">${sub}</div></div>`).join('')}
    </div>

    <div class="section-heading"><h2>选择今天的练习</h2><span>小小练习，稳稳进步</span></div>
    <div class="grid cols-3 practice-grid">
      ${[
        ['cards', '单词背卡', '用间隔重复，让记忆更牢固', '开始背卡', 'green'],
        ['grammar', '语法练习', '在句子里，慢慢理清语法', '开始练习', 'purple'],
        ['listening', '听力精听', '逐句听写，听懂每一个细节', '开始精听', 'amber'],
      ].map(([key, title, desc, action, color]) => `<a class="practice-card" href="#/${key}"><span class="practice-icon ${color}">${icon(key)}</span><h3>${title}</h3><p>${desc}</p><span class="practice-action">${action} ${icon('arrow')}</span></a>`).join('')}
    </div>

    <div class="home-bottom">
      <section class="panel deck-panel"><div class="section-heading"><h2>我的单词卡组</h2><a class="text-link" href="#/data">管理卡组 ${icon('arrow')}</a></div><div class="deck-list">
        ${overview.map(({ deck, ov }) => {
          const learned = ov.total - ov.fresh;
          const rate = ov.total ? Math.round(learned / ov.total * 100) : 0;
          const levelClass = deck.level === 'B1' ? 'b1' : deck.level === 'B2' ? 'b2' : 'gray';
          return `<a class="deck-row" href="#/cards" data-deck="${esc(deck.id)}"><span class="deck-cover ${levelClass}">${esc(deck.level)}</span><div class="deck-detail"><div class="row between"><h3>${esc(deck.name)}</h3><span class="small muted">${ov.total} 词</span></div><div class="progress"><i style="width:${rate}%"></i></div><div class="row between deck-meta"><span>已学习 ${learned} · 未学 ${ov.fresh}</span><span>${ov.due} 张待复习</span></div></div>${icon('arrow', 'deck-arrow')}</a>`;
        }).join('')}
      </div></section>
      <section class="panel due-panel"><div class="section-heading"><h2>接下来 7 天</h2><span class="chart-key"><i></i> 到期卡片</span></div><div class="chart">${barChart(due.map((d) => ({ label: d.date, value: d.count })), { height: 240, unit: ' 张' })}</div><div class="legend">${due.some((d) => d.count) ? '按时温习，让记忆慢慢沉淀。逾期卡片计入今天。' : '完成背卡后，这里会显示你的复习计划。'}</div></section>
    </div>
    <footer class="home-footer">学习数据仅保存在当前浏览器中 <span>·</span> 记得定期在<a href="#/data">数据管理</a>中备份 <span>·</span> <a href="splash.html">开屏预览</a></footer>
  `;

  qsa('[data-deck]', root).forEach((link) => {
    link.addEventListener('click', () => {
      selectDeck(link.getAttribute('data-deck'));
    });
  });
}
