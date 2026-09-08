// 数据聚合层（纯数据 + 纯函数，无 DOM 依赖）
import { parseDeck } from './vocab_parse.js';
import { RAW as B1_1 } from './vocab_b1_1.js';
import { RAW as B1_2 } from './vocab_b1_2.js';
import { RAW as B1_3 } from './vocab_b1_3.js';
import { RAW as B1_4 } from './vocab_b1_4.js';
import { RAW as B1_5 } from './vocab_b1_5.js';
import { RAW as B1_6 } from './vocab_b1_6.js';
import { RAW as B2_1 } from './vocab_b2_1.js';
import { RAW as B2_2 } from './vocab_b2_2.js';
import { RAW as B2_3 } from './vocab_b2_3.js';
import { RAW as B2_4 } from './vocab_b2_4.js';
import { RAW as B2_5 } from './vocab_b2_5.js';
import { RAW as B2_6 } from './vocab_b2_6.js';
import { TOPIC as T_PASSIV } from './grammar_b1_passiv.js';
import { TOPIC as T_RELATIV } from './grammar_b1_relativ.js';
import { TOPIC as T_PRAEP } from './grammar_b1_praep.js';
import { TOPIC as T_NEBEN } from './grammar_b1_nebensatz.js';
import { TOPIC as T_TRENN } from './grammar_b1_trennbar.js';
import { TOPIC as T_KONJ2 } from './grammar_b2_konj2.js';
import { TOPIC as T_PART } from './grammar_b2_partizip.js';
import { TOPIC as T_NOM } from './grammar_b2_nominal.js';
import { TOPIC as T_ERSATZ } from './grammar_b2_passiversatz.js';
import { SENTENCES } from './listening.js';

export const BUILTIN_DECKS = [
  { id: 'b1', name: 'B1 核心词汇', level: 'B1' },
  { id: 'b2', name: 'B2 核心词汇', level: 'B2' },
];

const VOCAB_SOURCES = [
  { deckId: 'b1', level: 'B1', raw: B1_1 },
  { deckId: 'b1', level: 'B1', raw: B1_2 },
  { deckId: 'b1', level: 'B1', raw: B1_3 },
  { deckId: 'b1', level: 'B1', raw: B1_4 },
  { deckId: 'b1', level: 'B1', raw: B1_5 },
  { deckId: 'b1', level: 'B1', raw: B1_6 },
  { deckId: 'b2', level: 'B2', raw: B2_1 },
  { deckId: 'b2', level: 'B2', raw: B2_2 },
  { deckId: 'b2', level: 'B2', raw: B2_3 },
  { deckId: 'b2', level: 'B2', raw: B2_4 },
  { deckId: 'b2', level: 'B2', raw: B2_5 },
  { deckId: 'b2', level: 'B2', raw: B2_6 },
];

export const VOCAB = VOCAB_SOURCES.reduce((acc, s) => acc.concat(parseDeck(s.raw, s.level, s.deckId)), []);

export const TOPICS = [T_PASSIV, T_RELATIV, T_PRAEP, T_NEBEN, T_TRENN, T_KONJ2, T_PART, T_NOM, T_ERSATZ];

export const LISTENING = SENTENCES;

export function deckCards(deckId) {
  return VOCAB.filter((c) => c.deckId === deckId);
}

export function topicById(id) {
  return TOPICS.find((t) => t.id === id) || null;
}

// 所有可学习卡片：内置词库 + 用户自建词条
export function allCards(customCards) {
  const custom = Object.keys(customCards || {}).map((k) => customCards[k]);
  return VOCAB.concat(custom);
}
