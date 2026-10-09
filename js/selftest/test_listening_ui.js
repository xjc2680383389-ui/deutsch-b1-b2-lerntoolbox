// 听力页面与状态模块联动：最小 DOM/TTS 替身，无第三方依赖。
import { store } from '../ui/state.js';
import { render as renderListening, dispose as disposeListening } from '../ui/page_listening.js';
import { render as renderStats } from '../ui/page_stats.js';
import { LISTENING } from '../data/index.js';
import { createMemoryBackend } from '../core/store.js';
import { judgeListening } from '../core/listening.js';
import { tAsync, assert, eq } from './harness.js';

const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime();
export const title = '听力播放、自检与统计联动';

async function runTests() {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const savedNow = Date.now;
  const savedDb = store.exportJson();
  const backend = createMemoryBackend();
  let elements = new Map();
  let html = '';
  let spoken = 0;
  let utterances = [];
  let voiceHandlers = [];
  const root = {
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; elements = new Map(); },
    querySelector: (selector) => fakeDocument.querySelector(selector),
    querySelectorAll: () => [],
  };
  const fakeDocument = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        value: '',
        innerHTML: '',
        textContent: '',
        handlers: {},
        classList: { add() {}, remove() {} },
        addEventListener(type, handler) { (this.handlers[type] ||= []).push(handler); },
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
    return Promise.all(node.handlers[type].map((handler) => handler(Object.assign({ preventDefault() {} }, event))));
  }

  function shown() { return html + Array.from(elements.values()).map((node) => node.innerHTML + node.textContent).join(''); }

  function reset(mode) {
    store.reset();
    spoken = 0;
    utterances = [];
    delete fakeWindow.navigator;
    fakeWindow.speechSynthesis = mode === 'unsupported' ? undefined : {
      cancel() {},
      speak(u) { spoken += 1; utterances.push(u); if (mode === 'throws') throw new Error('测试播放失败'); },
      getVoices: () => [{ lang: 'de-DE' }],
      addEventListener(type, handler) { if (type === 'voiceschanged') voiceHandlers.push(handler); },
      removeEventListener(type, handler) { voiceHandlers = voiceHandlers.filter((h) => h !== handler); },
    };
    renderListening(root);
    fire('#clear-btn', 'click'); // 清除页面模块在上一项中保留的听写输入和结果。
  }

  async function submit(text, enter) {
    elements.get('#dictation').value = text;
    await fire('#dictation', 'input');
    if (enter) await fire('#dictation', 'keydown', { key: 'Enter' });
    else await fire('#check-btn', 'click');
  }

  function listeningStat() { return store.data.listeningStats[LISTENING[0].id]; }

  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: fakeWindow });
    Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: fakeDocument });
    Date.now = () => T0;
    return [
      await tAsync('正常与慢速播放成功或失败均不写学习记录', async () => {
        ['supported', 'unsupported', 'throws'].forEach((mode) => {
          reset(mode);
          fire('#play-btn', 'click');
          fire('#play-slow', 'click');
          eq(spoken, mode === 'unsupported' ? 0 : 2, '语音调用数');
          eq(store.data.events.length, 0, '播放不产生学习事件');
          eq(Object.keys(store.data.listeningStats).length, 0, '播放不增加自检次数');
          assert(shown().includes('已自检 0 次'), '页面应显示自检次数');
        });
      }),
      await tAsync('按钮提交失败听写只写一次自检事件并收集错题', async () => {
        reset();
        await submit('xyz');
        eq(listeningStat().plays, 1, '自检次数');
        eq(store.data.events.length, 1, '事件数');
        eq(store.data.events[0].ts, T0, '注入时钟');
        eq(store.data.events[0].type, 'listening', '事件类型');
        eq(store.data.events[0].topic, LISTENING[0].id, '句子 ID');
        eq(store.data.events[0].correct, false, '未通过结果');
        eq(store.data.mistakes.length, 1, '非空错误听写入错题本');
        assert(shown().includes('已自检 1 次') && shown().includes('尚未通过'), '次数与通过状态');
      }),
      await tAsync('Enter 自检保留通过标记并避免显示虚假的最佳分数', async () => {
        reset();
        const partial = LISTENING[0].de.split(/\s+/).slice(0, -1).join(' ');
        const result = judgeListening(LISTENING[0].de, partial);
        assert(result.passed && result.score < 1, '固定输入应通过但未满分');
        await submit(partial, true);
        eq(listeningStat().plays, 1, 'Enter 自检次数');
        eq(listeningStat().best, 100, '保留 v1 通过标记');
        eq(store.data.events[0].correct, true, '通过事件');
        eq(store.data.mistakes.length, 0, '通过不收集错题');
        assert(shown().includes('曾通过'), '通过状态');
        assert(!shown().includes('最佳'), '不能把通过标记描述为最佳分数');
      }),
      await tAsync('空答案按钮或 Enter 提交均计失败但不收集错题', async () => {
        reset();
        await submit('   ');
        await submit('', true);
        eq(listeningStat().plays, 2, '空答案逐次计数');
        eq(store.data.events.length, 2, '空答案事件数');
        assert(store.data.events.every((e) => e.correct === false), '空答案均判失败');
        eq(store.data.mistakes.length, 0, '空答案不收集错题');
      }),
      await tAsync('同一听写答案重复提交仍逐次计数', async () => {
        reset();
        await submit(LISTENING[0].de);
        await submit(LISTENING[0].de);
        eq(listeningStat().plays, 2, '重复自检次数');
        eq(store.data.events.length, 2, '重复自检事件数');
        assert(shown().includes('已自检 2 次'), '次数应与实际提交一致');
      }),
      await tAsync('统计页面说明听力参与正确率并标明自检事件', async () => {
        reset();
        await submit('xyz');
        store.update((db) => { db.events.push({ ts: T0, type: 'quiz', topic: 'test', correct: true }); return db; });
        renderStats(root);
        assert(shown().includes('50%'), '听力失败应进入正确率分母');
        assert(shown().includes('包含背卡、语法练习和听力自检'), '正确率范围说明');
        assert(shown().includes('<td>听力自检</td>'), '最近记录应标明自检');
      }),
      await tAsync('改写答案清除旧判分并保留输入节点', async () => {
        reset();
        const box = elements.get('#dictation');
        await submit(LISTENING[0].de, true);
        assert(elements.get('#listening-feedback').innerHTML.includes('100%'), '通过反馈');
        box.value = 'xyz';
        await fire('#dictation', 'input');
        eq(elements.get('#dictation'), box, '保留输入节点');
        eq(elements.get('#listening-feedback').innerHTML, '', '清除旧反馈');
        assert(!elements.get('#de-text').innerHTML.includes('class="w'), '清除旧高亮');
        eq(listeningStat().plays, 1, '编辑不计数');
      }),
      await tAsync('输入法确认、229 和重复 Enter 不提交', async () => {
        reset();
        for (const event of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }]) {
          await fire('#dictation', 'keydown', Object.assign({ key: 'Enter' }, event));
        }
        await fire('#dictation', 'compositionstart');
        await fire('#dictation', 'keydown', { key: 'Enter' });
        await fire('#check-btn', 'click');
        eq(store.data.events.length, 0, '组词期间不提交');
        await fire('#dictation', 'compositionend');
        await fire('#dictation', 'keydown', { key: 'Enter' });
        eq(store.data.events.length, 1, '正式提交一次');
      }),
      await tAsync('等待锁时阻止重复提交和过期反馈', async () => {
        reset();
        let release;
        let requests = 0;
        fakeWindow.navigator = { locks: { request(name, fn) {
          eq(name, 'dwt.db.v1', '同源锁名');
          requests += 1;
          return new Promise((resolve) => { release = () => resolve(fn()); });
        } } };
        elements.get('#dictation').value = LISTENING[0].de;
        await fire('#dictation', 'input');
        const pending = fire('#check-btn', 'click');
        await fire('#check-btn', 'click');
        eq(requests, 1, '重复事件不重复请求');
        elements.get('#dictation').value = 'changed';
        await fire('#dictation', 'input');
        release(); await pending;
        eq(listeningStat().plays, 1, '保存一次');
        eq(elements.get('#listening-feedback').innerHTML, '', '过期反馈无效');
        eq(elements.get('#check-btn').disabled, false, '恢复按钮');
      }),
      await tAsync('存储失败回滚听力计数、事件和错题，重试只写一次', async () => {
        reset();
        const savedSet = backend.setItem;
        backend.setItem = () => { throw new Error('quota'); };
        try {
          await submit('xyz');
          eq(store.data.events.length, 0, '事件回滚');
          eq(Object.keys(store.data.listeningStats).length, 0, '次数回滚');
          eq(store.data.mistakes.length, 0, '错题回滚');
          assert(elements.get('#listening-save-error').textContent.includes('未保存'), '失败提示');
        } finally { backend.setItem = savedSet; }
        await submit('xyz');
        eq(listeningStat().plays, 1, '成功重试一次');
        eq(elements.get('#listening-save-error').textContent, '', '清除错误');
      }),
      await tAsync('异步语音错误可见且旧回调不能覆盖新播放', async () => {
        reset();
        await fire('#play-btn', 'click');
        const old = utterances[0];
        await fire('#play-slow', 'click');
        old.onerror({ error: 'network' });
        eq(elements.get('#tts-status').textContent, '正在准备语音…', '旧错误无效');
        const latest = utterances[1];
        latest.onstart();
        eq(elements.get('#tts-status').textContent, '正在播放。', '真实事件接口');
        latest.onerror({ error: 'language-unavailable' });
        assert(elements.get('#tts-status').textContent.includes('朗读失败'), '异步失败提示');
        eq(store.data.events.length, 0, '播放不计数');
      }),
      await tAsync('语音列表异步加载不重绘输入框，离页忽略旧事件', async () => {
        reset();
        fakeWindow.speechSynthesis.getVoices = () => [];
        renderListening(root);
        const box = elements.get('#dictation');
        assert(elements.get('#voice-hint').textContent.includes('安装'), '无语音提示');
        fakeWindow.speechSynthesis.getVoices = () => [{ lang: 'de-DE' }];
        voiceHandlers.forEach((handler) => handler());
        eq(elements.get('#voice-hint').textContent, '', '更新语音提示');
        eq(elements.get('#dictation'), box, '保留输入框');
        await fire('#play-btn', 'click');
        const status = elements.get('#tts-status').textContent;
        disposeListening();
        utterances[0].onerror({ error: 'network' });
        eq(elements.get('#tts-status').textContent, status, '旧错误无效');
        eq(voiceHandlers.length, 0, '移除监听');
      }),
      await tAsync('旧听力记录重载后展示自检次数和历史通过状态', async () => {
        reset();
        store.update((db) => { db.listeningStats[LISTENING[0].id] = { plays: 7, best: 100 }; return db; });
        store.load();
        renderListening(root);
        assert(shown().includes('已自检 7 次') && shown().includes('曾通过'), '旧字段展示');
        assert(!shown().includes('已播放') && !shown().includes('最佳'), '移除误导文案');
      }),
    ];
  } finally {
    disposeListening();
    store.importJson(savedDb);
    Date.now = savedNow;
    if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow);
    else delete globalThis.window;
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument);
    else delete globalThis.document;
  }
}

export const results = await runTests();
