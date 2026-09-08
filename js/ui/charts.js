// 纯 SVG 图表（不引入任何图表库，离线可用）
const W = 680;

// 柱状图：rows = [{label, value, tip}]
export function barChart(rows, options = {}) {
  const opts = Object.assign({ height: 220, color: '#2b6cb0', unit: '' }, options);
  const list = rows || [];
  const max = Math.max(1, ...list.map((r) => r.value || 0));
  const padL = 34;
  const padR = 8;
  const padT = 16;
  const padB = 30;
  const h = opts.height;
  const innerW = W - padL - padR;
  const innerH = h - padT - padB;
  const step = list.length ? innerW / list.length : innerW;
  const bw = Math.max(6, Math.min(46, step * 0.6));

  let svg = `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="柱状图">`;
  svg += `<line x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" stroke="#cbd5e1" stroke-width="1"/>`;
  [0.5, 1].forEach((f) => {
    const y = padT + innerH - innerH * f;
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#eef1f6" stroke-width="1"/>`;
  });
  list.forEach((r, i) => {
    const v = r.value || 0;
    const bh = Math.round((v / max) * innerH);
    const x = padL + step * i + (step - bw) / 2;
    const y = padT + innerH - bh;
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(bh, v > 0 ? 2 : 0).toFixed(1)}" fill="${opts.color}" rx="3"><title>${esc(r.label || '')}：${v}${opts.unit}</title></rect>`;
    if (v > 0) {
      svg += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="11" fill="#6b7280" text-anchor="middle">${v}</text>`;
    }
    svg += `<text x="${(padL + step * i + step / 2).toFixed(1)}" y="${(padT + innerH + 16).toFixed(1)}" font-size="11" fill="#6b7280" text-anchor="middle">${esc(r.label || '')}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// 折线图：rows = [{label, rate(0~1 或 null)}]
export function lineChart(rows, options = {}) {
  const opts = Object.assign({ height: 200, color: '#2f855a' }, options);
  const list = rows || [];
  const h = opts.height;
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = h - padT - padB;
  const step = list.length ? innerW / Math.max(1, list.length - 1) : innerW;

  let svg = `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="折线图">`;
  [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
    const y = padT + innerH - innerH * f;
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#eef1f6" stroke-width="1"/>`;
    svg += `<text x="${padL - 6}" y="${(y + 4).toFixed(1)}" font-size="10" fill="#9aa3b2" text-anchor="end">${Math.round(f * 100)}%</text>`;
  });

  const pts = list.map((r, i) => (r.rate == null ? null : {
    x: padL + step * i,
    y: padT + innerH - innerH * Math.max(0, Math.min(1, r.rate)),
    r,
    i,
  }));

  let segments = [];
  pts.forEach((p) => {
    if (!p) { if (segments.length > 1) svg += `<polyline fill="none" stroke="${opts.color}" stroke-width="2" points="${segments.map((s) => s.x.toFixed(1) + ',' + s.y.toFixed(1)).join(' ')}"/>`; segments = []; return; }
    segments.push(p);
  });
  if (segments.length > 1) {
    svg += `<polyline fill="none" stroke="${opts.color}" stroke-width="2" points="${segments.map((s) => s.x.toFixed(1) + ',' + s.y.toFixed(1)).join(' ')}"/>`;
  }
  pts.forEach((p) => {
    if (!p) return;
    svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${opts.color}"><title>${esc(p.r.label)}：${Math.round(p.r.rate * 100)}%（${p.r.correct}/${p.r.total}）</title></circle>`;
  });
  list.forEach((r, i) => {
    if (i % 2 !== 0 && list.length > 10) return;
    svg += `<text x="${(padL + step * i).toFixed(1)}" y="${(padT + innerH + 16).toFixed(1)}" font-size="10" fill="#6b7280" text-anchor="middle">${esc(r.label)}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
