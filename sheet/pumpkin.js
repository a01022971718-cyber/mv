// 原创南瓜小人（第 2 版）：简单 3D 模型投影 + 四级线条层次 + 水彩上色
// 依赖 src/lib.js（ell / hash / trace / wob / chaikin / densify / makeBlotch / rgba / shade / lerp）与 sheet/seedling.js（sparkle / bang）
const PK = { body: '#e0773a', limb: '#b4542a', stem: '#6d8a3c', stem2: '#4e6a2a', eye: '#2a2230', mouth: '#5a1f22', tongue: '#e8858a', tooth: '#fbf4e6', pool: '#9b90b4', ink2: '#5a2a1c' };
const RX = 1.2, RY = 0.8, LEG = 0.36, PITCH = 0.18;
const VIEW_TH = { front: 0, q: 0.61, side: Math.PI / 2, qback: Math.PI - 0.61, back: Math.PI };
// 线条四级：W1 身体外轮廓 / W2 四肢与配饰轮廓 / W3 内部结构线 / W4 牙齿等细节
const W1 = 0.085, W2 = 0.055, W3 = 0.03, W4 = 0.018;

// ---------- 3D → 屏幕 ----------
function mkProj(th, cy) {
  const c = Math.cos(th), s = Math.sin(th), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  return ([x, y, z]) => { const x1 = x * c + z * s, z1 = -x * s + z * c; return [x1, cy + y * cp + z1 * sp, z1 * cp - y * sp]; };
}
const lobe = f => 0.95 + 0.05 * Math.cos(6 * f);
const surf = (f, v) => [RX * lobe(f) * Math.sin(v) * Math.sin(f), -RY * Math.cos(v), RX * lobe(f) * Math.sin(v) * Math.cos(f)];
function outlineOf(pts, cx, cy, bins = 90) {
  const best = new Array(bins).fill(null);
  pts.forEach(p => { const a = Math.atan2(p[1] - cy, p[0] - cx), k = ((Math.floor((a + Math.PI) / (2 * Math.PI) * bins)) % bins + bins) % bins, r = Math.hypot(p[0] - cx, p[1] - cy); if (!best[k] || r > best[k][2]) best[k] = [p[0], p[1], r]; });
  return best.filter(Boolean).map(p => [p[0], p[1]]);
}
const area = pts => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

// ---------- 墨线：粗细随方向（背光一侧和顶边更重）、两头收笔、边缘略毛 ----------
function inkV(ctx, pts, closed, w, o = {}) {
  if (pts.length < 2) return;
  const col = o.col ?? INK, seed = o.seed ?? 0, P = pts.length > 5 ? chaikin(pts, closed, 2) : densify(pts, closed, 8), N = P.length;
  const sgn = closed ? Math.sign(area(P)) || 1 : 1, Lp = [], Rp = [];
  for (let i = 0; i < N; i++) {
    const a = P[closed ? (i - 1 + N) % N : Math.max(0, i - 1)], b = P[closed ? (i + 1) % N : Math.min(N - 1, i + 1)], c = P[i];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const nx = dy * sgn, ny = -dx * sgn; // 外法线
    let f = 1;
    if (o.dir) f *= 0.68 + 0.55 * Math.max(0, nx * 0.5 + ny * 0.86) + 0.3 * Math.max(0, -ny);
    if (!closed && o.taper !== false) { const u = i / (N - 1); f *= 0.3 + 0.7 * Math.min(1, Math.min(u, 1 - u) / (o.taperLen ?? 0.3)); }
    f *= 1 + 0.08 * Math.sin(i * 0.37 + seed) + 0.025 * (hash(Math.floor(i / 3) * 7.31 + seed) - 0.5);
    const hw = w * f / 2;
    Lp.push([c[0] - dy * hw, c[1] + dx * hw]); Rp.push([c[0] + dy * hw, c[1] - dx * hw]);
  }
  ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = o.alpha ?? 1; ctx.beginPath();
  if (closed) { Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); Rp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill('evenodd'); }
  else { Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); for (let i = N - 1; i >= 0; i--) ctx.lineTo(...Rp[i]); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

// ---------- 水彩上色：双层不规则边 + 底部积色带 + 上方湿润晕亮 + 颗粒 + 边缘积色 ----------
function fillWC(ctx, pts, col, o = {}) {
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1, px = v => v / sc, seed = o.seed ?? 0;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), h = y1 - y0, wdt = x1 - x0;
  ctx.save(); ctx.translate(px(1.4), px(1.0)); // 颜色略微偏出墨线
  trace(ctx, pts, true); ctx.fillStyle = col; ctx.globalAlpha = 1; ctx.fill();
  trace(ctx, wob(pts, px(2.4), seed + 9), true); ctx.fillStyle = shade(col, -0.06); ctx.globalAlpha = 0.25; ctx.fill();
  ctx.globalAlpha = 1; trace(ctx, pts, true); ctx.clip();
  if (o.pool !== false && h * sc > 18) { // 颜料在下部堆积成一条带
    ctx.save(); ctx.filter = `blur(${Math.max(1, Math.round(h * sc * 0.05))}px)`; ctx.fillStyle = shade(col, -0.2); ctx.globalAlpha = 0.38;
    const band = []; for (let i = 0; i <= 12; i++) band.push([x0 - wdt * 0.1 + wdt * 1.2 * i / 12, y0 + h * (0.6 + 0.05 * Math.sin(i * 1.7 + seed))]);
    band.push([x1 + wdt * 0.2, y1 + h * 0.2], [x0 - wdt * 0.2, y1 + h * 0.2]); trace(ctx, band, true); ctx.fill(); ctx.restore();
    ctx.save(); ctx.filter = `blur(${Math.max(2, Math.round(h * sc * 0.12))}px)`; ctx.fillStyle = shade(col, 0.2); ctx.globalAlpha = 0.28; // 湿润晕亮
    trace(ctx, ell(x0 + wdt * 0.36, y0 + h * 0.3, wdt * 0.26, h * 0.16, 12), true); ctx.fill(); ctx.restore();
  }
  if (BLOTCH) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.3; ctx.drawImage(BLOTCH, 0, 0); ctx.restore(); }
  ctx.save(); ctx.filter = 'blur(1.5px)'; trace(ctx, pts, true); ctx.strokeStyle = shade(col, -0.32); ctx.globalAlpha = 0.35; ctx.lineWidth = px(4); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function part(ctx, pts, col, w = W2, o = {}) { fillWC(ctx, pts, col, o); inkV(ctx, pts, true, w, { dir: true, seed: o.seed ?? 0 }); }
// 不规则淡紫水渍阴影
function pool(ctx, cx, cy, rx, ry, a = 1) {
  ctx.save(); ctx.filter = 'blur(2px)';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba(PK.pool, 0.13 * a); trace(ctx, wob(ell(cx + (hash(i) - 0.5) * rx * 0.3, cy + (hash(i + 7) - 0.5) * ry * 0.4, rx * (0.75 + 0.3 * hash(i + 3)), ry * (0.8 + 0.4 * hash(i + 5)), 18), ry * 0.25, i * 13), true); ctx.fill(); }
  ctx.restore();
}

// ---------- 表情（画在南瓜表面 φ/v 坐标上，实心眼睛无描边） ----------
function eyesAndMouth(ctx, P, expr, map = p => p) {
  const pj = fv => P(map(surf(fv[0], fv[1]))), vis = q => q.reduce((a, p) => a + p[2], 0) / q.length > 0.15;
  const v0 = 0.44 * Math.PI, E = [[-0.34, -1], [0.34, 1]];
  if (expr === 'happy' || expr === 'angry') {
    E.forEach(([fc, k]) => {
      const pts = expr === 'happy' ? [[fc - 0.13, v0 + 0.06], [fc, v0 - 0.07], [fc + 0.13, v0 + 0.06]] : [[fc - 0.12 * k, v0 - 0.09], [fc + 0.08 * k, v0], [fc - 0.12 * k, v0 + 0.09]];
      const q = pts.map(pj); if (vis(q)) inkV(ctx, q.map(p => [p[0], p[1]]), false, 0.11, { seed: fc * 9, taperLen: 0.45, col: PK.eye });
    });
  } else {
    const sz = expr === 'surprised' ? 1.85 : 1.6;
    E.forEach(([fc]) => {
      const q = [[fc - 0.07 * sz, v0 - 0.11 * sz], [fc + 0.07 * sz, v0 - 0.11 * sz], [fc + 0.07 * sz, v0 + 0.11 * sz], [fc - 0.07 * sz, v0 + 0.11 * sz]].map(pj);
      if (!vis(q)) return;
      ctx.save(); trace(ctx, chaikin(q.map(p => [p[0], p[1]]), true, 2), true); ctx.fillStyle = PK.eye; ctx.fill(); ctx.restore();
      const hl = pj([fc - 0.03 * sz, v0 - 0.06 * sz]); ctx.save(); trace(ctx, ell(hl[0], hl[1], 0.035, 0.045, 10), true); ctx.fillStyle = PK.tooth; ctx.fill(); ctx.restore();
    });
  }
  const mv = 0.63 * Math.PI;
  if (expr === 'surprised') { const q = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; q.push(pj([Math.cos(a) * 0.07, mv + 0.02 + Math.sin(a) * 0.08])); } if (vis(q)) part(ctx, q.map(p => [p[0], p[1]]), PK.mouth, W3, { pool: false }); }
  else if (expr === 'happy') { const q = []; for (let i = 0; i <= 8; i++) { const f = lerp(-0.2, 0.2, i / 8); q.push(pj([f, mv - 0.02])); } for (let i = 8; i >= 0; i--) { const f = lerp(-0.2, 0.2, i / 8); q.push(pj([f, mv - 0.02 + 0.13 * (1 - Math.pow(f / 0.2, 2))])); } if (vis(q)) part(ctx, q.map(p => [p[0], p[1]]), PK.mouth, W3, { pool: false }); }
  else if (expr === 'neutral') { const q = [[-0.1, mv], [0, mv + 0.05], [0.1, mv]].map(pj); if (vis(q)) inkV(ctx, q.map(p => [p[0], p[1]]), false, 0.05, { seed: 3, col: PK.eye }); }
}

// ---------- 主绘制 ----------
function drawPumpkin(ctx, x, y, s, o, t) {
  o = Object.assign({ view: 'front', expr: 'neutral', legs: 'stand', walk: 0, arms: 'down', lift: 0, lean: 0, lid: 0, acc: null, sx: 1, sy: 1 }, o);
  const th = VIEW_TH[o.view] ?? o.view, cy = -(LEG + RY), P = mkProj(th, cy);
  ctx.save(); ctx.translate(x, y);
  pool(ctx, 0, 4, s * RX * 1.08 * (1 - o.lift * 0.4) * Math.max(1, o.sx), s * 0.16, 1 - o.lift * 0.6);
  ctx.scale(s, s); ctx.translate(0, -o.lift); ctx.rotate(o.lean); ctx.scale(o.sx, o.sy);
  const legs = [-1, 1].map((k, i) => {
    const hip = [k * 0.48, RY * 0.68, 0.05];
    let foot = [k * 0.5, RY * 0.68 + LEG + 0.04, 0.05];
    if (o.legs === 'walk') { const a = Math.sin(o.walk + i * Math.PI) * 0.5; foot = [k * 0.5, RY * 0.68 + (LEG + 0.04) * Math.cos(a), 0.05 + (LEG + 0.04) * Math.sin(a)]; }
    if (o.legs === 'dangle') foot = [k * 0.42, RY * 0.68 + LEG + 0.02, -0.12];
    if (o.legs === 'brace') foot = [k * 0.72, RY * 0.68 + LEG, 0.05];
    return { a: P(hip), b: P(foot), d: P(hip)[2], k };
  });
  const AE = { down: [1.55, 0.4, -0.1], up: [1.32, -0.85, -0.05], out: [1.7, -0.12, -0.1], back: [1.5, 0.25, -0.5], fan: [1.5, 0.05, 0.2], swing: null }[o.arms];
  const arms = [-1, 1].map((k, i) => {
    const sh = [k * RX * 0.93, 0.05, -0.15];
    const end = AE ? [k * AE[0], AE[1], AE[2]] : [k * 1.45, 0.38, Math.sin(o.walk + (i ? 0 : Math.PI)) * 0.55];
    return { a: P(sh), b: P(end), d: P(sh)[2], k };
  });
  const limb = (L, w, back) => {
    const col = back ? shade(PK.limb, -0.15) : PK.limb, a = [L.a[0], L.a[1]], b = [L.b[0], L.b[1]];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2;
    part(ctx, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], col, W2, { pool: false, seed: L.k * 5 });
  };
  const foot = (L, back) => part(ctx, ell(L.b[0] + 0.03, L.b[1] + 0.02, 0.15, 0.075, 12), back ? shade(PK.limb, -0.3) : shade(PK.limb, -0.15), W2, { pool: false, seed: 7 + L.k });
  const hand = (L, back) => part(ctx, ell(L.b[0], L.b[1], 0.12, 0.11, 12), back ? shade(PK.limb, -0.15) : PK.limb, W2, { pool: false, seed: 9 + L.k });
  legs.filter(L => L.d < -0.02).forEach(L => { limb(L, 0.2, true); foot(L, true); });
  arms.filter(L => L.d < -0.02).forEach(L => { limb(L, 0.15, true); hand(L, true); });
  if (o.lid) bodyLid(ctx, P, cy, o, t); else bodyMain(ctx, P, cy, o, t);
  legs.filter(L => L.d >= -0.02).forEach(L => { limb(L, 0.2, false); foot(L, false); });
  arms.filter(L => L.d >= -0.02).forEach(L => { limb(L, 0.15, false); hand(L, false); });
  if (o.acc) pkAcc(ctx, o.acc, P, cy, arms, t);
  ctx.restore();
}
function silhouette(P, cy, vmin = 0, vmax = Math.PI, map = p => p) {
  const pts = []; let sx = 0, sy = 0;
  for (let i = 0; i < 64; i++) for (let j = 0; j <= 20; j++) { const p = P(map(surf(i / 64 * Math.PI * 2, lerp(vmin, vmax, j / 20)))); pts.push([p[0], p[1]]); sx += p[0]; sy += p[1]; }
  return outlineOf(pts, sx / pts.length, sy / pts.length);
}
function grooves(ctx, P, vmin, vmax, map = p => p) { // W3：只画朝前的几条，且只画中段
  for (let k = 0; k < 6; k++) {
    const f = (k + 0.5) / 6 * Math.PI * 2; let run = [];
    const flush = () => { if (run.length > 4) inkV(ctx, run, false, W3, { col: PK.ink2, seed: k, alpha: 0.85 }); run = []; };
    for (let j = 0; j <= 22; j++) { const v = lerp(vmin, vmax, j / 22), p = P(map(surf(f, v))); if (p[2] > 0.3 && Math.abs(p[0]) < RX * 0.82) run.push([p[0], p[1]]); else flush(); }
    flush();
  }
}
function stem(ctx, P, map = p => p) {
  const b = [0, -RY * 0.95, 0], q = [[0, 0, 0], [0.02, -0.16, 0.02], [0.08, -0.29, 0.05], [0.17, -0.34, 0.08]].map(d => { const r = P(map([b[0] + d[0], b[1] + d[1], b[2] + d[2]])); return [r[0], r[1]]; });
  const w = 0.17, path = [], off = (i, sg) => { const p = q[i], a = q[Math.max(0, i - 1)], c = q[Math.min(3, i + 1)], dx = c[0] - a[0], dy = c[1] - a[1], d = Math.hypot(dx, dy) || 1, ww = w * (1 - i * 0.12) / 2; return [p[0] - sg * dy / d * ww, p[1] + sg * dx / d * ww]; };
  for (let i = 0; i < 4; i++) path.push(off(i, 1));
  for (let i = 3; i >= 0; i--) path.push(off(i, -1));
  part(ctx, path, PK.stem, W2, { pool: false, seed: 21 });
  const tip = q[3]; part(ctx, ell(tip[0], tip[1], 0.075, 0.055, 10), PK.stem2, W3, { pool: false, seed: 22 });
}
function bodyMain(ctx, P, cy, o, t) {
  const sil = silhouette(P, cy);
  if (!PK_HATS.includes(o.acc)) stem(ctx, P);
  fillWC(ctx, sil, PK.body, { seed: 1 });
  grooves(ctx, P, 0.25 * Math.PI, 0.8 * Math.PI);
  eyesAndMouth(ctx, P, o.expr);
  inkV(ctx, sil, true, W1, { dir: true, seed: 1 });
}
// LID：南瓜从中间分开，上半（带眼睛）绕后侧铰链张开，露出嘴里的牙和舌头
function bodyLid(ctx, P, cy, o, t) {
  const vc = 0.5 * Math.PI, ry = 0, rr = RX * 0.95, ang = o.lid;
  const rot = ([x, yy, z]) => { const dy = yy - ry, dz = z + rr; return [x, ry + dy * Math.cos(ang) - dz * Math.sin(ang), -rr + dy * Math.sin(ang) + dz * Math.cos(ang)]; };
  const rim = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; rim.push([Math.sin(a) * rr * lobe(a), ry, Math.cos(a) * rr * lobe(a)]); }
  const P2 = p => { const q = P(p); return [q[0], q[1]]; };
  const teeth = (map, dir) => rim.forEach((p, i) => { if (i % 3 || Math.cos(i / 48 * Math.PI * 2) < 0.3) return; const q2 = rim[(i + 2) % 48]; part(ctx, [P2(map(p)), P2(map(q2)), P2(map([(p[0] + q2[0]) / 2, ry + dir * 0.14, (p[2] + q2[2]) / 2]))], PK.tooth, W4, { pool: false, seed: 40 + i }); });
  const lower = silhouette(P, cy, vc, Math.PI);
  fillWC(ctx, lower, PK.body, { seed: 2 });
  grooves(ctx, P, vc + 0.08, 0.8 * Math.PI);
  part(ctx, rim.map(p => P2(p)), PK.mouth, W3, { pool: false, seed: 30 });
  const tg = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; tg.push(P2([Math.sin(a) * 0.45, ry - 0.01, 0.25 + Math.cos(a) * 0.3])); }
  ctx.save(); trace(ctx, rim.map(p => P2(p)), true); ctx.clip(); fillWC(ctx, tg, PK.tongue, { pool: false }); ctx.restore();
  teeth(p => p, -1);
  inkV(ctx, lower, true, W1, { dir: true, seed: 2 });
  const upper = silhouette(P, cy, 0, vc, rot);
  stem(ctx, P, rot);
  fillWC(ctx, upper, PK.body, { seed: 3 });
  grooves(ctx, P, 0.25 * Math.PI, vc - 0.08, rot);
  part(ctx, rim.map(p => P2(rot(p))), shade(PK.mouth, -0.1), W3, { pool: false, seed: 31 });
  teeth(rot, 1);
  eyesAndMouth(ctx, P, 'angry', rot);
  inkV(ctx, upper, true, W1, { dir: true, seed: 3 });
}

// ---------- 中国风配饰（耳机、蝴蝶结保留），全部用 W2 轮廓 ----------
const PK_HATS = ['guapi', 'douli', 'tiger', 'phoenix', 'wusha'];
function pkAcc(ctx, acc, P, cy, arms, t) {
  const top = P([0, -RY, 0]), tx = top[0], ty = top[1] + 0.06, br = Math.sin(PITCH) + 0.05;
  const sh = (p, c, s) => part(ctx, p, c, W2, { pool: false, seed: 100 + s });
  const dome = (rx, h, col, seed) => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; p.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * h]); } for (let i = 16; i >= 0; i--) { const a = i / 16 * Math.PI; p.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * rx * br]); } sh(p, col, seed); };
  const brim = (rx, col, seed, dy = 0) => sh(ell(tx, ty + dy, rx, rx * br, 24), col, seed);
  const line3 = (pts, col, s) => inkV(ctx, pts, false, W3, { col, seed: s });
  const dot = (x, y, r, col) => { ctx.save(); trace(ctx, ell(x, y, r, r, 8), true); ctx.fillStyle = col; ctx.fill(); ctx.restore(); };
  switch (acc) {
    case 'guapi': dome(0.6, 0.42, '#2f2a38', 1); [-0.3, 0, 0.3].forEach((k, i) => line3([[tx + k * 0.25, ty - 0.4], [tx + k, ty - 0.02]], '#6a6478', 2 + i)); sh(ell(tx, ty - 0.45, 0.09, 0.09, 12), '#c8342a', 5); break;
    case 'douli': sh([[tx - 1.3, ty + 0.04], [tx, ty - 0.7], [tx + 1.3, ty + 0.04], [tx, ty + 0.04 + 1.3 * br]], '#d6b676', 6); for (let i = 1; i < 4; i++) line3([[tx - 1.3 * i / 4, ty + 0.04 - 0.72 * (1 - i / 4)], [tx + 1.3 * i / 4, ty + 0.04 - 0.72 * (1 - i / 4)]], '#9a7a40', 7 + i); break;
    case 'tiger': [-1, 1].forEach((k, i) => sh(ell(tx + k * 0.46, ty - 0.38, 0.15, 0.15, 12), '#ec9a30', 11 + i)); dome(0.62, 0.44, '#ec9a30', 13); [-0.12, 0, 0.12].forEach((d, i) => line3([[tx - 0.17, ty - 0.24 + d], [tx + 0.17, ty - 0.24 + d]], '#2f2a38', 14 + i)); brim(0.64, '#c8342a', 17, 0.02); break;
    case 'phoenix': sh([[tx - 0.52, ty + 0.04], [tx - 0.56, ty - 0.32], [tx - 0.26, ty - 0.16], [tx, ty - 0.5], [tx + 0.26, ty - 0.16], [tx + 0.56, ty - 0.32], [tx + 0.52, ty + 0.04]], '#e4b23c', 18); sh(ell(tx, ty - 0.2, 0.08, 0.1, 10), '#c8342a', 19); [-1, 1].forEach((k, i) => { line3([[tx + k * 0.54, ty], [tx + k * 0.66, ty + 0.42]], '#a8822a', 20 + i); [0, 1, 2].forEach(j => sh(ell(tx + k * (0.57 + j * 0.035), ty + 0.12 + j * 0.13, 0.04, 0.04, 8), '#fbf4e6', 22 + j)); }); break;
    case 'wusha': [-1, 1].forEach((k, i) => { line3([[tx + k * 0.45, ty - 0.12], [tx + k * 1.05, ty - 0.22]], INK, 25 + i); sh(ell(tx + k * 1.13, ty - 0.23, 0.18, 0.08, 12, k * 0.1), '#2f2a38', 27 + i); }); dome(0.46, 0.48, '#2f2a38', 29); brim(0.56, '#2f2a38', 30, 0.02); break;
    case 'hairpin': inkV(ctx, [[tx - 0.5, ty - 0.45], [tx + 0.3, ty + 0.1]], false, 0.075, { col: '#a8822a', seed: 31 }); sh(ell(tx - 0.52, ty - 0.47, 0.08, 0.08, 10), '#e04a6a', 32); line3([[tx - 0.52, ty - 0.4], [tx - 0.57, ty - 0.12]], '#c8342a', 33); sh([[tx - 0.62, ty - 0.13], [tx - 0.52, ty - 0.13], [tx - 0.5, ty + 0.1], [tx - 0.64, ty + 0.1]], '#c8342a', 34); break;
    case 'knot': { const a = P([RX * 0.97, 0, 0.05]), x = a[0] + 0.12, y = a[1] + 0.1; line3([[a[0], a[1] - 0.2], [x, y - 0.2]], '#c8342a', 35); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); sh([[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]], '#c8342a', 36); ctx.restore(); sh([[x - 0.05, y + 0.2], [x + 0.05, y + 0.2], [x + 0.09, y + 0.5], [x - 0.09, y + 0.5]], '#c8342a', 37); break; }
    case 'lock': { const c = P(surf(0, 0.78 * Math.PI)); line3([[c[0] - 0.55, c[1] - 0.6], [c[0] - 0.3, c[1] - 0.08], [c[0], c[1] + 0.02], [c[0] + 0.3, c[1] - 0.08], [c[0] + 0.55, c[1] - 0.6]], '#a8acb8', 38); sh([[c[0] - 0.24, c[1] + 0.02], [c[0] + 0.24, c[1] + 0.02], [c[0] + 0.2, c[1] + 0.2], [c[0], c[1] + 0.3], [c[0] - 0.2, c[1] + 0.2]], '#d8dce4', 39); break; }
    case 'fan': { const h = arms[1].b, fx = h[0] + 0.1, fy = h[1] - 0.42; inkV(ctx, [[h[0], h[1]], [fx, fy + 0.25]], false, 0.05, { col: '#8a5a3a', seed: 40 }); sh(ell(fx, fy, 0.32, 0.32, 20), '#fbf2e4', 41); line3([[fx - 0.2, fy + 0.18], [fx, fy], [fx + 0.12, fy - 0.17]], '#5a4030', 42); [[fx - 0.02, fy - 0.02], [fx + 0.12, fy - 0.15], [fx - 0.13, fy + 0.1]].forEach(([px, py]) => dot(px, py, 0.045, '#ef7aa0')); break; }
    case 'opera': { const c = P(surf(0, 0.42 * Math.PI)); sh([[c[0] - 0.66, c[1] - 0.2], [c[0], c[1] - 0.3], [c[0] + 0.66, c[1] - 0.2], [c[0] + 0.58, c[1] + 0.2], [c[0] + 0.2, c[1] + 0.18], [c[0], c[1] + 0.08], [c[0] - 0.2, c[1] + 0.18], [c[0] - 0.58, c[1] + 0.2]], '#fbf4e6', 46); [-1, 1].forEach(k => { ctx.save(); trace(ctx, [[c[0] + k * 0.14, c[1] - 0.2], [c[0] + k * 0.56, c[1] - 0.22], [c[0] + k * 0.46, c[1] - 0.1]], true); ctx.fillStyle = '#2f2a38'; ctx.fill(); ctx.restore(); dot(c[0] + k * 0.34, c[1] + 0.04, 0.1, '#c8342a'); }); break; }
    case 'collar': { const c = P([0, RY * 0.5, RX * 0.62]); sh([[c[0] - 0.62, c[1] - 0.08], [c[0] + 0.62, c[1] - 0.08], [c[0] + 0.58, c[1] + 0.1], [c[0] - 0.58, c[1] + 0.1]], '#2e5aa8', 51); [0, 0.14].forEach((d, i) => inkV(ctx, [[c[0] - 0.12, c[1] + 0.2 + d], [c[0] + 0.12, c[1] + 0.2 + d]], false, 0.04, { col: '#e4b23c', seed: 52 + i })); break; }
    case 'plum': for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; sh(ell(tx + 0.42 + Math.cos(a) * 0.09, ty - 0.05 + Math.sin(a) * 0.09, 0.07, 0.07, 8), '#f490b0', 54 + i); } sh(ell(tx + 0.42, ty - 0.05, 0.04, 0.04, 8), '#f6c84a', 59); break;
    case 'panda': inkV(ctx, [[tx - 0.62, ty + 0.1], [tx - 0.42, ty - 0.2], [tx, ty - 0.28], [tx + 0.42, ty - 0.2], [tx + 0.62, ty + 0.1]], false, 0.07, { col: '#2f2a38', seed: 60, taper: false }); [-1, 1].forEach((k, i) => sh(ell(tx + k * 0.44, ty - 0.28, 0.17, 0.17, 12), '#2f2a38', 61 + i)); break;
    case 'headphones': { const l = P([-RX * 0.98, -0.05, 0]), r = P([RX * 0.98, -0.05, 0]); inkV(ctx, [[l[0], l[1]], [l[0] + 0.15, ty - 0.2], [tx, ty - 0.36], [r[0] - 0.15, ty - 0.2], [r[0], r[1]]], false, 0.1, { col: '#2f2a38', seed: 63, taper: false }); [l, r].forEach((p, i) => sh(ell(p[0], p[1], 0.13, 0.21, 12), '#7a5ac8', 64 + i)); break; }
    case 'bow': sh([[tx + 0.32, ty - 0.04], [tx + 0.08, ty - 0.2], [tx + 0.1, ty + 0.1]], '#ef7aa8', 66); sh([[tx + 0.32, ty - 0.04], [tx + 0.56, ty - 0.2], [tx + 0.54, ty + 0.1]], '#ef7aa8', 67); sh(ell(tx + 0.32, ty - 0.04, 0.05, 0.05, 8), '#d8507a', 68); break;
  }
}
