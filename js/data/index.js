// 保留数据聚合入口，兼容自检与演示；正式界面按需引用各数据模块。
export { BUILTIN_DECKS, VOCAB, deckCards, allCards } from './vocabulary.js';
export { TOPICS, topicById } from './grammar.js';
export { SENTENCES as LISTENING } from './listening.js';
