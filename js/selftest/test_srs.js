// 论文公式、SSP Bellman 残差、旧进度兼容和跨天调度；不使用真实等待。
import { createState, migrateState, schedule, isDue, dueQueue, buildReviewQueue,
  previewInterval, optimalInterval, DAY_MS, RETRY_MS, RATING } from '../core/srs.js';
import { DHP_MODEL, startHalfLife, recallProbability, nextHalfLife } from '../core/dhp.js';
import { SSP_CONFIG, SSP_GRID, SSP_POLICY } from '../data/ssp_policy.js';
import { solvePolicy, halfLifeIndex } from '../../scripts/build_ssp_policy.js';
import { t, assert, eq, near } from './harness.js';

const T0 = new Date(2026, 0, 1, 9, 0, 0).getTime();
const mature = () => Object.assign(createState('a'), {
  halfLife: 12, difficulty: 5, memoryReviewedAt: T0, lastReviewed: T0, totalReviews: 3,
});

export const title = 'SSP-MMC 与 DHP-HLR 记忆调度';
export const results = [
  t('新卡中性难度初始化，尚未学习且默认到期', () => {
    const s = createState('a');
    eq(s.difficulty, 5); eq(s.halfLife, 0); eq(s.due, 0); eq(s.reps, 0);
    assert(isDue(s, T0));
  }),
  t('DHP 初始化与论文式 (10) 的参考数值一致', () => {
    near(startHalfLife(5), 1.7635421746374427, 1e-12);
    near(recallProbability(12, 17), 0.3745767692191704, 1e-12);
    near(recallProbability(12, 12), 0.5, 1e-12, '半衰期定义');
  }),
  t('回忆成功与失败符合作者 2023 参数的独立参考数值', () => {
    const p = recallProbability(12, 17);
    near(nextHalfLife(5, 12, p, true), 90.68351159461866, 1e-10);
    near(nextHalfLife(5, 12, p, false), 4.153172310233487, 1e-10);
    near(nextHalfLife(1, 100, 0.25, true), 1136.3369355583031, 1e-9);
  }),
  t('首次学习按 SSP 策略安排 1 天后复习', () => {
    const s = schedule(createState('a'), RATING.KNOWN, T0);
    eq(s.algorithm, DHP_MODEL); eq(s.interval, 1); eq(s.due, T0 + DAY_MS);
    near(s.halfLife, startHalfLife(5)); eq(s.memoryReviewedAt, T0);
  }),
  t('按推荐时间连续成功的策略为 1、3、6、12、31 天后达终点', () => {
    let s = createState('a');
    const intervals = [];
    for (let i = 0; i < 6; i++) {
      s = schedule(s, RATING.KNOWN, i === 0 ? T0 : s.due);
      intervals.push(s.interval);
    }
    eq(JSON.stringify(intervals), JSON.stringify([1, 3, 6, 12, 31, 0]));
    assert(s.halfLife >= 360); eq(s.memoryTargetReached, true);
    eq(s.due, Number.MAX_SAFE_INTEGER);
  }),
  t('实际逾期间隔参与记忆更新，成功的间隔效应可见', () => {
    const onTime = schedule(mature(), RATING.KNOWN, T0 + 5 * DAY_MS);
    const overdue = schedule(mature(), RATING.KNOWN, T0 + 17 * DAY_MS);
    assert(overdue.halfLife > onTime.halfLife);
    near(overdue.halfLife, 90.68351159461866, 1e-10);
    eq(overdue.due, T0 + (17 + overdue.interval) * DAY_MS);
  }),
  t('跨天遗忘增加难度 2 并按失败公式更新半衰期', () => {
    const s = schedule(mature(), RATING.AGAIN, T0 + 17 * DAY_MS);
    near(s.halfLife, 4.153172310233487, 1e-10);
    eq(s.difficulty, 7); eq(s.reps, 0); eq(s.lapses, 1);
    eq(s.due, T0 + 17 * DAY_MS + RETRY_MS);
  }),
  t('难度上限为 18，边界状态保持有限且可序列化', () => {
    const s = schedule(Object.assign(mature(), { difficulty: 18 }), RATING.AGAIN, T0 + DAY_MS);
    eq(s.difficulty, 18); assert(Number.isFinite(s.halfLife) && s.halfLife > 0);
    assert(!JSON.stringify(s).includes('null'));
  }),
  t('同日重练不虚增半衰期，也不覆盖长期回忆的时间锚点', () => {
    let s = mature();
    for (let i = 0; i < 20; i++) s = schedule(s, i % 2 ? RATING.KNOWN : RATING.AGAIN, T0 + (i + 1) * RETRY_MS);
    eq(s.halfLife, 12); eq(s.difficulty, 5); eq(s.memoryReviewedAt, T0);
    eq(s.totalReviews, 23);
  }),
  t('旧版模糊评分作为二元回忆成功，不伪造第三种模型结果', () => {
    const fuzzy = schedule(mature(), RATING.FUZZY, T0 + 17 * DAY_MS);
    const known = schedule(mature(), RATING.KNOWN, T0 + 17 * DAY_MS);
    eq(fuzzy.halfLife, known.halfLife); eq(fuzzy.interval, known.interval);
  }),
  t('预览与实际调度一致，且都不修改输入状态', () => {
    const s = mature(), snapshot = JSON.stringify(s), now = T0 + 17 * DAY_MS;
    for (const rating of [0, 1, 2]) {
      const next = schedule(s, rating, now);
      eq(previewInterval(s, rating, now), rating === 0 ? 0 : next.interval);
    }
    eq(JSON.stringify(s), snapshot);
  }),
  t('旧 SM-2 状态重放现存历史，保留原到期时间、次数与备份字段', () => {
    const history = [{ at: T0, rating: 2 }, { at: T0 + DAY_MS, rating: 1 }, { at: T0 + 7 * DAY_MS, rating: 0 }];
    const old = { id: 'a', ef: 2.2, due: T0 + 8 * DAY_MS, lastReviewed: T0 + 7 * DAY_MS,
      reps: 0, lapses: 1, totalReviews: 3, history };
    const snapshot = JSON.stringify(old), s = migrateState(old);
    let expected = createState('a');
    history.forEach((e) => { expected = schedule(expected, e.rating, e.at); });
    near(s.halfLife, expected.halfLife); eq(s.difficulty, expected.difficulty);
    eq(s.due, old.due); eq(s.totalReviews, 3); eq(s.ef, 2.2);
    eq(s.memorySource, 'history'); eq(JSON.stringify(old), snapshot);
  }),
  t('截断或缺失的旧历史明确使用局部重放或基线，不丢弃次数', () => {
    const partial = migrateState({ id: 'a', totalReviews: 50, lastReviewed: T0,
      history: [{ at: T0, rating: 2 }] });
    eq(partial.memorySource, 'partial-history'); eq(partial.totalReviews, 50);
    const missing = migrateState({ id: 'b', totalReviews: 6, lastReviewed: T0, due: T0 + DAY_MS });
    eq(missing.memorySource, 'legacy-baseline'); eq(missing.due, T0 + DAY_MS);
    eq(missing.memoryReviewedAt, T0); assert(missing.halfLife > 0);
  }),
  t('达到 360 天半衰期停止调度，不将终点策略 0 当作立即到期', () => {
    const s = schedule(Object.assign(mature(), { halfLife: 360 }), RATING.KNOWN, T0);
    eq(previewInterval(s, RATING.KNOWN, T0), 0);
    assert(!isDue(s, T0 + 1000 * DAY_MS)); eq(dueQueue({ a: s }, T0).length, 0);
    eq(buildReviewQueue([{ id: 'a' }], { a: s }, T0).length, 0);
    assert(optimalInterval(5, 359.999) > 0); eq(optimalInterval(5, 360), 0);
  }),
  t('意外在终点卡上选不会仍可以短期重练', () => {
    const s = schedule(Object.assign(mature(), { halfLife: 360, memoryTargetReached: true }), RATING.AGAIN, T0);
    eq(s.memoryTargetReached, false); assert(isDue(s, T0 + RETRY_MS));
  }),
  t('负向时间调整不产生负间隔或虚增记忆', () => {
    const s = schedule(mature(), RATING.KNOWN, T0 - DAY_MS);
    eq(s.halfLife, 12); eq(s.memoryReviewedAt, T0); assert(s.due > T0 - DAY_MS);
  }),
  t('推进 100 天，已达目标的卡片不再安排复习', () => {
    let s = createState('a');
    for (let day = 0; day < 100; day++) {
      const now = T0 + day * DAY_MS;
      if (isDue(s, now)) s = schedule(s, RATING.KNOWN, now);
      assert(s.due > now);
    }
    eq(s.totalReviews, 6); eq(s.memoryTargetReached, true);
  }),
  t('推进 100 天始终不会，每天仍到期且遗忘次数正确', () => {
    let s = createState('a');
    for (let day = 0; day < 100; day++) {
      const now = T0 + day * DAY_MS;
      assert(isDue(s, now)); s = schedule(s, RATING.AGAIN, now);
    }
    eq(s.totalReviews, 100); eq(s.lapses, 100); eq(s.difficulty, 18);
  }),
  t('学习队列保留到期、新卡、可提前练习的原顺序', () => {
    const cards = [{ id: 'later' }, { id: 'early' }, { id: 'fresh' }, { id: 'future' }];
    const states = {
      later: { id: 'later', due: T0, lastReviewed: T0 - DAY_MS },
      early: { id: 'early', due: T0 - DAY_MS, lastReviewed: T0 - 2 * DAY_MS },
      future: { id: 'future', due: T0 + DAY_MS, lastReviewed: T0 },
    };
    eq(JSON.stringify(buildReviewQueue(cards, states, T0).map((c) => c.id)),
      JSON.stringify(['early', 'later', 'fresh', 'future']));
    eq(dueQueue(states, T0)[0].id, 'early');
  }),
  t('无效评分与时间被拒绝，损坏的模型字段可从历史恢复', () => {
    let rejected = 0;
    for (const [rating, now] of [[99, T0], [2, NaN]]) {
      try { schedule(createState('a'), rating, now); } catch { rejected++; }
    }
    eq(rejected, 2);
    const s = schedule(Object.assign(mature(), { halfLife: -1, difficulty: 99 }), 2, T0 + DAY_MS);
    assert(Number.isFinite(s.halfLife) && s.halfLife > 0); assert(s.difficulty <= 18);
  }),
  t('离线重新求解 2916 个状态，结果与内置策略表完全一致', () => {
    const result = solvePolicy();
    eq(JSON.stringify(result.grid), JSON.stringify(SSP_GRID));
    eq(JSON.stringify(result.policy), JSON.stringify(SSP_POLICY));
    assert(result.sweeps.every((s) => s.residual <= SSP_CONFIG.tolerance));
  }),
  t('每个离散状态的策略满足 Bellman 最小期望成本，终点成本为零', () => {
    const { costs } = solvePolicy(), size = SSP_GRID.length;
    for (let d = 1; d <= 18; d++) {
      eq(costs[d - 1][size - 1], 0); eq(SSP_POLICY[d - 1][size - 1], 0);
      for (let i = 0; i < size - 1; i++) {
        const h = SSP_GRID[i], maxInterval = Math.max(1, Math.round(h * Math.log2(1 / 0.3)));
        let best = Infinity, selectedCost = Infinity;
        for (let interval = 1; interval <= maxInterval; interval++) {
          const p = recallProbability(h, interval);
          const a = halfLifeIndex(nextHalfLife(d, h, p, true), SSP_GRID);
          const b = halfLifeIndex(nextHalfLife(d, h, p, false), SSP_GRID);
          const cost = p * (3 + costs[d - 1][a]) + (1 - p) * (9 + costs[Math.min(18, d + 2) - 1][b]);
          best = Math.min(best, cost);
          if (interval === SSP_POLICY[d - 1][i]) selectedCost = cost;
        }
        near(costs[d - 1][i], best, 2e-8, 'Bellman 成本');
        near(selectedCost, best, 2e-8, '已选间隔');
      }
    }
  }),
];
