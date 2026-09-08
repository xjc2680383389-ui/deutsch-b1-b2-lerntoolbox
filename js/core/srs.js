// SRS 间隔重复调度：SM-2 简化实现（纯逻辑，时间由外部注入，测试可推进任意天数）
// 评分映射：0=不会(重来) 1=模糊(勉强想起) 2=会(轻松想起)

export const DAY_MS = 24 * 60 * 60 * 1000;
export const RETRY_MS = 10 * 60 * 1000; // 「不会」的卡片 10 分钟后回到本轮队列

export const RATING = { AGAIN: 0, FUZZY: 1, KNOWN: 2 };
export const RATING_LABEL = ['不会', '模糊', '会'];

export function createState(cardId) {
  return {
    id: cardId,
    ef: 2.5,        // 难易系数
    interval: 0,    // 当前间隔（天）
    reps: 0,        // 连续答对次数
    lapses: 0,      // 遗忘次数
    due: 0,         // 到期时间戳（毫秒）
    lastReviewed: 0,
    lastRating: -1,
    totalReviews: 0,
    history: [],    // {at, rating}
  };
}

function qualityOf(rating) {
  if (rating === RATING.AGAIN) return 0;
  if (rating === RATING.FUZZY) return 3;
  return 5;
}

// 纯函数：返回新的状态对象，不修改传入的 state
export function schedule(state, rating, now) {
  const s = state ? Object.assign({}, state) : createState('unknown');
  if (!Array.isArray(s.history)) s.history = [];
  const q = qualityOf(rating);
  let { ef, interval, reps, lapses } = s;

  if (q < 3) {
    reps = 0;
    lapses += 1;
    interval = 1;
    s.due = now + RETRY_MS;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = (q === 5 ? 6 : 3);
    else if (q === 5) interval = Math.max(1, Math.round(interval * ef));
    else interval = Math.max(1, Math.round(interval * 1.2)); // “模糊”只小幅推进
    s.due = now + interval * DAY_MS;
  }

  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;
  if (ef > 3.0) ef = 3.0;

  s.ef = Math.round(ef * 1000) / 1000;
  s.interval = interval;
  s.reps = reps;
  s.lapses = lapses;
  s.lastReviewed = now;
  s.lastRating = rating;
  s.totalReviews = (s.totalReviews || 0) + 1;
  s.history = s.history.concat([{ at: now, rating }]).slice(-30);
  return s;
}

// 预测某评分下的下次间隔天数（用于按钮上显示「1天 / 6天」）
export function previewInterval(state, rating) {
  const q = qualityOf(rating);
  if (q < 3) return 0; // 表示本轮稍后再来
  const s = state || createState('unknown');
  const reps = (s.reps || 0) + 1;
  if (reps === 1) return 1;
  if (reps === 2) return (q === 5 ? 6 : 3);
  if (q === 5) return Math.max(1, Math.round((s.interval || 1) * (s.ef || 2.5)));
  return Math.max(1, Math.round((s.interval || 1) * 1.2));
}

export function isDue(state, now) {
  if (!state) return true;
  return (state.due || 0) <= now;
}

// 从卡片状态表中取出到期卡片（按到期时间升序）
export function dueQueue(states, now) {
  const list = Object.keys(states || {}).map((k) => states[k]);
  return list.filter((s) => isDue(s, now)).sort((a, b) => (a.due || 0) - (b.due || 0));
}

// 学习队列：到期优先，不足时用未学习过的新卡补足
export function buildReviewQueue(allCards, states, now, limit) {
  const getState = (c) => states[c.id] || createState(c.id);
  const due = [];
  const fresh = [];
  const future = [];
  allCards.forEach((c) => {
    const st = getState(c);
    if (st.lastReviewed === 0) fresh.push(c);
    else if (isDue(st, now)) due.push(st);
    else future.push(st);
  });
  due.sort((a, b) => (a.due || 0) - (b.due || 0));
  future.sort((a, b) => (a.due || 0) - (b.due || 0));
  const byId = {};
  allCards.forEach((c) => { byId[c.id] = c; });
  const result = due.map((s) => byId[s.id]).filter(Boolean);
  result.push(...fresh);
  result.push(...future.map((s) => byId[s.id]).filter(Boolean));
  return typeof limit === 'number' && limit > 0 ? result.slice(0, limit) : result;
}
