// 词库解析（纯逻辑，不依赖 DOM）
// 原始格式：单词|词性|中文释义|例句|例句中文
export function parseVocab(raw, level, deckId) {
  const out = [];
  String(raw || '').split('\n').forEach((line) => {
    const text = line.trim();
    if (!text || text.startsWith('#')) return;
    const parts = text.split('|').map((s) => (s == null ? '' : String(s).trim()));
    if (parts.length < 4) return;
    const term = parts[0];
    if (!term) return;
    out.push({
      term,
      pos: parts[1] || '',
      zh: parts[2] || '',
      example: parts[3] || '',
      exZh: parts[4] || '',
      level,
      deckId,
    });
  });
  return out;
}

export function makeCard(v) {
  return {
    id: `${v.deckId}:${v.term}`,
    deckId: v.deckId,
    term: v.term,
    pos: v.pos,
    zh: v.zh,
    example: v.example,
    exZh: v.exZh,
    level: v.level,
  };
}

export function parseDeck(raw, level, deckId) {
  return parseVocab(raw, level, deckId).map(makeCard);
}
