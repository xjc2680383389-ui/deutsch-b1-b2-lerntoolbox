// 听力精听：文本相似度与自检判分（纯逻辑，无 DOM 依赖）
import { normalizeText } from './quiz.js';

export function tokens(text) {
  const t = normalizeText(text);
  return t ? t.split(' ').filter(Boolean) : [];
}

// 基于最长公共子序列的词序列相似度（0~1）
export function similarity(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 && tb.length === 0) return 1;
  if (ta.length === 0 || tb.length === 0) return 0;
  const prev = new Array(tb.length + 1).fill(0);
  const cur = new Array(tb.length + 1).fill(0);
  for (let i = 1; i <= ta.length; i++) {
    for (let j = 1; j <= tb.length; j++) {
      if (ta[i - 1] === tb[j - 1]) cur[j] = prev[j - 1] + 1;
      else cur[j] = Math.max(prev[j], cur[j - 1]);
    }
    for (let j = 0; j <= tb.length; j++) prev[j] = cur[j];
  }
  const lcs = prev[tb.length];
  return (2 * lcs) / (ta.length + tb.length);
}

export const LEVEL_COMMENT = [
  { min: 0.95, label: '几乎完全一致', hint: '可以直接进入下一句。' },
  { min: 0.8, label: '基本听懂', hint: '个别词尾或冠词没抓到，再听一遍对照原文。' },
  { min: 0.6, label: '听出大意', hint: '建议放慢语速，重点听弱读的冠词与词尾。' },
  { min: 0, label: '差异较大', hint: '先看解析，再逐词跟读一遍。' },
];

export function judgeListening(sentence, input) {
  const raw = String(input == null ? '' : input).trim();
  const score = similarity(sentence, raw);
  const comment = LEVEL_COMMENT.find((c) => score >= c.min) || LEVEL_COMMENT[LEVEL_COMMENT.length - 1];
  return {
    score: Math.round(score * 100) / 100,
    passed: score >= 0.8,
    label: comment.label,
    hint: comment.hint,
    empty: raw.length === 0,
    userText: raw,
    reference: sentence,
  };
}

// 把原文按词切开，标出与用户输入不匹配的词，便于对照
export function diffWords(sentence, input) {
  const ref = String(sentence || '').split(/\s+/).filter(Boolean);
  const got = tokens(input);
  return ref.map((w) => {
    const key = normalizeText(w.replace(/[.,!?;:„“”"]/g, ''));
    return { word: w, hit: key.length > 0 && got.indexOf(key) >= 0 };
  });
}
