// 错题本聚合（纯逻辑，无 DOM 依赖）
import { makeRng, shuffle } from './random.js';

export const SOURCE_LABEL = { card: '背卡', quiz: '语法练习', listening: '听力精听' };

export function makeMistake(input) {
  return {
    id: `${input.source}|${input.refId}`,
    source: input.source,               // card / quiz / listening
    module: input.module || '',         // 卡组名或专题名
    refId: String(input.refId),
    topicId: input.topicId || '',
    stem: input.stem || '',             // 题干（背卡为单词）
    userAnswer: input.userAnswer || '', // 用户当时的错误答案
    correctAnswer: input.correctAnswer || '',
    explanation: input.explanation || '',
    ts: input.ts || 0,
    wrongCount: 1,
    mastered: false,
    masteredTs: 0,
    lastReviewTs: 0,
    reviewCount: 0,
  };
}

// 收集：同一来源+同一题重复错时更新，不产生重复条目
export function collectMistake(list, input) {
  const items = Array.isArray(list) ? list.slice() : [];
  const entry = makeMistake(input);
  const idx = items.findIndex((m) => m.id === entry.id);
  if (idx >= 0) {
    const old = items[idx];
    const merged = Object.assign({}, old, {
      userAnswer: entry.userAnswer,
      ts: entry.ts,
      wrongCount: (old.wrongCount || 1) + 1,
      mastered: old.mastered ? false : false,
      masteredTs: 0,
    });
    items[idx] = merged;
    return { list: items, entry: merged, isNew: false };
  }
  items.unshift(entry);
  return { list: items, entry, isNew: true };
}

export function markMastered(list, id, ts) {
  return (list || []).map((m) => (m.id === id
    ? Object.assign({}, m, { mastered: true, masteredTs: ts || 0 })
    : m));
}

export function markUnmastered(list, id) {
  return (list || []).map((m) => (m.id === id
    ? Object.assign({}, m, { mastered: false, masteredTs: 0 })
    : m));
}

export function removeMistake(list, id) {
  return (list || []).filter((m) => m.id !== id);
}

export function filterMistakes(list, filter = {}) {
  return (list || []).filter((m) => {
    if (filter.source && m.source !== filter.source) return false;
    if (filter.module && m.module !== filter.module) return false;
    if (filter.topicId && m.topicId !== filter.topicId) return false;
    if (filter.mastered === true && !m.mastered) return false;
    if (filter.mastered === false && m.mastered) return false;
    if (filter.keyword) {
      const k = String(filter.keyword).toLowerCase();
      const hay = `${m.stem} ${m.userAnswer} ${m.correctAnswer}`.toLowerCase();
      if (hay.indexOf(k) < 0) return false;
    }
    return true;
  });
}

export function moduleList(list) {
  const out = [];
  (list || []).forEach((m) => { if (m.module && out.indexOf(m.module) < 0) out.push(m.module); });
  return out.sort();
}

// 错题重练：未掌握优先，按错误次数加权，可种子化
export function buildRetrySession(list, options = {}) {
  const rng = makeRng(options.seed == null ? 'retry' : options.seed);
  const pool = filterMistakes(list, { mastered: false, source: options.source, module: options.module });
  const pending = pool.filter((m) => (m.reviewCount || 0) === 0);
  const base = pending.length ? pending : pool;
  const ordered = shuffle(base, rng).sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
  const count = options.count && options.count > 0 ? options.count : ordered.length;
  return ordered.slice(0, count).map((m) => ({
    id: m.id,
    source: m.source,
    stem: m.stem,
    correctAnswer: m.correctAnswer,
    explanation: m.explanation,
    module: m.module,
    refId: m.refId,
  }));
}

export function statsOf(list) {
  const all = list || [];
  return {
    total: all.length,
    unmastered: all.filter((m) => !m.mastered).length,
    mastered: all.filter((m) => m.mastered).length,
    bySource: all.reduce((acc, m) => {
      acc[m.source] = (acc[m.source] || 0) + 1;
      return acc;
    }, {}),
  };
}
