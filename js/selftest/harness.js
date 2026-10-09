// 自检小框架：固定输入 → 断言输出
export function t(name, fn) {
  try {
    fn();
    return { name, pass: true, detail: '' };
  } catch (err) {
    return { name, pass: false, detail: err && err.message ? err.message : String(err) };
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || '断言失败');
}

export async function tAsync(name, fn) {
  try {
    await fn();
    return { name, pass: true, detail: '' };
  } catch (err) {
    return { name, pass: false, detail: err && err.message ? err.message : String(err) };
  }
}

export function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg ? msg + '：' : ''}期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
  }
}

export function near(actual, expected, eps, msg) {
  if (Math.abs(actual - expected) > (eps == null ? 1e-6 : eps)) {
    throw new Error(`${msg ? msg + '：' : ''}期望接近 ${expected}，实际 ${actual}`);
  }
}

export function includes(list, item, msg) {
  if (!list || list.indexOf(item) < 0) {
    throw new Error(`${msg ? msg + '：' : ''}未包含 ${JSON.stringify(item)}`);
  }
}
