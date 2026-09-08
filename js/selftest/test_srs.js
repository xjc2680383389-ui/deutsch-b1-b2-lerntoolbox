// srs 模块自检（注入虚拟时钟，不使用真实等待）
import { createState, schedule, isDue, dueQueue, buildReviewQueue, previewInterval, DAY_MS, RETRY_MS, RATING } from '../core/srs.js';
import { t, assert, eq } from './harness.js';

const T0 = new Date(2026, 0, 1, 9, 0, 0).getTime(); // 固定起点：2026-01-01 09:00

export const title = 'SRS 间隔重复调度';
export const results = [
  t('新卡片初始默认到期', () => {
    const s = createState('a');
    eq(s.due, 0, '初始到期时间');
    eq(s.reps, 0, '初始连续答对次数');
    eq(s.ef, 2.5, '初始难易系数');
    assert(isDue(s, T0), '新卡片应当可学');
  }),
  t('首次评分“会”→ 1 天后到期', () => {
    const s = schedule(createState('a'), RATING.KNOWN, T0);
    eq(s.interval, 1, '间隔');
    eq(s.due, T0 + DAY_MS, '到期时间');
    eq(s.reps, 1, '连续答对次数');
  }),
  t('连续“会”间隔按 1 → 6 → 增长', () => {
    let s = createState('a');
    s = schedule(s, RATING.KNOWN, T0);
    eq(s.interval, 1, '第一次间隔');
    s = schedule(s, RATING.KNOWN, s.due);
    eq(s.interval, 6, '第二次间隔');
    const third = schedule(s, RATING.KNOWN, s.due);
    assert(third.interval > 6, '第三次间隔应大于 6，实际 ' + third.interval);
  }),
  t('评分“不会”重置进度并在 10 分钟后回到队列', () => {
    let s = createState('a');
    s = schedule(s, RATING.KNOWN, T0);
    s = schedule(s, RATING.KNOWN, s.due);
    const after = schedule(s, RATING.AGAIN, s.due);
    eq(after.reps, 0, '连续答对次数未重置');
    eq(after.lapses, 1, '遗忘次数');
    eq(after.due, s.due + RETRY_MS, '重来到期时间');
  }),
  t('“模糊”也会推进但间隔增长更慢', () => {
    let good = createState('a');
    good = schedule(good, RATING.KNOWN, T0);
    good = schedule(good, RATING.KNOWN, good.due);
    const goodThird = schedule(good, RATING.KNOWN, good.due);

    let fuzzy = createState('b');
    fuzzy = schedule(fuzzy, RATING.KNOWN, T0);
    fuzzy = schedule(fuzzy, RATING.KNOWN, fuzzy.due);
    const fuzzyThird = schedule(fuzzy, RATING.FUZZY, fuzzy.due);

    assert(goodThird.interval > fuzzyThird.interval, '“会”的间隔应大于“模糊”');
  }),
  t('难易系数不会低于 1.3', () => {
    let s = createState('a');
    for (let i = 0; i < 30; i++) s = schedule(s, RATING.FUZZY, T0 + i * DAY_MS);
    assert(s.ef >= 1.3, '难易系数越界：' + s.ef);
  }),
  t('schedule 为纯函数，不修改入参', () => {
    const before = createState('a');
    const snapshot = JSON.stringify(before);
    schedule(before, RATING.KNOWN, T0);
    eq(JSON.stringify(before), snapshot, '原状态被修改');
  }),
  t('注入时钟推进 100 天：到期计算正确', () => {
    let s = createState('a');
    let now = T0;
    for (let day = 0; day < 100; day++) {
      now = T0 + day * DAY_MS;
      if (isDue(s, now)) {
        s = schedule(s, RATING.KNOWN, now);
        assert(s.due > now, '复习后到期时间必须晚于当前时间');
      }
    }
    const days = Math.round((s.due - T0) / DAY_MS);
    assert(days >= 100, '推进 100 天后总跨度应不小于 100 天，实际 ' + days);
    assert(s.totalReviews > 0 && s.totalReviews <= 100, '复习次数异常：' + s.totalReviews);
  }),
  t('注入时钟推进 100 天：全程“不会”则每天都到期', () => {
    let s = createState('a');
    let now = T0;
    let reviews = 0;
    for (let day = 0; day < 100; day++) {
      now = T0 + day * DAY_MS;
      if (isDue(s, now)) { s = schedule(s, RATING.AGAIN, now); reviews += 1; }
    }
    eq(reviews, 100, '“不会”时每天的复习次数');
    eq(s.lapses, 100, '遗忘次数');
  }),
  t('dueQueue 只返回到期状态', () => {
    const states = {
      a: { id: 'a', due: T0 - DAY_MS, lastReviewed: T0 },
      b: { id: 'b', due: T0 + 2 * DAY_MS, lastReviewed: T0 },
      c: { id: 'c', due: T0, lastReviewed: T0 },
    };
    const q = dueQueue(states, T0);
    eq(q.length, 2, '到期数量');
    eq(q[0].id, 'a', '应按到期时间升序');
  }),
  t('buildReviewQueue 到期优先、新卡次之、未到期最后', () => {
    const cards = [
      { id: 'due1' }, { id: 'due2' }, { id: 'fresh1' }, { id: 'future1' },
    ];
    const states = {
      due1: { id: 'due1', due: T0 - 3600000, lastReviewed: T0 - 5 * DAY_MS },
      due2: { id: 'due2', due: T0 - DAY_MS, lastReviewed: T0 - 9 * DAY_MS },
      future1: { id: 'future1', due: T0 + 5 * DAY_MS, lastReviewed: T0 },
    };
    const q = buildReviewQueue(cards, states, T0).map((c) => c.id);
    eq(q[0], 'due2', '最早的到期卡片应排第一');
    eq(q[1], 'due1', '第二张到期卡片');
    eq(q[2], 'fresh1', '新卡应排在其后');
    eq(q[3], 'future1', '未到期卡片排在最后');
  }),
  t('previewInterval 预测不修改状态', () => {
    const s = createState('a');
    const snapshot = JSON.stringify(s);
    eq(previewInterval(s, RATING.KNOWN), 1, '新卡首次预测间隔');
    eq(previewInterval(s, RATING.AGAIN), 0, '“不会”表示本轮再来');
    eq(JSON.stringify(s), snapshot, '状态被修改');
  }),
];
