// listening 模块自检
import { similarity, judgeListening, diffWords, tokens } from '../core/listening.js';
import { t, assert, eq, near } from './harness.js';

const S = 'Können Sie mir bitte sagen, wie ich zum Bahnhof komme?';

export const title = '听力精听自检';
export const results = [
  t('完全一致的文本相似度为 1', () => {
    near(similarity(S, S), 1, 1e-9, '相似度');
  }),
  t('忽略大小写、标点与多余空白', () => {
    near(similarity(S, '  können SIE mir bitte sagen wie ich zum Bahnhof komme  '), 1, 1e-9, '归一化后相似度');
  }),
  t('完全不相关文本相似度接近 0', () => {
    assert(similarity(S, 'Der Baum ist grün und sehr alt') < 0.2, '相似度过高');
  }),
  t('空输入相似度为 0', () => {
    eq(similarity(S, ''), 0, '空输入');
    eq(similarity('', ''), 1, '双方均为空');
  }),
  t('部分听写得到中间分数', () => {
    const s = similarity(S, 'Können Sie mir bitte sagen, wie ich zum Bahnhof gehe');
    assert(s > 0.7 && s < 1, '部分听写分数应在 0.7~1 之间，实际 ' + s);
  }),
  t('自检分级：高分通过、低分不通过', () => {
    const good = judgeListening(S, S);
    eq(good.passed, true, '完整听写应通过');
    assert(good.label.indexOf('一致') >= 0, '高分词级：' + good.label);
    const bad = judgeListening(S, 'Ich verstehe nur wenig');
    eq(bad.passed, false, '低分不应通过');
    assert(bad.hint.length > 0, '应给出建议');
  }),
  t('空答案被标记为未作答', () => {
    const r = judgeListening(S, '   ');
    eq(r.empty, true, '未作答标记');
    eq(r.passed, false, '不应通过');
  }),
  t('逐词对照标出未听出的词', () => {
    const d = diffWords('Der Zug fährt um acht Uhr ab', 'Der Bus fährt um acht Uhr ab');
    eq(d.length, 7, '切词数量');
    eq(d[0].hit, true, 'Der 应命中');
    eq(d[1].hit, false, 'Zug 应未命中');
    eq(d[6].hit, true, 'ab 应命中');
  }),
  t('tokens 归一化后切词', () => {
    eq(tokens('Der   Zug fährt.').join('|'), 'der|zug|fährt', '切词结果');
  }),
];
