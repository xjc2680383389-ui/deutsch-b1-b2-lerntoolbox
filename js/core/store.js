// 持久化层：localStorage / 内存后端通用（纯逻辑，可注入后端，便于自检）
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'dwt.db.v1';

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
    listeningStats: {},   // sentenceId -> {plays, best}
  };
}

const MAX_EVENTS = 8000;

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
  let text = initial == null ? null : JSON.stringify(initial);
  return {
    getItem: () => text,
    setItem: (key, v) => { text = String(v); },
    removeItem: () => { text = null; },
  };
}

export function createStore(backend) {
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
      return true;
    } catch (err) {
      return false;
    }
  }

  return {
    get data() { return db; },
    load() { db = sanitizeDb(readRaw(backend)); return db; },
    save() { return persist(); },
    update(fn) {
      const next = fn(db);
      if (next && typeof next === 'object') db = next;
      persist();
      return db;
    },
    reset() { db = emptyDb(); db.profile.createdAt = Date.now(); persist(); return db; },
    exportJson() { return JSON.stringify(db, null, 2); },
    importJson(text) {
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (err) { return { ok: false, error: '不是合法的 JSON 文本' }; }
      db = sanitizeDb(parsed);
      persist();
      return { ok: true };
    },
  };
}
