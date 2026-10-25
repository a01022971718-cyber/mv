// 6 张 320×180 像素场景（抖动渐变 + 分层视差）
const SW = 320, SH = 180;
function pxCloud(g, x, y, s, col = '#f6f2ea', sh = '#c4d4e4') {
  for (let i = 0; i < 5; i++) E(g, x + (i - 2) * s * 0.45, y - Math.sin(i / 4 * Math.PI) * s * 0.35, s * (0.32 + hash(i + x) * 0.12), s * 0.28, col);
  R(g, x - s * 1.1, y + s * 0.05, s * 2.2, 2, sh);
}
function ridge(g, y0, amp, col, seed, freq = 0.04) {
  for (let x = 0; x < SW; x++) {
    const h = y0 - amp * (0.5 + 0.35 * Math.sin(x * freq + seed) + 0.15 * Math.sin(x * freq * 2.7 + seed * 3));
    R(g, x, Math.round(h), 1, SH - Math.round(h), col);
  }
}
function scatter(g, n, seed, fn) { for (let i = 0; i < n; i++) fn(hash(seed + i * 1.37), hash(seed + i * 2.71), hash(seed + i * 4.13), i); }

const SCENES = {
  cliff(g) {
    bands(g, 0, 0, SW, 130, ['#3f7fc8', '#5b9ed8', '#8cc0e8', '#cfe8f4']);
    pxCloud(g, 70, 40, 34); pxCloud(g, 230, 28, 26);
    bands(g, 0, 118, SW, 62, ['#5a9ad0', '#3a6aa8', '#2c4e86']);
    scatter(g, 40, 3, (a, b) => R(g, Math.floor(a * 200), 122 + Math.floor(b * 56), 3, 1, '#cfe8f4'));
    poly(g, [[190, 180], [200, 96], [216, 70], [250, 56], [320, 52], [320, 180]], '#b89a74');
    for (let i = 0; i < 6; i++) line(g, 206 + i * 18, 76 + i * 2, 202 + i * 20, 180, '#8a6a52', 1);
    poly(g, [[204, 82], [218, 66], [250, 54], [320, 50], [320, 60], [252, 64], [222, 76], [208, 90]], '#6fa04e');
    scatter(g, 12, 9, (a, b) => P(g, 220 + a * 100, 56 + b * 10, '#8ccc4a'));
  },
  plains(g) {
    bands(g, 0, 0, SW, 110, ['#5a9ad8', '#8cc0e6', '#e4f0f0']);
    pxCloud(g, 90, 32, 28); pxCloud(g, 250, 44, 22);
    ridge(g, 104, 16, '#8fb4a0', 1, 0.03); ridge(g, 112, 10, '#9fbf8a', 4, 0.05);
    [[70, 112, 1], [262, 116, 0.8]].forEach(([x, y, k]) => { line(g, x, y, x + 1, y - 20 * k, '#6a4a34', 2); E(g, x, y - 23 * k, 18 * k, 5 * k, '#5f8f46'); R(g, x - 16 * k, y - 21 * k, 32 * k, 1, '#3f6a32'); });
    bands(g, 0, 114, SW, 66, ['#d9c27a', '#c8aa5e', '#a88a48']);
    scatter(g, 70, 11, (a, b, c) => { const x = Math.floor(a * SW), y = 118 + Math.floor(b * 60); P(g, x, y, '#7a6a3a'); if (c > 0.5) P(g, x + 1, y - 1, '#7a6a3a'); });
  },
  wasteland(g) {
    bands(g, 0, 0, SW, 120, ['#8a2e2a', '#c4553a', '#efb27a']);
    [[40, 110, 16, 40], [96, 112, 10, 26], [236, 110, 20, 52], [290, 114, 12, 30]].forEach(([x, y, w, h]) => { poly(g, [[x - w, y], [x - w * 0.6, y - h], [x + w * 0.6, y - h], [x + w, y]], '#8a4a3a'); R(g, x - w * 0.6, y - h, w * 1.2, 2, '#a85a42'); });
    ridge(g, 116, 6, '#a8503a', 7, 0.06);
    bands(g, 0, 118, SW, 62, ['#d98a5a', '#b86a46', '#8a4a34']);
    scatter(g, 26, 5, (a, b, c) => R(g, Math.floor(a * SW), 124 + Math.floor(b * 52), 4 + Math.floor(c * 8), 1, '#efb27a'));
  },
  storm(g) {
    bands(g, 0, 0, SW, SH, ['#120e20', '#24183c', '#3c2152', '#5a2a6a']);
    scatter(g, 70, 2, (a, b, c) => P(g, a * SW, b * 120, c > 0.7 ? '#fff6e0' : '#a898d0'));
    [[60, 40, 40], [200, 30, 50], [290, 60, 30]].forEach(([x, y, s]) => pxCloud(g, x, y, s, '#3a2a58', '#24183c'));
    const pts = [[214, 30]]; for (let i = 1; i < 9; i++) pts.push([214 + Math.round((hash(i * 9) - 0.5) * 22) - i * 2, 30 + i * 13]);
    polyline(g, pts, '#c88aff', 3); polyline(g, pts, '#fff6e0', 1);
    ridge(g, 166, 10, '#1a1228', 3, 0.05);
  },
  rain(g) {
    bands(g, 0, 0, SW, 130, ['#4a6470', '#6f8f8c', '#a2b4b4']);
    ridge(g, 128, 8, '#5f7a72', 2, 0.04);
    bands(g, 0, 132, SW, 48, ['#7f9a86', '#5f7a6a']);
    scatter(g, 120, 7, (a, b) => { const x = Math.floor(a * SW), y = Math.floor(b * SH); line(g, x, y, x - 1, y + 3, '#d4e4e8', 1); });
    scatter(g, 10, 17, (a, b) => { R(g, a * SW, 150 + b * 26, 6, 1, '#a8c4c0'); });
  },
  dusk(g) {
    bands(g, 0, 0, SW, 140, ['#2a1f4a', '#5a3a6a', '#c46a5a', '#f0a05a', '#ffd27a']);
    E(g, 228, 112, 26, 26, '#ffe8a8'); E(g, 228, 112, 20, 20, '#fff6e0');
    for (let r = 32; r < 60; r += 9) for (let a = 0; a < 64; a++) if ((a + r) % 3 === 0) P(g, 228 + Math.cos(a / 64 * 6.283) * r, 112 + Math.sin(a / 64 * 6.283) * r, '#ffe0a0');
    ridge(g, 128, 14, '#4a3050', 5, 0.03);
    poly(g, [[0, 180], [0, 132], [60, 118], [130, 122], [200, 140], [320, 160], [320, 180]], '#2e2238');
  },
};
function makeScene(name) { const [c, g] = mk(SW, SH); SCENES[name](g); return c; }
