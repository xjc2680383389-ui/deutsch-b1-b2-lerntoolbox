// 演示数据：仅供截图与人工冒烟使用（地址栏加 ?demo=1 触发，仅生成一次）
import { store, nowTs } from './state.js';
import { VOCAB, TOPICS } from '../data/index.js';
import { createState, schedule, DAY_MS } from '../core/srs.js';
import { makeRng } from '../core/random.js';
import { collectMistake } from '../core/mistakes.js';

export function seedDemo() {
  if (store.data.settings.demoSeeded) return;
  const rng = makeRng('demo-2026');
  const now = nowTs();

  // 1) 近 14 天的学习事件
  const events = [];
  for (let d = 13; d >= 0; d--) {
    const dayTs = now - d * DAY_MS;
    const count = 10 + Math.floor(rng() * 20);
    for (let i = 0; i < count; i++) {
      const roll = rng();
      const correct = roll > 0.26;
      const type = roll < 0.6 ? 'card' : roll < 0.9 ? 'quiz' : 'listening';
      const ev = {
        ts: dayTs + Math.floor(rng() * 9 * 3600000) + 8 * 3600000,
        type,
        correct,
        qtype: roll < 0.72 ? 'mc' : 'fill',
      };
      if (type === 'card') ev.deck = roll < 0.55 ? 'b1' : 'b2';
      else if (type === 'quiz') ev.topic = TOPICS[Math.floor(rng() * TOPICS.length)].id;
      else ev.topic = 'l' + String(1 + Math.floor(rng() * 30)).padStart(2, '0');
      if (type === 'card') ev.rating = correct ? 2 : 0;
      events.push(ev);
    }
  }
  store.update((db) => {
    db.events = events.sort((a, b) => a.ts - b.ts).concat(db.events);
    return db;
  });

  // 2) B1 / B2 卡片的 SRS 进度
  const cards = VOCAB.slice(0, 420);
  store.update((db) => {
    cards.forEach((c) => {
      if (rng() > 0.6) return;
      let st = createState(c.id);
      const times = 1 + Math.floor(rng() * 4);
      let t = now - (6 + Math.floor(rng() * 8)) * DAY_MS;
      for (let k = 0; k < times; k++) {
        st = schedule(st, rng() > 0.25 ? 2 : 1, t);
        t += Math.max(1, Math.round(st.interval * DAY_MS));
      }
      db.states[c.id] = st;
    });
    return db;
  });

  // 3) 若干错题（覆盖三个来源）
  store.update((db) => {
    let list = db.mistakes;
    TOPICS.slice(0, 5).forEach((tp) => {
      const q = tp.questions[Math.floor(rng() * tp.questions.length)];
      const r = collectMistake(list, {
        source: 'quiz',
        module: tp.name,
        topicId: tp.id,
        refId: q.id,
        stem: q.stem,
        userAnswer: q.type === 'mc' ? q.options[(q.answer + 1) % 4] : '（空）',
        correctAnswer: q.type === 'mc' ? q.options[q.answer] : q.answers[0],
        explanation: q.explain,
        ts: now - Math.floor(rng() * 5) * DAY_MS,
      });
      list = r.list;
    });
    ['abholen', 'beantragen', 'Umwelt', 'Verantwortung', 'Maßnahme'].forEach((term, i) => {
      const card = VOCAB.find((c) => c.term === term) || VOCAB[i * 7];
      const r = collectMistake(list, {
        source: 'card',
        module: card.deckId === 'b1' ? 'B1 核心词汇' : 'B2 核心词汇',
        refId: card.id,
        stem: `${card.term}（${card.pos}）`,
        userAnswer: '不会（没想起来）',
        correctAnswer: card.zh,
        explanation: `${card.example} —— ${card.exZh}`,
        ts: now - Math.floor(rng() * 3) * DAY_MS,
      });
      list = r.list;
    });
    const r = collectMistake(list, {
      source: 'listening',
      module: '听力精听（B1）',
      refId: 'l02',
      stem: 'Der Zug nach München fährt heute von Gleis vier ab.',
      userAnswer: 'Der Zug nach München fährt heute von Platz vier ab.',
      correctAnswer: 'Der Zug nach München fährt heute von Gleis vier ab.',
      explanation: '可分动词现在时：fährt … ab；von + 第三格 dem Gleis → vom Gleis。',
      ts: now - DAY_MS,
    });
    db.mistakes = r.list;
    return db;
  });

  store.update((db) => { db.settings.demoSeeded = true; return db; });
}
