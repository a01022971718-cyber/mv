// 像素风：限定色板 + 逐像素图元（无抗锯齿）
const PAL = {
  ink: '#1e1a2a', ink2: '#3a3150', paper: '#f4ecdc', hi: '#fff6e0',
  skin: '#f5d0b0', skin2: '#d89c84', blush: '#ec8a8a', mouth: '#8a2e3a',
  lanHair: '#2c3452', lanHair2: '#4a5a8c', streak: '#e6e0f0', amber: '#d88a24', amber2: '#ffc04a',
  scarf: '#c9412f', scarf2: '#8e2a26', jacket: '#eef0e8', jacket2: '#b4bac4', teal: '#3c8e88',
  pants: '#3a4660', pants2: '#262e44', belt: '#6a4630', shoe: '#2e2838',
  kuiHair: '#b2357a', kuiHair2: '#e070a8', cloak: '#4e9a5c', cloak2: '#2f6a40', leaf: '#8ccc4a', gold: '#e8c44c', kuiEye: '#3c9a58',
  shHair: '#9cc4df', shHair2: '#dcecf6', coat: '#33456e', coat2: '#222e4c', shEye: '#4a6db0', silver: '#cbdaec',
  emb: '#f2b632', emb2: '#c27a1c', embL: '#ffe08a', fl1: '#d8442a', fl2: '#f08a2c', fl3: '#ffd25a',
  vil: '#2f2442', vilW: '#45356a', vilW2: '#6a54a0', red: '#ff3a3a', red2: '#9a1e2e',
  ice: '#cdeefc', ice2: '#7ab8e0', petal: '#f48ab8', petal2: '#ffd0e4', stem: '#5e8a3e',
};

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function P(g, x, y, col) { if (!col) return; g.fillStyle = col; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function E(g, cx, cy, rx, ry, col) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) P(g, x, y, col);
    }
}
function inPoly(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function poly(g, pts, col) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++)
      if (inPoly(x + 0.5, y + 0.5, pts)) P(g, x, y, col);
}
// Bresenham 线，w = 笔宽（方形笔）
function line(g, x0, y0, x1, y1, col, w = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, o = Math.floor((w - 1) / 2);
  for (;;) {
    R(g, x0 - o, y0 - o, w, w, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function polyline(g, pts, col, w) { for (let i = 0; i < pts.length - 1; i++) line(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, w); }
// 带墨边的肢体：先粗墨线，再细颜色线
function limbO(g, pts, col, w) { polyline(g, pts, PAL.ink, w + 2); polyline(g, pts, col, w); }
// 小矩阵：每个字符对应 map 里的颜色，'.' 透明
function mat(g, x, y, rows, map) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && map[ch]) P(g, x + i, y + j, map[ch]); }));
}
// 自动描边：透明像素若 4 邻有实像素 → 墨色
function outline(c, col = PAL.ink) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const img = g.getImageData(0, 0, w, h), d = img.data, a = i => d[i * 4 + 3] > 0;
  const add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (a(i)) continue;
    if ((x > 0 && a(i - 1)) || (x < w - 1 && a(i + 1)) || (y > 0 && a(i - w)) || (y < h - 1 && a(i + w))) add.push([x, y]);
  }
  add.forEach(([x, y]) => P(g, x, y, col));
  return c;
}
// 4×4 Bayer 有序抖动：t∈[0,1] 时在 c1→c2 之间取色
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function dpick(x, y, t, c1, c2) { return t * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5 ? c2 : c1; }
// 多色带纵向渐变（带抖动）
function bands(g, x0, y0, w, h, cols) {
  const n = cols.length - 1;
  for (let y = 0; y < h; y++) {
    const f = y / Math.max(1, h - 1) * n, k = Math.min(n - 1, Math.floor(f)), t = f - k;
    for (let x = 0; x < w; x++) P(g, x0 + x, y0 + y, dpick(x0 + x, y0 + y, t, cols[k], cols[k + 1]));
  }
}
// 把小画布按整数倍放大贴到目标上
function blit(g, src, x, y, s) { g.imageSmoothingEnabled = false; g.drawImage(src, Math.round(x), Math.round(y), src.width * s, src.height * s); }
