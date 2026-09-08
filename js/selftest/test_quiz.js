// quiz 模块自检
import { normalizeText, judgeMc, judgeFill, judge, prepareQuestion, buildSession, gradeSession } from '../core/quiz.js';
import { makeRng } from '../core/random.js';
import { t, assert, eq } from './harness.js';

const MC = {
  id: 'q1', type: 'mc', topicId: 'tp',
  stem: '选出正确的被动态：',
  options: ['wird gebaut', 'wird bauen', 'wurde bauen', 'ist bauen'],
  answer: 0,
  explain: '现在时被动态 = wird + 第二分词。',
};

const FILL = {
  id: 'q2', type: 'fill', topicId: 'tp',
  stem: 'Das Haus ____ 1900 gebaut.',
  answers: ['wurde', 'ist'],
  explain: '过去时被动态用 wurde。',
};

export const title = '练习判分与抽题';
export const results = [
  t('四选一：选对判正确', () => {
    const r = judgeMc(MC, 0);
    eq(r.correct, true, '判分结果');
    eq(r.correctAnswer, 'wird gebaut', '正确答案');
  }),
  t('四选一：选错判错误并给出正确答案', () => {
    const r = judgeMc(MC, 2);
    eq(r.correct, false, '判分结果');
    eq(r.userAnswer, 'wurde bauen', '用户答案回显');
    eq(r.correctAnswer, 'wird gebaut', '正确答案');
    assert(r.explanation.length > 0, '解析为空');
  }),
  t('填空：答对判正确', () => {
    eq(judgeFill(FILL, 'wurde').correct, true, 'wurde 应判正确');
    eq(judgeFill(FILL, 'ist').correct, true, '备选答案也应判正确');
  }),
  t('填空：归一大小写、空格、ß 与句末句号', () => {
    eq(normalizeText('  Wurde  '), 'wurde', '大小写与空格');
    eq(normalizeText('Er heißt.'), 'er heisst', 'ß 与句号');
    eq(judgeFill(FILL, '  WURDE ').correct, true, '大写 + 空格');
    eq(judgeFill(FILL, 'wurde.').correct, true, '句末句号');
  }),
  t('填空：答错与空答案判错误', () => {
    eq(judgeFill(FILL, 'wird').correct, false, '错误答案');
    eq(judgeFill(FILL, '').correct, false, '空答案');
    eq(judgeFill(FILL, '   ').correct, false, '纯空格');
  }),
  t('judge 按题型自动分派', () => {
    eq(judge(MC, 0).correct, true, '四选一');
    eq(judge(FILL, 'wurde').correct, true, '填空');
  }),
  t('prepareQuestion 打乱选项后仍能定位正确答案', () => {
    let rng = makeRng('opt');
    for (let i = 0; i < 30; i++) {
      const item = prepareQuestion(MC, rng);
      eq(item.options.length, 4, '选项数量');
      eq(item.options[item.answerIndex], MC.options[MC.answer], '正确答案定位错误');
      eq(new Set(item.options).size, 4, '选项出现重复');
    }
  }),
  t('buildSession 同种子结果一致', () => {
    const list = [MC, FILL, { ...MC, id: 'q3' }, { ...FILL, id: 'q4' }];
    const a = buildSession(list, { seed: 's1' }).map((x) => x.id + ':' + x.answerIndex);
    const b = buildSession(list, { seed: 's1' }).map((x) => x.id + ':' + x.answerIndex);
    const c = buildSession(list, { seed: 's2' }).map((x) => x.id + ':' + x.answerIndex);
    eq(a.join('|'), b.join('|'), '同种子不一致');
    assert(a.join('|') !== c.join('|') || a.length === 1, '不同种子应产生不同顺序');
  }),
  t('buildSession 抽取数量正确', () => {
    const list = Array.from({ length: 20 }, (_, i) => ({ ...MC, id: 'q' + i }));
    eq(buildSession(list, { count: 8, seed: 'c' }).length, 8, '抽取数量');
    eq(buildSession(list, { count: 99, seed: 'c' }).length, 20, '超量抽取');
  }),
  t('gradeSession 统计正确率并收集错题', () => {
    const list = [MC, FILL, { ...MC, id: 'q3' }];
    const session = buildSession(list, { seed: 'g' });
    const answers = session.map((item) => (item.type === 'fill' ? 'wurde' : item.answerIndex));
    const fillAt = session.findIndex((item) => item.type === 'fill');
    answers[fillAt] = 'falsch'; // 故意把填空题答错
    const r = gradeSession(session, answers);
    eq(r.total, 3, '总题数');
    eq(r.correct, 2, '答对题数');
    eq(r.wrong.length, 1, '错题数');
    eq(r.wrong[0].correct, false, '错题标记');
    assert(Math.abs(r.accuracy - 2 / 3) < 1e-9, '正确率计算错误');
  }),
];
