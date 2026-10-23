import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createMemoryBackend } from './js/core/store.js';
import { createState, schedule, RATING } from './js/core/srs.js';

function staticGraph(entry, revision = null, seen = new Map()) {
  if (seen.has(entry)) return seen;
  const text = revision ? execFileSync('git', ['show', `${revision}:${entry}`], {encoding:'utf8'}) : readFileSync(entry,'utf8');
  seen.set(entry, Buffer.byteLength(text));
  const imports = text.matchAll(/^(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/gm);
  for(const [,specifier] of imports) if(specifier.startsWith('.')) staticGraph(path.posix.normalize(path.posix.join(path.posix.dirname(entry),specifier)), revision, seen);
  return seen;
}

test('首页依赖不提前解析语法题库、听力句库或其余六个页面', () => {
  const graph=staticGraph('js/ui/app.js'); staticGraph('js/ui/page_home.js',null,graph);
  assert.ok(graph.has('js/data/vocabulary.js'));
  assert.ok(!graph.has('js/data/grammar.js'));
  assert.ok(!graph.has('js/data/listening.js'));
  assert.equal([...graph.keys()].filter(p=>p.startsWith('js/ui/page_')).length,1);
  // 基线实测于 a54d22a；CI 浅克隆不依赖历史对象。
  const previous={files:44,bytes:265372};
  const sum=g=>[...g.values()].reduce((a,b)=>a+b,0);
  console.log(`首屏 JS 依赖：${previous.files} → ${graph.size} 个文件；${previous.bytes} → ${sum(graph)} 字节（源码，非运行耗电测量）。`);
  assert.ok(sum(graph)<previous.bytes);
});

test('一次背卡评分只保存一次，状态、事件和错题共同提交或回滚', async () => {
  const previousWindow=globalThis.window, previousDocument=globalThis.document;
  const memory=createMemoryBackend(); let writes=0, fail=false;
  const originalSet=memory.setItem;
  memory.setItem=(key,value)=>{writes++;if(fail)throw Error('full');originalSet(key,value);};
  globalThis.window={localStorage:memory};
  globalThis.document={querySelector:()=>({textContent:'',classList:{add(){},remove(){}}})};
  try {
    const {store,recordCardReview}=await import('./js/ui/state.js');
    store.reset(); writes=0;
    const card={id:'b1:test',deckId:'b1'};
    const next=schedule(createState(card.id),RATING.AGAIN,Date.now());
    const mistake={source:'card',refId:card.id,stem:'Test',userAnswer:'不会',correctAnswer:'测试'};
    assert.equal(recordCardReview(card,RATING.AGAIN,false,next,mistake),true);
    assert.equal(writes,1); assert.equal(store.data.events.length,1);
    assert.equal(store.data.mistakes.length,1); assert.deepEqual(store.data.states[card.id],next);
    const saved=store.exportJson(); writes=0; fail=true;
    assert.equal(recordCardReview(card,RATING.AGAIN,false,next,mistake),false);
    assert.equal(writes,1); assert.equal(store.exportJson(),saved);
  } finally { globalThis.window=previousWindow;globalThis.document=previousDocument; }
});
