// "种种"转面图 / 动作 / 配饰（复刻参考表的格式，角色为原创）
// 依赖 src/lib.js 与 sheet/seedling.js（sb / eye / mouth / sparkle / bang / heart / EMO / SEED）
const VIEWS = {
  front: { wx: 1, fx: 0, legs: [-0.32, 0.32], face: 'full', seam: 'top' },
  q: { wx: 0.92, fx: 0.2, legs: [-0.2, 0.4], face: 'q', seam: 'left' },
  side: { wx: 0.62, fx: 0.34, legs: [-0.08, 0.14], face: 'side', seam: 'none' },
  qback: { wx: 0.92, fx: -0.2, legs: [-0.4, 0.2], face: null, seam: 'right' },
  back: { wx: 1, fx: 0, legs: [-0.32, 0.32], face: null, seam: 'back' },
};
const HATS = ['party', 'hard', 'wizard', 'top', 'fedora', 'beanie']; // 戴这些时芽藏在帽子里
const BODY = [[0, -1.15], [0.38, -1.0], [0.66, -0.6], [0.84, -0.05], [0.84, 0.38], [0.66, 0.74], [0.3, 0.92], [0, 0.95], [-0.3, 0.92], [-0.66, 0.74], [-0.84, 0.38], [-0.84, -0.05], [-0.66, -0.6], [-0.38, -1.0]];

function armLine(ctx, bx, by, hx, hy, col, seed, back = false) {
  inkLine(ctx, [[bx, by], [(bx + hx) / 2, (by + hy) / 2 + 0.03], [hx, hy]], 0.13, INK, seed, 0.005);
  inkLine(ctx, [[bx, by], [(bx + hx) / 2, (by + hy) / 2 + 0.03], [hx, hy]], 0.075, back ? shade(SEED.shade, -0.15) : SEED.shade, seed + 1, 0.004);
  sb(ctx, ell(hx, hy, 0.12, 0.12, 10), back ? shade(col, -0.12) : col, { lw: 0.045, seed: seed + 2, edge: 0.05 });
}
function legLine(ctx, lx, a, tuck, back, seed) {
  const L = tuck ? 0.26 : 0.46, fx = lx + Math.sin(a) * L, fy = 0.82 + Math.cos(a) * L;
  inkLine(ctx, [[lx, 0.8], [fx, fy]], 0.17, INK, seed, 0.005);
  inkLine(ctx, [[lx, 0.8], [fx, fy - 0.01]], 0.11, back ? shade(SEED.shade, -0.18) : SEED.shade, seed + 1, 0.004);
  sb(ctx, ell(fx + 0.06, fy + 0.03, 0.16, 0.07, 10), shade(SEED.shade, back ? -0.4 : -0.25), { lw: 0.035, seed: seed + 2 });
}
function sproutDraw(ctx, view, t) {
  const sway = Math.sin(t * 3) * 0.05, side = view === 'side' ? 0.6 : 1;
  const stem = [[0, -1.08], [0.02 + sway * 0.5, -1.3], [0.04 + sway, -1.48]];
  inkLine(ctx, stem, 0.11, INK, 20, 0.006); inkLine(ctx, stem, 0.06, SEED.leaf2, 21, 0.004);
  const [ax, ay] = stem[2];
  const leaf = (ang, L, sc = 1) => sb(ctx, [[ax, ay], [ax + Math.cos(ang - 0.5) * L * 0.55 * sc, ay + Math.sin(ang - 0.5) * L * 0.55], [ax + Math.cos(ang) * L * sc, ay + Math.sin(ang) * L], [ax + Math.cos(ang + 0.5) * L * 0.55 * sc, ay + Math.sin(ang + 0.5) * L * 0.55]], SEED.leaf, { lw: 0.04, seed: ang * 7, edge: 0.06 });
  leaf(-1.57 - 0.75 + sway, 0.36, side); leaf(-1.57 + 0.75 + sway, 0.4, side);
}
function accDraw(ctx, acc, t) {
  const top = -1.12;
  const o = (pts, col, seed) => sb(ctx, pts, col, { lw: 0.045, seed, edge: 0.06 });
  switch (acc) {
    case 'party': o([[-0.32, top + 0.12], [0.32, top + 0.12], [0.02, top - 0.72]], '#e87a9a', 1); [0.25, 0.45].forEach((k, i) => inkLine(ctx, [[-0.32 * (1 - k), top + 0.12 - 0.84 * k], [0.32 * (1 - k), top + 0.12 - 0.84 * k]], 0.05, '#f6d04a', 2 + i, 0.004)); sb(ctx, ell(0.02, top - 0.74, 0.08, 0.08, 10), '#f6c84a', { lw: 0.04, seed: 4 }); break;
    case 'hard': o([[-0.5, top + 0.08], [-0.42, top - 0.25], [0, top - 0.4], [0.42, top - 0.25], [0.5, top + 0.08]], '#f0c03a', 5); o([[-0.66, top + 0.06], [0.66, top + 0.06], [0.62, top + 0.16], [-0.62, top + 0.16]], '#e0a828', 6); break;
    case 'crown': o([[-0.36, top + 0.1], [-0.4, top - 0.28], [-0.2, top - 0.1], [0, top - 0.36], [0.2, top - 0.1], [0.4, top - 0.28], [0.36, top + 0.1]], '#f0c03a', 7); [-0.18, 0.05, 0.25].forEach((xx, i) => sb(ctx, ell(xx, top - 0.02, 0.04, 0.04, 8), ['#e8506a', '#4aa0e8', '#5ac06a'][i], { line: null, wash: false })); break;
    case 'halo': glow(ctx, 0, top - 0.6, 0.6, '#ffe27a', 0.35); sb(ctx, ell(0, top - 0.6, 0.42, 0.1, 18), null, { lw: 0.07, line: '#e8b030' }); break;
    case 'wizard': o([[-0.5, top + 0.1], [0.5, top + 0.1], [0.08, top - 1.0]], '#2e3e8a', 8); o([[-0.6, top + 0.06], [0.6, top + 0.06], [0.56, top + 0.15], [-0.56, top + 0.15]], '#24326e', 9); sparkle(ctx, 0.04, top - 0.35, 0.12, '#f6c84a'); break;
    case 'top': o([[-0.3, top + 0.06], [-0.3, top - 0.62], [0.3, top - 0.62], [0.3, top + 0.06]], '#2e2838', 10); o([[-0.3, top - 0.12], [0.3, top - 0.12], [0.3, top - 0.02], [-0.3, top - 0.02]], '#d8462e', 11); o([[-0.56, top + 0.04], [0.56, top + 0.04], [0.52, top + 0.13], [-0.52, top + 0.13]], '#2e2838', 12); break;
    case 'fedora': o([[-0.36, top + 0.06], [-0.32, top - 0.3], [0, top - 0.22], [0.32, top - 0.3], [0.36, top + 0.06]], '#3a3448', 13); o([[-0.36, top - 0.06], [0.36, top - 0.06], [0.36, top + 0.04], [-0.36, top + 0.04]], '#8a2e3a', 14); o([[-0.7, top + 0.06], [0.7, top + 0.02], [0.62, top + 0.14], [-0.62, top + 0.16]], '#3a3448', 15); break;
    case 'band': o([[-0.74, -0.62], [0.74, -0.62], [0.78, -0.5], [-0.78, -0.5]], '#d8462e', 16); o([[0.7, -0.6], [0.98, -0.72], [0.95, -0.55]], '#d8462e', 17); break;
    case 'beanie': o([[-0.5, top + 0.12], [-0.44, top - 0.22], [0, top - 0.38], [0.44, top - 0.22], [0.5, top + 0.12]], '#2e9a8a', 18); o([[-0.54, top + 0.04], [0.54, top + 0.04], [0.54, top + 0.18], [-0.54, top + 0.18]], '#237a6e', 19); sb(ctx, ell(0, top - 0.42, 0.1, 0.1, 10), '#f4ecdc', { lw: 0.04, seed: 20 }); break;
    case 'bow': o([[0.22, -0.98], [0.02, -1.1], [0.04, -0.86]], '#ef7aa8', 21); o([[0.22, -0.98], [0.44, -1.12], [0.42, -0.86]], '#ef7aa8', 22); sb(ctx, ell(0.22, -0.98, 0.05, 0.05, 8), '#d8507a', { lw: 0.03, seed: 23 }); break;
    case 'flower': for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; sb(ctx, ell(-0.3 + Math.cos(a) * 0.08, -0.98 + Math.sin(a) * 0.08, 0.06, 0.06, 8), '#fbf6ee', { lw: 0.03, seed: 24 + i }); } sb(ctx, ell(-0.3, -0.98, 0.04, 0.04, 8), '#f6c84a', { lw: 0.025, seed: 29 }); break;
    case 'headphones': inkLine(ctx, [[-0.78, -0.3], [-0.6, -0.95], [0, -1.22], [0.6, -0.95], [0.78, -0.3]], 0.1, '#2e2838', 30, 0.004); [-1, 1].forEach((k, i) => sb(ctx, ell(k * 0.86, -0.22, 0.12, 0.2, 10), '#7a5ac8', { lw: 0.045, seed: 31 + i })); break;
    case 'cat': [-1, 1].forEach((k, i) => { o([[k * 0.22, -1.02], [k * 0.52, -1.42], [k * 0.62, -0.78]], shade(SEED.body, -0.05), 33 + i); sb(ctx, [[k * 0.3, -1.0], [k * 0.5, -1.28], [k * 0.56, -0.86]], '#f4a0a8', { line: null, wash: false }); }); break;
    case 'masq': o([[-0.6, -0.26], [-0.3, -0.34], [0, -0.22], [0.3, -0.34], [0.6, -0.26], [0.5, 0.02], [0.2, 0.0], [0, -0.06], [-0.2, 0.0], [-0.5, 0.02]], '#7a4ac0', 35); [-0.3, 0.3].forEach((xx, i) => sb(ctx, ell(xx, -0.13, 0.11, 0.07, 10), '#2a1f40', { line: null, wash: false })); break;
    case 'bowtie': o([[0, 0.46], [-0.26, 0.34], [-0.26, 0.6]], '#7a4ac0', 36); o([[0, 0.46], [0.26, 0.34], [0.26, 0.6]], '#7a4ac0', 37); sb(ctx, ell(0, 0.46, 0.06, 0.06, 8), '#5a2ea0', { lw: 0.03, seed: 38 }); break;
  }
}

function drawSeedView(ctx, x, y, s, o, t) {
  o = Object.assign({ view: 'front', emo: 'neutral', legs: 'stand', walk: 0, arms: 'down', lift: 0, lean: 0, lid: 0, acc: null, flip: false, stretch: 0, eyes: null }, o);
  const V = VIEWS[o.view], E = EMO[o.emo] || EMO.neutral, col = SEED.body;
  ctx.save(); ctx.translate(x, y);
  sb(ctx, ell(0, 0, s * (1 - o.lift * 0.5) * V.wx, s * 0.13, 16), rgba('#5a4a3a', 0.18), { line: null, wash: false, amp: 1 });
  ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.translate(0, -1.3 - o.lift); ctx.rotate(o.lean);
  const br = Math.sin(t * 2.4) * 0.012;
  ctx.scale(1 - o.stretch * 0.5 + br, 1 + o.stretch - br);
  const wx = V.wx, edge = 0.82 * wx;
  // 腿（后腿先画）
  V.legs.forEach((lx, i) => {
    const a = o.legs === 'walk' ? Math.sin(o.walk + i * Math.PI) * 0.45 : o.legs === 'tuck' ? (i ? -0.5 : 0.5) : 0;
    legLine(ctx, lx * (o.view === 'side' ? 1 : 1), a, o.legs === 'tuck', o.view === 'side' && i === 0, 10 + i * 3);
  });
  // 后侧手臂
  const ay = 0.12, armEnd = { down: [0.42, 0.3], up: [0.3, -0.62], out: [0.36, -0.02] }[o.arms];
  if (o.view === 'q') armLine(ctx, -edge + 0.08, ay, -edge - armEnd[0] * 0.6, ay + armEnd[1], col, 40, true);
  if (o.view === 'side') { const sw = o.legs === 'walk' ? Math.sin(o.walk) * 0.25 : 0; armLine(ctx, -0.05, ay, -0.05 - 0.2 - sw, ay + 0.35, col, 40, true); }
  if (o.view === 'qback') armLine(ctx, edge - 0.08, ay, edge + armEnd[0] * 0.6, ay + armEnd[1], col, 40, true);
  // 身体（可带"盖子"张开）
  const body = BODY.map(p => [p[0] * wx, p[1]]);
  const hasHat = HATS.includes(o.acc);
  const drawBodyPart = (clipTop) => {
    ctx.save();
    if (clipTop !== null) { ctx.beginPath(); if (clipTop) ctx.rect(-2, -3, 4, 2.85); else ctx.rect(-2, -0.15, 4, 3); ctx.clip(); }
    sb(ctx, body, col, { lw: 0.05, amp: 0.008, seed: 30, edge: 0.14 });
    ctx.save(); trace(ctx, body, true); ctx.clip();
    if (o.view !== 'back' && o.view !== 'qback') sb(ctx, ell(V.fx * 0.8 + 0.05, 0.55, 0.5 * (o.view === 'side' ? 0.55 : 1), 0.36, 14), SEED.belly, { line: null, alpha: 0.85, wash: false });
    sb(ctx, ell(-0.45 * wx, -0.55, 0.12, 0.3, 10, 0.4), rgba('#fff4d8', 0.5), { line: null, wash: false });
    const sc = rgba('#7a4a1a', 0.5);
    if (V.seam === 'top') inkLine(ctx, [[0, -1.1], [0.05, -0.75]], 0.025, sc, 31, 0.004);
    if (V.seam === 'back') inkLine(ctx, [[0, -1.1], [0.03, -0.3], [0, 0.9]], 0.03, sc, 32, 0.004);
    if (V.seam === 'left') inkLine(ctx, [[-0.25, -1.08], [-0.42, -0.2], [-0.3, 0.88]], 0.03, sc, 33, 0.004);
    if (V.seam === 'right') inkLine(ctx, [[0.25, -1.08], [0.42, -0.2], [0.3, 0.88]], 0.03, sc, 34, 0.004);
    ctx.restore(); ctx.restore();
  };
  if (o.lid > 0) {
    drawBodyPart(false);
    sb(ctx, ell(0, -0.15, 0.78 * wx, 0.13, 16), '#5a1e2a', { lw: 0.04, seed: 50 });
    for (let i = 0; i < 6; i++) { const xx = -0.6 + i * 0.24; sb(ctx, [[xx - 0.08, -0.12], [xx + 0.08, -0.12], [xx, -0.3]], '#fbf6ee', { lw: 0.03, seed: 51 + i }); }
    const hx = -0.84 * wx, hy = -0.15;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-o.lid); ctx.translate(-hx, -hy);
    if (!hasHat) sproutDraw(ctx, o.view, t);
    drawBodyPart(true);
    sb(ctx, [[-0.82, -0.15], [0.82, -0.15], [0.7, -0.05], [-0.7, -0.05]], '#5a1e2a', { lw: 0.04, seed: 60 });
    for (let i = 0; i < 6; i++) { const xx = -0.6 + i * 0.24; sb(ctx, [[xx - 0.08, -0.12], [xx + 0.08, -0.12], [xx, 0.06]], '#fbf6ee', { lw: 0.03, seed: 61 + i }); }
    eye(ctx, -0.3, -0.45, 'squint', -1, [0, 0], t); eye(ctx, 0.3, -0.45, 'squint', 1, [0, 0], t);
    inkLine(ctx, [[-0.46, -0.66], [-0.18, -0.56]], 0.055, INK, 70, 0.004); inkLine(ctx, [[0.46, -0.66], [0.18, -0.56]], 0.055, INK, 71, 0.004);
    ctx.restore();
  } else {
    if (!hasHat) sproutDraw(ctx, o.view, t);
    drawBodyPart(null);
  }
  ctx.__bodyCol = col;
  // 脸
  if (V.face && !o.lid) {
    const ex = o.eyes || E.eyes, look = E.look || [0, 0];
    ctx.save(); ctx.translate(V.fx, 0);
    if (V.face === 'full') { eye(ctx, -0.3, -0.12, ex, -1, look, t); eye(ctx, 0.3, -0.12, ex, 1, look, t); mouth(ctx, E.mouth, t); }
    if (V.face === 'q') { eye(ctx, 0.26, -0.12, ex, 1, look, t); ctx.save(); ctx.translate(-0.24, -0.12); ctx.scale(0.72, 1); eye(ctx, 0, 0, ex, -1, look, t); ctx.restore(); ctx.save(); ctx.scale(0.85, 1); mouth(ctx, E.mouth, t); ctx.restore(); }
    if (V.face === 'side') { eye(ctx, 0.04, -0.12, ex, 1, look, t); ctx.save(); ctx.translate(0.08, 0); ctx.scale(0.5, 1); mouth(ctx, E.mouth, t); ctx.restore(); }
    ctx.restore();
  }
  if (E.blush && V.face === 'full') [-1, 1].forEach(k => sb(ctx, ell(k * 0.48, 0.12, 0.14, 0.07, 10), rgba('#ef8a8a', 0.45), { line: null, wash: false }));
  // 前侧手臂
  if (o.view === 'front' || o.view === 'back' || o.lid) [-1, 1].forEach((k, i) => armLine(ctx, k * (edge - 0.06), ay, k * (edge + armEnd[0]), ay + armEnd[1] + (o.arms === 'up' ? Math.sin(t * 6 + i) * 0.04 : 0), col, 42 + i * 3));
  if (o.view === 'q') armLine(ctx, edge - 0.06, ay, edge + armEnd[0], ay + armEnd[1], col, 42);
  if (o.view === 'qback') armLine(ctx, -edge + 0.06, ay, -edge - armEnd[0], ay + armEnd[1], col, 42);
  if (o.view === 'side') { const sw = o.legs === 'walk' ? Math.sin(o.walk) * 0.25 : 0; armLine(ctx, 0.12, ay, 0.12 + 0.24 + sw, ay + (o.arms === 'out' ? -0.02 : 0.32), col, 42); }
  if (o.acc) accDraw(ctx, o.acc, t);
  ctx.restore();
}
// 抹影（smear）与转身弧线
function smearTrail(ctx, x, y, s) {
  for (let i = 0; i < 5; i++) sb(ctx, ell(x - s * (0.6 + i * 0.35), y - s * 1.3, s * (0.55 - i * 0.06), s * (0.8 - i * 0.1), 14), rgba('#e8a03a', 0.45 - i * 0.08), { line: null, wash: false, amp: 2 });
  for (let i = 0; i < 4; i++) inkLine(ctx, [[x - s * 0.7, y - s * (0.7 + i * 0.32)], [x - s * 2.1, y - s * (0.75 + i * 0.32)]], 2, rgba('#2a2230', 0.45), 400 + i, 1);
}
function spinArcs(ctx, x, y, s) {
  [[1.15, -0.3], [1.3, 0.2]].forEach(([r, a0], i) => { const p = []; for (let k = 0; k <= 10; k++) { const a = a0 + Math.PI * (0.9 + k / 10 * 0.6); p.push([x + Math.cos(a) * r * s, y - s * 1.3 + Math.sin(a) * r * 0.45 * s]); } inkLine(ctx, p, 2.2, rgba('#2a2230', 0.55), 410 + i, 1); });
}
