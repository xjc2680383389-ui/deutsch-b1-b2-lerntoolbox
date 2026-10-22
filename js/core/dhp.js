// DHP-HLR：移植自 MaiMemo SSP-MMC-Plus/SSP-MMC/DHP.cpp（MIT）。
// 对应 TKDE 2023 式 (10)、(18)、(19)；参数精度沿用作者源码。
export const DHP_MODEL = 'dhp-hlr-2023';
export const DEFAULT_DIFFICULTY = 5; // 缺少德语词条的群体难度数据，采用中性初值。
export const MAX_DIFFICULTY = 18;
export const DIFFICULTY_STEP = 2;

export function startHalfLife(difficulty = DEFAULT_DIFFICULTY) {
  return -1 / Math.log2(Math.max(0.925 - 0.05 * difficulty, 0.025));
}

export function recallProbability(halfLife, elapsedDays) {
  return Math.pow(2, -Math.max(0, elapsedDays) / halfLife);
}

export function nextHalfLife(difficulty, halfLife, probability, recalled) {
  // p=1 的短期练习由调度层处理；此处保护浮点边界，避免负幂产生 Infinity。
  const forgotten = Math.max(1e-12, Math.min(1, 1 - probability));
  if (recalled) {
    return halfLife * (1 + Math.exp(3.252) * Math.pow(difficulty, -0.3855)
      * Math.pow(halfLife, -0.1471) * Math.pow(forgotten, 0.8214));
  }
  return Math.exp(1.003) * Math.pow(difficulty, -0.1524)
    * Math.pow(halfLife, 0.2648) * Math.pow(forgotten, -0.01736);
}
