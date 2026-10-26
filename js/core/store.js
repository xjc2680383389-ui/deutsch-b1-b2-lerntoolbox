// 持久化层：localStorage / 内存后端通用（纯逻辑，可注入后端，便于自检）
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'dwt.db.v1';
export const BEFORE_IMPORT_KEY = STORAGE_KEY + '.before-import';
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export function emptyDb() {
  return {
    version: SCHEMA_VERSION,
    profile: { createdAt: 0 },
    settings: {
      dailyGoal: 30,      // 每日目标（次）
      timeOffsetMs: 0,    // 时间机器：虚拟推进的毫秒数（用于跨天复习模拟）
      ttsRate: 0.9,       // 朗读语速
      lastDeckId: 'b1',
      lastTopicId: '',
      demoSeeded: false, // 演示数据只写入一次的标记
    },
    states: {},           // 卡片调度状态：cardId -> state
    customCards: {},      // 用户自建词条：cardId -> card
    userDecks: [],        // 用户自建卡组：[{id,name,level}]
    events: [],           // 学习事件流水
    mistakes: [],         // 错题本
    quizStats: {},        // topicId -> {attempts, correct}
    listeningStats: {},   // sentenceId -> {plays: 自检提交次数（历史字段名）, best: 0/100 通过标记}
  };
}

const MAX_EVENTS = 8000;

function checkBackupSize(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('备份必须是 UTF-8 文本，且不能超过 10 MiB；现有学习记录未修改。');
  }
}

function validateBackup(raw) {
  const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const name = (v) => typeof v === 'string' && v.trim().length > 0;
  const safeId = (v) => name(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
  const numeric = (v) => typeof v === 'number' && Number.isFinite(v);
  const count = (v) => Number.isSafeInteger(v) && v >= 0;
  const require = (ok, field) => { if (!ok) throw new Error('备份字段无效或缺失：' + field + '；现有学习记录未修改。'); };
  require(record(raw), '根对象');
  require(raw.version === SCHEMA_VERSION, 'version（仅支持完整 v1 备份）');
  for (const key of ['profile', 'settings', 'states', 'customCards', 'quizStats', 'listeningStats']) require(record(raw[key]), key);
  for (const key of ['userDecks', 'events', 'mistakes']) require(Array.isArray(raw[key]), key);
  require(numeric(raw.profile.createdAt), 'profile.createdAt');
  for (const [key, value] of Object.entries(emptyDb().settings)) {
    const actual = raw.settings[key];
    require(typeof actual === typeof value && (typeof value !== 'number' || numeric(actual)), 'settings.' + key);
  }
  require(raw.settings.dailyGoal > 0 && raw.settings.ttsRate > 0, 'settings');
  const deckIds = new Set();
  raw.userDecks.forEach((v, index) => {
    require(record(v) && safeId(v.id) && !['b1', 'b2'].includes(v.id) && !deckIds.has(v.id) &&
      typeof v.name === 'string' && typeof v.level === 'string', 'userDecks.' + index);
    deckIds.add(v.id);
  });
  const entries = (key, check) => Object.entries(raw[key]).forEach(([id, value]) => {
    require(safeId(id) && record(value) && check(value, id), key + '.' + id);
  });
  // 非空记录必须能进入队列并完成下一次评分；不能猜测缺失的学习进度或卡组。
  entries('states', (v, id) => v.id === id && numeric(v.ef) && v.ef >= 1.3 && v.ef <= 3 &&
    ['interval', 'due', 'lastReviewed'].every((key) => numeric(v[key]) && v[key] >= 0) &&
    ['reps', 'lapses', 'totalReviews'].every((key) => count(v[key])) &&
    [-1, 0, 1, 2].includes(v.lastRating) && Array.isArray(v.history) &&
    v.history.every((h) => record(h) && numeric(h.at) && h.at >= 0 && [0, 1, 2].includes(h.rating)));
  entries('customCards', (v, id) => v.id === id && deckIds.has(v.deckId) && name(v.term) && name(v.zh) &&
    ['pos', 'example', 'exZh', 'level'].every((key) => !(key in v) || typeof v[key] === 'string'));
  entries('quizStats', (v) => numeric(v.attempts) && numeric(v.correct));
  entries('listeningStats', (v) => numeric(v.plays) && numeric(v.best));
  require(raw.events.length <= MAX_EVENTS && raw.events.every((v) => record(v) && numeric(v.ts)), 'events 条目或数量');
  require(raw.mistakes.every((v) => record(v) && name(v.id)), 'mistakes 条目');
}

export function sanitizeDb(raw) {
  const db = emptyDb();
  if (!raw || typeof raw !== 'object') return db;
  if (typeof raw.version === 'number') db.version = raw.version;
  if (raw.profile && typeof raw.profile === 'object') {
    db.profile.createdAt = Number(raw.profile.createdAt) || 0;
  }
  if (raw.settings && typeof raw.settings === 'object') {
    const s = raw.settings;
    db.settings.dailyGoal = Number(s.dailyGoal) > 0 ? Number(s.dailyGoal) : 30;
    db.settings.timeOffsetMs = Number(s.timeOffsetMs) || 0;
    db.settings.ttsRate = Number(s.ttsRate) > 0 ? Number(s.ttsRate) : 0.9;
    db.settings.lastDeckId = String(s.lastDeckId || 'b1');
    db.settings.lastTopicId = String(s.lastTopicId || '');
    db.settings.demoSeeded = !!s.demoSeeded;
  }
  if (raw.states && typeof raw.states === 'object') {
    Object.keys(raw.states).forEach((k) => {
      const v = raw.states[k];
      if (v && typeof v === 'object') db.states[k] = v;
    });
  }
  if (raw.customCards && typeof raw.customCards === 'object') {
    Object.keys(raw.customCards).forEach((k) => {
      const v = raw.customCards[k];
      if (v && typeof v === 'object' && v.term) db.customCards[k] = v;
    });
  }
  if (Array.isArray(raw.userDecks)) {
    db.userDecks = raw.userDecks
      .filter((d) => d && typeof d === 'object' && d.id)
      .map((d) => ({ id: String(d.id), name: String(d.name || '未命名卡组'), level: String(d.level || '自定义') }));
  }
  if (Array.isArray(raw.events)) {
    db.events = raw.events
      .filter((e) => e && typeof e === 'object' && typeof e.ts === 'number')
      .slice(-MAX_EVENTS);
  }
  if (Array.isArray(raw.mistakes)) {
    db.mistakes = raw.mistakes.filter((m) => m && typeof m === 'object' && m.id);
  }
  if (raw.quizStats && typeof raw.quizStats === 'object') {
    Object.keys(raw.quizStats).forEach((k) => {
      const v = raw.quizStats[k];
      if (v && typeof v === 'object') {
        db.quizStats[k] = { attempts: Number(v.attempts) || 0, correct: Number(v.correct) || 0 };
      }
    });
  }
  if (raw.listeningStats && typeof raw.listeningStats === 'object') {
    Object.keys(raw.listeningStats).forEach((k) => {
      const v = raw.listeningStats[k];
      if (v && typeof v === 'object') {
        db.listeningStats[k] = { plays: Number(v.plays) || 0, best: Number(v.best) || 0 };
      }
    });
  }
  return db;
}

export function createMemoryBackend(initial) {
  const values = new Map(initial == null ? [] : [[STORAGE_KEY, JSON.stringify(initial)]]);
  return {
    getItem: (key = STORAGE_KEY) => values.get(key) ?? null,
    setItem: (key, v) => { values.set(key, String(v)); },
    removeItem: (key = STORAGE_KEY) => { values.delete(key); },
  };
}

export function createStore(backend, onSaveError = () => {}) {
  let lastSaveOk = true;
  let db = sanitizeDb(readRaw(backend));
  if (!db.profile.createdAt) {
    db.profile.createdAt = Date.now();
    persist();
  }

  function readRaw(bk) {
    try {
      const t = bk.getItem(STORAGE_KEY);
      return t ? JSON.parse(t) : null;
    } catch (err) {
      return null; // 数据损坏时回退到空库，保证程序可用
    }
  }

  function persist() {
    try {
      backend.setItem(STORAGE_KEY, JSON.stringify(db));
      return (lastSaveOk = true);
    } catch (err) {
      lastSaveOk = false;
      onSaveError(err);
      return false;
    }
  }

  return {
    get data() { return db; },
    get lastSaveOk() { return lastSaveOk; },
    load() { db = sanitizeDb(readRaw(backend)); return db; },
    save() { return persist(); },
    update(fn) {
      // 写入前刷新其他标签保存的内容；读取失败时不覆盖旧数据。
      try {
        const text = backend.getItem(STORAGE_KEY);
        db = sanitizeDb(text ? JSON.parse(text) : null);
        if (!db.profile.createdAt) db.profile.createdAt = Date.now();
      } catch (err) {
        lastSaveOk = false;
        onSaveError(err);
        return db;
      }
      const previous = JSON.stringify(db);
      const next = fn(db);
      if (next && typeof next === 'object') db = next;
      if (!persist()) db = JSON.parse(previous);
      return db;
    },
    reset() {
      const previous = db;
      db = emptyDb();
      db.profile.createdAt = Date.now();
      if (!persist()) db = previous;
      return db;
    },
    exportJson() {
      const text = JSON.stringify(db, null, 2);
      checkBackupSize(text);
      return text;
    },
    exportBeforeImport() { return backend.getItem(BEFORE_IMPORT_KEY); },
    importJson(text) {
      let parsed = null;
      try { checkBackupSize(text); } catch (err) { return { ok: false, error: err.message }; }
      try { parsed = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (err) { return { ok: false, error: '不是合法的 JSON 文本' }; }
      try { validateBackup(parsed); } catch (err) { return { ok: false, error: err.message }; }
      const previous = db;
      try {
        // 先保存主库的最新原文；快照失败时禁止覆盖。只保留最近一次导入前快照。
        const current = backend.getItem(STORAGE_KEY);
        backend.setItem(BEFORE_IMPORT_KEY, current === null ? JSON.stringify(db) : current);
      } catch (err) {
        lastSaveOk = false;
        onSaveError(err);
        return { ok: false, error: '无法保存导入前快照，请先导出备份并检查存储空间；现有学习记录未修改' };
      }
      db = sanitizeDb(parsed);
      if (!persist()) {
        db = previous;
        return { ok: false, error: '无法保存到浏览器，请检查存储权限或可用空间' };
      }
      return { ok: true };
    },
  };
}
