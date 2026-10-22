// store 模块自检（内存后端，可重复运行）
import { createStore, createMemoryBackend, emptyDb, sanitizeDb, SCHEMA_VERSION, STORAGE_KEY } from '../core/store.js';
import { t, assert, eq } from './harness.js';
import { createState, schedule, RATING, DAY_MS } from '../core/srs.js';

export const title = '持久化与数据结构';
export const results = [
  t('DHP 状态、终点及旧进度可以保存重载与备份往返', () => {
    const store = createStore(createMemoryBackend());
    let s = createState('a');
    for (let i = 0; i < 6; i++) s = schedule(s, RATING.KNOWN, i ? s.due : 1767258000000);
    const legacy = { id: 'old', ef: 2.5, due: 1767258000000 + DAY_MS, totalReviews: 9, history: [] };
    store.update((db) => { db.states.a = s; db.states.old = legacy; return db; });
    store.load();
    const other = createStore(createMemoryBackend());
    eq(other.importJson(store.exportJson()).ok, true);
    other.load();
    eq(JSON.stringify(other.data.states.a), JSON.stringify(s));
    eq(JSON.stringify(other.data.states.old), JSON.stringify(legacy));
    eq(other.data.states.a.memoryTargetReached, true);
    assert(Number.isFinite(other.data.states.a.due));
  }),
  t('多个实例交替写入保留其他实例的新事件', () => {
    const backend = createMemoryBackend();
    const a = createStore(backend), b = createStore(backend);
    a.update((db) => { db.events.push({ ts: 1 }); return db; });
    b.update((db) => { db.events.push({ ts: 2 }); return db; });
    a.update((db) => { db.events.push({ ts: 3 }); return db; });
    b.load();
    eq(b.data.events.length, 3, '保留所有事件');
  }),
  t('保存失败回滚修改并报告错误，恢复后可重试', () => {
    const backend = createMemoryBackend();
    let errors = 0;
    const store = createStore(backend, () => { errors += 1; });
    const savedSet = backend.setItem;
    backend.setItem = () => { throw new Error('quota'); };
    store.update((db) => { db.events.push({ ts: 1 }); return db; });
    eq(store.lastSaveOk, false, '失败结果');
    eq(store.data.events.length, 0, '回滚修改');
    eq(errors, 1, '错误通知');
    backend.setItem = savedSet;
    store.update((db) => { db.events.push({ ts: 2 }); return db; });
    eq(store.lastSaveOk, true, '恢复成功');
    eq(store.data.events.length, 1, '只记录成功写入');
  }),
  t('导入和清空保存失败保留原数据', () => {
    const backend = createMemoryBackend({ profile: { createdAt: 1 }, events: [{ ts: 1 }] });
    const store = createStore(backend);
    backend.setItem = () => { throw new Error('denied'); };
    eq(store.importJson('{}').ok, false, '导入失败');
    eq(store.data.events.length, 1, '保留原数据');
    store.reset();
    eq(store.lastSaveOk, false, '清空失败');
    eq(store.data.events.length, 1, '保留原数据');
  }),
  t('读取失败不覆盖旧存储', () => {
    const backend = createMemoryBackend({ profile: { createdAt: 1 }, events: [{ ts: 1 }] });
    const store = createStore(backend);
    let writes = 0;
    backend.getItem = () => { throw new Error('denied'); };
    backend.setItem = () => { writes += 1; };
    store.update((db) => { db.events.push({ ts: 2 }); return db; });
    eq(writes, 0, '不覆盖');
    eq(store.data.events.length, 1, '保留旧数据');
    eq(store.lastSaveOk, false, '失败结果');
  }),
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
  t('旧版听力自检字段经清洗和重载仍保持原值', () => {
    const initial = {
      version: 1,
      profile: { createdAt: 1 },
      listeningStats: { l01: { plays: 7, best: 100 }, l02: { plays: 3, best: 0 } },
    };
    const cleaned = sanitizeDb(initial);
    eq(cleaned.listeningStats.l01.plays, 7, '历史自检次数');
    eq(cleaned.listeningStats.l01.best, 100, '曾通过标记');
    eq(cleaned.listeningStats.l02.best, 0, '尚未通过标记');
    const store = createStore(createMemoryBackend(initial));
    store.load();
    eq(store.data.listeningStats.l01.plays, 7, '重载不能把次数清零');
    eq(store.data.version, 1, '结构版本保持 v1');
  }),
  t('听力自检次数和事件经备份往返保持一致', () => {
    const store = createStore(createMemoryBackend({
      profile: { createdAt: 1 },
      listeningStats: { l01: { plays: 2, best: 100 } },
      events: [
        { ts: 10, type: 'listening', topic: 'l01', correct: false },
        { ts: 11, type: 'listening', topic: 'l01', correct: true },
      ],
    }));
    const restored = createStore(createMemoryBackend());
    eq(restored.importJson(store.exportJson()).ok, true, '导入成功');
    restored.load();
    eq(restored.data.listeningStats.l01.plays, 2, '自检次数');
    eq(restored.data.listeningStats.l01.best, 100, '通过标记');
    eq(restored.data.events.length, 2, '听力自检事件数');
    eq(restored.data.events[1].correct, true, '自检通过结果');
    eq(JSON.stringify(restored.data.listeningStats), JSON.stringify(store.data.listeningStats), '听力字段往返');
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
