// 《小月亮去哪儿了》：小球球 Orbi 的 41 秒小故事（纯时间函数）
// 依赖 src/lib.js、sheet/seedling.js、sheet/orbi.js
const STORY_END = 41;
let SCV, SCX, SB = [];
function storyInit() {
  SCV = document.getElementById('c'); SCX = SCV.getContext('2d');
  PAPER_TEX = makePaper();
  for (let i = 0; i < 2; i++) { const c = document.createElement('canvas'); c.width = W; c.height = H; SB.push(c); }
}

// ---------- 场景与道具 ----------
function nightBg(ctx, u, camX = 0, dim = 0) {
  skyGrad(ctx, '#1c2350', '#535a96');
  particles(ctx, 70, 11, (i, a, b, c) => {
    const x = ((a * (W + 200) - camX * 0.08) % (W + 200) + W + 200) % (W + 200) - 100, y = b * 430;
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(u * (0.8 + c * 2) + i));
    ctx.fillStyle = rgba('#fff4d6', tw * 0.9); ctx.fillRect(x, y, 1.5 + c * 2.5, 1.5 + c * 2.5);
    if (c > 0.9) sparkle(ctx, x, y, 5 * tw, '#fff0c0');
  });
  const far = [];
  for (let i = -2; i <= 16; i++) { const x = i * 100 - ((camX * 0.3) % 100), k = i + Math.floor(camX * 0.3 / 100); far.push([x, 470 - 40 * (0.5 + 0.5 * Math.sin(k * 0.8)) * (0.6 + 0.4 * hash(k))]); }
  far.push([W + 300, H + 50], [-300, H + 50]);
  blob(ctx, far, '#2c3466', { lw: 2, seed: 3, edge: 14 });
  const near = [];
  for (let i = -2; i <= 16; i++) { const x = i * 100 - (camX % 100), k = i + Math.floor(camX / 100); near.push([x, 560 + 14 * Math.sin(k * 0.6)]); }
  near.push([W + 300, H + 50], [-300, H + 50]);
  blob(ctx, near, '#3a4682', { lw: 2.4, seed: 5, edge: 18 });
  particles(ctx, 18, 21, (i, a, b) => { const x = ((a * (W + 200) - camX) % (W + 200) + W + 200) % (W + 200) - 100, y = 590 + b * 110; inkLine(ctx, [[x - 6, y], [x - 2, y - 10]], 2, '#5a6aa8', 30 + i, 0.6); inkLine(ctx, [[x + 2, y], [x + 5, y - 12]], 2, '#5a6aa8', 40 + i, 0.6); });
  if (dim > 0) { ctx.fillStyle = rgba('#141830', dim); ctx.fillRect(-W, -H, 3 * W, 3 * H); }
}
function shootingStar(ctx, p, x0, y0, x1, y1) {
  if (p <= 0 || p >= 1) return;
  const x = lerp(x0, x1, p), y = lerp(y0, y1, p), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const [w, a] of [[10, 0.12], [4, 0.4], [2, 0.9]]) { ctx.strokeStyle = rgba('#fff2c0', a * Math.sin(p * Math.PI)); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - dx / L * 160, y - dy / L * 160); ctx.lineTo(x, y); ctx.stroke(); }
  ctx.restore();
  glow(ctx, x, y, 30, '#fff4c8', 0.9);
  sparkle(ctx, x, y, 12, '#fff6d8');
}
// 小月亮角色：圆脸 + 豆豆眼
function moonChar(ctx, x, y, r, u, o = {}) {
  const e = o.eyes || 'dot', lk = o.look || [0, 0];
  glow(ctx, x, y, r * 3.2, '#ffe6a0', 0.35);
  blob(ctx, ell(x, y, r, r, 16), ORB.moon, { lw: 2.2, amp: 0.5, seed: 700, edge: 5 });
  blob(ctx, ell(x - r * 0.35, y + r * 0.35, r * 0.22, r * 0.18, 8), '#e2d4ae', { line: null, wash: false, amp: 0.3 });
  blob(ctx, ell(x + r * 0.45, y - r * 0.4, r * 0.14, r * 0.12, 8), '#e2d4ae', { line: null, wash: false, amp: 0.3 });
  [-1, 1].forEach((k, i) => {
    const ex = x + k * r * 0.32 + lk[0] * r * 0.12, ey = y - r * 0.05 + lk[1] * r * 0.1;
    if (e === 'happy') inkLine(ctx, [[ex - r * 0.12, ey + r * 0.04], [ex, ey - r * 0.08], [ex + r * 0.12, ey + r * 0.04]], 2.2, INK, 710 + i, 0.3);
    else blob(ctx, ell(ex, ey, r * 0.08, r * 0.11, 8), INK, { line: null, wash: false, amp: 0.2 });
  });
  blob(ctx, ell(x - r * 0.5, y + r * 0.22, r * 0.12, r * 0.06, 8), rgba('#ef8aa8', 0.5), { line: null, wash: false, amp: 0.2 });
  blob(ctx, ell(x + r * 0.5, y + r * 0.22, r * 0.12, r * 0.06, 8), rgba('#ef8aa8', 0.5), { line: null, wash: false, amp: 0.2 });
  if (o.smile) inkLine(ctx, [[x - r * 0.12, y + r * 0.25], [x, y + r * 0.33], [x + r * 0.12, y + r * 0.25]], 2, INK, 720, 0.3);
}
function orbiAt(ctx, x, y, s, o, u, flip = false) {
  ctx.save(); if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
  drawOrbi(ctx, x, y, s, Object.assign({ moon: false }, o), u);
  ctx.restore();
}
function nightCloud(ctx, x, y, s) { cloud(ctx, x, y, s, '#6a72aa', 0.95, 77); }

// ---------- 镜头 ----------
const ST = {};
ST.sleep = (ctx, u) => {
  nightBg(ctx, u);
  const ox = 640, oy = 560, s = 95, cyH = oy - s * 2.45;
  const orbitPos = t => { const a = t * 1.1 + 0.4; return [ox + Math.cos(a) * 190, cyH - 20 + Math.sin(a) * 24, Math.sin(a) > 0]; };
  let mx, my, front;
  if (u < 3.4) [mx, my, front] = orbitPos(u);
  else { const p = orbitPos(3.4); const k = easeIn(seg(u, 3.9, 5.0)); mx = lerp(p[0], 1450, k); my = lerp(p[1], 110, k) - Math.sin(k * Math.PI) * 40; front = true; }
  const look = u > 3.0 ? [0.9, -0.6] : [0, 0];
  if (!front) moonChar(ctx, mx, my, 30, u, { look });
  orbiAt(ctx, ox, oy, s, { emo: 'sleepy' }, u);
  if (front) { moonChar(ctx, mx, my, 30, u, { look }); if (u > 3.9 && u < 5.2) speedLines(ctx, 6, 3, u, '#fff4d0', 0.35, 1, my - 30, my + 30); }
  shootingStar(ctx, seg(u, 2.6, 3.6), 80, 90, 1000, 170);
};
ST.wake = (ctx, u) => {
  nightBg(ctx, u);
  ctx.save(); ctx.translate(640, 360); ctx.scale(1.25, 1.25); ctx.translate(-640, -360);
  const blinkClose = u > 0.8 && u < 1.0;
  let emo = 'neutral', look = [0, 0];
  if (u < 0.8) emo = 'sleepy';
  if (u >= 1.3 && u < 2.1) look = [-0.9, 0];
  if (u >= 2.1 && u < 2.9) look = [0.9, 0];
  if (u >= 3.0) emo = 'surprised';
  const sq = u > 3.0 && u < 3.25 ? -0.1 * Math.sin(seg(u, 3.0, 3.25) * Math.PI) : 0;
  orbiAt(ctx, 640, 640, 130, { emo, look, eyes: blinkClose ? 'line' : null, squash: sq }, u);
  ctx.restore();
};
ST.search = (ctx, u) => {
  const walking = u < 2.5 || u > 4.0, wt = u < 2.5 ? u : u > 4.0 ? u - 1.5 : 2.5;
  nightBg(ctx, u, wt * 130);
  if (walking) orbiAt(ctx, 600, 560 - Math.abs(Math.sin(wt * 7)) * 5, 100, { view: 'side', legs: 'walk', walk: wt * 7 }, u);
  else orbiAt(ctx, 600, 560, 100, { emo: 'confused', look: [0.3, -0.9] }, u);
};
ST.sad = (ctx, u) => {
  nightBg(ctx, u, 0, 0.25 * ease(seg(u, 0, 1.5)));
  const emo = u < 0.8 ? 'neutral' : u < 2.5 ? 'sad' : 'cry';
  orbiAt(ctx, 640, 600, 120, { emo, look: u < 0.8 ? [0, 0.3] : undefined }, u);
};
ST.returns = (ctx, u) => {
  nightBg(ctx, u, 0, 0.2);
  orbiAt(ctx, 520, 600, 62, { emo: 'cry' }, u);
  const peek = easeOut(seg(u, 0.4, 1.2)), fly = ease(seg(u, 2.0, 3.6));
  const sx = 990 - peek * 70, sy = 170, ex = 560, ey = 600 - 62 * 2.9;
  const mx = lerp(sx, ex, fly), my = lerp(sy, ey, fly) - Math.sin(fly * Math.PI) * 90;
  const look = u > 1.2 ? [-0.9, 0.7] : [-0.5, 0];
  if (fly <= 0) { moonChar(ctx, mx, my, 32, u, { look }); nightCloud(ctx, 1040, 190, 130); }
  else { nightCloud(ctx, 1040, 190, 130); moonChar(ctx, mx, my, 32, u, { look }); if (fly < 0.95) speedLines(ctx, 5, 9, u, '#fff4d0', 0.25, -1, my - 20, my + 20); }
};
ST.bonk = (ctx, u) => {
  nightBg(ctx, u);
  ctx.save(); ctx.translate(640, 360); ctx.scale(1.2, 1.2); ctx.translate(-640, -360);
  const lift = u > 2.0 && u < 2.8 ? Math.sin(seg(u, 2.0, 2.8) * Math.PI) * 0.9 : 0;
  const sq = u > 1.75 && u < 2.0 ? 0.18 * Math.sin(seg(u, 1.75, 2.0) * Math.PI) : u > 2.8 && u < 2.95 ? 0.2 * Math.sin(seg(u, 2.8, 2.95) * Math.PI) : -0.05 * lift;
  const emo = u < 0.5 ? 'cry' : u < 1.3 ? 'surprised' : 'laugh';
  const s = 125, oy = 650, top = oy - lift * s - s * 2.45;
  orbiAt(ctx, 640, oy, s, { emo, lift, squash: sq, legs: lift > 0.1 ? 'tuck' : 'stand', hands: lift > 0.1 ? 'up' : 'down' }, u);
  const tap = seg(u, 0, 0.5), mx = lerp(900, 700, easeIn(tap)) + (u > 0.5 ? Math.sin(u * 3) * 10 : 0), my = u <= 0.5 ? lerp(160, top - 10, easeIn(tap)) : top - 60 - 15 * Math.sin(u * 4);
  moonChar(ctx, mx, my, 36, u, { look: [-0.6, 0.6], eyes: u > 1.3 ? 'happy' : 'dot', smile: u > 1.3 });
  if (u > 0.5 && u < 1.0) { sparkle(ctx, 670, top + 5, 26 * (1 - seg(u, 0.5, 1.0))); sparkle(ctx, 720, top - 10, 14 * (1 - seg(u, 0.5, 1.0))); }
  ctx.restore();
};
ST.hug = (ctx, u) => {
  nightBg(ctx, u);
  glow(ctx, 640, 380, 380, '#ffd88a', 0.25 * ease(seg(u, 0.4, 1.5)));
  const s = 135, oy = 640, cyH = oy - s * 1.37;
  if (u < 2.8) {
    const k = easeOut(seg(u, 0, 0.6));
    orbiAt(ctx, 640, oy, s, { emo: 'love', hands: 'hug' }, u);
    moonChar(ctx, lerp(820, 640, k), lerp(200, cyH + 55, k), 34, u, { eyes: 'happy', smile: true });
  } else {
    const a = (u - 2.8) * 1.6 + Math.PI / 2, mx = 640 + Math.cos(a) * 200, my = oy - s * 2.6 + Math.sin(a) * 26, front = Math.sin(a) > 0;
    if (!front) moonChar(ctx, mx, my, 32, u, { eyes: 'happy', smile: true });
    orbiAt(ctx, 640, oy, s, { emo: 'happy' }, u);
    if (front) moonChar(ctx, mx, my, 32, u, { eyes: 'happy', smile: true });
  }
};
ST.end = (ctx, u) => {
  nightBg(ctx, u);
  const ox = 640, oy = 560, s = 95, cyH = oy - s * 2.45;
  const pause = u > 2.0 && u < 3.2;
  const tt = u < 2.0 ? u : u < 3.2 ? 2.0 : u - 1.2;
  const a = tt * 1.1 + 2.2, r = lerp(190, 145, ease(seg(u, 3.2, 4.5)));
  const mx = ox + Math.cos(a) * r + (pause && u > 2.6 ? Math.sin(u * 30) * 4 : 0), my = cyH - 20 + Math.sin(a) * 22, front = Math.sin(a) > 0;
  const look = pause && u < 2.6 ? [0.9, -0.6] : [0, 0];
  if (!front) moonChar(ctx, mx, my, 30, u, { look, eyes: u > 3.2 ? 'happy' : 'dot' });
  orbiAt(ctx, ox, oy, s, { emo: 'sleepy' }, u);
  if (front) moonChar(ctx, mx, my, 30, u, { look, eyes: u > 3.2 ? 'happy' : 'dot' });
  shootingStar(ctx, seg(u, 1.5, 2.5), 80, 90, 1000, 170);
};
const STORY = [[0, 'cut', ST.sleep], [6, 'fade', ST.wake], [10.5, 'wipe', ST.search], [17, 'fade', ST.sad], [23, 'cut', ST.returns], [27, 'cut', ST.bonk], [31, 'iris', ST.hug], [36, 'fade', ST.end]];
const STD = { cut: 0, fade: 0.6, wipe: 0.5, iris: 0.6 };

function storyShot(c, i, T) {
  const ctx = c.getContext('2d'), s = STORY[i][0], e = i + 1 < STORY.length ? STORY[i + 1][0] : STORY_END;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const z = 1 + 0.03 * ease((T - s) / (e - s));
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  STORY[i][2](ctx, T - s, e - s);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function storyFrame(T) {
  BOIL = Math.floor(T * 10);
  let i = 0; while (i + 1 < STORY.length && STORY[i + 1][0] <= T) i++;
  const tr = STORY[i][1], td = STD[tr], p = td ? (T - STORY[i][0]) / td : 1, ctx = SCX;
  if (i === 0 || p >= 1) { storyShot(SB[0], i, T); ctx.drawImage(SB[0], 0, 0); }
  else {
    storyShot(SB[0], i - 1, T); storyShot(SB[1], i, T); const q = ease(p);
    ctx.drawImage(SB[0], 0, 0);
    ctx.save();
    if (tr === 'fade') { ctx.globalAlpha = q; ctx.drawImage(SB[1], 0, 0); }
    if (tr === 'wipe') { ctx.beginPath(); ctx.moveTo(-10, -10); for (let y = 0; y <= H + 18; y += 18) ctx.lineTo(q * (W + 400) - 200 + Math.sin(y * 0.03) * 40 + (hash(Math.floor(y / 18)) - 0.5) * 50, y); ctx.lineTo(-10, H + 20); ctx.closePath(); ctx.clip(); ctx.drawImage(SB[1], 0, 0); }
    if (tr === 'iris') { trace(ctx, ell(640, 380, q * 820, q * 820, 24), true); ctx.clip(); ctx.drawImage(SB[1], 0, 0); }
    ctx.restore();
  }
  paperOverlay(ctx);
  const fin = 1 - seg(T, 0, 0.8), fout = seg(T, STORY_END - 1.2, STORY_END - 0.1);
  if (fin + fout > 0) { ctx.globalAlpha = Math.max(fin, fout); ctx.drawImage(PAPER_TEX, 0, 0); ctx.globalAlpha = 1; }
  return SCV.toDataURL('image/jpeg', 0.92);
}
