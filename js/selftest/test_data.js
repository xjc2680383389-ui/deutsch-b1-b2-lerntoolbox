// 数据完整性自检（词库、题库、听力句库）
import { VOCAB, TOPICS, LISTENING, BUILTIN_DECKS } from '../data/index.js';
import { t, assert, eq } from './harness.js';

export const title = '数据完整性';
export const results = [
  t('B1 与 B2 词库各不少于 400 词', () => {
    const b1 = VOCAB.filter((c) => c.deckId === 'b1').length;
    const b2 = VOCAB.filter((c) => c.deckId === 'b2').length;
    assert(b1 >= 400, 'B1 词条不足：' + b1);
    assert(b2 >= 400, 'B2 词条不足：' + b2);
  }),
  t('词条字段完整（单词/词性/释义/例句/等级）', () => {
    const bad = VOCAB.filter((c) => !c.term || !c.pos || !c.zh || !c.example || !c.exZh || !c.level);
    eq(bad.length, 0, '字段缺失的词条：' + bad.slice(0, 5).map((c) => c.term).join('、'));
  }),
  t('词库无重复词条', () => {
    const seen = {};
    const dup = [];
    VOCAB.forEach((c) => {
      const k = c.term.trim().toLowerCase();
      if (seen[k]) dup.push(c.term);
      seen[k] = true;
    });
    eq(dup.length, 0, '重复词条：' + dup.slice(0, 10).join('、'));
  }),
  t('卡片编号唯一', () => {
    const ids = new Set(VOCAB.map((c) => c.id));
    eq(ids.size, VOCAB.length, '存在重复编号');
  }),
  t('内置卡组定义完整', () => {
    eq(BUILTIN_DECKS.length, 2, '内置卡组数量');
    BUILTIN_DECKS.forEach((d) => {
      assert(d.id && d.name && d.level, '卡组字段缺失：' + JSON.stringify(d));
      assert(VOCAB.some((c) => c.deckId === d.id), '卡组无词条：' + d.id);
    });
  }),
  t('语法专题不少于 8 个，B1 与 B2 各不少于 4 个', () => {
    assert(TOPICS.length >= 8, '专题不足：' + TOPICS.length);
    const b1 = TOPICS.filter((x) => x.level === 'B1').length;
    const b2 = TOPICS.filter((x) => x.level === 'B2').length;
    assert(b1 >= 4, 'B1 专题不足：' + b1);
    assert(b2 >= 4, 'B2 专题不足：' + b2);
  }),
  t('每个专题不少于 20 题', () => {
    TOPICS.forEach((tp) => {
      assert(tp.questions.length >= 20, `专题「${tp.name}」题量不足：${tp.questions.length}`);
    });
  }),
  t('题目编号全局唯一', () => {
    const ids = [];
    TOPICS.forEach((tp) => tp.questions.forEach((q) => ids.push(q.id)));
    eq(new Set(ids).size, ids.length, '存在重复题号');
  }),
  t('四选一题目：四个选项、答案键有效、解析非空', () => {
    const errs = [];
    TOPICS.forEach((tp) => tp.questions.forEach((q) => {
      if (q.type !== 'mc') return;
      if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(q.id + ' 选项数不为 4');
      else if (new Set(q.options).size !== 4) errs.push(q.id + ' 选项重复');
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) errs.push(q.id + ' 答案键越界');
      if (!q.explain || !q.explain.trim()) errs.push(q.id + ' 缺解析');
      if (!q.stem || !q.stem.trim()) errs.push(q.id + ' 缺题干');
    }));
    eq(errs.length, 0, errs.slice(0, 6).join('；'));
  }),
  t('填空题目：答案键非空且解析非空', () => {
    const errs = [];
    TOPICS.forEach((tp) => tp.questions.forEach((q) => {
      if (q.type !== 'fill') return;
      if (!Array.isArray(q.answers) || q.answers.length === 0) errs.push(q.id + ' 缺答案');
      else q.answers.forEach((a) => { if (!String(a).trim()) errs.push(q.id + ' 存在空答案'); });
      if (!q.explain || !q.explain.trim()) errs.push(q.id + ' 缺解析');
      if (!q.stem || !q.stem.trim()) errs.push(q.id + ' 缺题干');
    }));
    eq(errs.length, 0, errs.slice(0, 6).join('；'));
  }),
  t('题目均含四选一与填空两种题型', () => {
    const all = TOPICS.reduce((acc, tp) => acc.concat(tp.questions), []);
    assert(all.some((q) => q.type === 'mc'), '缺少四选一');
    assert(all.some((q) => q.type === 'fill'), '缺少填空');
  }),
  t('每个专题都混合两种题型', () => {
    TOPICS.forEach((tp) => {
      assert(tp.questions.some((q) => q.type === 'mc'), `专题「${tp.name}」缺少四选一`);
      assert(tp.questions.some((q) => q.type === 'fill'), `专题「${tp.name}」缺少填空`);
    });
  }),
  t('听力句库不少于 30 句且含解析', () => {
    assert(LISTENING.length >= 30, '句库不足：' + LISTENING.length);
    const errs = [];
    LISTENING.forEach((s) => {
      if (!s.de || !s.zh) errs.push(s.id + ' 缺原文或译文');
      if (!s.grammar || !s.grammar.trim()) errs.push(s.id + ' 缺语法解析');
      if (!Array.isArray(s.points) || s.points.length === 0) errs.push(s.id + ' 缺词汇点');
    });
    eq(errs.length, 0, errs.slice(0, 5).join('；'));
    eq(new Set(LISTENING.map((s) => s.id)).size, LISTENING.length, '句子编号重复');
  }),
  t('听力句库覆盖 B1 与 B2 两级', () => {
    assert(LISTENING.some((s) => s.level === 'B1'), '缺少 B1 句子');
    assert(LISTENING.some((s) => s.level === 'B2'), '缺少 B2 句子');
  }),
];
