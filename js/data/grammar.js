// 语法题库：进入语法练习时才加载。
import { TOPIC as T_PASSIV } from './grammar_b1_passiv.js';
import { TOPIC as T_RELATIV } from './grammar_b1_relativ.js';
import { TOPIC as T_PRAEP } from './grammar_b1_praep.js';
import { TOPIC as T_NEBEN } from './grammar_b1_nebensatz.js';
import { TOPIC as T_TRENN } from './grammar_b1_trennbar.js';
import { TOPIC as T_KONJ2 } from './grammar_b2_konj2.js';
import { TOPIC as T_PART } from './grammar_b2_partizip.js';
import { TOPIC as T_NOM } from './grammar_b2_nominal.js';
import { TOPIC as T_ERSATZ } from './grammar_b2_passiversatz.js';
export const TOPICS = [T_PASSIV, T_RELATIV, T_PRAEP, T_NEBEN, T_TRENN, T_KONJ2, T_PART, T_NOM, T_ERSATZ];

export function topicById(id) {
  return TOPICS.find((t) => t.id === id) || null;
}

