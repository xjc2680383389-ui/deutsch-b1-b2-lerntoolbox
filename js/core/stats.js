// 学习统计聚合（纯逻辑，无 DOM 依赖；时间一律外部注入）
import { DAY_MS } from './srs.js';

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(ts) {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function addDays(ts, n) {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function dayKey(ts) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shortKey(ts) {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayRange(days, now) {
  const base = startOfDay(now);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = addDays(base, -i);
    out.push({ ts, key: dayKey(ts), label: shortKey(ts), start: ts, end: endOfDay(ts) });
  }
  return out;
}

// 每日学习量：统计每天产生的学习事件条数（背卡评分+语法练习+听力自检提交，不含播放）
export function dailyVolume(events, days, now) {
  const range = dayRange(days, now);
  const buckets = {};
  range.forEach((d) => { buckets[d.key] = 0; });
  (events || []).forEach((e) => {
    const k = dayKey(e.ts);
    if (buckets[k] != null) buckets[k] += 1;
  });
  return range.map((d) => ({ date: d.label, key: d.key, count: buckets[d.key] }));
}

// 每日正确率：当天有记录才有值（null 表示无数据，折线图断线处理）
export function dailyAccuracy(events, days, now) {
  const range = dayRange(days, now);
  const agg = {};
  range.forEach((d) => { agg[d.key] = { total: 0, correct: 0 }; });
  (events || []).forEach((e) => {
    const k = dayKey(e.ts);
    if (!agg[k]) return;
    agg[k].total += 1;
    if (e.correct) agg[k].correct += 1;
  });
  return range.map((d) => {
    const a = agg[d.key];
    return {
      date: d.label,
      key: d.key,
      total: a.total,
      correct: a.correct,
      rate: a.total ? a.correct / a.total : null,
    };
  });
}

// 未来 N 天到期分布：逾期卡片统一计入「今天」
export function dueDistribution(states, now, days) {
  const n = days || 7;
  const range = dayRange(n, now);
  const out = range.map((d) => ({ date: d.label, key: d.key, count: 0 }));
  const todayStart = startOfDay(now);
  Object.keys(states || {}).forEach((id) => {
    const s = states[id];
    if (!s || s.memoryTargetReached) return;
    const due = s.due || 0;
    if (due <= now) { out[0].count += 1; return; }
    const idx = Math.floor((startOfDay(due) - todayStart) / DAY_MS);
    if (idx >= 0 && idx < n) out[idx].count += 1;
  });
  return out;
}

// 连续学习天数（今天往前推）
export function streakDays(events, now) {
  const set = {};
  (events || []).forEach((e) => { set[dayKey(e.ts)] = true; });
  let streak = 0;
  let cursor = startOfDay(now);
  if (!set[dayKey(cursor)]) cursor = addDays(cursor, -1); // 今天还没学，从昨天算起
  while (set[dayKey(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function summarize(events, states, now) {
  const evs = events || [];
  const today = dayKey(now);
  let todayCount = 0;
  let correct = 0;
  let cardReviews = 0;
  let quizAnswers = 0;
  evs.forEach((e) => {
    if (dayKey(e.ts) === today) todayCount += 1;
    if (e.correct) correct += 1;
    if (e.type === 'card') cardReviews += 1;
    if (e.type === 'quiz') quizAnswers += 1;
  });
  let dueToday = 0;
  let totalCards = 0;
  Object.keys(states || {}).forEach((id) => {
    const s = states[id];
    if (!s) return;
    totalCards += 1;
    if (!s.memoryTargetReached && (s.due || 0) <= now) dueToday += 1;
  });
  return {
    totalEvents: evs.length,
    todayCount,
    correct,
    accuracy: evs.length ? correct / evs.length : 0,
    cardReviews,
    quizAnswers,
    dueToday,
    learnedCards: totalCards,
    streak: streakDays(evs, now),
  };
}

// 卡组维度概览（首页用）
export function deckOverview(cards, states, now) {
  let learning = 0;
  let due = 0;
  let fresh = 0;
  (cards || []).forEach((c) => {
    const s = states[c.id];
    if (!s || !s.lastReviewed) fresh += 1;
    else {
      learning += 1;
      if (!s.memoryTargetReached && (s.due || 0) <= now) due += 1;
    }
  });
  return { total: (cards || []).length, fresh, learning, due };
}
