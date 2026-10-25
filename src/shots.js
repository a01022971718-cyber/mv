// 43 个镜头 + 转场合成。每个镜头 f(ctx, u, d)：u = 镜头内时间，d = 镜头时长
let CV, CX, BUF = [], LAYER;
const END = 152.36;

function mkCanvas() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
function init() {
  CV = document.getElementById('c'); CX = CV.getContext('2d');
  PAPER_TEX = makePaper();
  BUF = [mkCanvas(), mkCanvas()]; LAYER = mkCanvas();
}
// 半透明图层：在同样的变换下画进 LAYER，再整体以 a 透明度盖上
function withAlpha(ctx, a, fn) {
  if (a <= 0.003) return;
  const lc = LAYER.getContext('2d');
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, W, H);
  lc.setTransform(ctx.getTransform());
  fn(lc);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(LAYER, 0, 0); ctx.restore();
}

// ---------- 场景小件 ----------
function hills(ctx, y, amp, col, seed, scroll = 0, line = true) {
  const pts = [];
  for (let i = -2; i <= 14; i++) {
    const x = i * 110 - (scroll % 110);
    const k = i + Math.floor(scroll / 110);
    pts.push([x, y - amp * (0.5 + 0.5 * Math.sin(k * 0.9 + seed) * hash(seed + k))]);
  }
  pts.push([W + 300, H + 300], [-300, H + 300]);
  blob(ctx, pts, col, { lw: line ? 2.2 : 0, line: line ? INK : null, amp: 1.5, seed, edge: 14 });
}
function drawHand(ctx, x, y, s, rot, open, skin = CH.lan.skin, sx = 1, bandage = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * sx, s);
  const col = bandage ? '#efe6d2' : skin;
  const fingers = [[-0.45, 0.15], [-0.15, 0.05], [0.15, 0.05], [0.45, 0.15]];
  fingers.forEach(([fx], i) => {
    const L = (0.95 + (i === 1 || i === 2 ? 0.15 : 0)) * lerp(0.45, 1, open);
    const spread = (fx) * 0.5 * open;
    const curl = (1 - open) * 1.4;
    const p1 = [fx, -0.55], p2 = [fx + Math.sin(spread) * L * 0.55, -0.55 - Math.cos(spread) * L * 0.55];
    const p3 = [p2[0] + Math.sin(spread + curl) * L * 0.45, p2[1] - Math.cos(spread + curl) * L * 0.45];
    trace(ctx, [p1, p2, p3], false); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 0.34; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 0.27; ctx.stroke();
  });
  blob(ctx, [[-0.62, -0.6], [0.62, -0.6], [0.6, 0.35], [0.35, 0.75], [-0.35, 0.75], [-0.62, 0.35]], col, { lw: 0.045, amp: 0.012, seed: 3, edge: 0.15 });
  const th = [[-0.55, 0.1], [-0.95 - 0.1 * open, -0.25 - 0.2 * open], [-1.05 - 0.15 * open, -0.6 - 0.3 * open]];
  trace(ctx, th, false); ctx.strokeStyle = INK; ctx.lineWidth = 0.36; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 0.29; ctx.stroke();
  // 手腕/袖
  blob(ctx, [[-0.4, 0.6], [0.4, 0.6], [0.45, 2.2], [-0.45, 2.2]], col, { lw: 0.045, amp: 0.012, seed: 4, edge: 0.15 });
  if (bandage) for (let i = 0; i < 6; i++) inkLine(ctx, [[-0.6, -0.4 + i * 0.4], [0.6, -0.25 + i * 0.4]], 0.03, rgba('#8a7a62', 0.8), 20 + i, 0.01);
  else blob(ctx, [[-0.55, 1.3], [0.55, 1.3], [0.65, 2.6], [-0.65, 2.6]], CH.lan.cloth, { lw: 0.045, amp: 0.012, seed: 5, edge: 0.15 });
  ctx.restore();
}
function drawPaw(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  blob(ctx, [[-0.7, 2.5], [-0.8, 0.4], [-0.5, -0.3], [0.5, -0.3], [0.8, 0.4], [0.7, 2.5]], EMB.body, { lw: 0.05, amp: 0.012, seed: 6, edge: 0.2 });
  [-0.5, -0.17, 0.17, 0.5].forEach((tx, i) => blob(ctx, ell(tx, -0.35, 0.2, 0.25, 10), EMB.body, { lw: 0.05, amp: 0.01, seed: 7 + i }));
  blob(ctx, ell(0, 0.25, 0.35, 0.28, 10), '#e88a5a', { lw: 0.04, amp: 0.01, seed: 12 });
  ctx.restore();
}
function drawDandelion(ctx, x, y, r, t, rel, seed) {
  inkLine(ctx, [[x, y], [x + 6, y + 120], [x - 4, y + 260], [x + 2, H + 50]], 3, '#6e8a4a', seed, 0.8);
  blob(ctx, ell(x, y, r * 0.16, r * 0.14, 10), '#c9b48a', { lw: 1.5, amp: 0.6, seed });
  const n = 34;
  for (let i = 0; i < n; i++) {
    if (hash(seed + i * 1.7) < rel) continue;
    const a = i / n * Math.PI * 2 + 0.03 * Math.sin(t * 2 + i);
    drawSeed(ctx, x + Math.cos(a) * r * 0.12, y + Math.sin(a) * r * 0.12, r * 0.85 / 1.25, a + Math.PI / 2 + Math.PI, 0.95);
  }
  glow(ctx, x, y, r * 1.1, '#ffffff', 0.12);
}
function shards(ctx, cx, cy, n, R, u, seed, col = '#cdeefc') {
  particles(ctx, n, seed, (i, a, b, c) => {
    const ang = a * Math.PI * 2 + u * (1.5 + b), rr = R * (0.2 + 0.8 * ((b + u * 0.25) % 1));
    const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * 0.6, sz = 8 + c * 22;
    blob(ctx, [[x, y - sz], [x + sz * 0.4, y], [x, y + sz * 0.6], [x - sz * 0.4, y]].map(q => { const dx = q[0] - x, dy = q[1] - y, r2 = ang + 1; return [x + dx * Math.cos(r2) - dy * Math.sin(r2), y + dx * Math.sin(r2) + dy * Math.cos(r2)]; }), col, { lw: 1.4, line: '#2e4c7a', amp: 0.6, seed: seed + i, edge: 4 });
  });
}
function petals(ctx, cx, cy, n, R, u, seed, cols = ['#f48ab8', '#ffd0e4', '#9ad46a']) {
  particles(ctx, n, seed, (i, a, b, c) => {
    const ang = a * Math.PI * 2 + u * (2 + b * 2), rr = R * (0.15 + 0.85 * ((b + u * 0.3) % 1));
    const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * 0.55;
    const sz = 7 + c * 12;
    blob(ctx, ell(x, y, sz, sz * 0.5, 8, ang * 2 + c * 6), cols[i % cols.length], { lw: 1.1, amp: 0.5, seed: seed + i, edge: 3 });
  });
}
function embers(ctx, n, seed, u, col = '#ffb43a', speed = 120) {
  particles(ctx, n, seed, (i, a, b, c) => {
    const y = H + 40 - ((b * (H + 80) + u * speed * (0.6 + c)) % (H + 80));
    const x = a * W + Math.sin(u * 2 + i) * 20;
    glow(ctx, x, y, 6 + c * 10, col, 0.7);
  });
}
function rain(ctx, u, n = 90, seed = 5) {
  ctx.save(); ctx.strokeStyle = 'rgba(220,236,240,0.35)'; ctx.lineWidth = 1.5;
  particles(ctx, n, seed, (i, a, b, c) => {
    const y = ((b * H + u * (700 + c * 300)) % (H + 100)) - 50, x = a * W - y * 0.15;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 28); ctx.stroke();
  });
  ctx.restore();
}
function stars(ctx, n, seed, u, col = '#e8e0ff') {
  particles(ctx, n, seed, (i, a, b, c) => {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(u * (1 + c * 2) + i));
    ctx.fillStyle = rgba(col, tw * 0.8); ctx.fillRect(a * W, b * H, 1.5 + c * 2, 1.5 + c * 2);
  });
}
function bigBurst(ctx, x, y, R, u, seed, cols = ['#c8401f', '#f08a2c', '#ffd25a', '#fff2c4']) {
  cols.forEach((c, k) => {
    const r = R * (1 - k * 0.22);
    const pts = [];
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; const rr = r * (0.7 + 0.45 * hash(seed + i * 3 + k * 50) + 0.1 * Math.sin(u * 8 + i)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    blob(ctx, pts, c, { line: null, amp: 3, seed: seed + k, edge: 30 });
  });
  glow(ctx, x, y, R * 0.8, '#fff2c4', 0.7);
}
function shakeT(T, amp) { return [(hash(Math.floor(T * 25)) - 0.5) * 2 * amp, (hash(Math.floor(T * 25) + 0.5) - 0.5) * 2 * amp]; }

// ---------- 镜头 ----------
const S = {};
S.cliffOpen = (ctx, u) => {
  skyGrad(ctx, '#5b9ed8', '#cfe8f4');
  cloud(ctx, 200 - u * 12, 140, 170, '#fbf7ef', 0.9, 1); cloud(ctx, 980 - u * 8, 90, 130, '#fbf7ef', 0.85, 2);
  // 右侧悬崖
  blob(ctx, [[930, 720], [960, 380], [1010, 250], [1120, 180], [1290, 160], [1290, 720]], '#b89a74', { lw: 2.5, seed: 4, edge: 18 });
  for (let i = 0; i < 6; i++) inkLine(ctx, [[990 + i * 45, 260 + i * 10], [980 + i * 50, 720]], 2, rgba('#6a5040', 0.5), 10 + i, 1.5);
  blob(ctx, [[1000, 260], [1120, 175], [1290, 155], [1290, 215], [1130, 235], [1030, 290]], '#6fa04e', { lw: 2.2, seed: 5, edge: 10 });
  const lk = ease(seg(u, 1.4, 1.9)), tn = ease(seg(u, 1.6, 2.6)), sp = ease(seg(u, 2.75, 3.1));
  drawHead(ctx, CH.lan, 560, 330 + 6 * Math.sin(u * 2), 175, {
    turn: lerp(-0.25, 0.35, tn), look: [lerp(-0.5, 0.85, lk), lerp(0.1, -0.1, lk)], wind: 0.65, wdir: -1,
    mouth: sp * 0.55, brow: sp * 0.7, blink: autoBlink(u + 1.3, 4) * (1 - sp), tilt: lerp(-0.04, 0.03, tn),
  }, u, 4);
  // 风中的草屑
  particles(ctx, 10, 3, (i, a, b, c) => { const x = W - ((a * W + u * (300 + c * 300)) % (W + 100)), y = b * H * 0.7 + Math.sin(u * 3 + i) * 15; blob(ctx, ell(x, y, 7, 3, 6, u * 3 + i), '#7fae58', { lw: 1, amp: 0.4, seed: i }); });
};
S.plains = (ctx, u) => {
  skyGrad(ctx, '#6aa8dc', '#e4f0f0');
  cloud(ctx, 300, 120, 140, '#fbf7ef', 0.9, 7); cloud(ctx, 950, 160, 110, '#fbf7ef', 0.8, 8);
  hills(ctx, 400, 50, '#9fbf8a', 2, 0); hills(ctx, 450, 40, '#c7c27a', 9, 0);
  // 平顶树
  [[260, 430, 1], [1040, 445, 0.8]].forEach(([x, y, k], i) => {
    inkLine(ctx, [[x, y], [x + 5, y - 70 * k], [x - 4, y - 110 * k]], 9 * k, '#6a4a34', 30 + i, 1);
    blob(ctx, ell(x, y - 120 * k, 95 * k, 28 * k, 14), '#5f8f46', { lw: 2.2, seed: 40 + i, edge: 10 });
  });
  const g = ctx.createLinearGradient(0, 450, 0, H); g.addColorStop(0, '#d9c27a'); g.addColorStop(1, '#b89a5a');
  ctx.fillStyle = g; ctx.fillRect(-100, 455, W + 200, 400);
  particles(ctx, 40, 11, (i, a, b, c) => inkLine(ctx, [[a * W, 470 + b * 260], [a * W + 4, 455 + b * 260 - 10 * c]], 1.5, rgba('#7a6a3a', 0.6), 50 + i, 0.6));
  const k = easeOut(seg(u, 0, 2.0)), ph = u * 2.6;
  const hop = Math.abs(Math.sin(Math.PI * ph));
  const x = lerp(820, 600, k), yb = lerp(440, 600, k), s = lerp(8, 44, k * k);
  blob(ctx, ell(x, yb + s * 0.9, s * 1.1 * (1 - hop * 0.3), s * 0.25, 10), rgba('#5a4a2a', 0.35), { line: null, wash: false });
  drawEmberSmall(ctx, x, yb - hop * s * 1.6, s, u, { hop: ph, sx: -1 }, 3);
};
S.amulet = (ctx, u) => {
  radialBg(ctx, 640, 380, '#7a4a2a', '#221a28', 800);
  const lit = ease(seg(u, 0.7, 1.7)), op = easeOut(seg(u, 0.1, 0.9));
  rays(ctx, 640, 380, 18, 700 * lit, '#ffd77a', u * 0.25, 0.45 * lit, 0.05, 3);
  embers(ctx, 18, 7, u, '#ffcf6a', 90);
  drawHand(ctx, 640 - lerp(60, 170, op), 620, 150, -lerp(0.2, 0.55, op), op, CH.lan.skin, 1);
  drawHand(ctx, 640 + lerp(60, 170, op), 620, 150, lerp(0.2, 0.55, op), op, CH.lan.skin, -1);
  drawAmulet(ctx, 640, 400 - 20 * op - 6 * Math.sin(u * 3), 55, u, lit);
};
S.awaken = (ctx, u) => {
  radialBg(ctx, 640, 360, '#ffd65a', '#c43a1e', 760);
  const k = easeOut(seg(u, 0, 1.2));
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.2; const r = 120 + 420 * k; flame(ctx, 640 + Math.cos(a) * r, 400 + Math.sin(a) * r * 0.7, 40, 120, u, i, ['#c8401f', '#f08a2c', '#ffd25a'], a + Math.PI / 2); }
  glow(ctx, 640, 380, 360, '#fff0b0', 0.6);
  drawFigure(ctx, CH.lan, 640, 470, 30, Object.assign(POSE.raise(u), { head: { turn: 0.1, wind: 0.9, wdir: -1, brow: -0.6, mouth: 0.3 * pulse(u, 1.2, 2.6) } }), u, 5);
  embers(ctx, 40, 9, u, '#fff0a0', 260);
};
S.eye = (ctx, u) => {
  radialBg(ctx, 640, 360, '#e8b88a', '#7a4a3a', 800);
  const op = 1 - ease(seg(u, 0.15, 0.6));
  drawHead(ctx, CH.lan, 960, 300, 820, { turn: 0.1, look: [lerp(-0.2, 0.15, ease(seg(u, 0.8, 1.6))), 0], blink: op, wind: 0.2, wdir: -1, shoulders: false, brow: -0.3 }, u, 4);
  glow(ctx, 640, 400, 160 * ease(seg(u, 1.0, 2.0)), '#ffd25a', 0.8);
  starBurst(ctx, 620, 380, 60 * pulse(u, 1.2, 2.6), '#fff4c8', 0.9, u * 0.5);
};
S.transform = (ctx, u) => {
  radialBg(ctx, 640, 360, '#fff6dc', '#f0b04a', 760);
  rays(ctx, 640, 360, 24, 900, '#ffffff', u * 0.3, 0.45, 0.04, 11);
  const g = easeIn(seg(u, 0, 1.5));
  if (u < 1.55) {
    withAlpha(ctx, 1, c => drawEmberSmall(c, 640, 380, lerp(40, 95, g), u, { hop: u * 0.5 }, 3));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#fff2c4', 0.6 * g); ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
  } else {
    const k = backOut(seg(u, 1.55, 2.3));
    drawBeastHead(ctx, 640, 380, lerp(60, 120, k), u, { eyes: ease(seg(u, 1.9, 2.3)) }, 9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#fff2c4', 0.9 * (1 - seg(u, 1.55, 2.0))); ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
  }
};
S.grip = (ctx, u) => {
  ctx.fillStyle = CH.lan.cloth; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  for (let i = 0; i < 5; i++) inkLine(ctx, [[150 + i * 240, -10], [190 + i * 230, 300]], 2, rgba('#9aa098', 0.6), 70 + i, 2);
  blob(ctx, [[-50, 330], [W + 50, 330], [W + 50, H + 50], [-50, H + 50]], CH.lan.pants, { lw: 2.5, seed: 8, edge: 20 });
  blob(ctx, [[-50, 300], [W + 50, 300], [W + 50, 360], [-50, 360]], '#6a4630', { lw: 2.5, seed: 9, edge: 8 });
  blob(ctx, [[600, 300], [680, 300], [680, 360], [600, 360]], '#c9a24a', { lw: 2.5, seed: 10 });
  const sw = Math.sin(u * 3) * 0.08;
  ctx.save(); ctx.translate(640, 360); ctx.rotate(sw); drawAmulet(ctx, 0, 110, 48, u, 0.4); ctx.restore();
  const inn = easeOut(seg(u, 0, 0.8)), cl = ease(seg(u, 1.1, 1.5));
  const sh = cl > 0.9 ? shakeT(u, 3) : [0, 0];
  drawHand(ctx, lerp(1250, 700, inn) + sh[0], lerp(620, 490, inn) + sh[1], 120, -1.2 + cl * 0.3, 1 - cl, CH.lan.skin, 1);
};
S.charge = (ctx, u, d) => {
  const sc = u * 900;
  skyGrad(ctx, '#b84a32', '#efb27a');
  hills(ctx, 360, 60, '#9a4a36', 3, sc * 0.2);
  hills(ctx, 430, 40, '#c46a44', 6, sc * 0.5);
  const g = ctx.createLinearGradient(0, 430, 0, H); g.addColorStop(0, '#d98a5a'); g.addColorStop(1, '#a8503a');
  ctx.fillStyle = g; ctx.fillRect(-100, 440, W + 200, 400);
  particles(ctx, 20, 21, (i, a, b, c) => { const x = ((a * (W + 400) - sc * (1 + c)) % (W + 400) + W + 400) % (W + 400) - 200; inkLine(ctx, [[x, 470 + b * 230], [x + 30 + c * 60, 470 + b * 230]], 2, rgba('#7a3a2a', 0.5), 80 + i, 1); });
  const k = ease(seg(u, 0, d)), bx = lerp(-200, 1250, k);
  for (let i = 0; i < 8; i++) { const px = bx - 120 - i * 70, a = 0.5 - i * 0.05; blob(ctx, ell(px, 600 + Math.sin(i) * 10, 50 + i * 12, 30 + i * 8, 12), rgba('#e8b088', a), { line: null, seed: 90 + i, wash: false }); }
  drawBeastRun(ctx, bx, 470, 62, u, 12);
  speedLines(ctx, 18, 4, u, '#ffe6b0', 0.4, 1, 150, 650);
};
S.shuangWake = (ctx, u) => {
  radialBg(ctx, 640, 300, '#4a5aa8', '#1a1838', 760);
  stars(ctx, 60, 4, u);
  particles(ctx, 12, 8, (i, a, b, c) => glow(ctx, a * W, b * H, 14 + c * 20, '#9fd0ff', 0.5));
  const op = 1 - ease(seg(u, 0.5, 1.0));
  drawHead(ctx, CH.shuang, 640, 300 + 4 * Math.sin(u * 2), 165, { turn: -0.15, blink: Math.max(op, autoBlink(u, 9) * (u > 1.2 ? 1 : 0)), look: [0.1, 0.05], wind: 0.55, wdir: 1, brow: -0.2 }, u, 9);
};
S.redEyes = (ctx, u) => {
  skyGrad(ctx, '#140f22', '#3c2152');
  stars(ctx, 50, 12, u, '#d8c8ff');
  withAlpha(ctx, 0.55 * ease(seg(u, 2.2, 3.8)), c => drawVillain(c, 640, 420, 110, u, { open: 0.6, eyes: 0 }, 21));
  particles(ctx, 11, 31, (i, a, b, c) => {
    const on = ease(seg(u, 0.2 + i * 0.28, 0.5 + i * 0.28));
    if (on <= 0) return;
    const x = 120 + a * 1040, y = 90 + b * 520, s = 18 + c * 26;
    blob(ctx, [[x - s, y], [x, y - s * 0.45 * on], [x + s, y], [x, y + s * 0.45 * on]], '#ff3a3a', { lw: 1.5, amp: 0.5, seed: 40 + i, wash: false });
    blob(ctx, ell(x, y, s * 0.15, s * 0.35 * on, 8), '#2a0a10', { line: null, wash: false });
    glow(ctx, x, y, s * 3, '#ff3030', 0.45 * on);
  });
};
S.wings = (ctx, u) => {
  skyGrad(ctx, '#3f7fc8', '#a8d4f0');
  cloud(ctx, 220, 560, 200, '#fbf7ef', 0.8, 13); cloud(ctx, 1050, 600, 180, '#fbf7ef', 0.8, 14);
  const o = easeOut(seg(u, 0.1, 1.2));
  // 阴影压暗天空
  ctx.save(); ctx.fillStyle = rgba('#2a1f40', 0.35 * o); ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
  drawVillain(ctx, 640, 380, 95, u, { open: lerp(0.15, 1, o), eyes: ease(seg(u, 0.6, 1.4)) }, 21);
  if (u > 1.3 && u < 1.6) bolt(ctx, 200, 0, 330, 420, 3, '#c9a0ff', 4);
  if (u > 2.0 && u < 2.3) bolt(ctx, 1100, 0, 960, 380, 7, '#c9a0ff', 4);
};
S.iceSwirl = (ctx, u) => {
  radialBg(ctx, 640, 400, '#9fdcf6', '#1d4a96', 760);
  shards(ctx, 640, 380, 26, 560, u, 3);
  glow(ctx, 640, 360, 220, '#e8fbff', 0.5 + 0.2 * Math.sin(u * 4));
  drawFigure(ctx, CH.shuang, 640, 470, 32, Object.assign(POSE.raise(u), { head: { turn: 0.2, wind: 1, wdir: 1, brow: -0.6 } }), u, 9);
  shards(ctx, 640, 420, 10, 360, u + 3, 7);
};
S.lanFire = (ctx, u) => {
  radialBg(ctx, 640, 700, '#e8642a', '#3a1a1e', 900);
  for (let i = 0; i < 12; i++) flame(ctx, i * 115 + 20, H + 20, 70, 220 + 80 * hash(i), u, i, ['#9a2a1e', '#d8442a', '#f08a2c']);
  drawHead(ctx, CH.lan, 600, 340 + 3 * Math.sin(u * 3), 180, { turn: 0.15, look: [0.2, 0], brow: -0.85, wind: 0.75, wdir: -1, blink: autoBlink(u, 2) }, u, 4);
  embers(ctx, 30, 13, u, '#ffb43a', 160);
};
S.explosion = (ctx, u) => {
  ctx.fillStyle = '#3a1a1e'; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  const k = easeOut(seg(u, 0, 1.3));
  bigBurst(ctx, 640, 380, 120 + 700 * k, u, 5);
  rays(ctx, 640, 380, 20, 900, '#fff2c4', 0.3, 0.5 * (1 - seg(u, 0.8, 2.6)), 0.05, 17);
  particles(ctx, 30, 41, (i, a, b, c) => { const ang = a * Math.PI * 2, r = (100 + 800 * c) * k; glow(ctx, 640 + Math.cos(ang) * r, 380 + Math.sin(ang) * r, 14, '#ffcf6a', 0.8); });
};
S.kuiLeaf = (ctx, u) => {
  radialBg(ctx, 760, 340, '#ffc8e4', '#9a2a7a', 800);
  particles(ctx, 16, 6, (i, a, b, c) => glow(ctx, a * W, ((b * H - u * 30 * (1 + c)) % H + H) % H, 10 + c * 16, '#ffe6f2', 0.6));
  const r = easeOut(seg(u, 0.4, 1.4));
  drawHead(ctx, CH.kui, 560, 340 + 4 * Math.sin(u * 2), 165, { turn: 0.3, look: [lerp(0, 0.7, r), lerp(0, 0.4, r)], smile: 0.6 * r, blush: 0.8, wind: 0.4, wdir: -1, blink: autoBlink(u, 8) }, u, 8);
  const lx = 820, ly = lerp(820, 470, r);
  drawHand(ctx, lx, ly + 60, 70, 0.25, 0.3, CH.kui.skin, 1);
  blob(ctx, [[lx, ly - 70], [lx + 34, ly - 20], [lx, ly + 20], [lx - 30, ly - 20]], '#6dbb4a', { lw: 2.2, seed: 9 });
  inkLine(ctx, [[lx, ly - 60], [lx, ly + 30]], 1.6, INK, 10, 0.6);
  glow(ctx, lx, ly - 20, 90 * r, '#c8ffb0', 0.5);
};
S.kuiSpin = (ctx, u) => {
  radialBg(ctx, 640, 360, '#f6a8d8', '#5a2a8a', 760);
  petals(ctx, 640, 380, 40, 620, u, 5);
  const turn = Math.cos(u * 5);
  drawFigure(ctx, CH.kui, 640, 470, 30, { lean: 0, aL: [2.0, 0.1], aR: [-2.0, -0.1], lL: [0.12, 0], lR: [-0.12, 0], head: { turn: 0.4 * turn, smile: 0.7, blink: 0.9, wind: 0.6, wdir: -Math.sign(turn || 1) } }, u, 8, turn >= 0 ? 1 : -1);
  petals(ctx, 640, 420, 16, 380, u + 2, 9);
};
S.dive = (ctx, u, d) => {
  radialBg(ctx, 640, 360, '#6a2ab8', '#160c2c', 800);
  const k = easeIn(seg(u, 0, d));
  if (Math.floor(u * 4) % 3 === 0) bolt(ctx, hash(Math.floor(u * 4)) * W, 0, hash(Math.floor(u * 4) + 3) * W, H, Math.floor(u * 4), '#c88aff', 4, 3);
  drawVillain(ctx, lerp(300, 640, k), lerp(180, 420, k), lerp(40, 160, k), u, { open: 0.75, eyes: 1, flapSp: 6 }, 21);
  speedLines(ctx, 14, 9, u, '#d0b0ff', 0.25, 1, 0, H);
};
S.villainFace = (ctx, u) => {
  radialBg(ctx, 640, 300, '#4a2a6a', '#120a1e', 760);
  const [sx, sy] = u > 1.2 ? shakeT(u, 4) : [0, 0];
  drawVillain(ctx, 640 + sx, 760 + sy, 330, u, { open: 1, eyes: ease(seg(u, 0.4, 1.4)), flap: 0.3 }, 21);
  if (u > 1.0) focusLines(ctx, 640, 340, 40, 3, '#1a0e24', 0.35);
};
S.combo = (ctx, u) => {
  skyGrad(ctx, '#2e70c0', '#bfe4f6');
  cloud(ctx, 640, 640, 300, '#fbf7ef', 0.9, 21);
  withAlpha(ctx, 0.75, c => drawVillain(c, 640, 150, 30, u, { open: 1, eyes: 1 }, 21));
  drawFigure(ctx, CH.shuang, 230, 520, 26, Object.assign(POSE.point(u), { head: { turn: 0.5, brow: -0.6, wind: 0.6, wdir: -1 } }), u, 9);
  drawFigure(ctx, CH.kui, 1050, 520, 25, Object.assign(POSE.point(u + 1), { head: { turn: 0.5, brow: -0.5, wind: 0.6, wdir: -1 } }), u, 8, -1);
  const k = ease(seg(u, 0.5, 2.0));
  // 冰流与花流在中间相遇
  particles(ctx, 26, 61, (i, a, b, c) => { const f = ((a + u * 0.8) % 1) * k; const x = lerp(290, 640, f), y = lerp(400, 330, f) + Math.sin(f * 9 + i) * 30 * (1 - f); blob(ctx, ell(x, y, 12 + c * 10, 6, 6, 0.3), '#d4f2ff', { lw: 1.2, line: '#2e4c7a', amp: 0.5, seed: i }); });
  particles(ctx, 26, 71, (i, a, b, c) => { const f = ((a + u * 0.8) % 1) * k; const x = lerp(990, 640, f), y = lerp(400, 330, f) + Math.cos(f * 9 + i) * 30 * (1 - f); blob(ctx, ell(x, y, 10 + c * 8, 5, 6, f * 6), i % 3 ? '#f48ab8' : '#9ad46a', { lw: 1.1, amp: 0.5, seed: i }); });
  const m = ease(seg(u, 1.8, 3.4));
  glow(ctx, 640, 330, 60 + 220 * m, '#ffffff', 0.8 * m);
  starBurst(ctx, 640, 330, 160 * m, '#e8fbff', m, u);
};
S.shatter = (ctx, u) => {
  skyGrad(ctx, '#7a8aa0', '#d8dde2');
  const sw = easeInOut(seg(u, 0, 0.7));
  function easeInOut(x) { return ease(x); }
  const wx = lerp(1700, -700, sw);
  blob(ctx, [[wx, 100], [wx + 300, 0], [wx + 1200, -100], [wx + 1400, 300], [wx + 1100, 420], [wx + 900, 330], [wx + 700, 460], [wx + 450, 360], [wx + 200, 500]], VIL.wing, { lw: 3, seed: 3, edge: 30 });
  const sm = easeOut(seg(u, 0.5, 2.4));
  particles(ctx, 14, 81, (i, a, b, c) => { const x = 640 + (a - 0.5) * 1300 * sm, y = 360 + (b - 0.5) * 700 * sm; cloud(ctx, x, y, 140 + 160 * c * sm, '#f2f0ec', 0.85 * sm, i); });
  particles(ctx, 18, 91, (i, a, b, c) => { const y = -40 + ((u - 0.6) * (200 + c * 300) + b * 200); if (u < 0.6) return; blob(ctx, [[a * W, y], [a * W + 10, y + 16], [a * W - 6, y + 22]], '#cdeefc', { lw: 1.2, line: '#2e4c7a', amp: 0.5, seed: i }); });
};
S.runGold = (ctx, u) => {
  radialBg(ctx, 900, 300, '#fff0b0', '#c47a1e', 900);
  rays(ctx, 900, 300, 16, 900, '#ffffff', u * 0.2, 0.3, 0.05, 23);
  const g = ctx.createLinearGradient(0, 560, 0, H); g.addColorStop(0, '#a8601e'); g.addColorStop(1, '#6a3a1a');
  ctx.fillStyle = g; ctx.fillRect(-100, 560, W + 200, 300);
  drawFigure(ctx, CH.lan, 560, 455, 28, Object.assign(POSE.run(u), { head: { turn: 0.6, brow: -0.6, wind: 0.8, wdir: -1, mouth: 0.25 } }), u, 5);
  speedLines(ctx, 14, 3, u, '#fff0c0', 0.35, -1, 100, 600);
  // 一排种子灯依次亮起（前景）
  for (let i = 0; i < 5; i++) {
    const on = ease(seg(u, 2.0 + i * 0.35, 2.3 + i * 0.35));
    ctx.save(); ctx.translate(180 + i * 230, 640); drawAmulet(ctx, 0, 0, 34, u, on); ctx.restore();
  }
};
S.beastBehind = (ctx, u) => {
  radialBg(ctx, 900, 300, '#2a4a7a', '#0e1424', 800);
  const ap = ease(seg(u, 0.3, 1.3)), dk = ease(seg(u, 2.4, 3.6));
  withAlpha(ctx, ap * (1 - dk * 0.85), c => drawBeastHead(c, 900, 330, 120, u, { eyes: 1 }, 9));
  drawHead(ctx, CH.lan, 380, 380, 160, { turn: 0.5, look: [0.6 - dk * 1.2, -0.1], wind: 0.4, wdir: -1, brow: dk * 0.8 - 0.2, mouth: dk * 0.5, blink: autoBlink(u, 3) }, u, 4);
  ctx.save(); const g = ctx.createLinearGradient(0, -200, 0, H); g.addColorStop(0, rgba('#0a0812', 0.95 * dk)); g.addColorStop(1, rgba('#0a0812', 0.5 * dk)); ctx.fillStyle = g; ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
};
S.shout = (ctx, u) => {
  if (u < 2.2) {
    ctx.fillStyle = '#1c1622'; ctx.fillRect(-W, -H, 3 * W, 3 * H);
    for (let i = 0; i < 5; i++) flame(ctx, 1000 + i * 70, H + 10, 70, 300, u, i + 20, ['#9a2a1e', '#d8442a', '#f08a2c']);
    focusLines(ctx, 560, 360, 50, 7, '#f4ecdc', 0.18);
    const [sx, sy] = shakeT(u, 3);
    drawHead(ctx, CH.lan, 560 + sx, 360 + sy, 175, { turn: 0.2, mouth: ease(seg(u, 0.2, 0.5)), brow: 0.9, wind: 0.9, wdir: -1, blink: 0.25 }, u, 4);
  } else {
    ctx.fillStyle = '#1c1622'; ctx.fillRect(-W, -H, 3 * W, 3 * H);
    const b = easeOut(seg(u, 2.4, 3.0));
    starBurst(ctx, 640, 360, 500 * pulse(u, 2.3, 3.6), '#fff4c8', 1, 0.3, 4);
    drawAmulet(ctx, 640, 360, 70, u, 1 - b, b);
    particles(ctx, 20, 51, (i, a, c2, c) => { const ang = a * Math.PI * 2, r = 400 * b * (0.3 + c); blob(ctx, ell(640 + Math.cos(ang) * r, 360 + Math.sin(ang) * r, 6, 4, 6, ang), '#ffa23a', { lw: 1, amp: 0.4, seed: i }); });
  }
};
S.bandage = (ctx, u) => {
  skyGrad(ctx, '#6f8f8c', '#b8c8c2');
  blob(ctx, [[-100, 520], [W + 100, 470], [W + 100, H + 100], [-100, H + 100]], '#7f9a86', { lw: 2.2, seed: 3, edge: 16 });
  particles(ctx, 20, 4, (i, a, b, c) => blob(ctx, ell(((a * W + u * 40 * (1 + c)) % (W + 100)) - 50, 200 + b * 400, 30 + c * 50, 10, 8), rgba('#e0e8e4', 0.35), { line: null, wash: false }));
  const cl = ease(seg(u, 0.8, 2.2)), [sx, sy] = shakeT(u, 1.5 + cl * 2);
  drawHand(ctx, 640 + sx, 460 + sy, 170, -1.45, 1 - cl * 0.9, CH.lan.skin, 1, true);
};
S.tears = (ctx, u) => {
  skyGrad(ctx, '#5a7480', '#a2b4b4');
  rain(ctx, u);
  drawHead(ctx, CH.lan, 640, 360, 200, { turn: -0.1, look: [0, 0.5], brow: 0.9, mouth: 0.12, blink: 0.35 + 0.65 * (autoBlink(u, 6) > 0.5 ? 1 : 0), tear: ease(seg(u, 0.6, 1.8)), wind: 0.15, wdir: -1, tilt: 0.05 }, u, 4);
  rain(ctx, u + 2, 30, 9);
};
S.memory = (ctx, u) => {
  skyGrad(ctx, '#5fa6e0', '#e6f2f6');
  cloud(ctx, 250 - u * 6, 500, 220, '#fbf7ef', 0.9, 31); cloud(ctx, 1000 - u * 4, 560, 240, '#fbf7ef', 0.9, 32);
  particles(ctx, 12, 33, (i, a, b, c) => { const y = ((b * H + u * 50 * (0.6 + c)) % (H + 60)) - 30, x = a * W + Math.sin(u * 1.5 + i) * 40; blob(ctx, [[x, y - 12], [x + 8, y], [x, y + 12], [x - 8, y]].map(q => [q[0], q[1]]), '#8cc464', { lw: 1.2, seed: i }); });
  withAlpha(ctx, 0.85 * ease(seg(u, 0.8, 2.2)), c => drawHead(c, CH.shuang, 350, 290 + 8 * Math.sin(u), 115, { turn: 0.25, smile: 0.8, blink: 0.95, wind: 0.4, wdir: 1, shoulders: true }, u, 9));
  withAlpha(ctx, 0.85 * ease(seg(u, 2.2, 3.6)), c => drawHead(c, CH.kui, 930, 270 + 8 * Math.sin(u + 1), 110, { turn: -0.25, smile: 0.9, blink: 0.95, blush: 0.8, wind: 0.4, wdir: -1 }, u, 8));
  withAlpha(ctx, ease(seg(u, 3.8, 5.0)), c => drawEmberSmall(c, 640, 560 - Math.abs(Math.sin(u * 3)) * 30, 50, u, { hop: u * 1.5, happy: true }, 3));
};
S.goldBolt = (ctx, u) => {
  radialBg(ctx, 640, 340, '#8a5a1e', '#1e1610', 800);
  const k = ease(seg(u, 0.3, 2.0));
  glow(ctx, 640, 320, 140 + 260 * k, '#ffcf4a', 0.6 * k);
  drawFigure(ctx, CH.lan, 640, 480, 34, Object.assign(POSE.raise(u), { head: { turn: 0.15, brow: -0.8, wind: 0.7 + 0.3 * k, wdir: -1, mouth: 0.4 * pulse(u, 2.4, 3.8) } }), u, 5);
  for (let i = 0; i < Math.floor(1 + k * 5); i++) { const a = hash(i + Math.floor(u * 6) * 13) * Math.PI * 2; bolt(ctx, 640 + Math.cos(a) * 60, 300 + Math.sin(a) * 140, 640 + Math.cos(a) * 520, 340 + Math.sin(a) * 360, i * 7 + Math.floor(u * 6), '#ffd23a', 3, 1); }
  bolt(ctx, 650, -20, 668, 130, 99 + Math.floor(u * 6), '#ffe27a', 5 * k, 2);
};
S.duskHill = (ctx, u) => {
  skyGrad(ctx, '#3a2a5a', '#f0a05a');
  const sb = ease(seg(u, 1.0, 2.6));
  glow(ctx, 900, 420, 500, '#ffcf6a', 0.4 + 0.4 * sb);
  starBurst(ctx, 900, 430, 120 + 380 * sb, '#fff2c4', 0.8 * sb, 0.2);
  hills(ctx, 500, 30, '#4a3050', 4);
  blob(ctx, [[-100, 720], [-50, 520], [300, 470], [620, 490], [900, 560], [1380, 720]], '#2e2238', { lw: 2.4, seed: 5, edge: 20 });
  drawFigure(ctx, CH.lan, 400, 425, 10, Object.assign(POSE.stand(u), { head: { turn: 0.6, wind: 0.7, wdir: -1 } }), u, 5);
  const e = easeOut(seg(u, 1.6, 2.6)), hop = Math.abs(Math.sin(u * 7)) * (1 - e);
  if (u > 1.6) drawEmberSmall(ctx, lerp(200, 460, e), 455 - hop * 30, 14, u, { hop: u * 2 }, 3);
};
S.rise = (ctx, u) => {
  skyGrad(ctx, '#3e86cc', '#cfe8f4');
  cloud(ctx, 640, 600, 320, '#fbf7ef', 0.9, 41);
  const a = easeOut(seg(u, 0.2, 1.3)), b = easeOut(seg(u, 0.7, 1.8));
  drawHead(ctx, CH.shuang, 410, lerp(760, 300, a), 135, { turn: 0.3, brow: -0.5, wind: 0.5, wdir: 1, look: [0.3, 0], blink: autoBlink(u, 9) }, u, 9);
  drawHead(ctx, CH.kui, 870, lerp(780, 320, b), 128, { turn: -0.3, brow: -0.5, smile: 0.2, wind: 0.5, wdir: -1, look: [-0.3, 0], blink: autoBlink(u, 8) }, u, 8);
};
S.kuiEye = (ctx, u) => {
  radialBg(ctx, 640, 360, '#a8e48a', '#1e5a3a', 800);
  petals(ctx, 640, 360, 30, 700, u, 13, ['#9ad46a', '#c8f0a0', '#5aa84a']);
  drawHead(ctx, CH.kui, 900, 330, 780, { turn: 0.1, look: [lerp(0.4, -0.1, ease(seg(u, 0.5, 1.2))), 0], blink: 1 - ease(seg(u, 0.1, 0.5)), wind: 0.5, wdir: -1, shoulders: false, brow: -0.4 }, u, 8);
  glow(ctx, 620, 400, 120 * ease(seg(u, 1.2, 2.2)), '#c8ffb0', 0.6);
};
S.lanBolt = (ctx, u) => {
  radialBg(ctx, 700, 360, '#2a5a9a', '#0e1830', 800);
  stars(ctx, 40, 3, u, '#cfe0ff');
  const r = drawFigure(ctx, CH.lan, 380, 480, 34, Object.assign(POSE.point(u), { head: { turn: 0.6, brow: -0.9, mouth: 0.5 * pulse(u, 0.6, 1.8), wind: 0.8, wdir: -1 } }), u, 5);
  const k = seg(u, 0.7, 1.0);
  if (k > 0) {
    bolt(ctx, r.hand[0], r.hand[1], lerp(r.hand[0], 1400, k), 300 + 30 * Math.sin(u * 9), Math.floor(u * 8), '#9ad8ff', 6, 3);
    glow(ctx, r.hand[0], r.hand[1], 140, '#cfeeff', 0.7);
  }
};
S.roar = (ctx, u) => {
  radialBg(ctx, 640, 360, '#ffb04a', '#9a2a1e', 800);
  const r = ease(seg(u, 0.4, 0.8)), [sx, sy] = u > 0.6 ? shakeT(u, 6) : [0, 0];
  if (u > 0.6) focusLines(ctx, 640, 380, 50, 9, '#5a1a14', 0.3);
  drawBeastHead(ctx, 640 + sx, 400 + sy, 125 + 10 * r, u, { roar: r, eyes: 1 }, 9);
  embers(ctx, 30, 19, u, '#ffe08a', 300);
};
S.wasteland = (ctx, u) => {
  skyGrad(ctx, '#6a5a4a', '#c8a882');
  [[200, 460, 60, 200], [380, 470, 40, 140], [1000, 465, 70, 230], [1160, 470, 45, 150]].forEach(([x, y, w, h], i) => blob(ctx, [[x - w, y], [x - w * 0.4, y - h], [x + w * 0.2, y - h * 1.05], [x + w, y]], '#8a6a52', { lw: 2.2, seed: 50 + i, edge: 12 }));
  const g = ctx.createLinearGradient(0, 460, 0, H); g.addColorStop(0, '#a88462'); g.addColorStop(1, '#7a5a42');
  ctx.fillStyle = g; ctx.fillRect(-100, 465, W + 200, 300);
  drawVillain(ctx, 680, 230 + 10 * Math.sin(u * 2), 42, u, { open: 1, eyes: 1 }, 21);
  drawFigure(ctx, CH.lan, 300, 600, 14, Object.assign(POSE.stand(u), { head: { turn: 0.5, wind: 0.6, wdir: -1 } }), u, 5);
  ctx.save(); ctx.translate(180, 610); drawEmberSmall(ctx, 0, 0, 22, u, {}, 3); ctx.restore();
  particles(ctx, 8, 7, (i, a, b, c) => blob(ctx, ell(((a * W + u * 60) % (W + 300)) - 150, 520 + b * 180, 120, 26, 10), rgba('#d8bc96', 0.35), { line: null, wash: false }));
};
S.villainHit = (ctx, u) => {
  radialBg(ctx, 640, 360, '#5a3a7a', '#1a1028', 800);
  const hit = seg(u, 0.5, 0.8), sh = easeIn(seg(u, 1.2, 3.2));
  if (hit > 0 && u < 2.6) { bolt(ctx, -40, 420, 600, 380, Math.floor(u * 8), '#ffcf4a', 12, 3); glow(ctx, 640, 360, 300, '#ffe08a', 0.6); }
  if (sh < 0.98) drawVillain(ctx, 640, 380, 120 * (1 - sh), u, { open: 1 - sh * 0.5, eyes: 1 - sh }, 21);
  if (hit > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#ffe08a', 0.9 * (1 - sh)); ctx.lineWidth = 4; for (let i = 0; i < 7; i++) { const a = hash(i) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(640, 360); ctx.lineTo(640 + Math.cos(a) * 260 * hit, 360 + Math.sin(a) * 260 * hit); ctx.stroke(); } ctx.restore(); }
  particles(ctx, 50, 61, (i, a, b, c) => { if (sh <= 0) return; const ang = a * Math.PI * 2, r = 500 * sh * (0.2 + c); glow(ctx, 640 + Math.cos(ang) * r, 360 + Math.sin(ang) * r - sh * 100 * b, 10, '#b88aff', 0.8 * (1 - sh * 0.6)); });
};
S.flyRide = (ctx, u) => {
  skyGrad(ctx, '#2f76c8', '#cfe8f6');
  particles(ctx, 7, 71, (i, a, b, c) => cloud(ctx, ((a * (W + 600) - u * (300 + c * 500)) % (W + 600) + W + 600) % (W + 600) - 300, 80 + b * 560, 120 + c * 150, '#fbf7ef', 0.85, i));
  const y = 380 + 25 * Math.sin(u * 1.6);
  drawBeastRun(ctx, 600, y, 55, u * 0.6, 12);
  drawFigure(ctx, CH.lan, 640, y - 75, 18, { lean: 0.35, aL: [1.6, -0.2], aR: [-0.6, -0.3], lL: [1.4, -1.3], lR: [1.2, -1.2], head: { turn: 0.6, smile: 0.7, wind: 0.9, wdir: -1 } }, u, 5);
  speedLines(ctx, 20, 8, u, '#ffffff', 0.4, -1, 0, H);
};
S.smile = (ctx, u) => {
  skyGrad(ctx, '#3a86d6', '#d6eef8');
  cloud(ctx, 300 - u * 20, 600, 260, '#fbf7ef', 0.9, 51);
  const s = ease(seg(u, 0.4, 1.2));
  drawHead(ctx, CH.lan, 660, 360, 190, { turn: 0.65, look: [0.6, -0.1], smile: 0.9 * s, mouth: 0.25 * s, wind: 0.6, wdir: -1, blink: autoBlink(u, 5) }, u, 4);
};
S.beastEyes = (ctx, u) => {
  radialBg(ctx, 640, 380, '#ffd27a', '#b8501e', 800);
  drawBeastHead(ctx, 640, 380 + 4 * Math.sin(u * 2), 185, u, { eyes: ease(seg(u, 0.6, 1.4)), glow: 1 }, 9);
  embers(ctx, 24, 23, u, '#fff0a0', 140);
};
S.eyesClosed = (ctx, u) => {
  radialBg(ctx, 640, 300, '#ffb05a', '#7a2a1e', 800);
  embers(ctx, 30, 29, u, '#ffd27a', 120);
  drawHead(ctx, CH.lan, 640, 360, 200, { turn: 0, blink: 1 - ease(seg(u, 1.1, 1.5)), brow: -0.5, wind: 0.75, wdir: -1, look: [0, 0] }, u, 4);
};
S.reach = (ctx, u) => {
  radialBg(ctx, 640, 340, '#a8401e', '#2a1414', 800);
  const k = easeOut(seg(u, 0, 1.0)), b = easeIn(seg(u, 1.2, 2.6));
  glow(ctx, 600, 320, 120 + 300 * k, '#ffd25a', 0.7);
  drawHand(ctx, lerp(1100, 760, k), lerp(820, 520, k), 160, -0.7, 1, CH.lan.skin, 1);
  starBurst(ctx, 600, 320, 80 + 1200 * b, '#fff4c8', 0.6 + 0.4 * b, b * 0.5, 4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#fff6dc', b); ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
};
S.dandelions = (ctx, u) => {
  skyGrad(ctx, '#2e7ccc', '#d4ecf8');
  cloud(ctx, 1000, 560, 260, '#fbf7ef', 0.9, 61);
  const rel = ease(seg(u, 1.4, 3.6));
  [[340, 420, 90, 0], [640, 300, 110, 1], [930, 460, 80, 2]].forEach(([x, y, r, i]) => drawDandelion(ctx, x + Math.sin(u * 1.5 + i) * 8, y, r, u, rel * (0.6 + 0.4 * hash(i)), 70 + i * 40));
  particles(ctx, 40, 81, (i, a, b, c) => { const st = 1.4 + a * 2; if (u < st) return; const f = u - st; const sx = [340, 640, 930][i % 3], sy = [420, 300, 460][i % 3]; drawSeed(ctx, sx + f * (120 + c * 160), sy - f * (60 + b * 120) + Math.sin(f * 2 + i) * 20, 12 + c * 8, 0.4 + Math.sin(f + i) * 0.3, 0.95); });
};
S.seeds = (ctx, u) => {
  skyGrad(ctx, '#3a8ad6', '#e2f2f8');
  cloud(ctx, 300 - u * 10, 580, 260, '#fbf7ef', 0.85, 71);
  particles(ctx, 60, 91, (i, a, b, c) => { const x = ((a * (W + 200) + u * (40 + c * 60)) % (W + 200)) - 100, y = ((b * (H + 200) - u * (30 + c * 50)) % (H + 200) + H + 200) % (H + 200) - 100; drawSeed(ctx, x, y + Math.sin(u + i) * 12, 8 + c * 14, 0.3 + Math.sin(u * 0.8 + i) * 0.4, 0.5 + 0.5 * c); });
  const k = ease(seg(u, 0.5, 2.0));
  glow(ctx, 640, 340 - u * 12, 100, '#ffb43a', 0.6 * k);
  drawSeed(ctx, 640 + Math.sin(u) * 20, 320 - u * 12, 34, 0.2 + Math.sin(u * 0.7) * 0.2, 1);
};
S.profileWind = (ctx, u) => {
  skyGrad(ctx, '#3384d4', '#d8eef8');
  cloud(ctx, 260, 560, 280, '#fbf7ef', 0.9, 81);
  drawHead(ctx, CH.lan, 720, 370, 200, { turn: 0.75, look: [0.7, -0.4], smile: 0.4, wind: 0.85, wdir: -1, blink: autoBlink(u, 7) }, u, 4);
  particles(ctx, 16, 101, (i, a, b, c) => { const x = W - ((a * (W + 200) + u * (120 + c * 120)) % (W + 200)) + 100, y = b * H; drawSeed(ctx, x, y + Math.sin(u + i) * 10, 9 + c * 10, -0.6, 0.85); });
};
S.finale = (ctx, u) => {
  skyGrad(ctx, '#5b9ed8', '#f2e2c8');
  cloud(ctx, 640, 180, 200, '#fbf7ef', 0.8, 91);
  blob(ctx, [[480, 720], [560, 560], [800, 520], [1290, 500], [1290, 720]], '#b89a74', { lw: 2.5, seed: 4, edge: 18 });
  blob(ctx, [[560, 565], [800, 515], [1290, 495], [1290, 530], [800, 545], [600, 590]], '#6fa04e', { lw: 2.2, seed: 5, edge: 10 });
  drawBeastHead(ctx, 330, 300 + 6 * Math.sin(u * 1.5), 105, u, { eyes: 1, glow: 0.6 }, 9);
  const k = easeOut(seg(u, 0.2, 1.4));
  const px = lerp(520, 690, k), py = lerp(500, 400, k);
  limb(ctx, [[330, 620], [lerp(420, 520, k), lerp(560, 500, k)], [px - 30, py + 8]], 48, EMB.body, 3);
  drawPaw(ctx, px, py, 34, -1.35);
  drawFigure(ctx, CH.lan, 800, 470, 22, { lean: -0.05, aL: [lerp(0.4, 2.0, k), -0.1], aR: [-0.2, -0.3], lL: [0.15, 0], lR: [-0.15, 0], head: { turn: 0.6, smile: 0.8, wind: 0.6, wdir: 1 } }, u, 5, -1);
  glow(ctx, 680, 420, 80 * k, '#ffd25a', 0.6 * k);
  particles(ctx, 12, 111, (i, a, b, c) => drawSeed(ctx, ((a * W + u * 40) % W), b * 400, 8 + c * 8, 0.3, 0.7));
};

// 镜头表：[开始时间, 入场转场, 镜头函数, 推镜幅度]
const SHOTS = [
  [0.0, 'cut', S.cliffOpen, 0.04], [4.0, 'wipe', S.plains, 0.05], [6.0, 'iris', S.amulet, 0.08], [9.0, 'flash', S.awaken, 0.06],
  [12.0, 'whip', S.eye, 0.05], [14.7, 'push', S.transform, 0.08], [17.3, 'cut', S.grip, 0.05], [20.0, 'wipe', S.charge, 0.02],
  [24.3, 'whip', S.shuangWake, 0.05], [26.4, 'dark', S.redEyes, 0.06], [30.4, 'flash', S.wings, 0.05], [33.1, 'whip', S.iceSwirl, 0.06],
  [37.1, 'wipe', S.lanFire, 0.05], [40.4, 'flash', S.explosion, 0.04], [43.1, 'iris', S.kuiLeaf, 0.05], [46.6, 'whip', S.kuiSpin, 0.05],
  [49.6, 'dark', S.dive, 0.03], [52.7, 'push', S.villainFace, 0.06], [55.9, 'flash', S.combo, 0.04], [60.5, 'cut', S.shatter, 0.04],
  [64.0, 'wipe', S.runGold, 0.03], [68.6, 'whip', S.beastBehind, 0.05], [72.6, 'cut', S.shout, 0.05], [76.4, 'flash', S.bandage, 0.05],
  [80.0, 'fade', S.tears, 0.06], [84.7, 'fade', S.memory, 0.04], [91.2, 'flash', S.goldBolt, 0.06], [96.1, 'wipe', S.duskHill, 0.05],
  [99.9, 'whip', S.rise, 0.04], [103.9, 'push', S.kuiEye, 0.06], [106.6, 'flash', S.lanBolt, 0.04], [110.2, 'cut', S.roar, 0.06],
  [113.3, 'wipe', S.wasteland, 0.04], [117.0, 'push', S.villainHit, 0.05], [120.5, 'flash', S.flyRide, 0.03], [126.0, 'whip', S.smile, 0.05],
  [128.6, 'push', S.beastEyes, 0.06], [132.3, 'fade', S.eyesClosed, 0.05], [134.4, 'cut', S.reach, 0.05], [137.0, 'flash', S.dandelions, 0.05],
  [141.0, 'fade', S.seeds, 0.04], [145.6, 'wipe', S.profileWind, 0.05], [149.6, 'fade', S.finale, 0.03],
];
const TDUR = { cut: 0, fade: 0.6, wipe: 0.5, iris: 0.55, flash: 0.45, whip: 0.35, push: 0.5, dark: 0.8 };

function drawShot(ctx, i, T) {
  const [s, , fn, push] = SHOTS[i];
  const e = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : END;
  const u = T - s, d = e - s;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const z = 1 + push * ease(u / d) + 0.01;
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  fn(ctx, u, d);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function brushEdge(p, y) { return p * (W + 400) - 200 + Math.sin(y * 0.03 + 1) * 40 + (hash(Math.floor(y / 18)) - 0.5) * 50; }

function renderTime(T, type) {
  BOIL = Math.floor(T * 10);
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= T) i++;
  const tr = SHOTS[i][1], td = TDUR[tr], p = td ? (T - SHOTS[i][0]) / td : 1;
  const ctx = CX;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (i === 0 || p >= 1) {
    drawShot(ctx, i, T);
  } else {
    const A = BUF[0].getContext('2d'), B = BUF[1].getContext('2d');
    drawShot(A, i - 1, T); drawShot(B, i, T);
    const q = ease(p);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (tr === 'fade') { ctx.drawImage(BUF[0], 0, 0); ctx.globalAlpha = q; ctx.drawImage(BUF[1], 0, 0); }
    else if (tr === 'flash') {
      ctx.drawImage(p < 0.5 ? BUF[0] : BUF[1], 0, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#fff4dc', 1 - Math.abs(p - 0.5) * 2); ctx.fillRect(0, 0, W, H);
    } else if (tr === 'dark') {
      ctx.drawImage(p < 0.5 ? BUF[0] : BUF[1], 0, 0);
      ctx.fillStyle = rgba('#1a1420', 1 - Math.abs(p - 0.5) * 2); ctx.fillRect(0, 0, W, H);
    } else if (tr === 'wipe') {
      ctx.drawImage(BUF[0], 0, 0);
      ctx.save(); ctx.beginPath(); ctx.moveTo(-10, -10);
      for (let y = 0; y <= H + 18; y += 18) ctx.lineTo(brushEdge(q, y), y);
      ctx.lineTo(-10, H + 20); ctx.closePath(); ctx.clip(); ctx.drawImage(BUF[1], 0, 0); ctx.restore();
      ctx.save(); ctx.strokeStyle = rgba('#2a2230', 0.55); ctx.lineWidth = 7; ctx.beginPath();
      for (let y = 0; y <= H + 18; y += 18) { const x = brushEdge(q, y); y ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    } else if (tr === 'iris') {
      ctx.drawImage(BUF[0], 0, 0);
      ctx.save(); trace(ctx, ell(W / 2, H / 2, q * 800, q * 800, 24), true); ctx.clip(); ctx.drawImage(BUF[1], 0, 0); ctx.restore();
      ctx.save(); trace(ctx, wob(ell(W / 2, H / 2, q * 800, q * 800, 24), 4, 3), true); ctx.strokeStyle = rgba('#2a2230', 0.6); ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    } else if (tr === 'whip') {
      const src = p < 0.5 ? BUF[0] : BUF[1], off = p < 0.5 ? -easeIn(p * 2) * W * 0.7 : easeOut((1 - p) * 2) * W * 0.7 * 0 + (1 - easeOut((p - 0.5) * 2)) * W * 0.7;
      for (let k = 0; k < 6; k++) { ctx.globalAlpha = k ? 0.22 : 1; ctx.drawImage(src, off + (k * (p < 0.5 ? 40 : -40)), 0); }
    } else if (tr === 'push') {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + q * 1.5, 1 + q * 1.5); ctx.translate(-W / 2, -H / 2); ctx.drawImage(BUF[0], 0, 0); ctx.restore();
      ctx.globalAlpha = q; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(0.85 + 0.15 * q, 0.85 + 0.15 * q); ctx.translate(-W / 2, -H / 2); ctx.drawImage(BUF[1], 0, 0); ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  paperOverlay(ctx);
  // 片头纸面淡入、片尾淡出到纸面
  const fin = 1 - seg(T, 0, 0.8), fout = seg(T, END - 1.2, END - 0.1);
  if (fin + fout > 0) { ctx.globalAlpha = Math.max(fin, fout); ctx.drawImage(PAPER_TEX, 0, 0); ctx.globalAlpha = 1; }
  return CV.toDataURL(type, 0.92);
}
