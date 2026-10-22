// SSP-MMC + DHP-HLR：纯逻辑，时间由外部注入。来源与适配说明见 README。
import { DHP_MODEL, DEFAULT_DIFFICULTY, MAX_DIFFICULTY, DIFFICULTY_STEP,
  startHalfLife, recallProbability, nextHalfLife } from './dhp.js';
import { SSP_CONFIG, SSP_GRID, SSP_POLICY } from '../data/ssp_policy.js';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const RETRY_MS = 10 * 60 * 1000; // 「不会」的卡片 10 分钟后回到本轮队列

export const RATING = { AGAIN: 0, FUZZY: 1, KNOWN: 2 };
export const RATING_LABEL = ['不会', '模糊', '会'];

export function createState(cardId) {
  return {
    id: cardId,
    algorithm: DHP_MODEL,
    difficulty: DEFAULT_DIFFICULTY,
    halfLife: 0,     // 记忆半衰期（天）；首次学习后初始化
    memoryReviewedAt: 0, // 长期模型的时间锚点，同日练习不重置
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

function updateMemory(s, rating, now) {
  if (!(s.halfLife > 0)) {
    s.halfLife = startHalfLife(s.difficulty);
    s.memoryReviewedAt = now;
    return;
  }
  const elapsedDays = Math.max(0, (now - s.memoryReviewedAt) / DAY_MS);
  // 论文的数据是跨天回忆；本轮重练不作为新的长期记忆证据。
  if (elapsedDays < 1) return;
  const recalled = rating !== RATING.AGAIN;
  s.halfLife = nextHalfLife(s.difficulty, s.halfLife, recallProbability(s.halfLife, elapsedDays), recalled);
  if (!recalled) s.difficulty = Math.min(MAX_DIFFICULTY, s.difficulty + DIFFICULTY_STEP);
  s.memoryReviewedAt = now;
}

// 旧备份按现存历史重放；不改变原到期日期、次数或历史。缺失的旧历史不伪造。
export function migrateState(state) {
  const s = Object.assign(createState(state && state.id || 'unknown'), state || {});
  s.history = Array.isArray(s.history) ? s.history.slice() : [];
  if (s.algorithm === DHP_MODEL && Number.isFinite(s.halfLife) && s.halfLife > 0
      && Number.isInteger(s.difficulty) && s.difficulty >= 1 && s.difficulty <= MAX_DIFFICULTY
      && Number.isFinite(s.memoryReviewedAt)) return s;
  s.algorithm = DHP_MODEL;
  s.difficulty = DEFAULT_DIFFICULTY;
  s.halfLife = 0;
  s.memoryReviewedAt = 0;
  const history = s.history.filter((e) => e && Number.isFinite(e.at) && [0, 1, 2].includes(e.rating))
    .sort((a, b) => a.at - b.at);
  history.forEach((e) => updateMemory(s, e.rating, e.at));
  if (history.length) {
    s.memorySource = (s.totalReviews || 0) > history.length ? 'partial-history' : 'history';
  } else if ((s.totalReviews || 0) > 0 || s.lastReviewed > 0) {
    s.halfLife = startHalfLife(s.difficulty);
    s.memoryReviewedAt = Number(s.lastReviewed) || 0;
    s.memorySource = 'legacy-baseline';
  }
  return s;
}

export function optimalInterval(difficulty, halfLife) {
  if (halfLife >= SSP_CONFIG.targetHalfLife) return 0; // 论文 SSP 的终止状态。
  const index = Math.max(0, Math.min(SSP_GRID.length - 2,
    Math.round(Math.log(halfLife) / Math.log(SSP_CONFIG.base)) - SSP_CONFIG.minExponent));
  return SSP_POLICY[difficulty - 1][index];
}

// 纯函数：返回新的状态对象，不修改传入的 state
export function schedule(state, rating, now) {
  if (![RATING.AGAIN, RATING.FUZZY, RATING.KNOWN].includes(rating) || !Number.isFinite(now)) {
    throw new Error('无效的复习评分或时间');
  }
  const s = migrateState(state);
  updateMemory(s, rating, now);
  s.memoryTargetReached = rating !== RATING.AGAIN && s.halfLife >= SSP_CONFIG.targetHalfLife;
  if (rating === RATING.AGAIN) {
    s.reps = 0;
    s.lapses = (s.lapses || 0) + 1;
    s.interval = RETRY_MS / DAY_MS;
    s.due = now + RETRY_MS;
  } else {
    s.reps = (s.reps || 0) + 1;
    s.interval = optimalInterval(s.difficulty, s.halfLife);
    // JSON 无法保存 Infinity，使用有限的哨兵表示终止调度。
    s.due = s.memoryTargetReached ? Number.MAX_SAFE_INTEGER : now + s.interval * DAY_MS;
  }
  s.lastReviewed = now;
  s.lastRating = rating;
  s.totalReviews = (s.totalReviews || 0) + 1;
  s.history = s.history.concat([{ at: now, rating }]).slice(-30);
  return s;
}

// 预览与实际保存共用调度函数、同一个 now，包含逾期和终止状态。
export function previewInterval(state, rating, now = Date.now()) {
  const next = schedule(state, rating, now);
  return rating === RATING.AGAIN ? 0 : next.interval;
}

export function isDue(state, now) {
  if (!state) return true;
  return !state.memoryTargetReached && (state.due || 0) <= now;
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
    if (st.memoryTargetReached) return;
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
