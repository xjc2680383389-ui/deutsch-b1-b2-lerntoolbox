// stats 模块自检（时间全部注入，不依赖系统当前时间）
import {
  dayKey, addDays, startOfDay, dailyVolume, dailyAccuracy,
  dueDistribution, streakDays, summarize, deckOverview,
} from '../core/stats.js';
import { createState, schedule, DAY_MS, RATING } from '../core/srs.js';
import { t, assert, eq, near } from './harness.js';

const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime(); // 2026-01-10 12:00

function ev(dayOffset, correct, type) {
  return { ts: T0 + dayOffset * DAY_MS, type: type || 'card', correct: !!correct };
}

export const title = '学习统计聚合';
export const results = [
  t('dayKey 与 addDays 跨月正确', () => {
    eq(dayKey(T0), '2026-01-10', '日期键');
    eq(dayKey(addDays(T0, 25)), '2026-02-04', '跨月推进');
    eq(startOfDay(T0), new Date(2026, 0, 10, 0, 0, 0).getTime(), '当日零点');
  }),
  t('每日学习量按天聚合', () => {
    const events = [ev(0, true), ev(0, false), ev(0, true), ev(-1, true)];
    const v = dailyVolume(events, 7, T0);
    eq(v.length, 7, '返回天数');
    eq(v[6].count, 3, '今天的学习量');
    eq(v[5].count, 1, '昨天的学习量');
    eq(v[0].count, 0, '无记录当天为 0');
  }),
  t('窗口外的事件不计入', () => {
    const v = dailyVolume([ev(-30, true)], 7, T0);
    eq(v.reduce((a, b) => a + b.count, 0), 0, '窗口外事件被计入');
  }),
  t('每日正确率计算正确', () => {
    const events = [ev(0, true), ev(0, false), ev(-1, true), ev(-1, true)];
    const a = dailyAccuracy(events, 3, T0);
    eq(a[2].total, 2, '今天答题数');
    near(a[2].rate, 0.5, 1e-9, '今天正确率');
    near(a[1].rate, 1, 1e-9, '昨天正确率');
    eq(a[0].rate, null, '无数据当天应为 null');
  }),
  t('背卡、语法和听力自检共同计入学习量与正确率', () => {
    const events = [ev(0, true, 'card'), ev(0, true, 'quiz'), ev(0, false, 'listening')];
    const volume = dailyVolume(events, 1, T0)[0];
    const accuracy = dailyAccuracy(events, 1, T0)[0];
    const sum = summarize(events, {}, T0);
    eq(volume.count, 3, '学习量应包含听力自检');
    eq(accuracy.total, 3, '每日正确率分母应包含听力自检');
    near(accuracy.rate, 2 / 3, 1e-9, '每日正确率');
    eq(sum.totalEvents, 3, '累计量');
    eq(sum.todayCount, 3, '今日量');
    eq(sum.streak, 1, '连续学习天数');
    eq(sum.cardReviews, 1, '背卡次数');
    eq(sum.quizAnswers, 1, '语法题数');
    near(sum.accuracy, 2 / 3, 1e-9, '总正确率');
  }),
  t('未来 7 天到期分布：逾期计入今天', () => {
    const states = {
      a: { id: 'a', due: T0 - 3 * DAY_MS },   // 逾期
      b: { id: 'b', due: T0 + 3600000 },       // 今天晚些时候
      c: { id: 'c', due: T0 + 2 * DAY_MS },    // 后天
      d: { id: 'd', due: T0 + 20 * DAY_MS },   // 窗口外
    };
    const d = dueDistribution(states, T0, 7);
    eq(d.length, 7, '返回天数');
    eq(d[0].count, 2, '今天到期数（含逾期）');
    eq(d[2].count, 1, '第 3 天到期数');
    eq(d.reduce((a, b) => a + b.count, 0), 3, '窗口内总数');
  }),
  t('连续学习天数统计', () => {
    eq(streakDays([ev(0, true), ev(-1, true), ev(-2, true)], T0), 3, '连续三天');
    eq(streakDays([ev(0, true), ev(-2, true)], T0), 1, '中断后重新计数');
    eq(streakDays([], T0), 0, '无记录');
    eq(streakDays([ev(-1, true), ev(-2, true)], T0), 2, '今天未学从昨天算起');
  }),
  t('总览汇总与学习记录一致', () => {
    const events = [ev(0, true), ev(0, false), ev(0, true)];
    const s = summarize(events, { a: { due: T0 - 1 }, b: { due: T0 + DAY_MS } }, T0);
    eq(s.totalEvents, 3, '总事件数');
    eq(s.todayCount, 3, '今日学习量');
    eq(s.correct, 2, '正确次数');
    near(s.accuracy, 2 / 3, 1e-9, '总正确率');
    eq(s.dueToday, 1, '今日到期');
    eq(s.learnedCards, 2, '在学卡片数');
  }),
  t('推进 100 天：事件总量与分布一致', () => {
    const events = [];
    for (let d = 0; d < 100; d++) {
      events.push(ev(-d, true), ev(-d, false));
    }
    const v = dailyVolume(events, 100, T0);
    eq(v.reduce((a, b) => a + b.count, 0), 200, '窗口内总量');
    const a = dailyAccuracy(events, 100, T0);
    eq(a.filter((x) => x.rate !== null).length, 100, '有效正确率天数');
    a.forEach((x) => near(x.rate, 0.5, 1e-9, '每日正确率'));
  }),
  t('推进 100 天：SRS 到期分布与调度结果一致', () => {
    let st = createState('a');
    let now = T0 - 5 * DAY_MS;
    st = schedule(st, RATING.KNOWN, now);      // 1 天后
    st = schedule(st, RATING.KNOWN, st.due);   // 6 天后
    const states = { a: st };
    const dist = dueDistribution(states, T0, 7);
    const idx = Math.floor((startOfDay(st.due) - startOfDay(T0)) / DAY_MS);
    eq(dist[idx].count, 1, '到期卡片应落在第 ' + idx + ' 天');
    eq(dist.reduce((a, b) => a + b.count, 0), 1, '窗口内总数');
  }),
  t('卡组概览：新卡/在学/到期分类正确', () => {
    const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const states = {
      a: { id: 'a', due: T0 - DAY_MS, lastReviewed: T0 - 3 * DAY_MS }, // 在学且到期
      b: { id: 'b', due: T0 + DAY_MS, lastReviewed: T0 },              // 在学未到期
    };
    const o = deckOverview(cards, states, T0);
    eq(o.total, 3, '总卡片数');
    eq(o.fresh, 1, '未学卡片');
    eq(o.learning, 2, '在学卡片');
    eq(o.due, 1, '到期卡片');
  }),
];
