// mistakes 模块自检
import {
  collectMistake, markMastered, markUnmastered, removeMistake,
  filterMistakes, moduleList, buildRetrySession, statsOf,
} from '../core/mistakes.js';
import { t, assert, eq } from './harness.js';

const T0 = new Date(2026, 0, 1, 10, 0, 0).getTime();

function base(over) {
  return Object.assign({
    source: 'quiz', module: '被动态', refId: 'q1', topicId: 'b1-passiv',
    stem: 'Das Haus ____ 1900 gebaut.', userAnswer: 'wird',
    correctAnswer: 'wurde', explanation: '过去时被动态', ts: T0,
  }, over || {});
}

export const title = '错题本';
export const results = [
  t('首次收集生成新条目并记录错误答案', () => {
    const r = collectMistake([], base());
    eq(r.isNew, true, '应为新条目');
    eq(r.list.length, 1, '条目数');
    eq(r.list[0].userAnswer, 'wird', '未记录用户错误答案');
    eq(r.list[0].wrongCount, 1, '错误次数');
    eq(r.list[0].mastered, false, '默认未掌握');
  }),
  t('同一题再次答错只更新不重复', () => {
    let list = collectMistake([], base()).list;
    const r = collectMistake(list, base({ userAnswer: 'ist', ts: T0 + 1000 }));
    eq(r.isNew, false, '不应产生新条目');
    eq(r.list.length, 1, '条目数');
    eq(r.list[0].wrongCount, 2, '错误次数未累加');
    eq(r.list[0].userAnswer, 'ist', '未更新为最新的错误答案');
  }),
  t('不同来源的同题互不覆盖', () => {
    let list = collectMistake([], base()).list;
    list = collectMistake(list, base({ source: 'card', refId: 'q1' })).list;
    eq(list.length, 2, '条目数');
  }),
  t('标记已掌握与取消掌握', () => {
    let list = collectMistake([], base()).list;
    const id = list[0].id;
    list = markMastered(list, id, T0 + 1000);
    eq(list[0].mastered, true, '未标记为掌握');
    list = markUnmastered(list, id);
    eq(list[0].mastered, false, '未取消掌握');
  }),
  t('重新答错会取消掌握标记', () => {
    let list = collectMistake([], base()).list;
    const id = list[0].id;
    list = markMastered(list, id, T0);
    list = collectMistake(list, base({ userAnswer: 'wird' })).list;
    eq(list.find((m) => m.id === id).mastered, false, '应取消掌握');
  }),
  t('按来源与模块筛选', () => {
    let list = [];
    list = collectMistake(list, base()).list;
    list = collectMistake(list, base({ source: 'card', module: 'B1 核心词汇', refId: 'c1' })).list;
    eq(filterMistakes(list, { source: 'quiz' }).length, 1, '按来源筛选');
    eq(filterMistakes(list, { module: 'B1 核心词汇' }).length, 1, '按模块筛选');
    eq(filterMistakes(list, { mastered: true }).length, 0, '未掌握筛选');
    eq(moduleList(list).join(','), 'B1 核心词汇,被动态', '模块列表');
  }),
  t('关键词筛选命中题干与答案', () => {
    const list = collectMistake([], base()).list;
    eq(filterMistakes(list, { keyword: 'wurde' }).length, 1, '按正确答案搜索');
    eq(filterMistakes(list, { keyword: 'haus' }).length, 1, '按题干搜索（忽略大小写）');
    eq(filterMistakes(list, { keyword: 'zzz' }).length, 0, '无命中');
  }),
  t('删除条目', () => {
    const list = collectMistake([], base()).list;
    eq(removeMistake(list, list[0].id).length, 0, '删除失败');
  }),
  t('重练只出未掌握的错题', () => {
    let list = [];
    list = collectMistake(list, base({ refId: 'q1' })).list;
    list = collectMistake(list, base({ refId: 'q2' })).list;
    list = markMastered(list, 'quiz|q1', T0);
    const retry = buildRetrySession(list, { seed: 'r' });
    eq(retry.length, 1, '重练题数');
    eq(retry[0].refId, 'q2', '重练内容');
  }),
  t('重练可种子化且限制条数', () => {
    let list = [];
    for (let i = 0; i < 10; i++) list = collectMistake(list, base({ refId: 'q' + i })).list;
    const a = buildRetrySession(list, { seed: 'r1', count: 5 }).map((x) => x.refId);
    const b = buildRetrySession(list, { seed: 'r1', count: 5 }).map((x) => x.refId);
    eq(a.join(','), b.join(','), '同种子结果不一致');
    eq(a.length, 5, '限制条数');
  }),
  t('统计汇总正确', () => {
    let list = [];
    list = collectMistake(list, base({ refId: 'q1' })).list;
    list = collectMistake(list, base({ refId: 'q2', source: 'card' })).list;
    list = markMastered(list, 'quiz|q1', T0);
    const s = statsOf(list);
    eq(s.total, 2, '总数');
    eq(s.mastered, 1, '已掌握');
    eq(s.unmastered, 1, '未掌握');
    eq(s.bySource.card, 1, '按来源统计');
  }),
];
