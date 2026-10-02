// 听力页面与状态模块联动：最小 DOM/TTS 替身，无第三方依赖。
import { store } from '../ui/state.js';
import { render as renderListening } from '../ui/page_listening.js';
import { render as renderStats } from '../ui/page_stats.js';
import { LISTENING } from '../data/index.js';
import { createMemoryBackend } from '../core/store.js';
import { judgeListening } from '../core/listening.js';
import { t, assert, eq } from './harness.js';

const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime();
export const title = '听力播放、自检与统计联动';

function runTests() {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const savedNow = Date.now;
  const savedDb = store.exportJson();
  const backend = createMemoryBackend();
  let elements = new Map();
  let html = '';
  let spoken = 0;
  const root = {
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; elements = new Map(); },
    querySelectorAll: () => [],
  };
  const fakeDocument = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        value: '',
        handlers: {},
        classList: { add() {}, remove() {} },
        addEventListener(type, handler) { this.handlers[type] = handler; },
      });
      return elements.get(selector);
    },
    querySelectorAll: () => [],
  };
  const fakeWindow = {
    localStorage: backend,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  };

  function fire(selector, type, event) {
    const node = elements.get(selector);
    assert(node && node.handlers[type], selector + ' 缺少 ' + type + ' 处理器');
    node.handlers[type](event || {});
  }

  function reset(mode) {
    store.reset();
    spoken = 0;
    fakeWindow.speechSynthesis = mode === 'unsupported' ? undefined : {
      cancel() {},
      speak() { spoken += 1; if (mode === 'throws') throw new Error('测试播放失败'); },
      getVoices: () => [{ lang: 'de-DE' }],
    };
    renderListening(root);
    fire('#clear-btn', 'click'); // 清除页面模块在上一项中保留的听写输入和结果。
  }

  function submit(text, enter) {
    elements.get('#dictation').value = text;
    fire('#dictation', 'input');
    if (enter) fire('#dictation', 'keydown', { key: 'Enter' });
    else fire('#check-btn', 'click');
  }

  function listeningStat() { return store.data.listeningStats[LISTENING[0].id]; }

  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: fakeWindow });
    Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: fakeDocument });
    Date.now = () => T0;
    return [
      t('正常与慢速播放成功或失败均不写学习记录', () => {
        ['supported', 'unsupported', 'throws'].forEach((mode) => {
          reset(mode);
          fire('#play-btn', 'click');
          fire('#play-slow', 'click');
          eq(spoken, mode === 'unsupported' ? 0 : 2, '语音调用数');
          eq(store.data.events.length, 0, '播放不产生学习事件');
          eq(Object.keys(store.data.listeningStats).length, 0, '播放不增加自检次数');
          assert(html.includes('已自检 0 次'), '页面应显示自检次数');
        });
      }),
      t('按钮提交失败听写只写一次自检事件并收集错题', () => {
        reset();
        submit('xyz');
        eq(listeningStat().plays, 1, '自检次数');
        eq(store.data.events.length, 1, '事件数');
        eq(store.data.events[0].ts, T0, '注入时钟');
        eq(store.data.events[0].type, 'listening', '事件类型');
        eq(store.data.events[0].topic, LISTENING[0].id, '句子 ID');
        eq(store.data.events[0].correct, false, '未通过结果');
        eq(store.data.mistakes.length, 1, '非空错误听写入错题本');
        assert(html.includes('已自检 1 次') && html.includes('尚未通过'), '次数与通过状态');
      }),
      t('Enter 自检保留通过标记并避免显示虚假的最佳分数', () => {
        reset();
        const partial = LISTENING[0].de.split(/\s+/).slice(0, -1).join(' ');
        const result = judgeListening(LISTENING[0].de, partial);
        assert(result.passed && result.score < 1, '固定输入应通过但未满分');
        submit(partial, true);
        eq(listeningStat().plays, 1, 'Enter 自检次数');
        eq(listeningStat().best, 100, '保留 v1 通过标记');
        eq(store.data.events[0].correct, true, '通过事件');
        eq(store.data.mistakes.length, 0, '通过不收集错题');
        assert(html.includes('曾通过'), '通过状态');
        assert(!html.includes('最佳'), '不能把通过标记描述为最佳分数');
      }),
      t('空答案按钮或 Enter 提交均计失败但不收集错题', () => {
        reset();
        submit('   ');
        submit('', true);
        eq(listeningStat().plays, 2, '空答案逐次计数');
        eq(store.data.events.length, 2, '空答案事件数');
        assert(store.data.events.every((e) => e.correct === false), '空答案均判失败');
        eq(store.data.mistakes.length, 0, '空答案不收集错题');
      }),
      t('同一听写答案重复提交仍逐次计数', () => {
        reset();
        submit(LISTENING[0].de);
        submit(LISTENING[0].de);
        eq(listeningStat().plays, 2, '重复自检次数');
        eq(store.data.events.length, 2, '重复自检事件数');
        assert(html.includes('已自检 2 次'), '次数应与实际提交一致');
      }),
      t('统计页面说明听力参与正确率并标明自检事件', () => {
        reset();
        submit('xyz');
        store.update((db) => { db.events.push({ ts: T0, type: 'quiz', topic: 'test', correct: true }); return db; });
        renderStats(root);
        assert(html.includes('50%'), '听力失败应进入正确率分母');
        assert(html.includes('包含背卡、语法练习和听力自检'), '正确率范围说明');
        assert(html.includes('<td>听力自检</td>'), '最近记录应标明自检');
      }),
      t('旧听力记录重载后展示自检次数和历史通过状态', () => {
        reset();
        store.update((db) => { db.listeningStats[LISTENING[0].id] = { plays: 7, best: 100 }; return db; });
        store.load();
        renderListening(root);
        assert(html.includes('已自检 7 次') && html.includes('曾通过'), '旧字段展示');
        assert(!html.includes('已播放') && !html.includes('最佳'), '移除误导文案');
      }),
    ];
  } finally {
    store.importJson(savedDb);
    Date.now = savedNow;
    if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow);
    else delete globalThis.window;
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument);
    else delete globalThis.document;
  }
}

export const results = runTests();
