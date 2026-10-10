// SSP-MMC 离散值迭代：移植自 MaiMemo SSP-MMC-Plus/SSP-MMC/DHP.cpp（MIT）。
// node scripts/build_ssp_policy.js：离线生成策略；浏览器只加载结果，无运行时求解依赖。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextHalfLife, recallProbability, MAX_DIFFICULTY, DIFFICULTY_STEP } from '../js/core/dhp.js';

export const CONFIG = Object.freeze({
  base: 1.05, minExponent: -40, targetHalfLife: 360,
  recallCost: 3, forgetCost: 9, minimumRecall: 0.3, tolerance: 1e-8,
});

export function halfLifeGrid() {
  const grid = [];
  for (let exponent = CONFIG.minExponent; Math.pow(CONFIG.base, exponent) < CONFIG.targetHalfLife; exponent++) {
    grid.push(Math.pow(CONFIG.base, exponent));
  }
  grid.push(CONFIG.targetHalfLife); // 明确以论文的 360 天为终点。
  return grid;
}

export function halfLifeIndex(halfLife, grid) {
  if (halfLife >= CONFIG.targetHalfLife) return grid.length - 1;
  return Math.max(0, Math.min(grid.length - 2,
    Math.round(Math.log(halfLife) / Math.log(CONFIG.base)) - CONFIG.minExponent));
}

export function solvePolicy() {
  const grid = halfLifeGrid(), size = grid.length, terminal = size - 1;
  const costs = Array.from({ length: MAX_DIFFICULTY }, () => new Float64Array(size));
  const policy = Array.from({ length: MAX_DIFFICULTY }, () => new Array(size).fill(0));
  const sweeps = [];
  // 从零递增值迭代，不以任意有限大数冒充 Infinity；检查所有状态的 Bellman 残差。
  for (let difficulty = MAX_DIFFICULTY; difficulty >= 1; difficulty--) {
    const row = costs[difficulty - 1];
    const failedRow = costs[Math.min(MAX_DIFFICULTY, difficulty + DIFFICULTY_STEP) - 1];
    const actions = grid.slice(0, terminal).map((h) => {
      const list = [];
      const maximum = Math.max(1, Math.round(h * Math.log2(1 / CONFIG.minimumRecall)));
      for (let interval = maximum; interval >= 1; interval--) {
        const p = recallProbability(h, interval);
        list.push({ interval, p,
          success: halfLifeIndex(nextHalfLife(difficulty, h, p, true), grid),
          failure: halfLifeIndex(nextHalfLife(difficulty, h, p, false), grid) });
      }
      return list;
    });
    let residual = Infinity, count = 0;
    while (residual > CONFIG.tolerance && count < 200000) {
      residual = 0;
      for (let i = terminal - 1; i >= 0; i--) {
        let best = Infinity, interval = 0;
        for (const a of actions[i]) {
          const value = a.p * (CONFIG.recallCost + row[a.success])
            + (1 - a.p) * (CONFIG.forgetCost + failedRow[a.failure]);
          if (value < best) { best = value; interval = a.interval; }
        }
        residual = Math.max(residual, Math.abs(row[i] - best));
        row[i] = best;
        policy[difficulty - 1][i] = interval;
      }
      count++;
    }
    if (residual > CONFIG.tolerance || !Number.isFinite(residual)) throw new Error('SSP 未收敛，难度 ' + difficulty);
    sweeps.push({ difficulty, count, residual });
  }
  return { config: CONFIG, grid, policy, costs: costs.map((r) => Array.from(r)), sweeps };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = solvePolicy();
  const output = new URL('../js/data/ssp_policy.js', import.meta.url);
  fs.writeFileSync(output,
    '// 自动生成：node scripts/build_ssp_policy.js；SSP-MMC + DHP-HLR（MIT，来源见 THIRD_PARTY_NOTICES.md）。\n'
    + 'export const SSP_CONFIG = ' + JSON.stringify(result.config) + ';\n'
    + 'export const SSP_GRID = ' + JSON.stringify(result.grid) + ';\n'
    + 'export const SSP_POLICY = ' + JSON.stringify(result.policy) + ';\n');
  console.log('SSP 策略已生成：' + result.grid.length * MAX_DIFFICULTY + ' 状态，最大残差 '
    + Math.max(...result.sweeps.map((s) => s.residual)));
}
