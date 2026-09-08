// store 模块自检（内存后端，可重复运行）
import { createStore, createMemoryBackend, emptyDb, sanitizeDb, SCHEMA_VERSION, STORAGE_KEY } from '../core/store.js';
import { t, assert, eq } from './harness.js';

export const title = '持久化与数据结构';
export const results = [
  t('空库结构符合钉死的数据格式', () => {
    const db = emptyDb();
    eq(db.version, SCHEMA_VERSION, '结构版本');
    assert(db.profile && typeof db.profile.createdAt === 'number', '缺少 profile');
    assert(db.settings && typeof db.settings.timeOffsetMs === 'number', '缺少 settings');
    assert(db.states && typeof db.states === 'object', '缺少 states');
    assert(db.customCards && typeof db.customCards === 'object', '缺少 customCards');
    assert(Array.isArray(db.userDecks), 'userDecks 应为数组');
    assert(Array.isArray(db.events), 'events 应为数组');
    assert(Array.isArray(db.mistakes), 'mistakes 应为数组');
    assert(db.quizStats && typeof db.quizStats === 'object', '缺少 quizStats');
    assert(db.listeningStats && typeof db.listeningStats === 'object', '缺少 listeningStats');
  }),
  t('写入后可读回（往返一致）', () => {
    const backend = createMemoryBackend();
    const store = createStore(backend);
    store.update((db) => {
      db.states['b1:abholen'] = { id: 'b1:abholen', due: 123, lastReviewed: 1 };
      db.events.push({ ts: 1, type: 'card', correct: true });
      return db;
    });
    const reloaded = createStore(createMemoryBackend(JSON.parse(backend.getItem(STORAGE_KEY))));
    eq(reloaded.data.states['b1:abholen'].due, 123, '卡片状态未持久化');
    eq(reloaded.data.events.length, 1, '事件未持久化');
  }),
  t('损坏数据回退为空库而不抛错', () => {
    const backend = createMemoryBackend();
    backend.setItem(STORAGE_KEY, '{这不是合法 JSON');
    const store = createStore(backend);
    eq(store.data.version, SCHEMA_VERSION, '未回退到空库');
    eq(store.data.events.length, 0, '事件应为空');
  }),
  t('sanitizeDb 补齐缺失字段并过滤脏数据', () => {
    const db = sanitizeDb({
      version: 99,
      settings: { dailyGoal: -5, timeOffsetMs: 'x' },
      events: [{ ts: 1 }, null, 'bad', { ts: 3, type: 'quiz' }],
      mistakes: [null, { id: 'm1' }],
      userDecks: [{ id: 'u1' }, null],
      states: { a: { id: 'a' }, b: null },
    });
    eq(db.settings.dailyGoal, 30, '非法每日目标应回退默认值');
    eq(db.settings.timeOffsetMs, 0, '非法时间偏移应回退 0');
    eq(db.events.length, 2, '应过滤不合法事件');
    eq(db.mistakes.length, 1, '应过滤不合法错题');
    eq(db.userDecks.length, 1, '应过滤不合法卡组');
    eq(db.userDecks[0].name, '未命名卡组', '缺失名称应补默认值');
    eq(Object.keys(db.states).length, 1, '应过滤不合法状态');
  }),
  t('sanitizeDb 对 null / 非对象输入安全', () => {
    eq(sanitizeDb(null).version, SCHEMA_VERSION, 'null 输入');
    eq(sanitizeDb('abc').version, SCHEMA_VERSION, '字符串输入');
    eq(sanitizeDb(42).version, SCHEMA_VERSION, '数字输入');
  }),
  t('重置清空所有学习数据', () => {
    const store = createStore(createMemoryBackend());
    store.update((db) => { db.events.push({ ts: 1, type: 'card', correct: true }); return db; });
    store.reset();
    eq(store.data.events.length, 0, '重置后事件应为空');
    assert(store.data.profile.createdAt > 0, '重置后应写入创建时间');
  }),
  t('导出再导入可完整还原', () => {
    const store = createStore(createMemoryBackend());
    store.update((db) => {
      db.states['b1:abholen'] = { id: 'b1:abholen', due: 999 };
      db.events.push({ ts: 5, type: 'quiz', correct: false });
      return db;
    });
    const json = store.exportJson();
    const other = createStore(createMemoryBackend());
    const r = other.importJson(json);
    eq(r.ok, true, '导入失败');
    eq(other.data.states['b1:abholen'].due, 999, '卡片状态未还原');
    eq(other.data.events.length, 1, '事件未还原');
  }),
  t('导入非法文本返回明确错误', () => {
    const store = createStore(createMemoryBackend());
    const r = store.importJson('not-json');
    eq(r.ok, false, '应返回失败');
    assert(String(r.error).length > 0, '错误信息为空');
  }),
  t('事件流水超过上限时自动裁剪', () => {
    const db = sanitizeDb({
      events: Array.from({ length: 9000 }, (_, i) => ({ ts: i, type: 'card', correct: true })),
    });
    assert(db.events.length <= 8000, '事件上限失效：' + db.events.length);
    eq(db.events[db.events.length - 1].ts, 8999, '应保留最新的事件');
  }),
];
