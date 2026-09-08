// random 模块自检
import { makeRng, shuffle, sample, randInt, hashSeed } from '../core/random.js';
import { t, assert, eq } from './harness.js';

export const title = '随机数（种子化）';
export const results = [
  t('同一种子产生完全相同的序列', () => {
    const a = makeRng('seed-1');
    const b = makeRng('seed-1');
    for (let i = 0; i < 50; i++) eq(a(), b(), '第 ' + i + ' 个随机数');
  }),
  t('不同种子产生不同序列', () => {
    const a = makeRng('seed-a');
    const b = makeRng('seed-b');
    let diff = 0;
    for (let i = 0; i < 20; i++) if (a() !== b()) diff += 1;
    assert(diff > 15, '不同种子的序列差异过小：' + diff);
  }),
  t('随机数落在 [0,1) 区间', () => {
    const rng = makeRng(20240908);
    for (let i = 0; i < 500; i++) {
      const v = rng();
      assert(v >= 0 && v < 1, '越界：' + v);
    }
  }),
  t('shuffle 不修改原数组且元素不丢失', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(src, makeRng('x'));
    eq(src.join(','), '1,2,3,4,5,6,7,8', '原数组被修改');
    eq(out.slice().sort((a, b) => a - b).join(','), '1,2,3,4,5,6,7,8', '元素丢失或重复');
    assert(out.join(',') !== src.join(','), '洗牌后顺序未变化');
  }),
  t('shuffle 种子化可复现', () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], makeRng('same'));
    const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], makeRng('same'));
    eq(a.join(','), b.join(','), '同种子洗牌结果不一致');
  }),
  t('sample 抽取数量正确且无重复', () => {
    const src = Array.from({ length: 30 }, (_, i) => i);
    const out = sample(src, 7, makeRng('pick'));
    eq(out.length, 7, '抽取数量');
    eq(new Set(out).size, 7, '抽取结果存在重复');
  }),
  t('sample 请求数量超过总量时返回全部', () => {
    const out = sample([1, 2, 3], 10, makeRng('over'));
    eq(out.length, 3, '超量抽取');
  }),
  t('randInt 落在闭区间内', () => {
    const rng = makeRng('int');
    for (let i = 0; i < 300; i++) {
      const v = randInt(rng, 3, 7);
      assert(v >= 3 && v <= 7, '越界：' + v);
    }
  }),
  t('字符串哈希稳定且非负', () => {
    eq(hashSeed('abc'), hashSeed('abc'), '哈希不稳定');
    assert(hashSeed('abc') >= 0, '哈希为负');
    assert(hashSeed('abc') !== hashSeed('abd'), '不同字符串哈希相同');
  }),
];
