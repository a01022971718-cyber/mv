// 原创南瓜小人：用简单 3D 模型投影，保证转面、遮挡、明暗的空间关系
// 依赖 src/lib.js（ell / hash / trace / chaikin / densify / makeBlotch / rgba / shade / lerp）与 sheet/seedling.js（sparkle / bang / sb）
const PK = { body: '#e27b2f', shade: '#b5561f', groove: '#8e3f19', stem: '#6f8a3a', stem2: '#4f6a28', vine: '#5a7430', hole: '#3a1d17', ground: '#8a7aa0' };
const RX = 1.15, RY = 0.82, LEG = 0.42, PITCH = 0.2;
const VIEW_TH = { front: 0, q: 0.61, side: Math.PI / 2, qback: Math.PI - 0.61, back: Math.PI };

// ---------- 3D → 屏幕 ----------
function mkProj(th, cy) {
  const c = Math.cos(th), s = Math.sin(th), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  return ([x, y, z]) => { const x1 = x * c + z * s, z1 = -x * s + z * c; return [x1, cy + y * cp + z1 * sp, z1 * cp - y * sp]; };
}
const lobe = f => 0.93 + 0.07 * Math.cos(6 * f);
const surf = (f, v) => [RX * lobe(f) * Math.sin(v) * Math.sin(f), -RY * Math.cos(v), RX * lobe(f) * Math.sin(v) * Math.cos(f)];
// 投影点云的外轮廓：按角度分桶取最远点
function outlineOf(pts, cx, cy, bins = 72) {
  const best = new Array(bins).fill(null);
  pts.forEach(p => { const a = Math.atan2(p[1] - cy, p[0] - cx), k = ((Math.floor((a + Math.PI) / (2 * Math.PI) * bins)) % bins + bins) % bins, r = Math.hypot(p[0] - cx, p[1] - cy); if (!best[k] || r > best[k][2]) best[k] = [p[0], p[1], r]; });
  return best.filter(Boolean).map(p => [p[0], p[1]]);
}

// ---------- 画法：实心粗墨线（粗细只轻微起伏、钝头）+ 哑光平涂 ----------
function inkR(ctx, pts, closed, w, col = INK, seed = 0) {
  if (pts.length < 2) return;
  const P = pts.length > 5 ? chaikin(pts, closed, 2) : densify(pts, closed, 6), N = P.length, Lp = [], Rp = [];
  for (let i = 0; i < N; i++) {
    const a = P[closed ? (i - 1 + N) % N : Math.max(0, i - 1)], b = P[closed ? (i + 1) % N : Math.min(N - 1, i + 1)], c = P[i];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const ww = w * (1 + 0.1 * Math.sin(i / N * 6.3 + seed) + 0.04 * (hash(i * 1.7 + seed) - 0.5)) / 2;
    Lp.push([c[0] - dy * ww, c[1] + dx * ww]); Rp.push([c[0] + dy * ww, c[1] - dx * ww]);
  }
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  if (closed) { Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); Rp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill('evenodd'); }
  else { Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); for (let i = N - 1; i >= 0; i--) ctx.lineTo(...Rp[i]); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function flatFill(ctx, pts, col, wash = true) {
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1;
  ctx.save(); ctx.translate(1.2 / sc, 0.9 / sc); // 颜色略微偏出墨线
  trace(ctx, pts, true); ctx.fillStyle = col; ctx.fill();
  if (wash) {
    ctx.clip();
    if (BLOTCH) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.32; ctx.drawImage(BLOTCH, 0, 0); ctx.restore(); }
    trace(ctx, pts, true); ctx.strokeStyle = shade(col, -0.25); ctx.globalAlpha = 0.22; ctx.lineWidth = 7 / sc; ctx.stroke();
  }
  ctx.restore();
}
function shape(ctx, pts, col, w = 0.06, seed = 0) { flatFill(ctx, pts, col); inkR(ctx, pts, true, w, INK, seed); }

// ---------- 刻脸（定义在南瓜表面的 φ/v 坐标上） ----------
function faceParts(expr) {
  const E = [], L = [], tri = (fc, v0, k = 1) => [[fc - 0.14, v0 + 0.07 * k], [fc + 0.14, v0 + 0.07 * k], [fc, v0 - 0.1 * k]];
  const v0 = 0.43 * Math.PI;
  if (expr === 'happy') { [-0.36, 0.36].forEach(fc => L.push([[fc - 0.14, v0 + 0.05], [fc, v0 - 0.06], [fc + 0.14, v0 + 0.05]])); }
  else if (expr === 'surprised') { [-0.36, 0.36].forEach(fc => { const p = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.push([fc + Math.cos(a) * 0.09, v0 + Math.sin(a) * 0.09]); } E.push(p); }); }
  else if (expr === 'angry') { E.push([[-0.5, v0 - 0.06], [-0.22, v0 + 0.04], [-0.42, v0 + 0.1]]); E.push([[0.5, v0 - 0.06], [0.22, v0 + 0.04], [0.42, v0 + 0.1]]); }
  else { E.push(tri(-0.36, v0)); E.push(tri(0.36, v0)); }
  // 嘴
  const top = [], bot = [];
  if (expr === 'surprised') { const p = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.push([Math.cos(a) * 0.12, 0.66 * Math.PI + Math.sin(a) * 0.1]); } E.push(p); }
  else {
    const wide = expr === 'happy' ? 0.55 : expr === 'angry' ? 0.5 : 0.46;
    for (let i = 0; i <= 10; i++) { const f = lerp(-wide, wide, i / 10); top.push([f, 0.61 * Math.PI - (expr === 'angry' ? -0.15 : 0.55) * f * f]); }
    for (let i = 10; i >= 0; i--) {
      const f = lerp(-wide, wide, i / 10); let v = (expr === 'happy' ? 0.73 : 0.69) * Math.PI - (expr === 'angry' ? -0.1 : 0.7) * f * f;
      if (Math.abs(Math.abs(f) - 0.16) < 0.05 && expr !== 'happy') v -= 0.08; // 两颗刻出来的牙
      bot.push([f, v]);
    }
    E.push(top.concat(bot));
  }
  return { holes: E, lines: L };
}

// ---------- 主绘制 ----------
function drawPumpkin(ctx, x, y, s, o, t) {
  o = Object.assign({ view: 'front', expr: 'neutral', legs: 'stand', walk: 0, arms: 'down', lift: 0, lean: 0, lid: 0, acc: null, stretch: 0, ghost: 0 }, o);
  const th = VIEW_TH[o.view] ?? o.view, cy = -(LEG + RY) - o.lift, P = mkProj(th, cy);
  ctx.save(); ctx.translate(x, y);
  // 脚下水渍阴影：离地越高越小越淡
  ctx.save(); ctx.filter = 'blur(3px)'; ctx.fillStyle = rgba(PK.ground, 0.3 * (1 - o.lift * 0.6));
  trace(ctx, ell(0, 2, s * RX * 1.05 * (1 - o.lift * 0.35), s * 0.15, 20), true); ctx.fill(); ctx.restore();
  ctx.scale(s, s); ctx.rotate(o.lean); ctx.scale(1 - o.stretch * 0.45, 1 + o.stretch);
  // 手脚的 3D 端点
  const legs = [-1, 1].map((k, i) => {
    const hip = [k * 0.45, RY * 0.72, 0], sw = o.legs === 'walk' ? Math.sin(o.walk + i * Math.PI) * 0.32 : 0;
    const len = o.legs === 'tuck' ? LEG * 0.45 : LEG + 0.04;
    const foot = [k * 0.47, RY * 0.72 + len, sw + (o.legs === 'tuck' ? 0.08 : 0)];
    return { a: P(hip), b: P(foot), d: P(hip)[2], k };
  });
  const armEnd = { down: [1.6, 0.42, -0.12], up: [1.42, -0.8, -0.06], out: [1.72, -0.08, -0.1], fan: [1.5, 0.05, 0.2] }[o.arms];
  const arms = [-1, 1].map(k => { const sh = [k * RX * 0.95, 0.08, -0.18], hd = [k * armEnd[0], armEnd[1], armEnd[2]]; return { a: P(sh), b: P(hd), d: P(sh)[2], k }; });
  const limb = (L, col, w, back) => { inkR(ctx, [[L.a[0], L.a[1]], [L.b[0], L.b[1]]], false, w + 0.1, INK, L.k * 3); inkR(ctx, [[L.a[0], L.a[1]], [L.b[0], L.b[1]]], false, w, back ? shade(col, -0.2) : col, L.k * 5); };
  const foot = (L, back) => shape(ctx, ell(L.b[0] + 0.04, L.b[1] + 0.02, 0.17, 0.08, 12), back ? shade(PK.vine, -0.25) : shade(PK.vine, -0.1), 0.05, 7 + L.k);
  const hand = (L, back) => shape(ctx, ell(L.b[0], L.b[1], 0.12, 0.12, 12), back ? shade(PK.vine, -0.15) : PK.vine, 0.05, 9 + L.k);
  // 远侧（被身体挡住的一侧）先画
  legs.filter(L => L.d < -0.02).forEach(L => { limb(L, PK.vine, 0.14, true); foot(L, true); });
  arms.filter(L => L.d < -0.02).forEach(L => { limb(L, PK.vine, 0.1, true); hand(L, true); });
  if (o.lid) bodyWithLid(ctx, P, cy, o, t); else body(ctx, P, cy, o, t);
  legs.filter(L => L.d >= -0.02).forEach(L => { limb(L, PK.vine, 0.14, false); foot(L, false); });
  arms.filter(L => L.d >= -0.02).forEach(L => { limb(L, PK.vine, 0.1, false); hand(L, false); });
  if (o.acc) pkAcc(ctx, o.acc, P, cy, arms, t);
  ctx.restore();
}
function silhouette(P, cy, vmin = 0, vmax = Math.PI) {
  const pts = [];
  for (let i = 0; i < 64; i++) for (let j = 0; j <= 24; j++) { const p = P(surf(i / 64 * Math.PI * 2, lerp(vmin, vmax, j / 24))); pts.push([p[0], p[1]]); }
  return outlineOf(pts, 0, cy);
}
function shadeBody(ctx, sil) {
  flatFill(ctx, sil, PK.shade);
  // 光从左上来：把亮色轮廓往左上平移，剩下右下的一弯是暗面
  ctx.save(); trace(ctx, sil, true); ctx.clip(); ctx.translate(-0.16, -0.12); flatFill(ctx, sil, PK.body); ctx.restore();
}
function grooves(ctx, P, vmin) {
  for (let k = 0; k < 6; k++) {
    const f = (k + 0.5) / 6 * Math.PI * 2; let run = [];
    const flush = () => { if (run.length > 3) inkR(ctx, run, false, 0.032, PK.groove, k); run = []; };
    for (let j = 0; j <= 20; j++) {
      const v = lerp(Math.max(vmin, 0.24 * Math.PI), 0.8 * Math.PI, j / 20), p = P(surf(f, v));
      if (p[2] > 0.18 && Math.abs(p[0]) < RX * 0.86) run.push([p[0], p[1]]); else flush();
    }
    flush();
  }
}
function stem(ctx, P, t, rot = null) {
  const T = p => rot ? rot(p) : p;
  const base = [0, -RY * 0.98, 0];
  const pts = [[0, 0, 0], [0.03, -0.17, 0.02], [0.1, -0.31, 0.06], [0.2, -0.36, 0.1]].map(q => P(T([base[0] + q[0], base[1] + q[1], base[2] + q[2]])));
  const tend = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 3.2; tend.push(P(T([-0.05 - 0.13 * Math.cos(a) * (1 - i / 30), base[1] - 0.04 - i * 0.008, 0.13 * Math.sin(a) * (1 - i / 30)]))); }
  inkR(ctx, tend.map(p => [p[0], p[1]]), false, 0.07, INK, 21); inkR(ctx, tend.map(p => [p[0], p[1]]), false, 0.035, PK.stem, 22);
  inkR(ctx, pts.map(p => [p[0], p[1]]), false, 0.24, INK, 23); inkR(ctx, pts.map(p => [p[0], p[1]]), false, 0.15, PK.stem, 24);
  const tip = pts[3]; shape(ctx, ell(tip[0], tip[1], 0.08, 0.06, 10), PK.stem2, 0.045, 25);
}
function face(ctx, P, expr) {
  const F = faceParts(expr), pj = fv => P(surf(fv[0], fv[1]));
  F.holes.forEach((h, i) => { const q = h.map(pj); if (q.reduce((a, p) => a + p[2], 0) / q.length < 0.2) return; shape(ctx, q.map(p => [p[0], p[1]]), PK.hole, 0.045, 30 + i); });
  F.lines.forEach((l, i) => { const q = l.map(pj); if (q.reduce((a, p) => a + p[2], 0) / q.length < 0.2) return; inkR(ctx, q.map(p => [p[0], p[1]]), false, 0.09, PK.hole, 40 + i); });
}
function body(ctx, P, cy, o, t) {
  if (o.ghost) return; // 残影只画轮廓色
  const sil = silhouette(P, cy);
  shadeBody(ctx, sil);
  grooves(ctx, P, 0);
  face(ctx, P, o.expr);
  inkR(ctx, sil, true, 0.075, INK, 1);
  if (!PK_HATS.includes(o.acc)) stem(ctx, P, t);
}
// LID：顶盖沿刻痕掀开（绕后侧铰链旋转），露出空腔和刻出来的牙
function bodyWithLid(ctx, P, cy, o, t) {
  const vc = 0.22 * Math.PI, ry = -RY * Math.cos(vc), rr = RX * Math.sin(vc) * 0.95;
  const rim = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; rim.push([Math.sin(a) * rr, ry, Math.cos(a) * rr]); }
  const ang = o.lid, rot = ([x, yy, z]) => { const dy = yy - ry, dz = z + rr; return [x, ry + dy * Math.cos(ang) - dz * Math.sin(ang), -rr + dy * Math.sin(ang) + dz * Math.cos(ang)]; };
  const teeth = (pts, dir, seed) => rim.forEach((p, i) => { if (i % 4 || Math.cos(i / 40 * Math.PI * 2) < 0.25) return; const q2 = rim[(i + 2) % 40], a = pts(p), b = pts(q2), m = pts([(p[0] + q2[0]) / 2, ry + dir * 0.13, (p[2] + q2[2]) / 2]); shape(ctx, [[a[0], a[1]], [b[0], b[1]], [m[0], m[1]]], '#f2c890', 0.03, seed + i); });
  // 1) 掀到后面的顶盖（铰链在后侧，翻起后位于身体后方，所以先画）
  const capPts = []; for (let i = 0; i < 64; i++) for (let j = 0; j <= 10; j++) { const q = P(rot(surf(i / 64 * Math.PI * 2, lerp(0, vc, j / 10)))); capPts.push([q[0], q[1]]); }
  const cc = capPts.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]).map(v => v / capPts.length);
  const cap = outlineOf(capPts, cc[0], cc[1]);
  stem(ctx, P, t, rot);
  flatFill(ctx, cap, PK.shade);
  const under = rim.map(p => { const q = P(rot(p)); return [q[0], q[1]]; });
  shape(ctx, under, shade(PK.hole, 0.12), 0.04, 52);
  teeth(p => P(rot(p)), 1, 60);
  inkR(ctx, cap, true, 0.075, INK, 2);
  // 2) 下半身 + 空腔 + 下排牙
  const lower = silhouette(P, cy, vc, Math.PI);
  shadeBody(ctx, lower);
  grooves(ctx, P, vc + 0.05);
  face(ctx, P, o.expr);
  shape(ctx, rim.map(p => { const q = P(p); return [q[0], q[1]]; }), PK.hole, 0.05, 50);
  teeth(P, -1, 51);
  inkR(ctx, lower, true, 0.075, INK, 1);
}

// ---------- 中国风配饰（耳机、蝴蝶结保留） ----------
const PK_HATS = ['guapi', 'douli', 'tiger', 'phoenix', 'wusha', 'panda'];
function pkAcc(ctx, acc, P, cy, arms, t) {
  const top = P([0, -RY, 0]), tx = top[0], ty = top[1] + 0.06, br = Math.sin(PITCH); // 帽檐椭圆的扁度由俯视角决定
  const dome = (rx, h, col, seed) => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; p.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * h]); } for (let i = 16; i >= 0; i--) { const a = i / 16 * Math.PI; p.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * rx * br]); } shape(ctx, p, col, 0.05, seed); };
  const brim = (rx, col, seed, dy = 0) => shape(ctx, ell(tx, ty + dy, rx, rx * br + 0.03, 24), col, 0.05, seed);
  switch (acc) {
    case 'guapi': dome(0.58, 0.42, '#2f2a38', 1); [-0.3, 0, 0.3].forEach((k, i) => inkR(ctx, [[tx + k * 0.25, ty - 0.4], [tx + k, ty - 0.02]], false, 0.02, '#5a5468', 2 + i)); shape(ctx, ell(tx, ty - 0.45, 0.09, 0.09, 12), '#d0352b', 0.04, 5); break;
    case 'douli': shape(ctx, [[tx - 1.25, ty + 0.02], [tx, ty - 0.68], [tx + 1.25, ty + 0.02], [tx, ty + 0.02 + 1.25 * br]], '#d9b878', 0.055, 6); for (let i = 1; i < 4; i++) inkR(ctx, [[tx - 1.25 * i / 4, ty + 0.02 - 0.7 * (1 - i / 4)], [tx + 1.25 * i / 4, ty + 0.02 - 0.7 * (1 - i / 4)]], false, 0.018, '#a88a4a', 7 + i); break;
    case 'tiger': [-1, 1].forEach((k, i) => shape(ctx, ell(tx + k * 0.45, ty - 0.38, 0.15, 0.15, 12), '#ef9d2c', 0.045, 11 + i)); dome(0.62, 0.44, '#ef9d2c', 13); [-0.12, 0, 0.12].forEach((d, i) => inkR(ctx, [[tx - 0.17, ty - 0.24 + d], [tx + 0.17, ty - 0.24 + d]], false, 0.035, '#2f2a38', 14 + i)); brim(0.64, '#d0352b', 17, 0.02); break;
    case 'phoenix': shape(ctx, [[tx - 0.52, ty + 0.04], [tx - 0.56, ty - 0.32], [tx - 0.26, ty - 0.16], [tx, ty - 0.5], [tx + 0.26, ty - 0.16], [tx + 0.56, ty - 0.32], [tx + 0.52, ty + 0.04]], '#e8b43a', 0.05, 18); shape(ctx, ell(tx, ty - 0.2, 0.08, 0.1, 10), '#d0352b', 0.035, 19); [-1, 1].forEach((k, i) => { inkR(ctx, [[tx + k * 0.54, ty], [tx + k * 0.66, ty + 0.42]], false, 0.022, '#b8862a', 20 + i); [0, 1, 2].forEach(j => shape(ctx, ell(tx + k * (0.57 + j * 0.035), ty + 0.12 + j * 0.13, 0.04, 0.04, 8), '#fbf6ee', 0.022, 22 + j)); }); break;
    case 'wusha': [-1, 1].forEach((k, i) => { inkR(ctx, [[tx + k * 0.45, ty - 0.12], [tx + k * 1.05, ty - 0.22]], false, 0.035, INK, 25 + i); shape(ctx, ell(tx + k * 1.13, ty - 0.23, 0.18, 0.08, 12, k * 0.1), '#2f2a38', 0.04, 27 + i); }); dome(0.46, 0.48, '#2f2a38', 29); brim(0.56, '#2f2a38', 30, 0.02); break;
    case 'hairpin': inkR(ctx, [[tx - 0.5, ty - 0.45], [tx + 0.3, ty + 0.1]], false, 0.075, '#b8862a', 31); shape(ctx, ell(tx - 0.52, ty - 0.47, 0.08, 0.08, 10), '#e04a6a', 0.035, 32); inkR(ctx, [[tx - 0.52, ty - 0.4], [tx - 0.57, ty - 0.12]], false, 0.025, '#d0352b', 33); shape(ctx, [[tx - 0.62, ty - 0.13], [tx - 0.52, ty - 0.13], [tx - 0.5, ty + 0.1], [tx - 0.64, ty + 0.1]], '#d0352b', 0.03, 34); break;
    case 'knot': { const a = P([RX * 0.98, 0.0, 0.05]), x = a[0] + 0.12, y = a[1] + 0.1; inkR(ctx, [[a[0], a[1] - 0.2], [x, y - 0.2]], false, 0.03, '#d0352b', 35); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); shape(ctx, [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]], '#d0352b', 0.045, 36); ctx.restore(); shape(ctx, [[x - 0.05, y + 0.2], [x + 0.05, y + 0.2], [x + 0.09, y + 0.5], [x - 0.09, y + 0.5]], '#d0352b', 0.035, 37); break; }
    case 'lock': { const c = P(surf(0, 0.8 * Math.PI)); inkR(ctx, [[c[0] - 0.55, c[1] - 0.6], [c[0] - 0.3, c[1] - 0.08], [c[0], c[1] + 0.02], [c[0] + 0.3, c[1] - 0.08], [c[0] + 0.55, c[1] - 0.6]], false, 0.035, '#b8bcc8', 38); shape(ctx, [[c[0] - 0.24, c[1] + 0.02], [c[0] + 0.24, c[1] + 0.02], [c[0] + 0.2, c[1] + 0.2], [c[0], c[1] + 0.3], [c[0] - 0.2, c[1] + 0.2]], '#d8dce4', 0.045, 39); break; }
    case 'fan': { const h = arms[1].b, fx = h[0] + 0.1, fy = h[1] - 0.42; inkR(ctx, [[h[0], h[1]], [fx, fy + 0.25]], false, 0.05, '#8a5a3a', 40); shape(ctx, ell(fx, fy, 0.32, 0.32, 20), '#fbf2e4', 0.045, 41); inkR(ctx, [[fx - 0.2, fy + 0.18], [fx, fy], [fx + 0.12, fy - 0.17]], false, 0.022, '#5a4030', 42); [[fx - 0.02, fy - 0.02], [fx + 0.12, fy - 0.15], [fx - 0.13, fy + 0.1]].forEach(([px, py], i) => shape(ctx, ell(px, py, 0.045, 0.045, 8), '#ef7aa0', 0.015, 43 + i)); break; }
    case 'opera': { const c = P(surf(0, 0.43 * Math.PI)); shape(ctx, [[c[0] - 0.66, c[1] - 0.2], [c[0], c[1] - 0.3], [c[0] + 0.66, c[1] - 0.2], [c[0] + 0.58, c[1] + 0.2], [c[0] + 0.2, c[1] + 0.18], [c[0], c[1] + 0.08], [c[0] - 0.2, c[1] + 0.18], [c[0] - 0.58, c[1] + 0.2]], '#fbf6ee', 0.05, 46); [-1, 1].forEach(k => { shape(ctx, [[c[0] + k * 0.14, c[1] - 0.2], [c[0] + k * 0.56, c[1] - 0.22], [c[0] + k * 0.46, c[1] - 0.1]], '#2f2a38', 0.02, 47 + k); shape(ctx, ell(c[0] + k * 0.34, c[1] + 0.04, 0.13, 0.09, 10), '#d0352b', 0.02, 49 + k); }); break; }
    case 'collar': { const c = P([0, RY * 0.55, RX * 0.55]); shape(ctx, [[c[0] - 0.62, c[1] - 0.08], [c[0] + 0.62, c[1] - 0.08], [c[0] + 0.58, c[1] + 0.1], [c[0] - 0.58, c[1] + 0.1]], '#2e5aa8', 0.045, 51); [0, 0.14].forEach((d, i) => { inkR(ctx, [[c[0] - 0.12, c[1] + 0.2 + d], [c[0] + 0.12, c[1] + 0.2 + d]], false, 0.04, '#e8b43a', 52 + i); }); break; }
    case 'plum': for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; shape(ctx, ell(tx + 0.42 + Math.cos(a) * 0.09, ty - 0.05 + Math.sin(a) * 0.09, 0.07, 0.07, 8), '#f490b0', 0.025, 54 + i); } shape(ctx, ell(tx + 0.42, ty - 0.05, 0.04, 0.04, 8), '#f6c84a', 0.02, 59); break;
    case 'panda': inkR(ctx, [[tx - 0.62, ty + 0.1], [tx - 0.42, ty - 0.2], [tx, ty - 0.28], [tx + 0.42, ty - 0.2], [tx + 0.62, ty + 0.1]], false, 0.07, '#2f2a38', 60); [-1, 1].forEach((k, i) => shape(ctx, ell(tx + k * 0.44, ty - 0.28, 0.17, 0.17, 12), '#2f2a38', 0.04, 61 + i)); break;
    case 'headphones': { const l = P([-RX * 0.99, -0.05, 0]), r = P([RX * 0.99, -0.05, 0]); inkR(ctx, [[l[0], l[1]], [l[0] + 0.15, ty - 0.2], [tx, ty - 0.36], [r[0] - 0.15, ty - 0.2], [r[0], r[1]]], false, 0.1, '#2f2a38', 63); [l, r].forEach((p, i) => shape(ctx, ell(p[0], p[1], 0.13, 0.21, 12), '#7a5ac8', 0.045, 64 + i)); break; }
    case 'bow': shape(ctx, [[tx + 0.32, ty - 0.04], [tx + 0.08, ty - 0.2], [tx + 0.1, ty + 0.1]], '#ef7aa8', 0.04, 66); shape(ctx, [[tx + 0.32, ty - 0.04], [tx + 0.56, ty - 0.2], [tx + 0.54, ty + 0.1]], '#ef7aa8', 0.04, 67); shape(ctx, ell(tx + 0.32, ty - 0.04, 0.05, 0.05, 8), '#d8507a', 0.03, 68); break;
  }
  if (PK_HATS.includes(acc) && acc === 'panda') stem(ctx, P, t);
}
