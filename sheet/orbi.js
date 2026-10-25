// 原创角色"小球球 Orbi"：小星球身体 + 会表达情绪的光环 + 绕着转的小月亮
// 依赖 src/lib.js 与 sheet/seedling.js（sb / eye / mouth / 各种小符号 / EMO）
const ORB = { body: '#7f96e6', shade: '#5a6cc0', hi: '#c8d4ff', crater: '#6a7fd0', ring: '#f2c14e', ring2: '#c8922a', moon: '#f6ecd0', foot: '#4a56a0' };
const OVIEW = {
  front: { fx: 0, eyes: 2, ringRy: 0.3, tilt: -0.12 },
  q: { fx: 0.34, eyes: 2, ringRy: 0.24, tilt: -0.1 },
  side: { fx: 0.68, eyes: 1, ringRy: 0.08, tilt: -0.05 },
  qback: { fx: -0.34, eyes: 0, ringRy: 0.24, tilt: 0.1 },
  back: { fx: 0, eyes: 0, ringRy: 0.3, tilt: 0.12 },
};
// 光环跟着情绪变：颜色、倾斜、下滑、转动
const RING_MOOD = {
  happy: { spin: 1 }, laugh: { spin: 1.5 }, excited: { spin: 2 }, love: { col: '#f08aa8' }, starstruck: { spin: 1, col: '#ffd86a' },
  sad: { drop: 0.45, tilt: 0.25 }, cry: { drop: 0.55, tilt: 0.3 }, angry: { col: '#e0583a', tilt: -0.3 }, furious: { col: '#e0583a', tilt: -0.35 },
  sleepy: { tilt: 0.5, drop: 0.2 }, dizzy: { wobble: 1 }, surprised: { lift: 0.25 }, scared: { lift: 0.2, tilt: 0.2 }, shy: { tilt: 0.2 },
};

function ringPts(rx, ry, tilt, a0, a1, cy) {
  const p = [];
  for (let i = 0; i <= 18; i++) { const a = a0 + (a1 - a0) * i / 18, x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push([x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]); }
  return p;
}
function ringHalf(ctx, back, rx, ry, tilt, cy, col) {
  const p = back ? ringPts(rx, ry, tilt, Math.PI, Math.PI * 2, cy) : ringPts(rx, ry, tilt, 0, Math.PI, cy);
  inkLine(ctx, p, 0.17, INK, back ? 501 : 502, 0.005);
  inkLine(ctx, p, 0.1, back ? shade(col, -0.2) : col, back ? 503 : 504, 0.004);
  if (!back) inkLine(ctx, p.slice(3, 9), 0.03, rgba('#fff6d8', 0.8), 505, 0.003);
}
function moonAt(ctx, x, y, r) {
  sb(ctx, ell(x, y, r, r, 12), ORB.moon, { lw: 0.04, seed: 510, edge: 0.05 });
  sb(ctx, ell(x - r * 0.3, y + r * 0.2, r * 0.25, r * 0.22, 8), '#e2d4ae', { line: null, wash: false });
}

function drawOrbi(ctx, x, y, s, o, t) {
  o = Object.assign({ view: 'front', emo: 'neutral', legs: 'stand', walk: 0, hands: 'down', lift: 0, squash: 0, roll: 0, moon: true, tilt: 0 }, o);
  const V = OVIEW[o.view], E = EMO[o.emo] || EMO.neutral, R = RING_MOOD[o.emo] || {};
  const col = E.body === SEED.red ? '#e0705a' : E.body === SEED.green ? '#9ab86a' : E.body === SEED.pale ? '#b8c4f0' : ORB.body;
  ctx.save(); ctx.translate(x, y);
  sb(ctx, ell(0, 0, s * (0.95 - o.lift * 0.4), s * 0.13, 16), rgba('#4a4a6a', 0.2), { line: null, wash: false, amp: 1 });
  ctx.scale(s, s); ctx.translate(0, -o.lift);
  ctx.rotate(o.tilt);
  const br = Math.sin(t * 2.4) * 0.015, sq = o.squash + br;
  ctx.translate(0, -0.05); ctx.scale(1 + sq, 1 - sq);
  const cy = -1.32;
  // 腿与脚
  [-1, 1].forEach((k, i) => {
    const a = o.legs === 'walk' ? Math.sin(o.walk + i * Math.PI) * 0.45 : 0, L = o.legs === 'tuck' ? 0.12 : 0.32;
    const hx = k * 0.36, hy = -0.42, fx = hx + Math.sin(a) * L, fy = hy + Math.cos(a) * L;
    if (o.legs !== 'none') { inkLine(ctx, [[hx, hy], [fx, fy]], 0.18, INK, 520 + i, 0.005); inkLine(ctx, [[hx, hy], [fx, fy - 0.01]], 0.11, ORB.foot, 522 + i, 0.004); sb(ctx, ell(fx + k * 0.04, fy + 0.03, 0.17, 0.08, 10), shade(ORB.foot, -0.2), { lw: 0.035, seed: 524 + i }); }
  });
  // 光环后半 + 小月亮（在身后时）
  const spin = (R.spin || 0) * Math.sin(t * 4) * 0.12 + (R.wobble ? Math.sin(t * 7) * 0.35 : 0);
  const rTilt = V.tilt + (R.tilt || 0) + spin, rcy = cy + 0.4 + (R.drop || 0) * 0.6 - (R.lift || 0), rCol = R.col || ORB.ring;
  const ma = t * 1.3 + 0.6, mx = Math.cos(ma) * 1.25, my = cy - 1.05 + Math.sin(ma) * 0.18, mFront = Math.sin(ma) > 0;
  if (o.moon && !mFront) moonAt(ctx, mx, my, 0.17);
  ringHalf(ctx, true, 1.45, V.ringRy, rTilt, rcy, rCol);
  // 球体
  ctx.save(); ctx.translate(0, cy); ctx.rotate(o.roll);
  sb(ctx, ell(0, 0, 1, 1, 26), col, { lw: 0.05, amp: 0.006, seed: 530, edge: 0.16 });
  ctx.save(); trace(ctx, ell(0, 0, 1, 1, 26), true); ctx.clip();
  // 陨石坑（随视角平移，看起来在转）
  [[-0.5, 0.45, 0.16], [0.42, 0.55, 0.11], [-0.15, -0.62, 0.1], [0.6, -0.25, 0.08], [-0.75, -0.1, 0.09]].forEach(([cx0, cy0, r], i) => {
    const cx2 = cx0 - V.fx * 1.4; if (Math.abs(cx2) > 0.95) return;
    const sxk = Math.sqrt(Math.max(0.15, 1 - cx2 * cx2));
    sb(ctx, ell(cx2, cy0, r * sxk, r, 10), ORB.crater, { lw: 0.025, line: rgba('#2a2230', 0.5), seed: 540 + i, wash: false });
  });
  sb(ctx, ell(0.25, 0.35, 0.95, 0.9, 20), rgba('#3a4a9a', 0.18), { line: null, wash: false });
  sb(ctx, ell(-0.42, -0.45, 0.22, 0.14, 10, -0.6), rgba(ORB.hi, 0.85), { line: null, wash: false });
  ctx.restore(); ctx.restore();
  ctx.__bodyCol = col;
  // 脸
  if (V.eyes) {
    const ex = o.eyes || E.eyes, look = o.look || E.look || [0, 0];
    ctx.save(); ctx.translate(V.fx, cy + 0.05);
    if (V.eyes === 2) {
      const far = o.view === 'q' ? 0.7 : 1;
      eye(ctx, 0.3, -0.12, ex, 1, look, t);
      ctx.save(); ctx.translate(-0.3 * (o.view === 'q' ? 0.85 : 1), -0.12); ctx.scale(far, 1); eye(ctx, 0, 0, ex, -1, look, t); ctx.restore();
      ctx.save(); ctx.scale(o.view === 'q' ? 0.85 : 1, 1); mouth(ctx, E.mouth, t); ctx.restore();
      if (E.blush) [-1, 1].forEach(k => sb(ctx, ell(k * 0.5 * (o.view === 'q' && k < 0 ? 0.8 : 1), 0.13, 0.13, 0.07, 10), rgba('#ef8aa8', 0.5), { line: null, wash: false }));
      if (E.brow === 'angry') { inkLine(ctx, [[-0.44, -0.36], [-0.18, -0.26]], 0.055, INK, 550, 0.004); inkLine(ctx, [[0.44, -0.36], [0.18, -0.26]], 0.055, INK, 551, 0.004); }
      if (E.brow === 'worried') { inkLine(ctx, [[-0.44, -0.27], [-0.18, -0.36]], 0.05, INK, 552, 0.004); inkLine(ctx, [[0.44, -0.27], [0.18, -0.36]], 0.05, INK, 553, 0.004); }
      if ((E.fx || []).includes('tears')) [-1, 1].forEach((k, i) => sb(ctx, [[k * 0.26, -0.04], [k * 0.36, -0.04], [k * 0.4, 0.55], [k * 0.22, 0.55]], rgba('#8ccaf0', 0.85), { lw: 0.03, line: '#4a8ac8', seed: 554 + i }));
    } else { eye(ctx, 0.04, -0.12, ex, 1, look, t); ctx.save(); ctx.translate(0.1, 0); ctx.scale(0.45, 1); mouth(ctx, E.mouth, t); ctx.restore(); }
    ctx.restore();
  }
  // 光环前半 + 小月亮（在身前时）
  ringHalf(ctx, false, 1.45, V.ringRy, rTilt, rcy, rCol);
  if (o.moon && mFront) moonAt(ctx, mx, my, 0.17);
  // 小圆手
  const HP = { down: [[-1.08, -0.62], [1.08, -0.62]], up: [[-1.15, -2.05], [1.15, -2.05]], wave: [[-1.12, -0.95], [1.18, -2.0 + Math.sin(t * 8) * 0.08]], out: [[-1.3, -1.4], [1.3, -1.4]], hug: [[-0.4, -0.55], [0.4, -0.55]] }[o.hands];
  const showL = o.view !== 'side', showR = o.view !== 'qback' || true;
  HP.forEach(([hx, hy], i) => {
    if (o.view === 'side' && i === 0) return;
    if (o.view === 'back' || o.view === 'qback') { if (o.view === 'qback' && i === 1) return; }
    const k = i ? 1 : -1, sx = o.view === 'side' ? 0.15 : o.view === 'q' && i === 0 ? hx * 0.8 : hx;
    sb(ctx, ell(sx, hy, 0.15, 0.15, 10), col, { lw: 0.045, seed: 560 + i, edge: 0.05 });
  });
  // 小符号
  (E.fx || []).forEach(f => {
    if (f === 'sparkle') { sparkle(ctx, 1.05, -2.35, 0.15); sparkle(ctx, 1.3, -2.0, 0.08); }
    if (f === 'sparkle2') { sparkle(ctx, -1.1, -2.3, 0.12); sparkle(ctx, 1.15, -2.4, 0.15); }
    if (f === 'hearts') { heart(ctx, 0.8, -2.55 - Math.sin(t * 2) * 0.05, 0.14, '#e8506a'); heart(ctx, 1.12, -2.25, 0.09, '#e8506a'); }
    if (f === 'drop') drop(ctx, 1.0, -2.1, 0.1);
    if (f === 'rain') rainCloud(ctx, 0, -2.85, t);
    if (f === 'vein') vein(ctx, 0.95, -2.2, 0.16);
    if (f === 'bang') bang(ctx, 1.1, -2.35, 0.26);
    if (f === 'question') question(ctx, 1.1, -2.4, 0.32);
    if (f === 'zzz') zzz(ctx, 0.85, -2.35, 0.13, t);
    if (f === 'stars') for (let i = 0; i < 3; i++) { const a = t * 2.5 + i / 3 * Math.PI * 2; sparkle(ctx, Math.cos(a) * 0.6, -2.55 + Math.sin(a) * 0.12, 0.1, '#f6c84a'); }
  });
  ctx.restore();
}
