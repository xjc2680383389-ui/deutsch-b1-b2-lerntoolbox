// 种子化随机数工具（纯逻辑，不依赖浏览器与 DOM）
// 用途：洗牌、抽题、抽样；同一 seed 必须得到完全相同的序列，便于自检复现。

export function hashSeed(input) {
  const str = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// mulberry32：小而稳的 32 位伪随机数发生器
export function makeRng(seed) {
  const base = (typeof seed === 'number' && Number.isFinite(seed)) ? (seed >>> 0) : hashSeed(seed);
  let a = base >>> 0;
  const rng = function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.seed = base;
  return rng;
}

// 返回新数组，不修改入参
export function shuffle(list, rng = Math.random) {
  const arr = Array.isArray(list) ? list.slice() : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function sample(list, n, rng = Math.random) {
  const arr = Array.isArray(list) ? list.slice() : [];
  const k = Math.max(0, Math.min(n, arr.length));
  return shuffle(arr, rng).slice(0, k);
}

export function randInt(rng, minInclusive, maxInclusive) {
  const lo = Math.ceil(Math.min(minInclusive, maxInclusive));
  const hi = Math.floor(Math.max(minInclusive, maxInclusive));
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function pick(list, rng = Math.random) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  return list[Math.floor(rng() * list.length) % list.length];
}
