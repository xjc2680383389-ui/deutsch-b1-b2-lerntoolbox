// 练习判分与抽题（纯逻辑，无 DOM 依赖）
import { makeRng, shuffle } from './random.js';

export const TYPE_MC = 'mc';
export const TYPE_FILL = 'fill';

// 归一：大小写、ß、标点、多余空白统一，便于填空题判分
export function normalizeText(s) {
  return String(s == null ? '' : s)
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,!?;:„“”"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function judgeMc(item, answerIndex) {
  const idx = Number(answerIndex);
  const ok = idx === item.answer;
  return {
    correct: ok,
    correctAnswer: item.options[item.answer],
    userAnswer: item.options[idx] == null ? '' : item.options[idx],
    explanation: item.explain || '',
  };
}

export function judgeFill(item, text) {
  const norm = normalizeText(text);
  const answers = (item.answers || []).map(normalizeText);
  const ok = norm.length > 0 && answers.indexOf(norm) >= 0;
  return {
    correct: ok,
    correctAnswer: (item.answers || []).join(' / '),
    userAnswer: String(text == null ? '' : text).trim(),
    explanation: item.explain || '',
  };
}

export function judge(item, answer) {
  if (!item) return { correct: false, correctAnswer: '', userAnswer: '', explanation: '' };
  if (item.type === TYPE_FILL) return judgeFill(item, answer);
  return judgeMc(item, answer);
}

// 四选一题目：选项顺序打乱后仍能定位正确答案
export function prepareQuestion(q, rng = Math.random) {
  if (q.type === TYPE_MC) {
    const order = shuffle(q.options.map((_, i) => i), rng);
    return {
      id: q.id,
      topicId: q.topicId || '',
      type: q.type,
      stem: q.stem,
      hint: q.hint || '',
      options: order.map((i) => q.options[i]),
      answerIndex: order.indexOf(q.answer),
      raw: q,
    };
  }
  return {
    id: q.id,
    topicId: q.topicId || '',
    type: q.type,
    stem: q.stem,
    hint: q.hint || '',
    options: null,
    answerIndex: -1,
    raw: q,
  };
}

export function buildSession(questions, options = {}) {
  const rng = makeRng(options.seed == null ? 'dwt-default' : options.seed);
  const list = Array.isArray(questions) ? questions.slice() : [];
  const picked = (options.count && options.count < list.length)
    ? shuffle(list, rng).slice(0, options.count)
    : shuffle(list, rng);
  return picked.map((q) => prepareQuestion(q, rng));
}

export function answerOf(item) {
  if (item.type === TYPE_FILL) return (item.raw.answers || []).join(' / ');
  return item.options[item.answerIndex];
}

// 一次练习的整体判分
export function gradeSession(session, answers) {
  const details = [];
  let correct = 0;
  session.forEach((item, i) => {
    // 四选一按打乱后的选项判分，填空按原始答案键判分
    const res = item.type === TYPE_FILL
      ? judgeFill(item.raw, answers[i])
      : judgeMc({ options: item.options, answer: item.answerIndex, explain: item.raw.explain }, answers[i]);
    if (res.correct) correct += 1;
    details.push({
      questionId: item.id,
      topicId: item.topicId,
      type: item.type,
      stem: item.stem,
      userAnswer: res.userAnswer,
      correctAnswer: res.correctAnswer,
      explanation: res.explanation,
      correct: res.correct,
    });
  });
  return {
    total: session.length,
    correct,
    wrong: details.filter((d) => !d.correct),
    details,
    accuracy: session.length ? correct / session.length : 0,
  };
}
