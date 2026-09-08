// 应用状态：持久化后端、虚拟时钟、事件记录（UI 与核心逻辑的粘合层）
import { createStore, STORAGE_KEY } from '../core/store.js';
import { BUILTIN_DECKS, VOCAB, TOPICS } from '../data/index.js';
import { collectMistake } from '../core/mistakes.js';

const backend = {
  getItem: (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  setItem: (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* 忽略配额错误 */ } },
  removeItem: (k) => { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

export const store = createStore(backend);
export { STORAGE_KEY };

// 虚拟时钟：真实时间 + 时间机器偏移（用于跨天复习模拟）
export function nowTs() {
  return Date.now() + (store.data.settings.timeOffsetMs || 0);
}

export function allDecks() {
  return BUILTIN_DECKS.concat(store.data.userDecks.map((d) => Object.assign({}, d, { custom: true })));
}

export function deckInfo(id) {
  return allDecks().find((d) => d.id === id) || null;
}

export function deckName(id) {
  const d = deckInfo(id);
  return d ? d.name : '未命名卡组';
}

export function cardsOfDeck(deckId) {
  if (deckId === 'b1' || deckId === 'b2') return VOCAB.filter((c) => c.deckId === deckId);
  return Object.keys(store.data.customCards)
    .map((k) => store.data.customCards[k])
    .filter((c) => c.deckId === deckId);
}

export function topicName(id) {
  const t = TOPICS.find((x) => x.id === id);
  return t ? t.name : '语法练习';
}

function pushEvent(ev) {
  store.update((db) => {
    db.events.push(Object.assign({ ts: nowTs() }, ev));
    if (db.events.length > 8000) db.events = db.events.slice(-8000);
    return db;
  });
}

export function recordCardReview(card, rating, correct) {
  pushEvent({ type: 'card', deck: card.deckId, correct: !!correct, rating });
}

export function recordQuiz(topicId, qtype, correct) {
  pushEvent({ type: 'quiz', topic: topicId, correct: !!correct, qtype });
  store.update((db) => {
    const s = db.quizStats[topicId] || { attempts: 0, correct: 0 };
    s.attempts += 1;
    if (correct) s.correct += 1;
    db.quizStats[topicId] = s;
    return db;
  });
}

export function recordListening(sentenceId, passed) {
  pushEvent({ type: 'listening', topic: sentenceId, correct: !!passed });
  store.update((db) => {
    const s = db.listeningStats[sentenceId] || { plays: 0, best: 0 };
    s.plays += 1;
    s.best = Math.max(s.best || 0, Math.round((passed ? 1 : 0) * 100));
    db.listeningStats[sentenceId] = s;
    return db;
  });
}

// 错项入库：背卡（不会）/ 练习 / 听力
export function addMistake(entry) {
  store.update((db) => {
    const r = collectMistake(db.mistakes, Object.assign({ ts: nowTs() }, entry));
    db.mistakes = r.list;
    return db;
  });
}

export function advanceDays(days) {
  store.update((db) => {
    db.settings.timeOffsetMs = (db.settings.timeOffsetMs || 0) + days * 24 * 60 * 60 * 1000;
    return db;
  });
}
