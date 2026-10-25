// 原创角色：阿岚、小葵、霜；小焰（小形态/巨兽）；影鸦
const CH = {
  lan: { skin: '#f5d8bd', hair: '#2c3452', hair2: '#4a5784', eye: '#d38a28', streak: '#ece6f2', type: 'spiky', cloth: '#eef0e8', trim: '#3c8e88', scarf: '#c9412f', pants: '#3a4660' },
  kui: { skin: '#f7dbc6', hair: '#b2357a', hair2: '#dc68a4', eye: '#3c9a58', type: 'bob', cloth: '#4e9a5c', trim: '#e8c44c', scarf: null, pants: '#3d5a46' },
  shuang: { skin: '#f0dbca', hair: '#9cc4df', hair2: '#d6eaf4', eye: '#4a6db0', type: 'long', cloth: '#33456e', trim: '#cbdaec', scarf: null, pants: '#28324e' },
};
const DEF = { turn: 0, look: [0, 0], blink: 0, mouth: 0, smile: 0, brow: 0, wind: 0.3, wdir: 1, tear: 0, blush: 0, shoulders: true, tilt: 0 };

// 自动眨眼：每 ~3 秒一次，由种子错开
function autoBlink(t, seed) {
  const per = 2.6 + hash(seed) * 1.4, ph = ((t + hash(seed * 3) * per) % per);
  return ph < 0.16 ? Math.sin(ph / 0.16 * Math.PI) : 0;
}

function drawHead(ctx, c, x, y, s, p0, t, seed = 1) {
  const p = Object.assign({}, DEF, p0);
  ctx.save(); ctx.translate(x, y); ctx.rotate(p.tilt); ctx.scale(s, s);
  const m = ctx.getTransform(), se = Math.hypot(m.a, m.b); // 实际像素缩放（含父级变换）
  const lw = 2.6 / se * Math.min(1.6, Math.max(0.55, se / 80)); // 线宽随尺寸缓变
  const T = p.turn, ws = p.wind * p.wdir;
  const sway = (i, k) => ws * (0.18 + 0.12 * Math.sin(t * 5.5 + i * 1.3 + seed)) * k;

  // 后发
  if (c.type === 'spiky') {
    const pts = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (1.05 + i / n * 0.9) ;
      const r0 = 0.92, r1 = 1.38 + hash(seed + i) * 0.25;
      const am = a - 0.09, at = a + 0.06;
      pts.push([Math.cos(am) * r0, -0.12 + Math.sin(am) * r0]);
      pts.push([Math.cos(at) * r1 + sway(i, 1.2), -0.12 + Math.sin(at) * r1 + Math.abs(sway(i, 0.3))]);
    }
    pts.push([0.98 + sway(20, 1), 0.35], [0.7, 0.2], [0.3, 0.1], [-0.3, 0.1], [-0.7, 0.2], [-1.0 + sway(21, 1), 0.38]);
    blob(ctx, pts, c.hair, { lw, seed: seed + 3, amp: 0.012, edge: 0.12 });
  } else if (c.type === 'bob') {
    const pts = [[-1.05 + sway(1, 0.4), 0.55], [-1.12, 0.0], [-0.95, -0.7], [-0.5, -1.08], [0.1, -1.15], [0.65, -0.98], [1.05, -0.55], [1.12, 0.05], [1.05 + sway(2, 0.4), 0.6], [0.85 + sway(3, 0.5), 0.75], [0.7, 0.45], [-0.7, 0.45], [-0.88 + sway(4, 0.5), 0.72]];
    blob(ctx, pts, c.hair, { lw, seed: seed + 3, amp: 0.012, edge: 0.12 });
  } else {
    const L = 2.6;
    const pts = [[-1.0, 0.0], [-0.95, -0.75], [-0.4, -1.1], [0.3, -1.1], [0.95, -0.7], [1.05, 0.0]];
    for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([1.05 + u * 0.15 + sway(i, u * 2.5), u * L]); }
    for (let i = 6; i >= 0; i--) { const u = i / 6; pts.push([-1.05 - u * 0.1 + sway(i + 9, u * 2.5), u * L]); }
    blob(ctx, pts, c.hair, { lw, seed: seed + 3, amp: 0.012, edge: 0.12 });
  }

  // 脖子与肩
  if (p.shoulders) {
    blob(ctx, [[-0.24, 0.6], [0.24, 0.6], [0.26, 1.35], [-0.26, 1.35]], shade(c.skin, -0.08), { lw, seed: seed + 5, amp: 0.01, edge: 0.1 });
    const tb = [[-1.55, 3.2], [-1.35, 1.6], [-0.9, 1.25], [-0.3, 1.12], [0.3, 1.12], [0.9, 1.25], [1.35, 1.6], [1.55, 3.2]];
    blob(ctx, tb.map(q => [q[0] + T * 0.15, q[1]]), c.cloth, { lw, seed: seed + 7, amp: 0.012, edge: 0.15 });
    blob(ctx, [[-0.45 + T * 0.15, 1.1], [0.45 + T * 0.15, 1.1], [0.3 + T * 0.15, 1.55], [0, 1.75], [-0.3 + T * 0.15, 1.55]], c.trim, { lw, seed: seed + 8, amp: 0.01, edge: 0.08 });
    if (c.scarf) {
      // 围巾与飘带（跟随风，比头发滞后）
      blob(ctx, [[-0.55, 1.0], [0.55, 1.0], [0.62, 1.38], [0, 1.5], [-0.62, 1.38]].map(q => [q[0] + T * 0.12, q[1]]), c.scarf, { lw, seed: seed + 9, amp: 0.012, edge: 0.12 });
      const dir = p.wdir, tail = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        tail.push([0.45 * dir + dir * u * (1.2 + p.wind * 2.2), 1.25 + u * (0.9 - p.wind * 0.7) + Math.sin(t * 6.5 - i * 0.9 + seed) * 0.14 * u * (0.4 + p.wind)]);
      }
      const top = tail.map((q, i) => [q[0], q[1] - 0.14 * (1 - i / 10)]), bot = tail.map((q, i) => [q[0], q[1] + 0.14 * (1 - i / 10)]).reverse();
      blob(ctx, top.concat(bot), c.scarf, { lw, seed: seed + 10, amp: 0.012, edge: 0.1 });
    }
  }

  // 脸
  const sq = 1 - Math.abs(T) * 0.12;
  const face = [[-0.82, -0.25], [-0.8, 0.25], [-0.55, 0.68], [-0.15 + T * 0.2, 0.95], [0.12 + T * 0.2, 0.95], [0.55, 0.68], [0.8, 0.25], [0.82, -0.25], [0.7, -0.75], [0, -0.95], [-0.7, -0.75]].map(q => [q[0] * sq, q[1]]);
  blob(ctx, face, c.skin, { lw, seed: seed + 12, amp: 0.01, edge: 0.12 });
  // 脸颊阴影
  ctx.save(); trace(ctx, face, true); ctx.clip();
  ctx.fillStyle = rgba(shade(c.skin, -0.3), 0.25);
  trace(ctx, ell(-0.9 * Math.sign(T || 1) * 0.0 - 0.95, 0.2, 0.35, 0.9, 12), true); ctx.fill();
  if (p.blush > 0) { ctx.fillStyle = rgba('#e8707a', 0.35 * p.blush); [-1, 1].forEach(k => { trace(ctx, ell(k * 0.45 + T * 0.2, 0.42, 0.17, 0.08, 10), true); ctx.fill(); }); }
  ctx.restore();

  // 眼睛
  const big = c.type === 'bob' ? 1.12 : 1;
  [-1, 1].forEach((k, ei) => {
    const far = (k * T < 0) ? 1 - Math.abs(T) * 0.4 : 1;
    const ex = k * 0.36 * sq + T * 0.22, ey = 0.12;
    const rx = 0.2 * big * far, ry0 = 0.25 * big;
    const bl = clamp(p.blink);
    const ry = ry0 * (1 - bl);
    // 眉
    const bang = (p.brow) * 0.35 * -k;
    inkLine(ctx, [[ex - rx * 1.1, -0.17 - 0.06 * p.brow * 0 + (k > 0 ? -1 : 1) * 0.0], [ex, -0.22 - p.brow * 0.03], [ex + rx * 1.1, -0.17]].map((q, i) => { const dx = q[0] - ex; return [q[0], q[1] + dx * Math.tan(bang) * k * k + (i === 1 ? 0 : 0)]; }), lw * 1.6, shade(c.hair, -0.2), seed + 20 + ei, 0.004);
    if (bl > 0.82) {
      inkLine(ctx, [[ex - rx, ey + 0.02], [ex, ey + 0.09 * (p.smile >= 0 ? -1 : 1) + 0.04], [ex + rx, ey + 0.02]], lw * 1.5, INK, seed + 30 + ei, 0.004);
      return;
    }
    const sc = ell(ex, ey + (ry0 - ry) * 0.5, rx, Math.max(ry, 0.01), 16);
    blob(ctx, sc, '#fbf6ee', { lw: 0, line: null, wash: false, amp: 0.004 });
    ctx.save(); trace(ctx, sc, true); ctx.clip();
    const ix = ex + p.look[0] * rx * 0.45, iy = ey + 0.02 + p.look[1] * ry0 * 0.3;
    const g = ctx.createLinearGradient(0, iy - ry0, 0, iy + ry0);
    g.addColorStop(0, shade(c.eye, -0.45)); g.addColorStop(1, shade(c.eye, 0.25));
    ctx.fillStyle = g; trace(ctx, ell(ix, iy, rx * 0.72, ry0 * 0.8, 14), true); ctx.fill();
    ctx.fillStyle = shade(c.eye, -0.7); trace(ctx, ell(ix, iy + 0.02, rx * 0.32, ry0 * 0.4, 12), true); ctx.fill();
    ctx.fillStyle = '#fffdf6';
    trace(ctx, ell(ix - rx * 0.28, iy - ry0 * 0.32, rx * 0.2, ry0 * 0.15, 10), true); ctx.fill();
    trace(ctx, ell(ix + rx * 0.25, iy + ry0 * 0.3, rx * 0.1, ry0 * 0.07, 8), true); ctx.fill();
    if (p.tear > 0) { ctx.globalAlpha = p.tear; ctx.fillStyle = rgba('#d8f0ff', 0.55); trace(ctx, ell(ex, ey + ry0 * 0.55, rx, ry0 * 0.35, 12), true); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    // 上眼睑
    const top = ey + (ry0 - ry) * 0.5 - ry;
    inkLine(ctx, [[ex - rx * 1.15, top + ry * 0.5], [ex - rx * 0.4, top - 0.02], [ex + rx * 0.5, top - 0.01], [ex + rx * 1.2 * k * k, top + ry * 0.35], [ex + k * rx * 1.4, top + ry * 0.15]], lw * 2.2, INK, seed + 40 + ei, 0.004);
    inkLine(ctx, [[ex - rx * 0.6, ey + ry0 * 0.95], [ex + rx * 0.6, ey + ry0 * 0.95]], lw * 0.8, rgba('#2a2230', 0.6), seed + 44 + ei, 0.004);
  });
  // 泪
  if (p.tear > 0.05) {
    [-1, 1].forEach((k, i) => {
      const ex = k * 0.36 * sq + T * 0.22, len = 0.2 + 0.5 * p.tear;
      const drop = ((t * 0.7 + i * 0.5) % 1);
      ctx.fillStyle = rgba('#cfeeff', 0.8 * p.tear);
      trace(ctx, [[ex - 0.03, 0.36], [ex + 0.03, 0.36], [ex + 0.04, 0.36 + len], [ex - 0.02, 0.36 + len]], true); ctx.fill();
      trace(ctx, ell(ex, 0.4 + len + drop * 0.5, 0.035, 0.05, 8), true); ctx.fill();
    });
  }
  // 鼻、嘴
  inkLine(ctx, [[T * 0.32 + 0.02, 0.36], [T * 0.32 - 0.03, 0.42]], lw, rgba('#2a2230', 0.7), seed + 50, 0.003);
  const mx = T * 0.26, my = 0.62;
  if (p.mouth > 0.05) {
    const mw = 0.14 + 0.08 * p.mouth, mh = 0.03 + 0.22 * p.mouth;
    const mp = [[mx - mw, my - 0.02 - p.smile * 0.03], [mx, my - 0.04], [mx + mw, my - 0.02 - p.smile * 0.03], [mx + mw * 0.6, my + mh * 0.8], [mx, my + mh], [mx - mw * 0.6, my + mh * 0.8]];
    blob(ctx, mp, '#7c2b31', { lw: lw * 1.2, seed: seed + 52, amp: 0.004, wash: false });
    ctx.save(); trace(ctx, mp, true); ctx.clip(); ctx.fillStyle = '#e07a7e'; trace(ctx, ell(mx, my + mh, mw * 0.6, mh * 0.45, 10), true); ctx.fill(); ctx.restore();
  } else {
    inkLine(ctx, [[mx - 0.11, my - p.smile * 0.05], [mx, my + p.smile * 0.03], [mx + 0.11, my - p.smile * 0.05]], lw * 1.2, INK, seed + 54, 0.004);
  }

  // 刘海
  if (c.type === 'spiky') {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), bx = lerp(-0.92, 0.92, u) + T * 0.2;
      const len = 0.5 + hash(seed + i * 5) * 0.35, w = 0.2;
      const tipx = bx + (u - 0.5) * 0.3 + sway(i + 30, 0.8), tipy = -0.72 + len + (i === 3 ? 0.12 : 0);
      const col = (i === 4) ? c.streak : (i % 2 ? c.hair2 : c.hair);
      blob(ctx, [[bx - w, -0.82], [bx + w, -0.82], [lerp(bx + w, tipx, 0.6) + 0.04, lerp(-0.82, tipy, 0.6)], [tipx, tipy], [lerp(bx - w, tipx, 0.5), lerp(-0.82, tipy, 0.5)]], col, { lw, seed: seed + 60 + i, amp: 0.01, edge: 0.06 });
    }
    blob(ctx, [[-0.95, -0.55], [-0.75, -1.02], [0, -1.12], [0.75, -1.02], [0.95, -0.55], [0.4, -0.72], [-0.4, -0.72]], c.hair, { lw, seed: seed + 70, amp: 0.01, edge: 0.08 });
  } else if (c.type === 'bob') {
    const pts = [[-0.98, -0.1], [-0.95, -0.7], [-0.4, -1.05], [0.3, -1.05], [0.95, -0.7], [0.98, -0.1]];
    for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([lerp(0.85, -0.85, u) + T * 0.2, -0.3 + (i % 2 ? 0.08 : 0) + sway(i, 0.1)]); }
    blob(ctx, pts, c.hair, { lw, seed: seed + 70, amp: 0.01, edge: 0.1 });
    // 叶子发卡
    blob(ctx, [[0.55, -0.62], [0.78, -0.82], [0.95, -0.66], [0.75, -0.48]], '#6dbb4a', { lw, seed: seed + 72, amp: 0.006 });
    inkLine(ctx, [[0.58, -0.6], [0.9, -0.7]], lw * 0.8, INK, seed + 73, 0.003);
  } else {
    const pts = [[-0.98, 0.2], [-0.95, -0.7], [-0.4, -1.08], [0.35, -1.06], [0.95, -0.7], [1.0, 0.1], [0.75 + sway(1, 0.3), 0.45], [0.55, -0.2], [0.1, -0.45], [-0.3, -0.25], [-0.6 + sway(2, 0.3), 0.3]];
    blob(ctx, pts.map(q => [q[0] + T * 0.15, q[1]]), c.hair, { lw, seed: seed + 70, amp: 0.01, edge: 0.1 });
    blob(ctx, [[-0.5, -0.9], [-0.1, -1.0], [0.0, -0.75]], c.hair2, { lw: 0, line: null, amp: 0.006, alpha: 0.7, wash: false });
  }
  ctx.restore();
}

// ---------- 全身木偶（面向右；sx=-1 镜像） ----------
// pose 角度：0 = 竖直向下，正值向前（+x）
function drawFigure(ctx, c, x, y, s, pose, t, seed = 1, sx = 1) {
  const P = Object.assign({ lean: 0, aL: [0.15, -0.2], aR: [-0.15, -0.2], lL: [0.1, 0.05], lR: [-0.1, 0.05], head: {}, scarf: 1 }, pose);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * sx, s);
  const sh = [Math.sin(P.lean) * -3.0, -3.0], hip = [0, 0];
  const lwk = 0.32;
  const arm = (a) => { const e = [sh[0] + Math.sin(a[0]) * 1.5, sh[1] + Math.cos(a[0]) * 1.5]; const h = [e[0] + Math.sin(a[0] + a[1]) * 1.4, e[1] + Math.cos(a[0] + a[1]) * 1.4]; return [sh, e, h]; };
  const leg = (l) => { const k = [hip[0] + Math.sin(l[0]) * 2.1, hip[1] + Math.cos(l[0]) * 2.1]; const f = [k[0] + Math.sin(l[0] + l[1]) * 2.1, k[1] + Math.cos(l[0] + l[1]) * 2.1]; return [hip, k, f]; };
  ctx.lineWidth = 0.1;
  const drawLimb = (pts, col, back) => {
    trace(ctx, wob(pts, 0.02, seed), false);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 0.78; ctx.stroke();
    ctx.strokeStyle = back ? shade(col, -0.18) : col; ctx.lineWidth = 0.6; ctx.stroke();
  };
  // 围巾尾（身后）
  if (c.scarf && P.scarf) {
    const tail = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; tail.push([sh[0] - 0.2 - u * 3.2 * P.scarf, sh[1] - 0.2 + u * 0.6 + Math.sin(t * 9 - i * 0.9 + seed) * 0.35 * u]); }
    const top = tail.map((q, i) => [q[0], q[1] - 0.25 * (1 - i / 10)]), bot = tail.map((q, i) => [q[0], q[1] + 0.25 * (1 - i / 10)]).reverse();
    blob(ctx, top.concat(bot), c.scarf, { lw: 0.08, amp: 0.02, seed: seed + 3, edge: 0.15 });
  }
  const lb = leg(P.lR), ab = arm(P.aR);
  drawLimb(lb, c.pants, true); blob(ctx, ell(lb[2][0] + 0.25, lb[2][1] + 0.1, 0.45, 0.25, 10), shade(INK, 0.15), { lw: 0.08, amp: 0.02 });
  drawLimb(ab, c.cloth, true); blob(ctx, ell(ab[2][0], ab[2][1], 0.28, 0.28, 10), c.skin, { lw: 0.08, amp: 0.02 });
  // 躯干
  blob(ctx, [[sh[0] - 0.9, sh[1] + 0.1], [sh[0] + 0.9, sh[1] + 0.1], [0.75, -0.2], [0.8, 0.5], [-0.8, 0.5], [-0.75, -0.2]], c.cloth, { lw: 0.08, amp: 0.02, seed: seed + 5, edge: 0.3 });
  blob(ctx, [[-0.8, 0.0], [0.8, 0.0], [0.8, 0.5], [-0.8, 0.5]], c.trim, { lw: 0.08, amp: 0.02, seed: seed + 6, edge: 0.2 });
  if (c.scarf) blob(ctx, ell(sh[0], sh[1], 0.8, 0.35, 12), c.scarf, { lw: 0.08, amp: 0.02, seed: seed + 7 });
  const lf = leg(P.lL), af = arm(P.aL);
  drawLimb(lf, c.pants, false); blob(ctx, ell(lf[2][0] + 0.25, lf[2][1] + 0.1, 0.45, 0.25, 10), INK, { lw: 0.08, amp: 0.02 });
  // 头
  const hd = Object.assign({ shoulders: false, turn: 0.55, wind: 0.5, wdir: -1 }, P.head);
  drawHead(ctx, c, sh[0] + 0.1, sh[1] - 1.7, 1.4, hd, t, seed + 11);
  drawLimb(af, c.cloth, false); blob(ctx, ell(af[2][0], af[2][1], 0.3, 0.3, 10), c.skin, { lw: 0.08, amp: 0.02 });
  ctx.restore();
  return { hand: [x + af[2][0] * s * sx, y + af[2][1] * s] };
}
const POSE = {
  stand: t => ({ lean: 0.02 * Math.sin(t * 2), aL: [0.12 + 0.03 * Math.sin(t * 2), -0.15], aR: [-0.12, -0.2], lL: [0.08, 0.02], lR: [-0.08, 0.02] }),
  run: (t, sp = 9) => { const ph = t * sp; return { lean: 0.3, aL: [-0.9 * Math.sin(ph), -1.2], aR: [0.9 * Math.sin(ph), -1.2], lL: [0.8 * Math.sin(ph) + 0.2, -0.6 - 0.6 * Math.max(0, -Math.cos(ph))], lR: [-0.8 * Math.sin(ph) + 0.2, -0.6 - 0.6 * Math.max(0, Math.cos(ph))] }; },
  point: t => ({ lean: 0.15, aL: [1.75 + 0.02 * Math.sin(t * 3), -0.05], aR: [-0.4, -0.6], lL: [0.4, -0.1], lR: [-0.35, 0.1] }),
  raise: t => ({ lean: -0.05, aL: [2.45 + 0.03 * Math.sin(t * 4), 0.45], aR: [-0.25, -0.4], lL: [0.25, 0], lR: [-0.25, 0] }),
  fly: t => ({ lean: 1.25, aL: [2.6, 0.1], aR: [0.4, -0.3], lL: [-0.5 + 0.1 * Math.sin(t * 5), 0.3], lR: [-0.7 + 0.1 * Math.sin(t * 5 + 1), 0.5] }),
};

// ---------- 小焰 ----------
const EMB = { body: '#f2b632', light: '#ffe08a', dark: '#c27a1c', flame: ['#d8442a', '#f08a2c', '#ffd25a'] };
function drawEmberSmall(ctx, x, y, s, t, p = {}, seed = 3) {
  const hop = p.hop ?? 0, sx = p.sx ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * sx, s);
  const sq = 1 + 0.12 * Math.sin(hop * Math.PI * 2);
  ctx.scale(1 / sq, sq);
  flame(ctx, -1.0, -0.2, 0.45, 1.5, t, seed, EMB.flame, -0.9 + 0.15 * Math.sin(t * 6));
  blob(ctx, ell(0, 0, 1.0, 0.82, 16), EMB.body, { lw: 0.07, amp: 0.02, seed, edge: 0.25 });
  blob(ctx, ell(0.15, 0.25, 0.55, 0.4, 12), EMB.light, { lw: 0, line: null, amp: 0.02, wash: false });
  [-0.55, 0.45].forEach((lx, i) => blob(ctx, ell(lx, 0.78, 0.22, 0.14, 10), EMB.dark, { lw: 0.06, amp: 0.02, seed: seed + i }));
  // 头
  const hx = 0.55, hy = -0.75;
  blob(ctx, [[hx - 0.6, hy - 0.3], [hx - 0.55, hy - 1.05], [hx - 0.2, hy - 0.55]], EMB.body, { lw: 0.07, amp: 0.02, seed: seed + 4 });
  blob(ctx, [[hx + 0.15, hy - 0.55], [hx + 0.55, hy - 1.05], [hx + 0.62, hy - 0.3]], EMB.body, { lw: 0.07, amp: 0.02, seed: seed + 5 });
  blob(ctx, ell(hx, hy, 0.75, 0.62, 16), EMB.body, { lw: 0.07, amp: 0.02, seed: seed + 6, edge: 0.2 });
  blob(ctx, ell(hx + 0.2, hy + 0.25, 0.38, 0.24, 12), EMB.light, { lw: 0.05, amp: 0.02, seed: seed + 7 });
  const bl = autoBlink(t, seed);
  [hx - 0.15, hx + 0.38].forEach((ex, i) => {
    if (bl > 0.6 || p.happy) inkLine(ctx, [[ex - 0.1, hy], [ex, hy - 0.08], [ex + 0.1, hy]], 0.07, INK, seed + 10 + i, 0.01);
    else { blob(ctx, ell(ex, hy - 0.03, 0.1, 0.15, 10), INK, { lw: 0, line: null, amp: 0.005, wash: false }); blob(ctx, ell(ex - 0.03, hy - 0.08, 0.04, 0.05, 8), '#fffbe8', { lw: 0, line: null, amp: 0.003, wash: false }); }
  });
  blob(ctx, ell(hx + 0.3, hy + 0.15, 0.06, 0.04, 8), '#7a3a2a', { lw: 0, line: null, amp: 0.004, wash: false });
  // 额头上的琥珀种子
  blob(ctx, [[hx + 0.05, hy - 0.5], [hx + 0.13, hy - 0.32], [hx + 0.05, hy - 0.22], [hx - 0.03, hy - 0.32]], '#ff9a2c', { lw: 0.04, amp: 0.005 });
  ctx.restore();
}
function maneFlames(ctx, s, t, n, r0, r1, seed, a0 = 0, a1 = Math.PI * 2) {
  for (let i = 0; i < n; i++) {
    const a = a0 + (i + 0.5) / n * (a1 - a0);
    const r = r0 + hash(seed + i) * 0.2;
    flame(ctx, Math.cos(a) * r, Math.sin(a) * r, 0.45 + hash(seed + i * 3) * 0.2, (r1 - r0) * (0.8 + hash(seed + i * 7) * 0.5), t, seed + i, EMB.flame, a + Math.PI / 2);
  }
}
// 巨兽正面头像
function drawBeastHead(ctx, x, y, s, t, p = {}, seed = 9) {
  const roar = p.roar ?? 0, eo = p.eyes ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  glow(ctx, 0, 0, 3.2, '#ff8a2a', 0.35 * (p.glow ?? 1));
  maneFlames(ctx, s, t, 18, 1.15, 2.4, seed);
  const face = [[-1.1, -0.6], [-0.75, -1.2], [0, -1.35], [0.75, -1.2], [1.1, -0.6], [1.05, 0.25], [0.6, 0.9 + roar * 0.2], [0, 1.15 + roar * 0.3], [-0.6, 0.9 + roar * 0.2], [-1.05, 0.25]];
  blob(ctx, face, EMB.body, { lw: 0.06, amp: 0.015, seed, edge: 0.25 });
  // 花纹
  [-1, 1].forEach((k, i) => blob(ctx, [[k * 0.95, -0.4], [k * 0.55, -0.25], [k * 0.9, -0.1]], '#c94a2a', { lw: 0.04, amp: 0.01, seed: seed + i }));
  blob(ctx, [[0, -0.95], [0.16, -0.62], [0, -0.45], [-0.16, -0.62]], '#ff7a22', { lw: 0.05, amp: 0.008, seed: seed + 3 });
  glow(ctx, 0, -0.68, 0.5, '#ffd25a', 0.6 + 0.3 * Math.sin(t * 4));
  // 眼
  [-1, 1].forEach((k, i) => {
    const ex = k * 0.48, ey = -0.15, ry = 0.17 * eo;
    if (eo < 0.1) { inkLine(ctx, [[ex - k * 0.25, ey], [ex + k * 0.22, ey - 0.08]], 0.07, INK, seed + 20 + i, 0.01); return; }
    const pts = [[ex - k * 0.3, ey + 0.05], [ex - k * 0.05, ey - ry], [ex + k * 0.28, ey - ry * 0.8], [ex + k * 0.22, ey + ry * 0.6], [ex - k * 0.05, ey + ry * 0.7]];
    blob(ctx, pts, '#fff2c4', { lw: 0.07, amp: 0.008, seed: seed + 22 + i, wash: false });
    blob(ctx, ell(ex + k * 0.02, ey, 0.1, ry * 0.85, 10), '#d8402a', { lw: 0, line: null, amp: 0.004, wash: false });
    blob(ctx, ell(ex + k * 0.02, ey, 0.035, ry * 0.7, 8), INK, { lw: 0, line: null, amp: 0.003, wash: false });
  });
  // 口鼻
  blob(ctx, ell(0, 0.45 + roar * 0.1, 0.55, 0.38 + roar * 0.15, 14), EMB.light, { lw: 0.05, amp: 0.01, seed: seed + 30 });
  blob(ctx, [[-0.2, 0.25], [0.2, 0.25], [0, 0.42]], '#6a2c24', { lw: 0.04, amp: 0.006, seed: seed + 31 });
  if (roar > 0.05) {
    const mp = [[-0.42, 0.62], [0.42, 0.62], [0.3, 0.62 + 0.5 * roar], [0, 0.72 + 0.6 * roar], [-0.3, 0.62 + 0.5 * roar]];
    blob(ctx, mp, '#7c2b31', { lw: 0.05, amp: 0.006, seed: seed + 32, wash: false });
    [-0.3, 0.3].forEach((fx, i) => blob(ctx, [[fx - 0.06, 0.62], [fx + 0.06, 0.62], [fx, 0.8]], '#fff6e0', { lw: 0.03, amp: 0.004, seed: seed + 33 + i }));
  } else inkLine(ctx, [[-0.3, 0.62], [0, 0.55], [0.3, 0.62]], 0.05, INK, seed + 34, 0.006);
  ctx.restore();
}
// 巨兽侧身奔跑（面向右）
function drawBeastRun(ctx, x, y, s, t, seed = 12, sx = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * sx, s);
  const ph = t * 10, bob = Math.sin(ph * 2) * 0.12;
  ctx.translate(0, bob);
  // 尾焰
  for (let i = 0; i < 4; i++) flame(ctx, -2.3 - i * 0.5, -0.4 - i * 0.15, 0.4 - i * 0.06, 1.6, t, seed + i, EMB.flame, -1.45 + 0.1 * Math.sin(t * 8 + i));
  const legs = [[-1.4, 0], [-1.0, 1.6], [1.0, 0.8], [1.4, 2.4]];
  legs.forEach(([lx, o], i) => {
    const a = Math.sin(ph + o) * 0.7, back = i % 2 === 0;
    const k = [lx + Math.sin(a) * 1.0, 0.6 + Math.cos(a) * 1.0], f = [k[0] + Math.sin(a * 0.4 - 0.3) * 1.0, k[1] + 1.0];
    trace(ctx, [[lx, 0.2], k, f], false); ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 0.62; ctx.stroke();
    ctx.strokeStyle = back ? EMB.dark : EMB.body; ctx.lineWidth = 0.5; ctx.stroke();
  });
  blob(ctx, ell(0, 0, 2.3, 0.95, 18), EMB.body, { lw: 0.06, amp: 0.015, seed, edge: 0.3 });
  blob(ctx, ell(0.2, 0.45, 1.6, 0.35, 14), EMB.light, { lw: 0, line: null, amp: 0.01, wash: false, alpha: 0.8 });
  [-0.8, 0, 0.8].forEach((sx2, i) => blob(ctx, [[sx2 - 0.15, -0.85], [sx2 + 0.15, -0.88], [sx2 + 0.05, -0.35]], '#c94a2a', { lw: 0.04, amp: 0.01, seed: seed + 40 + i }));
  ctx.save(); ctx.translate(2.4, -0.7);
  maneFlames(ctx, s, t, 11, 0.85, 1.9, seed + 5, Math.PI * 0.45, Math.PI * 1.75);
  blob(ctx, [[-0.6, -0.6], [0.2, -0.8], [0.9, -0.3], [1.3, 0.1], [1.2, 0.5], [0.5, 0.65], [-0.5, 0.55], [-0.8, 0]], EMB.body, { lw: 0.06, amp: 0.015, seed: seed + 6, edge: 0.2 });
  blob(ctx, [[0.3, 0.2], [1.2, 0.15], [1.15, 0.5], [0.4, 0.55]], EMB.light, { lw: 0.04, amp: 0.01, seed: seed + 7 });
  blob(ctx, [[0.25, -0.25], [0.6, -0.33], [0.55, -0.12], [0.3, -0.1]], '#fff2c4', { lw: 0.05, amp: 0.006, seed: seed + 8, wash: false });
  blob(ctx, ell(0.45, -0.2, 0.06, 0.09, 8), '#d8402a', { lw: 0, line: null, amp: 0.003, wash: false });
  blob(ctx, [[-0.2, -0.55], [0.1, -1.2], [0.25, -0.6]], EMB.body, { lw: 0.05, amp: 0.01, seed: seed + 9 });
  ctx.restore();
  ctx.restore();
}

// ---------- 影鸦 ----------
const VIL = { body: '#2f2442', wing: '#3a2d55', wing2: '#55427a', eye: '#ff3a3a' };
function drawVillain(ctx, x, y, s, t, p = {}, seed = 21) {
  const open = p.open ?? 1, flap = Math.sin(t * (p.flapSp ?? 2.2)) * 0.15 * (p.flap ?? 1);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  glow(ctx, 0, 0, 4, '#7a3cff', 0.25);
  // 烟尾
  for (let i = 0; i < 5; i++) {
    const u = i / 4;
    blob(ctx, ell(Math.sin(t * 2 + i) * 0.4 * u, 1.2 + u * 1.6, 0.6 - u * 0.3, 0.4, 10), rgba('#2f2442', 0.8 - u * 0.5), { line: null, amp: 0.05, seed: seed + i, wash: false });
  }
  [-1, 1].forEach((k, wi) => {
    const pts = [[k * 0.4, -0.5]];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const u = i / n, ang = (-0.35 - flap - (1 - open) * 1.0) * k + 0 ;
      const len = 1 + u * 3.6 * (0.3 + 0.7 * open);
      const ax = k * len, ay = -0.7 - Math.sin(u * Math.PI) * 1.0 * open + u * u * 1.0;
      const rx = ax * Math.cos(ang) - ay * Math.sin(ang), ry = ax * Math.sin(ang) + ay * Math.cos(ang);
      pts.push([rx, ry]);
    }
    for (let i = n; i >= 1; i--) {
      const u = i / n, ang = (-0.35 - flap - (1 - open) * 1.0) * k;
      const len = 0.8 + u * 3.3 * (0.3 + 0.7 * open);
      const ax = k * len, ay = 0.6 + (1 - u) * 0.2 + (i % 2 ? 0.55 : 0) * open;
      pts.push([ax * Math.cos(ang) - ay * Math.sin(ang), ax * Math.sin(ang) + ay * Math.cos(ang)]);
    }
    pts.push([k * 0.4, 0.4]);
    blob(ctx, pts, VIL.wing, { lw: 0.06, amp: 0.02, seed: seed + 10 + wi, edge: 0.35 });
    blob(ctx, pts.slice(0, 6).concat([[k * 0.6, 0.0]]), VIL.wing2, { lw: 0, line: null, amp: 0.02, wash: false, alpha: 0.6 });
  });
  blob(ctx, [[-0.55, -0.9], [0, -1.4], [0.55, -0.9], [0.65, 0.3], [0, 1.3], [-0.65, 0.3]], VIL.body, { lw: 0.06, amp: 0.02, seed: seed + 20, edge: 0.3 });
  // 头与喙
  blob(ctx, [[-0.4, -1.1], [-0.55, -1.8], [-0.2, -1.5], [0, -1.65], [0.2, -1.5], [0.55, -1.8], [0.4, -1.1], [0, -0.75]], '#3f3060', { lw: 0.06, amp: 0.015, seed: seed + 21 });
  const eg = p.eyes ?? 1;
  [[-0.18, -1.25], [0.18, -1.25], [0, -0.35], [-0.25, -0.1], [0.25, -0.1], [0, 0.15]].forEach(([ex, ey], i) => {
    const r = i < 2 ? 0.1 : 0.08;
    const on = clamp(eg * 6 - i);
    if (on <= 0) return;
    blob(ctx, ell(ex, ey, r, r * 0.7 * on, 10), VIL.eye, { lw: 0, line: null, amp: 0.004, wash: false });
    glow(ctx, ex, ey, 0.5, '#ff4040', 0.5 * on);
  });
  ctx.restore();
}

// 琥珀种子护符
function drawAmulet(ctx, x, y, s, t, lit = 1, broken = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (lit > 0) { glow(ctx, 0, 0, 3.5, '#ffb43a', 0.6 * lit); rays(ctx, 0, 0, 12, 6 * lit, '#ffe08a', t * 0.3, 0.35 * lit, 0.06, 7); }
  const half = (k) => [[0, -1.0], [0.55 * k, -0.4], [0.5 * k, 0.4], [0, 1.0]];
  [-1, 1].forEach((k, i) => {
    ctx.save(); ctx.translate(k * broken * 0.8, broken * 0.4 * (i ? 1 : -1)); ctx.rotate(k * broken * 0.4);
    blob(ctx, half(k).concat([[0, 1.0]]), lit > 0.2 ? '#ffa23a' : '#9a6a3a', { lw: 0.08, amp: 0.02, seed: 5 + i, edge: 0.2 });
    ctx.restore();
  });
  blob(ctx, ell(-0.15, -0.3, 0.12, 0.25, 8, 0.4), '#fff4c8', { lw: 0, line: null, wash: false, amp: 0.01, alpha: 0.8 });
  inkLine(ctx, [[0, -1.0], [0, -1.6]], 0.08, INK, 9, 0.01);
  ctx.restore();
}
// 蒲公英种子
function drawSeed(ctx, x, y, s, rot, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.strokeStyle = rgba('#fffaf0', 0.95); ctx.lineWidth = 0.06;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 1.2); ctx.stroke();
  for (let i = 0; i < 9; i++) { const ang = -Math.PI / 2 + (i - 4) * 0.28; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 0.9, Math.sin(ang) * 0.9); ctx.stroke(); }
  ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(0, 1.25, 0.08, 0.16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
