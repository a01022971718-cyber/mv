// 手绘水彩图元：纯时间函数，所有随机都来自 hash()
const W = 1280, H = 720, FPS = 25;
const INK = '#2a2230', PAPER = '#f4ecdc';
let BOIL = 0; // 每帧设为 floor(t*10)，线条每秒“沸腾”10次

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function h2(a, b) { return hash(a * 57.13 + b * 13.71); }
function jit(i, amp) { return (h2(i, BOIL) - 0.5) * 2 * amp; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
const easeIn = u => Math.pow(clamp(u), 3);
const backOut = u => { u = clamp(u); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const pulse = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function shade(hex, k) { // k<0 变暗，k>0 变亮
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = c => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return '#' + [f(r), f(g), f(b)].map(c => clamp(c, 0, 255).toString(16).padStart(2, '0')).join('');
}

// ---------- 路径 ----------
function wob(pts, amp, seed) {
  return pts.map((p, i) => [p[0] + jit(seed + i * 2.13, amp), p[1] + jit(seed + i * 2.13 + 0.7, amp)]);
}
function trace(ctx, pts, closed) {
  const n = pts.length;
  if (n < 2) return;
  ctx.beginPath();
  if (closed) {
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let s = m(pts[n - 1], pts[0]);
    ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const q = m(pts[i], pts[(i + 1) % n]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const q = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}
function ell(cx, cy, rx, ry, n = 16, rot = 0) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return p;
}
function xf(pts, x, y, s, rot = 0, sx = 1) {
  const c = Math.cos(rot), si = Math.sin(rot);
  return pts.map(p => { const px = p[0] * s * sx, py = p[1] * s; return [x + px * c - py * si, y + px * si + py * c]; });
}

// 水彩块：底色 + 边缘积色 + 抖动墨线
function blob(ctx, pts, fill, o = {}) {
  const amp = o.amp ?? 1.4, seed = o.seed ?? 0, lw = o.lw ?? 2.6;
  const p1 = wob(pts, amp * 0.6, seed + 11);
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (fill) {
    trace(ctx, p1, true);
    ctx.fillStyle = fill; ctx.fill();
    if (o.wash !== false) {
      ctx.save(); ctx.clip();
      ctx.strokeStyle = shade(typeof fill === 'string' ? fill : '#888888', -0.25);
      ctx.globalAlpha *= 0.28; ctx.lineWidth = (o.edge ?? 9);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (o.line !== null && lw > 0) {
    trace(ctx, wob(pts, amp, seed + 37), true);
    ctx.strokeStyle = o.line ?? INK; ctx.lineWidth = lw; ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}
function inkLine(ctx, pts, lw = 2.5, col = INK, seed = 0, amp = 1.2) {
  trace(ctx, wob(pts, amp, seed), false);
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke();
}
// 两层描边的肢体（墨边 + 颜色）
function limb(ctx, pts, w, col, seed = 0) {
  const p = wob(pts, 0.8, seed);
  trace(ctx, p, false);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + 5; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}

// ---------- 发光与效果（叠加） ----------
function glow(ctx, x, y, r, col, a = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.4, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function rays(ctx, x, y, n, len, col, rot, a = 0.5, width = 0.08, seed = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const ang = rot + i / n * Math.PI * 2 + hash(seed + i) * 0.3;
    const L = len * (0.6 + 0.6 * hash(seed + i * 3.1));
    const w = width * (0.5 + hash(seed + i * 7.7));
    const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang - w) * L, y + Math.sin(ang - w) * L);
    ctx.lineTo(x + Math.cos(ang + w) * L, y + Math.sin(ang + w) * L);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function starBurst(ctx, x, y, r, col, a = 1, rot = 0, k = 4) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(col, a);
  ctx.beginPath();
  for (let i = 0; i < k * 2; i++) {
    const ang = rot + i / (k * 2) * Math.PI * 2, rr = i % 2 ? r * 0.12 : r;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  glow(ctx, x, y, r * 0.6, col, a * 0.8);
}
function bolt(ctx, x1, y1, x2, y2, seed, col, w = 4, branches = 2) {
  const pts = [[x1, y1]], n = 10;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++) {
    const u = i / n, off = (h2(seed + i, BOIL * 3) - 0.5) * L * 0.18;
    pts.push([x1 + dx * u + nx * off, y1 + dy * u + ny * off]);
  }
  pts.push([x2, y2]);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
  for (const [lw, a] of [[w * 5, 0.15], [w * 2.2, 0.35], [w, 1]]) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.strokeStyle = lw === w ? rgba('#fffbe8', a) : rgba(col, a); ctx.lineWidth = lw; ctx.stroke();
  }
  ctx.restore();
  for (let b = 0; b < branches; b++) {
    const k = 2 + Math.floor(h2(seed + b, 5) * 6), p = pts[k];
    const ang = Math.atan2(dy, dx) + (h2(seed + b, 9) - 0.5) * 1.8;
    bolt(ctx, p[0], p[1], p[0] + Math.cos(ang) * L * 0.3, p[1] + Math.sin(ang) * L * 0.3, seed + 50 + b, col, w * 0.5, 0);
  }
}
// 火舌：在 (x,y) 底部向上
function flame(ctx, x, y, w, h, t, seed, cols = ['#d8442a', '#f08a2c', '#ffd25a'], ang = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  cols.forEach((c, k) => {
    const s = 1 - k * 0.28;
    const fl = Math.sin(t * 11 + seed * 3 + k) * 0.12 + Math.sin(t * 17 + seed) * 0.08;
    const tipx = Math.sin(t * 7 + seed * 2) * w * 0.35;
    const pts = [[-w * s, 0], [-w * s * 0.8, -h * s * 0.35], [-w * s * 0.3, -h * s * 0.7], [tipx, -h * s * (1 + fl)], [w * s * 0.35, -h * s * 0.6], [w * s * 0.85, -h * s * 0.3], [w * s, 0], [0, h * 0.12 * s]];
    trace(ctx, pts, true); ctx.fillStyle = c; ctx.fill();
  });
  ctx.restore();
}
function particles(ctx, n, seed, fn) { for (let i = 0; i < n; i++) fn(i, hash(seed + i * 1.37), hash(seed + i * 2.71), hash(seed + i * 4.13)); }

// 云：几个椭圆合成的柔和块
function cloud(ctx, x, y, s, col = '#fbf7ef', a = 0.9, seed = 0) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const cx = x + (i - n / 2) * s * 0.42 + (hash(seed + i) - 0.5) * s * 0.2;
    const cy = y - Math.sin(i / (n - 1) * Math.PI) * s * 0.3 + (hash(seed + i * 3) - 0.5) * s * 0.1;
    const r = s * (0.3 + hash(seed + i * 5) * 0.2);
    trace(ctx, wob(ell(cx, cy, r, r * 0.8, 12), 1.2, seed + i * 9), true); ctx.fill();
  }
  ctx.globalAlpha = a * 0.25; ctx.fillStyle = '#9fb3cc';
  trace(ctx, wob(ell(x, y + s * 0.12, s * 1.2, s * 0.12, 14), 1, seed + 77), true); ctx.fill();
  ctx.restore();
}
function skyGrad(ctx, top, bot) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
}
function radialBg(ctx, x, y, inner, outer, r = 900) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
}
// 速度线
function speedLines(ctx, n, seed, t, col, a = 0.5, dir = 1, y0 = 0, y1 = H) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(col, a); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = y0 + hash(seed + i) * (y1 - y0), L = 80 + hash(seed + i * 3) * 260, sp = 1800 + hash(seed + i * 5) * 1600;
    let x = ((hash(seed + i * 7) * (W + 600) + t * sp) % (W + 600)) - 300;
    if (dir < 0) x = W - x;
    ctx.lineWidth = 1 + hash(seed + i * 9) * 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * dir, y); ctx.stroke();
  }
  ctx.restore();
}
// 集中线（朝中心）
function focusLines(ctx, x, y, n, seed, col = INK, a = 0.35) {
  ctx.save(); ctx.fillStyle = rgba(col, a);
  for (let i = 0; i < n; i++) {
    const ang = hash(seed + i + BOIL * 0.37) * Math.PI * 2, r0 = 380 + hash(seed + i * 3 + BOIL) * 220, w = 0.012 + hash(seed + i * 5) * 0.02;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0);
    ctx.lineTo(x + Math.cos(ang - w) * 1600, y + Math.sin(ang - w) * 1600);
    ctx.lineTo(x + Math.cos(ang + w) * 1600, y + Math.sin(ang + w) * 1600);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- 纸面 ----------
let PAPER_TEX = null;
function makePaper() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const img = x.createImageData(W, H), d = img.data;
  // 低频斑驳（水彩晕染）+ 高频纸纹
  const cell = 90, gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2, grid = [];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) grid.push(hash(i * 31.7 + j * 91.3));
  const sm = u => u * u * (3 - 2 * u);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const gx = px / cell, gy = py / cell, i = Math.floor(gx), j = Math.floor(gy), fx = sm(gx - i), fy = sm(gy - j);
    const a = grid[j * gw + i], b = grid[j * gw + i + 1], c2 = grid[(j + 1) * gw + i], e = grid[(j + 1) * gw + i + 1];
    const low = lerp(lerp(a, b, fx), lerp(c2, e, fx), fy);
    const hi = hash(px * 0.913 + py * 7.31);
    const v = 236 + low * 16 + hi * 6;
    const k = (py * W + px) * 4;
    d[k] = v; d[k + 1] = v * 0.975; d[k + 2] = v * 0.93; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
function paperOverlay(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55;
  ctx.drawImage(PAPER_TEX, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(42,34,48,0)'); g.addColorStop(1, 'rgba(42,34,48,0.32)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
