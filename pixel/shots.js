// 像素版 43 镜头：在 320×180 逻辑画布上画，最后最近邻放大 4 倍
const LW = 320, LH = 180, END = 152.36;
let OUT, OG, L, LG, BA, BB, TMP;
function init() {
  OUT = document.getElementById('c'); OG = OUT.getContext('2d'); OG.imageSmoothingEnabled = false;
  [L, LG] = mk(LW, LH); BA = mk(LW, LH); BB = mk(LW, LH); TMP = mk(LW, LH);
}
const fl = Math.floor;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
const easeIn = u => Math.pow(clamp(u), 3);
const step8 = u => fl(u * 8); // 8 帧/秒的动画帧号

// ---------- 画面小工具 ----------
function spr(g, c, x, y, s = 1, flip = false) {
  g.imageSmoothingEnabled = false;
  x = Math.round(x); y = Math.round(y);
  if (!flip) g.drawImage(c, x, y, c.width * s, c.height * s);
  else { g.save(); g.translate(x + c.width * s, y); g.scale(-1, 1); g.drawImage(c, 0, 0, c.width * s, c.height * s); g.restore(); }
}
function sprC(g, c, cx, cy, s = 1, flip = false) { spr(g, c, cx - c.width * s / 2, cy - c.height * s / 2, s, flip); }
function radial(g, cx, cy, cols, R0) {
  const n = cols.length - 1;
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const f = Math.min(0.999, Math.hypot(x - cx, (y - cy) * 1.2) / R0) * n, k = fl(f);
    P(g, x, y, dpick(x, y, f - k, cols[k], cols[Math.min(n, k + 1)]));
  }
}
function sky(g, cols) { bands(g, 0, 0, LW, LH, cols); }
// 抖动光晕
function pxGlow(g, cx, cy, r, col, a = 1) {
  g.fillStyle = col;
  for (let y = fl(cy - r); y <= cy + r; y++) for (let x = fl(cx - r); x <= cx + r; x++) {
    if (x < 0 || y < 0 || x >= LW || y >= LH) continue;
    const t = (1 - Math.hypot(x - cx, y - cy) / r) * a;
    if (t > 0 && t * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5) g.fillRect(x, y, 1, 1);
  }
}
// 全屏抖动覆盖
function ditherFill(g, col, a) {
  if (a <= 0) return;
  g.fillStyle = col;
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if (a * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5) g.fillRect(x, y, 1, 1);
}
// 抖动透明贴图（保持纯色像素）
function ditherSpr(g, c, x, y, s, a, flip = false) {
  if (a <= 0) return;
  if (a >= 1) return spr(g, c, x, y, s, flip);
  const [tc, tg] = TMP; tg.clearRect(0, 0, LW, LH); spr(tg, c, x, y, s, flip);
  const src = tg.getImageData(0, 0, LW, LH), dst = g.getImageData(0, 0, LW, LH);
  for (let i = 0; i < LW * LH; i++) {
    if (src.data[i * 4 + 3] === 0) continue;
    const px = i % LW, py = fl(i / LW);
    if (a * 16 > BAYER[(py & 3) * 4 + (px & 3)] + 0.5) for (let k = 0; k < 4; k++) dst.data[i * 4 + k] = src.data[i * 4 + k];
  }
  g.putImageData(dst, 0, 0);
}
function pxRays(g, cx, cy, n, len, col, rot, seed = 0) {
  for (let i = 0; i < n; i++) {
    const a = rot + i / n * Math.PI * 2 + hash(seed + i) * 0.2, L0 = len * (0.5 + 0.5 * hash(seed + i * 3));
    line(g, cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, cx + Math.cos(a) * L0, cy + Math.sin(a) * L0, col, 1);
  }
}
function pxBolt(g, x1, y1, x2, y2, seed, col = PAL.fl3, w = 3) {
  const pts = [[x1, y1]], n = 9, dx = x2 - x1, dy = y2 - y1, Ln = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < n; i++) { const o = (hash(seed + i * 7.3) - 0.5) * Ln * 0.2; pts.push([x1 + dx * i / n - dy / Ln * o, y1 + dy * i / n + dx / Ln * o]); }
  pts.push([x2, y2]);
  polyline(g, pts, col, w); polyline(g, pts, PAL.hi, 1);
}
function sparks(g, n, seed, u, col, speed = 40, dir = -1) {
  for (let i = 0; i < n; i++) {
    const x = hash(seed + i) * LW + Math.sin(u * 2 + i) * 4;
    let y = (hash(seed + i * 3) * (LH + 20) + dir * u * speed * (0.6 + hash(seed + i * 5))) % (LH + 20);
    if (y < 0) y += LH + 20;
    P(g, x, y - 10, col); if (hash(seed + i * 9) > 0.6) P(g, x, y - 9, col);
  }
}
function speed(g, n, seed, u, col, dir = 1) {
  for (let i = 0; i < n; i++) {
    const y = fl(hash(seed + i) * LH), Lx = 8 + fl(hash(seed + i * 3) * 30);
    let x = (hash(seed + i * 7) * (LW + 60) + u * 500 * (0.6 + hash(seed + i * 5))) % (LW + 60) - 30;
    if (dir < 0) x = LW - x;
    R(g, x, y, Lx, 1, col);
  }
}
function shake(u, a) { return [fl((hash(fl(u * 25)) - 0.5) * 2 * a), fl((hash(fl(u * 25) + 0.37) - 0.5) * 2 * a)]; }
function scroll(g, c, off, y = 0) { const o = ((fl(off) % c.width) + c.width) % c.width; g.drawImage(c, -o, y); g.drawImage(c, c.width - o, y); }

// ---------- 镜头 ----------
const S = {};
S.cliffOpen = (g, u) => {
  spr(g, scene('cliff'), 0, 0);
  const x = fl(lerp(40, 64, ease(seg(u, 1.4, 2.6))));
  spr(g, face('lan', u > 2.8 ? 'surprise' : 'normal'), x, 180 - 128 + (step8(u) % 8 < 4 ? 0 : 1), 2);
  for (let i = 0; i < 8; i++) { const gx = LW - ((hash(i) * LW + u * (60 + hash(i * 3) * 60)) % (LW + 20)), gy = 20 + hash(i * 5) * 100 + Math.sin(u * 3 + i) * 4; R(g, gx, gy, 2, 1, PAL.leaf); }
};
S.plains = (g, u) => {
  spr(g, scene('plains'), 0, 0);
  const k = easeOut(seg(u, 0, 2)), sc = k < 0.35 ? 1 : k < 0.75 ? 2 : 3;
  const hop = Math.abs(Math.sin(u * 2.6 * Math.PI));
  const x = lerp(200, 150, k), y = lerp(112, 150, k);
  R(g, x - 6 * sc, y + 8 * sc, 18 * sc, 2, '#a88a48');
  sprC(g, ember(hop < 0.3 ? 1 : 0), x, y - hop * 8 * sc, sc, true);
};
S.amulet = (g, u) => {
  radial(g, 160, 90, ['#8a5a2a', '#5a3a2a', '#2a1f2e'], 200);
  const lit = ease(seg(u, 0.7, 1.7)), op = easeOut(seg(u, 0.1, 0.9));
  if (lit > 0) { pxGlow(g, 160, 84, 70 * lit, PAL.amber2, 0.8); pxRays(g, 160, 84, 16, 170 * lit, PAL.embL, u * 0.3, 3); }
  sparks(g, 16, 7, u, PAL.embL, 20);
  spr(g, hand(0), 160 - 62 - fl(op * 26), 112, 2, false);
  spr(g, hand(0), 160 - 22 + fl(op * 26), 112, 2, true);
  sprC(g, amulet(lit > 0.3 ? 0 : 1), 160, 86 - fl(op * 6) + (step8(u) % 8 < 4 ? 0 : 1), 3);
};
S.awaken = (g, u) => {
  radial(g, 160, 90, ['#fff0b0', '#ffd25a', '#f08a2c', '#c43a1e'], 200);
  const k = easeOut(seg(u, 0, 1.2));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; sprC(g, flameS((step8(u) + i) % 4), 160 + Math.cos(a) * (40 + 100 * k), 92 + Math.sin(a) * (30 + 60 * k), 2); }
  pxGlow(g, 160, 90, 70, PAL.hi, 0.7);
  sprC(g, kid('lan', 'raise'), 160, 96, 2);
  sparks(g, 30, 9, u, PAL.hi, 70);
};
S.eye = (g, u) => {
  radial(g, 160, 90, ['#f5d0b0', '#d89c84'], 200);
  spr(g, face('lan', u < 0.45 ? 'closed' : 'normal'), 25, -105, 6);
  if (u > 1.0) { const f = Math.min(3, fl((u - 1.0) * 5)); sprC(g, starS(f), 150, 84, 2); }
};
S.transform = (g, u) => {
  radial(g, 160, 90, ['#fff6e0', '#ffe08a', '#f0b04a'], 190);
  pxRays(g, 160, 90, 24, 220, PAL.hi, u * 0.4, 11);
  if (u < 1.55) {
    const sc = u < 0.5 ? 2 : u < 1.0 ? 3 : 4;
    sprC(g, ember(step8(u) % 2), 160, 92, sc);
    ditherFill(g, PAL.hi, easeIn(seg(u, 0.6, 1.55)));
  } else {
    sprC(g, bface(step8(u) % 4, u > 1.95 ? 1 : 0), 160, 92, u < 1.7 ? 2 : 3);
    ditherFill(g, PAL.hi, 1 - seg(u, 1.55, 1.95));
  }
};
S.grip = (g, u) => {
  R(g, 0, 0, LW, LH, PAL.jacket);
  for (let i = 0; i < 4; i++) line(g, 40 + i * 80, 0, 50 + i * 76, 70, PAL.jacket2, 1);
  R(g, 0, 82, LW, 98, PAL.pants); R(g, 0, 74, LW, 10, PAL.belt); R(g, 0, 83, LW, 1, PAL.ink);
  R(g, 150, 74, 20, 10, PAL.gold); R(g, 150, 73, 20, 1, PAL.ink);
  sprC(g, amulet(1), 160 + (step8(u) % 8 < 4 ? 0 : 1), 112, 3);
  const inn = easeOut(seg(u, 0, 0.8)), cl = u > 1.3;
  const [sx, sy] = cl ? shake(u, 1) : [0, 0];
  spr(g, hand(cl ? 1 : 0), lerp(330, 150, inn) + sx, lerp(170, 92, inn) + sy, 2);
};
S.charge = (g, u, d) => {
  scroll(g, scene('wasteland'), u * 40);
  const k = ease(seg(u, 0, d)), bx = lerp(-100, 320, k);
  for (let i = 0; i < 6; i++) E(g, bx - 4 - i * 14, 150 + (i % 2) * 3, 6 + i * 2, 4 + i, i % 2 ? '#efb27a' : '#d98a5a');
  spr(g, beast(step8(u) % 2), bx, 92);
  speed(g, 14, 4, u, '#ffe6b0');
};
S.shuangWake = (g, u) => {
  radial(g, 160, 70, ['#4a5aa8', '#2a2a6a', '#1a1838'], 200);
  for (let i = 0; i < 40; i++) P(g, hash(i) * LW, hash(i * 3) * LH, (fl(u * 6) + i) % 5 ? '#a8b8f0' : PAL.hi);
  spr(g, face('shuang', u < 0.8 ? 'closed' : 'normal'), 96, 52 + (step8(u) % 8 < 4 ? 0 : 1), 2);
};
S.redEyes = (g, u) => {
  sky(g, ['#120e20', '#24183c', '#3c2152']);
  for (let i = 0; i < 40; i++) P(g, hash(i + 5) * LW, hash(i * 3 + 5) * LH, '#a898d0');
  ditherSpr(g, crow(0), 160 - 98, 50, 2, 0.5 * ease(seg(u, 2.2, 3.8)));
  for (let i = 0; i < 11; i++) {
    const on = seg(u, 0.2 + i * 0.28, 0.45 + i * 0.28); if (on <= 0) continue;
    const x = 30 + hash(i * 7) * 260, y = 20 + hash(i * 11) * 130, h = Math.max(1, fl(on * 3));
    pxGlow(g, x, y, 10, PAL.red2, 0.6);
    R(g, x - 4, y - fl(h / 2), 9, h, PAL.red); if (h > 1) R(g, x, y - fl(h / 2), 1, h, PAL.ink);
  }
};
S.wings = (g, u) => {
  sky(g, ['#3f7fc8', '#5b9ed8', '#a8d4f0']);
  pxCloud(g, 50, 150, 40); pxCloud(g, 270, 158, 36);
  ditherFill(g, '#2a1f40', 0.4 * easeOut(seg(u, 0.1, 1.2)));
  sprC(g, crow(u > 0.6 ? 1 : 0), 160, 92 + (step8(u) % 8 < 4 ? 0 : 1), 2);
  if (u > 1.3 && u < 1.6) spr(g, boltS(0), 40, 0, 2);
  if (u > 2.0 && u < 2.3) spr(g, boltS(1), 260, 0, 2);
};
S.iceSwirl = (g, u) => {
  radial(g, 160, 90, ['#e8fbff', '#9fdcf6', '#4a8ad0', '#1d4a96'], 200);
  for (let i = 0; i < 18; i++) { const a = hash(i) * 6.28 + u * (1.5 + hash(i * 3)), r = 30 + ((hash(i * 5) + u * 0.3) % 1) * 140; sprC(g, small('ice'), 160 + Math.cos(a) * r, 90 + Math.sin(a) * r * 0.6, 2); }
  sprC(g, kid('shuang', 'raise'), 160, 96, 2);
};
S.lanFire = (g, u) => {
  radial(g, 160, 200, ['#e8642a', '#9a2a1e', '#3a1a1e'], 240);
  for (let i = 0; i < 11; i++) spr(g, flameS((step8(u) + i) % 4), i * 30 - 6, 132, 2);
  spr(g, face('lan', 'angry'), 96, 52 + (step8(u) % 8 < 4 ? 0 : 1), 2);
  sparks(g, 26, 13, u, PAL.fl3, 50);
};
S.explosion = (g, u) => {
  R(g, 0, 0, LW, LH, '#3a1a1e');
  const f = Math.min(3, fl(u * 1.2)), [sx, sy] = u < 1.2 ? shake(u, 3) : [0, 0];
  sprC(g, boomS(f), 160 + sx, 90 + sy, f < 3 ? 3 + f : 5);
  for (let i = 0; i < 30; i++) { const a = hash(i) * 6.28, r = easeOut(seg(u, 0, 1.4)) * (40 + hash(i * 3) * 150); P(g, 160 + Math.cos(a) * r, 90 + Math.sin(a) * r, PAL.fl3); }
};
S.kuiLeaf = (g, u) => {
  radial(g, 200, 80, ['#ffd0e4', '#f48ab8', '#c0408a', '#7a2a6a'], 220);
  for (let i = 0; i < 20; i++) P(g, hash(i) * LW, (hash(i * 3) * LH - u * 10 * (1 + hash(i))) % LH + LH * (hash(i * 3) * LH - u * 10 < 0), PAL.petal2);
  const r = easeOut(seg(u, 0.4, 1.4));
  spr(g, face('kui', u > 1.0 ? 'smile' : 'normal'), 50, 52 + (step8(u) % 8 < 4 ? 0 : 1), 2);
  const ly = lerp(200, 96, r);
  spr(g, hand(1), 200, ly, 2);
  sprC(g, small('leaf'), 228, ly - 4, 3);
  if (r > 0.9) pxGlow(g, 228, ly - 4, 22, PAL.leaf, 0.5);
};
S.kuiSpin = (g, u) => {
  radial(g, 160, 90, ['#f6a8d8', '#c060b0', '#5a2a8a'], 200);
  for (let i = 0; i < 26; i++) { const a = hash(i) * 6.28 + u * (2 + hash(i * 3) * 2), r = 20 + ((hash(i * 5) + u * 0.3) % 1) * 150; sprC(g, small(i % 3 ? 'petal' : 'leaf'), 160 + Math.cos(a) * r, 92 + Math.sin(a) * r * 0.55, 1); }
  sprC(g, kid('kui', 'spread', 'happy'), 160, 96, 2, fl(u * 5) % 2 === 1);
};
S.dive = (g, u, d) => {
  radial(g, 160, 90, ['#8a4ad0', '#4a1f8a', '#160c2c'], 200);
  if (fl(u * 4) % 3 === 0) pxBolt(g, hash(fl(u * 4)) * LW, 0, hash(fl(u * 4) + 3) * LW, LH, fl(u * 4), '#c88aff');
  const k = easeIn(seg(u, 0, d)), sc = k < 0.4 ? 1 : k < 0.8 ? 2 : 3;
  sprC(g, crow(1), lerp(80, 160, k), lerp(50, 100, k), sc);
  speed(g, 10, 9, u, '#b090e0');
};
S.villainFace = (g, u) => {
  radial(g, 160, 70, ['#4a2a6a', '#24143a', '#120a1e'], 200);
  const [sx, sy] = u > 1.2 ? shake(u, 2) : [0, 0];
  spr(g, crow(1), 13 + sx, 40 + sy - 30, 3);
  const on = ease(seg(u, 0.4, 1.4));
  if (on > 0) { pxGlow(g, 148 + sx, 46 + sy, 10 * on, PAL.red, 0.6); pxGlow(g, 172 + sx, 46 + sy, 10 * on, PAL.red, 0.6); }
};
S.combo = (g, u) => {
  sky(g, ['#2e70c0', '#5b9ed8', '#bfe4f6']);
  pxCloud(g, 160, 168, 70);
  spr(g, crow(1), 160 - 49, 4);
  spr(g, kid('shuang', 'point'), 20, 74, 2);
  spr(g, kid('kui', 'point'), 232, 74, 2, true);
  const k = ease(seg(u, 0.5, 2.0));
  for (let i = 0; i < 12; i++) { const f = ((hash(i) + u * 0.8) % 1) * k; sprC(g, small('ice'), lerp(84, 160, f), lerp(98, 86, f) + Math.sin(f * 9 + i) * 6 * (1 - f), 1); sprC(g, small(i % 3 ? 'petal' : 'leaf'), lerp(236, 160, f), lerp(98, 86, f) + Math.cos(f * 9 + i) * 6 * (1 - f), 1); }
  const m = seg(u, 1.8, 3.4); if (m > 0) { pxGlow(g, 160, 86, 20 + 40 * m, PAL.hi, 0.8); sprC(g, starS(Math.min(3, fl(m * 4))), 160, 86, 2 + fl(m * 2)); }
};
S.shatter = (g, u) => {
  sky(g, ['#7a8aa0', '#a8b4c4', '#d8dde2']);
  const wx = lerp(420, -360, ease(seg(u, 0, 0.7)));
  poly(g, [[wx, 20], [wx + 70, 0], [wx + 300, -20], [wx + 340, 70], [wx + 270, 100], [wx + 220, 80], [wx + 170, 110], [wx + 110, 86], [wx + 50, 120]], PAL.vilW);
  const sm = easeOut(seg(u, 0.5, 2.4));
  for (let i = 0; i < 12; i++) pxCloud(g, 160 + (hash(i) - 0.5) * 320 * sm, 90 + (hash(i * 3) - 0.5) * 180 * sm, 18 + 30 * hash(i * 5) * sm + 6, '#f2f0ec', '#c4c8cc');
  if (u > 0.6) for (let i = 0; i < 12; i++) sprC(g, small('ice'), hash(i) * LW, -10 + (u - 0.6) * (40 + hash(i * 3) * 60) + hash(i * 5) * 40, 1);
};
S.runGold = (g, u) => {
  radial(g, 230, 70, ['#fff0b0', '#ffd25a', '#e89a3a', '#c47a1e'], 240);
  pxRays(g, 230, 70, 16, 260, PAL.hi, u * 0.2, 23);
  R(g, 0, 140, LW, 40, '#8a4a1e'); R(g, 0, 140, LW, 1, PAL.ink);
  sprC(g, kid('lan', step8(u) % 2 ? 'run2' : 'run1'), 130, 92, 2);
  speed(g, 12, 3, u, PAL.hi, -1);
  for (let i = 0; i < 5; i++) sprC(g, amulet(u > 2.0 + i * 0.35 ? 0 : 1), 40 + i * 60, 160, 2);
};
S.beastBehind = (g, u) => {
  radial(g, 230, 70, ['#2a4a7a', '#1a2a4a', '#0e1424'], 220);
  const ap = ease(seg(u, 0.3, 1.3)), dk = ease(seg(u, 2.4, 3.6));
  ditherSpr(g, bface(step8(u) % 4), 230 - 99, 90 - 99, 3, ap * (1 - dk * 0.8));
  spr(g, face('lan', u > 2.4 ? 'surprise' : 'normal'), 20, 52, 2);
  ditherFill(g, '#0a0812', 0.85 * dk);
};
S.shout = (g, u) => {
  R(g, 0, 0, LW, LH, '#1c1622');
  if (u < 2.2) {
    for (let i = 0; i < 4; i++) spr(g, flameS((step8(u) + i) % 4), 236 + i * 20, 130, 3);
    const [sx, sy] = shake(u, 2);
    spr(g, face('lan', u > 0.3 ? 'shout' : 'angry'), 70 + sx, 52 + sy, 2);
  } else {
    const b = seg(u, 2.4, 3.0);
    if (u < 3.6) sprC(g, starS(Math.min(3, fl((u - 2.2) * 4))), 160, 90, 4);
    sprC(g, amulet(b > 0 ? 2 : 0), 160, 90, 4);
    for (let i = 0; i < 16; i++) { const a = hash(i) * 6.28, r = easeOut(b) * (20 + hash(i * 3) * 100); R(g, 160 + Math.cos(a) * r, 90 + Math.sin(a) * r, 2, 2, PAL.amber2); }
  }
};
S.bandage = (g, u) => {
  spr(g, scene('rain'), 0, 0);
  ditherFill(g, '#a2b4b4', 0.4);
  const [sx, sy] = shake(u, u > 0.8 ? 2 : 1);
  sprC(g, hand(u > 1.4 ? 2 : 3), 160 + sx, 100 + sy, 3);
};
S.tears = (g, u) => {
  sky(g, ['#4a6470', '#6f8f8c', '#a2b4b4']);
  for (let i = 0; i < 70; i++) { const x = hash(i) * LW, y = (hash(i * 3) * LH + u * (160 + hash(i * 5) * 60)) % LH; line(g, x, y, x - 1, y + 3, '#d4e4e8', 1); }
  spr(g, face('lan', u > 0.6 ? 'cry' : 'normal'), 96, 52, 2);
};
S.memory = (g, u) => {
  sky(g, ['#5fa6e0', '#9ccaee', '#e6f2f6']);
  pxCloud(g, 60, 150, 50); pxCloud(g, 260, 160, 56);
  for (let i = 0; i < 10; i++) sprC(g, small('leaf'), hash(i) * LW + Math.sin(u + i) * 10, (hash(i * 3) * LH + u * 14 * (0.6 + hash(i))) % (LH + 20) - 10, 1);
  ditherSpr(g, face('shuang', 'smile'), 24, 30, 2, ease(seg(u, 0.8, 2.2)));
  ditherSpr(g, face('kui', 'smile'), 168, 22, 2, ease(seg(u, 2.2, 3.6)));
  ditherSpr(g, ember(step8(u) % 2), 136, 132 - fl(Math.abs(Math.sin(u * 3)) * 10), 2, ease(seg(u, 3.8, 5.0)));
};
S.goldBolt = (g, u) => {
  radial(g, 160, 80, ['#ffcf4a', '#8a5a1e', '#3a2614', '#1e1610'], 200);
  const k = ease(seg(u, 0.3, 2.0));
  if (k > 0) pxGlow(g, 160, 80, 30 + 60 * k, PAL.amber2, 0.6);
  sprC(g, kid('lan', 'raise'), 160, 100, 2);
  for (let i = 0; i < fl(1 + k * 5); i++) { const a = hash(i + fl(u * 6) * 13) * 6.28; pxBolt(g, 160 + Math.cos(a) * 16, 80 + Math.sin(a) * 30, 160 + Math.cos(a) * 140, 90 + Math.sin(a) * 90, i * 7 + fl(u * 6)); }
  if (k > 0.3) pxBolt(g, 165, -4, 172, 40, 99 + fl(u * 6));
};
S.duskHill = (g, u) => {
  spr(g, scene('dusk'), 0, 0);
  const sb = seg(u, 1.0, 2.6);
  if (sb > 0) sprC(g, starS(Math.min(3, fl(sb * 4))), 228, 112, 3 + fl(sb * 2));
  spr(g, kid('lan', step8(u) % 8 < 4 ? 'stand1' : 'stand2'), 70, 74);
  if (u > 1.6) { const e = easeOut(seg(u, 1.6, 2.6)); spr(g, ember(step8(u) % 2), lerp(20, 98, e), 100 - fl(Math.abs(Math.sin(u * 7)) * 6 * (1 - e))); }
};
S.rise = (g, u) => {
  sky(g, ['#3e86cc', '#7ab4e0', '#cfe8f4']);
  pxCloud(g, 160, 168, 80);
  spr(g, face('shuang', 'angry'), 30, lerp(190, 52, easeOut(seg(u, 0.2, 1.3))), 2);
  spr(g, face('kui', 'angry'), 162, lerp(200, 52, easeOut(seg(u, 0.7, 1.8))), 2);
};
S.kuiEye = (g, u) => {
  radial(g, 160, 90, ['#c8f0a0', '#7ab44a', '#2f6a40'], 200);
  spr(g, face('kui', u < 0.4 ? 'closed' : 'normal'), 25, -105, 6);
  for (let i = 0; i < 20; i++) { const a = hash(i) * 6.28 + u * 2, r = 40 + ((hash(i * 5) + u * 0.4) % 1) * 160; sprC(g, small('leaf'), 160 + Math.cos(a) * r, 90 + Math.sin(a) * r * 0.6, 2); }
};
S.lanBolt = (g, u) => {
  radial(g, 200, 90, ['#2a5a9a', '#1a3060', '#0e1830'], 220);
  for (let i = 0; i < 30; i++) P(g, hash(i) * LW, hash(i * 3) * LH, '#cfe0ff');
  spr(g, kid('lan', 'point'), 40, 64, 2);
  const hx = 40 + 32 * 2, hy = 64 + 22 * 2, k = seg(u, 0.7, 1.0);
  if (k > 0) { pxGlow(g, hx, hy, 24, '#cfeeff', 0.7); pxBolt(g, hx, hy, lerp(hx, 330, k), 70 + Math.sin(u * 9) * 8, fl(u * 8), '#9ad8ff'); }
};
S.roar = (g, u) => {
  radial(g, 160, 90, ['#ffd27a', '#ffb04a', '#d8642a', '#9a2a1e'], 200);
  const r = u > 0.5, [sx, sy] = u > 0.6 ? shake(u, 3) : [0, 0];
  if (r) for (let i = 0; i < 30; i++) { const a = hash(i + fl(u * 8)) * 6.28; line(g, 160 + Math.cos(a) * 110, 90 + Math.sin(a) * 110, 160 + Math.cos(a) * 240, 90 + Math.sin(a) * 240, '#7a2a1e', 1); }
  sprC(g, bface(step8(u) % 4, 1, r ? 1 : 0), 160 + sx, 92 + sy, 3);
  sparks(g, 24, 19, u, PAL.embL, 80);
};
S.wasteland = (g, u) => {
  spr(g, scene('wasteland'), 0, 0);
  spr(g, crow(1), 160 - 49, 14 + (step8(u) % 8 < 4 ? 0 : 2));
  spr(g, kid('lan', step8(u) % 8 < 4 ? 'stand1' : 'stand2'), 56, 118);
  spr(g, ember(0), 26, 146);
  for (let i = 0; i < 5; i++) R(g, ((hash(i) * LW + u * 20) % (LW + 60)) - 30, 130 + hash(i * 3) * 40, 30, 2, '#efb27a');
};
S.villainHit = (g, u) => {
  radial(g, 160, 90, ['#5a3a7a', '#3a2454', '#1a1028'], 200);
  const hit = u > 0.5, sh = easeIn(seg(u, 1.2, 3.2));
  if (hit && u < 2.6) { pxBolt(g, -4, 100, 150, 92, fl(u * 8), PAL.fl3, 5); pxGlow(g, 160, 90, 50, PAL.embL, 0.6); }
  const sc = sh < 0.4 ? 2 : 1;
  ditherSpr(g, crow(1), 160 - 49 * sc, 90 - 37 * sc, sc, 1 - sh);
  if (hit) for (let i = 0; i < 7; i++) { const a = hash(i) * 6.28; line(g, 160, 80, 160 + Math.cos(a) * 60 * seg(u, 0.5, 0.8), 80 + Math.sin(a) * 60 * seg(u, 0.5, 0.8), PAL.embL, 1); }
  if (sh > 0) for (let i = 0; i < 40; i++) { const a = hash(i) * 6.28, r = 120 * sh * (0.2 + hash(i * 3)); R(g, 160 + Math.cos(a) * r, 90 + Math.sin(a) * r - sh * 20 * hash(i * 5), 2, 2, '#b88aff'); }
};
S.flyRide = (g, u) => {
  sky(g, ['#2f76c8', '#6aa8dc', '#cfe8f6']);
  for (let i = 0; i < 6; i++) pxCloud(g, ((hash(i) * (LW + 160) - u * (60 + hash(i * 3) * 90)) % (LW + 160) + LW + 160) % (LW + 160) - 80, 20 + hash(i * 5) * 140, 20 + hash(i * 7) * 30);
  const y = 50 + fl(Math.sin(u * 1.6) * 6);
  spr(g, beast(step8(u) % 2), 64, y, 2);
  spr(g, kid('lan', 'sit', 'happy'), 140, y - 10);
  speed(g, 16, 8, u, PAL.hi, -1);
};
S.smile = (g, u) => {
  sky(g, ['#3a86d6', '#8cc0e8', '#d6eef8']);
  pxCloud(g, 70 - u * 4, 160, 60);
  spr(g, face('lan', u > 0.6 ? 'smile' : 'normal'), 120, 52 + (step8(u) % 8 < 4 ? 0 : 1), 2);
};
S.beastEyes = (g, u) => {
  radial(g, 160, 90, ['#fff0b0', '#ffd27a', '#e8823a', '#b8501e'], 200);
  sprC(g, bface(step8(u) % 4, u > 1.0 ? 1 : 0), 160, 92 + (step8(u) % 8 < 4 ? 0 : 1), 3);
  sparks(g, 20, 23, u, PAL.hi, 40);
};
S.eyesClosed = (g, u) => {
  radial(g, 160, 70, ['#ffb05a', '#d8642a', '#7a2a1e'], 200);
  sparks(g, 26, 29, u, PAL.embL, 40);
  spr(g, face('lan', u < 1.2 ? 'closed' : 'angry'), 64, 0, 3);
};
S.reach = (g, u) => {
  radial(g, 150, 80, ['#ffd25a', '#a8401e', '#2a1414'], 200);
  const k = easeOut(seg(u, 0, 1.0)), b = seg(u, 1.2, 2.6);
  pxGlow(g, 150, 80, 30 + 50 * k, PAL.amber2, 0.8);
  spr(g, hand(0), lerp(280, 170, k), lerp(200, 90, k), 2);
  if (b > 0) sprC(g, starS(Math.min(3, fl(b * 5))), 150, 80, 3 + fl(b * 4));
  ditherFill(g, PAL.hi, easeIn(b));
};
S.dandelions = (g, u) => {
  sky(g, ['#2e7ccc', '#7ab4e0', '#d4ecf8']);
  pxCloud(g, 250, 150, 60);
  const rel = u > 1.5 ? 0.75 : 0;
  [[60, 60, 3], [140, 30, 3], [220, 70, 3]].forEach(([x, y, s], i) => spr(g, dand(rel), x + (fl(u * 2 + i) % 2), y, s));
  if (u > 1.5) for (let i = 0; i < 24; i++) { const f = u - 1.5 - hash(i) * 0.8; if (f < 0) continue; const sx = [101, 181, 261][i % 3], sy = [96, 66, 106][i % 3]; spr(g, seedS(), sx + f * (30 + hash(i * 3) * 40), sy - f * (14 + hash(i * 5) * 30) + Math.sin(f * 2 + i) * 4, 2); }
};
S.seeds = (g, u) => {
  sky(g, ['#3a8ad6', '#8cc0e8', '#e2f2f8']);
  pxCloud(g, 70, 150, 60);
  for (let i = 0; i < 36; i++) { const x = ((hash(i) * (LW + 40) + u * (10 + hash(i * 3) * 14)) % (LW + 40)) - 20, y = (((hash(i * 5) * (LH + 40) - u * (8 + hash(i * 7) * 12)) % (LH + 40)) + LH + 40) % (LH + 40) - 20; spr(g, seedS(), x, y, hash(i * 9) > 0.6 ? 2 : 1); }
  const k = ease(seg(u, 0.5, 2.0)), sy = 80 - u * 3;
  if (k > 0) pxGlow(g, 160, sy, 24, PAL.amber2, 0.7 * k);
  sprC(g, seedS(), 160 + Math.sin(u) * 4, sy, 3);
};
S.profileWind = (g, u) => {
  sky(g, ['#3384d4', '#8cc0e8', '#d8eef8']);
  pxCloud(g, 60, 150, 70);
  spr(g, face('lan', 'smile'), 150, 52 + (step8(u) % 8 < 4 ? 0 : 1), 2);
  for (let i = 0; i < 12; i++) spr(g, seedS(), LW - ((hash(i) * (LW + 40) + u * (30 + hash(i * 3) * 30)) % (LW + 40)) + 20, hash(i * 5) * LH, 1);
};
S.finale = (g, u) => {
  spr(g, scene('cliff'), 0, 0);
  sprC(g, bface(step8(u) % 4), 90, 70 + (step8(u) % 8 < 4 ? 0 : 1), 2);
  const k = easeOut(seg(u, 0.2, 1.4));
  spr(g, paw(), lerp(110, 150, k), lerp(110, 76, k), 2);
  spr(g, kid('lan', 'point', 'happy'), 200, 12 - 4, 2, true);
  if (k > 0.9) pxGlow(g, 210, 52, 18, PAL.amber2, 0.6);
  for (let i = 0; i < 8; i++) spr(g, seedS(), (hash(i) * LW + u * 12) % LW, hash(i * 3) * 90, 1);
};

// 时间表与转场：照搬水彩版
const SHOTS = [
  [0.0, 'cut', S.cliffOpen], [4.0, 'wipe', S.plains], [6.0, 'iris', S.amulet], [9.0, 'flash', S.awaken],
  [12.0, 'whip', S.eye], [14.7, 'push', S.transform], [17.3, 'cut', S.grip], [20.0, 'wipe', S.charge],
  [24.3, 'whip', S.shuangWake], [26.4, 'dark', S.redEyes], [30.4, 'flash', S.wings], [33.1, 'whip', S.iceSwirl],
  [37.1, 'wipe', S.lanFire], [40.4, 'flash', S.explosion], [43.1, 'iris', S.kuiLeaf], [46.6, 'whip', S.kuiSpin],
  [49.6, 'dark', S.dive], [52.7, 'push', S.villainFace], [55.9, 'flash', S.combo], [60.5, 'cut', S.shatter],
  [64.0, 'wipe', S.runGold], [68.6, 'whip', S.beastBehind], [72.6, 'cut', S.shout], [76.4, 'flash', S.bandage],
  [80.0, 'fade', S.tears], [84.7, 'fade', S.memory], [91.2, 'flash', S.goldBolt], [96.1, 'wipe', S.duskHill],
  [99.9, 'whip', S.rise], [103.9, 'push', S.kuiEye], [106.6, 'flash', S.lanBolt], [110.2, 'cut', S.roar],
  [113.3, 'wipe', S.wasteland], [117.0, 'push', S.villainHit], [120.5, 'flash', S.flyRide], [126.0, 'whip', S.smile],
  [128.6, 'push', S.beastEyes], [132.3, 'fade', S.eyesClosed], [134.4, 'cut', S.reach], [137.0, 'flash', S.dandelions],
  [141.0, 'fade', S.seeds], [145.6, 'wipe', S.profileWind], [149.6, 'fade', S.finale],
];
const TDUR = { cut: 0, fade: 0.6, wipe: 0.5, iris: 0.55, flash: 0.45, whip: 0.35, push: 0.5, dark: 0.8 };

function drawShot(g, i, T) {
  const s = SHOTS[i][0], e = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : END;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
  R(g, 0, 0, LW, LH, PAL.paper);
  SHOTS[i][2](g, T - s, e - s);
}
function mixDither(g, ca, cb, p) { // Bayer 溶解
  const a = ca.getContext('2d').getImageData(0, 0, LW, LH), b = cb.getContext('2d').getImageData(0, 0, LW, LH);
  for (let i = 0; i < LW * LH; i++) { const x = i % LW, y = fl(i / LW); if (p * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5) for (let k = 0; k < 4; k++) a.data[i * 4 + k] = b.data[i * 4 + k]; }
  g.putImageData(a, 0, 0);
}
function mosaic(g, c, n) { // 马赛克
  const [mc, mg] = TMP; const w = Math.max(1, fl(LW / n)), h = Math.max(1, fl(LH / n));
  mg.clearRect(0, 0, LW, LH); mg.imageSmoothingEnabled = false; mg.drawImage(c, 0, 0, w, h);
  g.imageSmoothingEnabled = false; g.drawImage(mc, 0, 0, w, h, 0, 0, LW, LH);
}

function renderTime(T, type) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= T) i++;
  const tr = SHOTS[i][1], td = TDUR[tr], p = td ? (T - SHOTS[i][0]) / td : 1;
  const g = LG;
  if (i === 0 || p >= 1) drawShot(g, i, T);
  else {
    const [ca, ga] = BA, [cb, gb] = BB;
    drawShot(ga, i - 1, T); drawShot(gb, i, T);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (tr === 'fade') mixDither(g, ca, cb, p);
    else if (tr === 'flash' || tr === 'dark') { g.drawImage(p < 0.5 ? ca : cb, 0, 0); ditherFill(g, tr === 'flash' ? PAL.hi : '#1a1420', 1 - Math.abs(p - 0.5) * 2); }
    else if (tr === 'wipe') {
      g.drawImage(ca, 0, 0);
      for (let y = 0; y < LH; y += 6) { const x = fl(p * (LW + 40) - 20 + ((y / 6) % 2) * 8); g.drawImage(cb, 0, y, Math.max(0, x), 6, 0, y, Math.max(0, x), 6); if (x > 0) R(g, x, y, 2, 6, PAL.ink); }
    } else if (tr === 'iris') {
      g.drawImage(ca, 0, 0);
      const r = p * 190, d = ga.getImageData(0, 0, LW, LH), b = gb.getImageData(0, 0, LW, LH);
      for (let k = 0; k < LW * LH; k++) { const x = k % LW, y = fl(k / LW), dd = Math.hypot(x - 160, y - 90); if (dd < r) for (let c = 0; c < 4; c++) d.data[k * 4 + c] = b.data[k * 4 + c]; else if (dd < r + 2) { d.data[k * 4] = 30; d.data[k * 4 + 1] = 26; d.data[k * 4 + 2] = 42; } }
      g.putImageData(d, 0, 0);
    } else if (tr === 'whip') {
      R(g, 0, 0, LW, LH, PAL.paper);
      if (p < 0.5) g.drawImage(ca, -fl(easeIn(p * 2) * LW), 0); else g.drawImage(cb, fl((1 - easeOut((p - 0.5) * 2)) * LW), 0);
      speed(g, 30, 77, T, PAL.hi, p < 0.5 ? -1 : 1);
    } else if (tr === 'push') {
      if (p < 0.5) mosaic(g, ca, 1 + fl(p * 2 * 15)); else mosaic(g, cb, 1 + fl((1 - p) * 2 * 15));
    }
  }
  // 片头/片尾：抖动淡入淡出到纸色
  const fin = 1 - seg(T, 0, 0.8), fout = seg(T, END - 1.2, END - 0.1);
  ditherFill(g, PAL.paper, Math.max(fin, fout));
  OG.imageSmoothingEnabled = false;
  OG.drawImage(L, 0, 0, 1280, 720);
  return OUT.toDataURL(type, 0.95);
}
