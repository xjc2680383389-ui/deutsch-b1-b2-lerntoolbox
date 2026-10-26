// store 模块自检（内存后端，可重复运行）
import { createStore, createMemoryBackend, emptyDb, sanitizeDb, SCHEMA_VERSION, STORAGE_KEY, BEFORE_IMPORT_KEY } from '../core/store.js';
import { createState, buildReviewQueue, schedule } from '../core/srs.js';
import { t, assert, eq } from './harness.js';

export const title = '持久化与数据结构';

function cardBackup() {
  const db = emptyDb();
  db.profile.createdAt = 1;
  db.states['b1:abholen'] = createState('b1:abholen');
  db.userDecks = [{ id: 'u', name: '自建卡组', level: 'B1' }];
  db.customCards['u:Test'] = { id: 'u:Test', deckId: 'u', term: 'Test', zh: '测试' };
  return db;
}

export const results = [
  t('残缺状态、自建卡和错误归属在任何写入前拒绝，重复导入也保留旧快照', () => {
    const mutations = [
      (db) => { db.states['b1:abholen'] = {}; },
      ...Object.keys(createState('b1:abholen')).map((key) => (db) => { delete db.states['b1:abholen'][key]; }),
      (db) => { db.states['b1:abholen'].id = 'b1:other'; },
      (db) => { db.customCards['u:Test'] = { term: 'Test' }; },
      ...['id', 'deckId', 'term', 'zh'].map((key) => (db) => { delete db.customCards['u:Test'][key]; }),
      (db) => { db.customCards['u:Test'].id = 'u:other'; },
      (db) => { db.customCards['u:Test'].deckId = 'missing'; },
      (db) => { db.customCards['u:Test'].deckId = 'b1'; },
      (db) => { db.customCards['u:Test'].term = ' '; },
      (db) => { db.customCards['u:Test'].zh = ''; },
      (db) => { db.userDecks.push({ ...db.userDecks[0] }); },
      (db) => { db.userDecks[0].id = 'b1'; },
      (db) => { db.userDecks[0].id = '__proto__'; },
    ];
    mutations.forEach((mutate, index) => {
      const initial = cardBackup(); initial.events = [{ ts: 42 }];
      const backend = createMemoryBackend(initial), store = createStore(backend);
      backend.setItem(BEFORE_IMPORT_KEY, '原恢复快照');
      const before = backend.getItem(STORAGE_KEY), memory = store.exportJson();
      const candidate = cardBackup(); mutate(candidate);
      const set = backend.setItem; let writes = 0;
      backend.setItem = (key, value) => { writes += 1; set(key, value); };
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const r = store.importJson(JSON.stringify(candidate));
        eq(r.ok, false, '拒绝残缺样本 ' + index);
        assert(/states\.|customCards\.|userDecks\./.test(r.error), '错误定位到记录');
        eq(backend.getItem(STORAGE_KEY), before, '主库原文不变');
        eq(store.exportJson(), memory, '内存库不变');
        eq(store.exportBeforeImport(), '原恢复快照', '已有快照不变');
      }
      eq(writes, 0, '拒绝前没有任何写入');
    });
  }),
  t('调度字段的错误类型、数值域和历史评分不能导入', () => {
    const bad = [
      ['ef', 0], ['ef', 3.1], ['ef', '2.5'], ['interval', -1], ['due', null],
      ['lastReviewed', -1], ['reps', 0.5], ['lapses', -1], ['totalReviews', Number.MAX_SAFE_INTEGER + 1],
      ['lastRating', 3], ['history', null], ['history', [{ at: 0, rating: -1 }]],
      ['history', [{ at: -1, rating: 2 }]], ['history', [{ at: 0, rating: '2' }]],
    ];
    bad.forEach(([key, value]) => {
      const candidate = cardBackup(); candidate.states['b1:abholen'][key] = value;
      const store = createStore(createMemoryBackend());
      eq(store.importJson(JSON.stringify(candidate)).ok, false, '拒绝非法 ' + key);
    });
  }),
  t('完整卡片导入重载后可复习、可归组，三档评分仍可备份往返', () => {
    const initial = cardBackup();
    initial.states['b1:abholen'] = { ...createState('b1:abholen'), lastReviewed: 1, due: 123 };
    const store = createStore(createMemoryBackend());
    eq(store.importJson('\uFEFF' + JSON.stringify(initial)).ok, true, '完整数据兼容 BOM');
    store.load();
    const custom = Object.values(store.data.customCards).filter((c) => c.deckId === 'u');
    eq(custom.length, 1, '自建卡可按卡组访问');
    const cards = [{ id: 'b1:abholen', deckId: 'b1' }, ...custom];
    eq(buildReviewQueue(cards, store.data.states, 1000).map((c) => c.id).join(','), 'b1:abholen,u:Test', '到期卡和新卡均进入队列');
    for (const rating of [0, 1, 2]) {
      const next = schedule(store.data.states['b1:abholen'], rating, 1000);
      ['ef', 'interval', 'reps', 'lapses', 'due', 'lastReviewed', 'totalReviews'].forEach((key) => assert(Number.isFinite(next[key]), '评分后 ' + key + ' 有限'));
      const candidate = cardBackup(); candidate.states['b1:abholen'] = next;
      eq(store.importJson(JSON.stringify(candidate)).ok, true, '真实评分状态可再次导入');
      store.load();
      eq(store.data.states['b1:abholen'].lastRating, rating, '评分保留');
    }
    eq(store.importJson(JSON.stringify(emptyDb())).ok, true, '完整空库仍可导入');
  }),
  t('无效备份的结构、版本、字段或条目错误均不能覆盖原库', () => {
    const mutations = [() => ({}), () => null, () => [], () => 'text',
      (db) => { db.version = 99; return db; },
      (db) => { db.version = '1'; return db; },
      (db) => { db.states = null; return db; },
      (db) => { db.settings = []; return db; },
      (db) => { db.events = {}; return db; },
      (db) => { db.userDecks = null; return db; },
      (db) => { db.userDecks = [null]; return db; },
      (db) => { db.events = [{ ts: 'bad' }]; return db; },
      (db) => { db.customCards = { a: { term: '' } }; return db; },
      (db) => { db.states = JSON.parse('{"__proto__":{}}'); return db; },
      (db) => { db.settings.dailyGoal = '30'; return db; },
      ...Object.keys(emptyDb()).map((key) => (db) => { delete db[key]; return db; })];
    mutations.forEach((mutate, index) => {
      const initial = emptyDb();
      initial.profile.createdAt = 1; initial.events = [{ ts: 42 }];
      const backend = createMemoryBackend(initial), store = createStore(backend);
      const before = backend.getItem(STORAGE_KEY), memory = store.exportJson();
      eq(store.importJson(JSON.stringify(mutate(emptyDb()))).ok, false, '拒绝无效样本 ' + index);
      eq(backend.getItem(STORAGE_KEY), before, '原持久化数据不变');
      eq(store.exportJson(), memory, '原内存数据不变');
    });
  }),
  t('导入前快照保存最新持久化记录，并可再次导入恢复', () => {
    const backend = createMemoryBackend(), store = createStore(backend);
    const other = createStore(backend);
    other.update((db) => { db.events.push({ ts: 42 }); return db; });
    const before = backend.getItem(STORAGE_KEY);
    eq(store.importJson(JSON.stringify(emptyDb())).ok, true, '导入成功');
    eq(store.data.events.length, 0, '新库已写入');
    eq(store.exportBeforeImport(), before, '快照包含另一实例的最新事件');
    eq(store.importJson(store.exportBeforeImport()).ok, true, '恢复快照');
    eq(store.data.events[0].ts, 42, '原事件恢复');
  }),
  t('快照写失败时不继续导入，主库写失败时保留内存和持久化原库', () => {
    for (const failAt of [1, 2]) {
      const initial = emptyDb(); initial.profile.createdAt = 1; initial.events = [{ ts: 42 }];
      const backend = createMemoryBackend(initial), store = createStore(backend);
      const before = backend.getItem(STORAGE_KEY), set = backend.setItem;
      let writes = 0;
      backend.setItem = (key, value) => { if (++writes === failAt) throw new Error('quota'); set(key, value); };
      eq(store.importJson(JSON.stringify(emptyDb())).ok, false, '报告失败');
      eq(writes, failAt, '快照失败不能继续写主库');
      eq(backend.getItem(STORAGE_KEY), before, '原持久化库不变');
      eq(store.data.events[0].ts, 42, '原内存库不变');
    }
  }),
  t('备份往返保留全部 v1 字段，含原始发行版的听力字段', () => {
    const initial = emptyDb(); initial.profile.createdAt = 1;
    initial.states.a = { ...createState('a'), due: 123 };
    initial.customCards.a = { id: 'a', term: '测试😀', deckId: 'u', zh: '测试' };
    initial.userDecks = [{ id: 'u', name: '测试', level: 'B1' }];
    initial.events = [{ ts: 42 }]; initial.mistakes = [{ id: 'm' }];
    initial.quizStats.q = { attempts: 3, correct: 2 }; initial.listeningStats.l = { plays: 4, best: 100 };
    const source = createStore(createMemoryBackend(initial));
    const target = createStore(createMemoryBackend());
    eq(target.importJson('\uFEFF' + source.exportJson()).ok, true, '兼容 UTF-8 BOM 文本');
    eq(target.exportJson(), source.exportJson(), '全字段完整往返');
  }),
  t('超过 10 MiB 的 UTF-8 备份不能导入或导出，原记录不变', () => {
    const backend = createMemoryBackend(), store = createStore(backend);
    const large = emptyDb(); large.customCards.a = { term: '德'.repeat(4 * 1024 * 1024) };
    const before = backend.getItem(STORAGE_KEY);
    eq(store.importJson(JSON.stringify(large)).ok, false, '按 UTF-8 字节拒绝大备份');
    eq(backend.getItem(STORAGE_KEY), before, '原库不变');
    const largeStore = createStore(createMemoryBackend(large));
    let rejected = false;
    try { largeStore.exportJson(); } catch { rejected = true; }
    assert(rejected, '不能导出无法回导的超限备份');
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
    eq(store.importJson(JSON.stringify(emptyDb())).ok, false, '合法备份写入失败');
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
      db.states['b1:abholen'] = { ...createState('b1:abholen'), due: 999 };
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
