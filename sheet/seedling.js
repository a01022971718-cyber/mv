// 原创角色"种种"：琥珀种子身体 + 头顶嫩芽 + 两条短腿 + 小圆手
// 依赖 src/lib.js（blob / inkLine / ell / glow / hash / jit / BOIL）
const SEED = { body: '#e8a03a', shade: '#c47a24', belly: '#fbe6b8', leaf: '#7cc04a', leaf2: '#4f8a34', blush: '#ef8a8a', red: '#d8462e', green: '#a8b84a', pale: '#f0c890' };
// 本文件在“单位坐标”里画（身体高约 2.1），抖动幅度默认要按单位给
const sb = (ctx, pts, fill, o = {}) => blob(ctx, pts, fill, Object.assign({ amp: 0.006 }, o));

// ---------- 小符号（全部用画笔现画） ----------
function heart(ctx, x, y, r, col) {
  const pts = [];
  for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; pts.push([x + r * 16 * Math.pow(Math.sin(t), 3) / 16, y - r * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); }
  sb(ctx, pts, col, { lw: 0.035, amp: 0.008, seed: x * 9, edge: 0.05 });
}
function sparkle(ctx, x, y, r, col = '#f6c84a') {
  const p = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.28 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  sb(ctx, p, col, { lw: 0.03, amp: 0.006, seed: y * 7, wash: false });
}
function drop(ctx, x, y, r, col = '#8ccaf0') {
  sb(ctx, [[x, y - r * 1.6], [x + r * 0.7, y - r * 0.2], [x + r, y + r * 0.4], [x, y + r], [x - r, y + r * 0.4], [x - r * 0.7, y - r * 0.2]], col, { lw: 0.03, amp: 0.006, seed: x * 3, edge: 0.04 });
  sb(ctx, ell(x - r * 0.35, y + r * 0.1, r * 0.18, r * 0.3, 8), '#e8f6ff', { line: null, wash: false, amp: 0.003 });
}
function rainCloud(ctx, x, y, t) {
  [[-0.25, 0, 0.22], [0.05, -0.1, 0.27], [0.32, 0.02, 0.2]].forEach(([dx, dy, r], i) => sb(ctx, ell(x + dx, y + dy, r, r * 0.8, 12), '#8f97a6', { lw: 0.035, amp: 0.008, seed: 50 + i, edge: 0.06 }));
  for (let i = 0; i < 4; i++) { const yy = y + 0.25 + ((t * 1.5 + i * 0.27) % 1) * 0.5; inkLine(ctx, [[x - 0.3 + i * 0.2, yy], [x - 0.34 + i * 0.2, yy + 0.1]], 0.035, '#6aa8d8', 60 + i, 0.004); }
}
function vein(ctx, x, y, r) { // 怒气符号
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], i) => inkLine(ctx, [[x + a * r * 0.25, y + b * r], [x + a * r * 0.3, y + b * r * 0.3], [x + a * r, y + b * r * 0.25]], 0.06, '#d8462e', 70 + i, 0.005));
}
function bang(ctx, x, y, r) { // 感叹号
  sb(ctx, [[x - r * 0.18, y - r], [x + r * 0.22, y - r], [x + r * 0.08, y + r * 0.35], [x - r * 0.06, y + r * 0.35]], '#f6b42a', { lw: 0.035, amp: 0.006, seed: 80 });
  sb(ctx, ell(x, y + r * 0.7, r * 0.15, r * 0.15, 8), '#f6b42a', { lw: 0.035, amp: 0.004, seed: 81 });
}
function question(ctx, x, y, r) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.1 - i / 10 * 1.6); pts.push([x + Math.cos(a) * r * 0.5, y - r * 0.45 + Math.sin(a) * -r * 0.45]); }
  pts.push([x, y + r * 0.05], [x, y + r * 0.3]);
  inkLine(ctx, pts, 0.09, '#3a5aa8', 82, 0.006);
  sb(ctx, ell(x, y + r * 0.62, r * 0.1, r * 0.1, 8), '#3a5aa8', { line: null, wash: false });
}
function dots3(ctx, x, y, r) { for (let i = 0; i < 3; i++) sb(ctx, ell(x + i * r * 0.55, y, r * 0.14, r * 0.14, 8), INK, { line: null, wash: false, amp: 0.004 }); }
function zzz(ctx, x, y, r, t) {
  [[0, 0, 1], [0.3, -0.35, 0.75], [0.52, -0.62, 0.55]].forEach(([dx, dy, k], i) => {
    const s = r * k, bx = x + dx * r * 2, by = y + dy * r * 2 + Math.sin(t * 2 + i) * 0.03;
    inkLine(ctx, [[bx - s * 0.4, by - s * 0.4], [bx + s * 0.4, by - s * 0.4], [bx - s * 0.4, by + s * 0.4], [bx + s * 0.4, by + s * 0.4]], 0.05, INK, 84 + i, 0.004);
  });
}
function bulb(ctx, x, y, r, t) {
  glow(ctx, x, y, r * 3, '#ffe27a', 0.55 + 0.15 * Math.sin(t * 6));
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; inkLine(ctx, [[x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35], [x + Math.cos(a) * r * 1.8, y + Math.sin(a) * r * 1.8]], 0.035, '#e8a020', 90 + i, 0.004); }
  sb(ctx, ell(x, y, r, r * 1.05, 14), '#fff0a0', { lw: 0.04, amp: 0.006, seed: 97 });
  sb(ctx, [[x - r * 0.45, y + r * 0.85], [x + r * 0.45, y + r * 0.85], [x + r * 0.4, y + r * 1.4], [x - r * 0.4, y + r * 1.4]], '#a8a4b0', { lw: 0.035, amp: 0.004, seed: 98 });
}
function note(ctx, x, y, r) {
  inkLine(ctx, [[x + r * 0.3, y + r * 0.6], [x + r * 0.3, y - r * 0.8], [x + r * 0.8, y - r * 0.5]], 0.05, INK, 99, 0.004);
  sb(ctx, ell(x, y + r * 0.65, r * 0.32, r * 0.24, 10, -0.4), INK, { line: null, wash: false });
}
function steam(ctx, x, y, r, t, k) { for (let i = 0; i < 3; i++) { const u = (t * 1.3 + i / 3) % 1; sb(ctx, ell(x + k * u * r * 2, y - u * r * 2, r * (0.3 + u * 0.4), r * (0.25 + u * 0.3), 10), rgba('#d8d2cc', 0.9 - u * 0.7), { lw: 0.03, line: rgba('#2a2230', 0.5 * (1 - u)), seed: 100 + i }); } }
function flameTop(ctx, x, y, s, t) { flame(ctx, x, y, s * 0.35, s, t, 7, ['#d8442a', '#f08a2c', '#ffd25a']); }

// ---------- 眼与嘴 ----------
function eye(ctx, x, y, type, k, look, t) {
  const L = [look[0] * 0.05, look[1] * 0.05];
  const dot = (sc = 1, hi = 1) => {
    sb(ctx, ell(x + L[0], y + L[1], 0.085 * sc, 0.12 * sc, 12), INK, { line: null, wash: false, amp: 0.004 });
    sb(ctx, ell(x + L[0] - 0.025 * sc, y + L[1] - 0.045 * sc, 0.032 * sc, 0.038 * sc, 8), PAPER, { line: null, wash: false, amp: 0.002 });
    if (hi > 1) sb(ctx, ell(x + L[0] + 0.03 * sc, y + L[1] + 0.04 * sc, 0.016, 0.018, 6), PAPER, { line: null, wash: false, amp: 0.002 });
  };
  const ln = (pts, w = 0.055) => inkLine(ctx, pts.map(p => [x + p[0], y + p[1]]), w, INK, 200 + x * 10 + y, 0.004);
  switch (type) {
    case 'dot': dot(); break;
    case 'big': dot(1.3, 2); break;
    case 'small': dot(0.7); break;
    case 'happy': ln([[-0.1, 0.04], [0, -0.06], [0.1, 0.04]]); break;
    case 'closed': ln([[-0.1, -0.02], [0, 0.05], [0.1, -0.02]]); break;
    case 'line': ln([[-0.1, 0], [0.1, 0]]); break;
    case 'half': dot(); ln([[-0.12, -0.03], [0.12, -0.03]], 0.06); sb(ctx, [[x - 0.13, y - 0.16], [x + 0.13, y - 0.16], [x + 0.13, y - 0.035], [x - 0.13, y - 0.035]], ctx.__bodyCol, { line: null, wash: false, amp: 0.002 }); ln([[-0.12, -0.035], [0.12, -0.035]], 0.06); break;
    case 'wide': sb(ctx, ell(x, y, 0.13, 0.15, 14), '#fbf6ee', { lw: 0.04, amp: 0.004, seed: x * 5, wash: false }); sb(ctx, ell(x + L[0], y + L[1], 0.04, 0.05, 8), INK, { line: null, wash: false }); break;
    case 'heart': heart(ctx, x, y + 0.02, 0.12, '#e8506a'); break;
    case 'star': sparkle(ctx, x, y, 0.16, '#f6c84a'); break;
    case 'x': ln([[-0.09, -0.09], [0.09, 0.09]]); ln([[0.09, -0.09], [-0.09, 0.09]]); break;
    case 'spiral': { const p = []; for (let i = 0; i < 24; i++) { const a = i * 0.55 + t * 4 * k, r = 0.012 + i * 0.0055; p.push([Math.cos(a) * r, Math.sin(a) * r]); } ln(p, 0.035); break; }
    case 'squint': ln(k < 0 ? [[-0.1, -0.08], [0.08, 0], [-0.1, 0.08]] : [[0.1, -0.08], [-0.08, 0], [0.1, 0.08]]); break;
    case 'tight': ln(k < 0 ? [[-0.1, -0.06], [0.08, 0.01], [-0.08, 0.06]] : [[0.1, -0.06], [-0.08, 0.01], [0.08, 0.06]]); break;
  }
}
function mouth(ctx, type, t) {
  const y = 0.22, ln = (pts, w = 0.05) => inkLine(ctx, pts, w, INK, 300 + pts.length, 0.004);
  const fill = (pts, inner) => { sb(ctx, pts, '#8a2e3a', { lw: 0.045, amp: 0.004, seed: 310, wash: false }); if (inner) { ctx.save(); trace(ctx, pts, true); ctx.clip(); sb(ctx, inner, '#e8707a', { line: null, wash: false }); ctx.restore(); } };
  switch (type) {
    case 'flat': ln([[-0.08, y], [0.08, y]]); break;
    case 'smile': ln([[-0.12, y - 0.02], [0, y + 0.06], [0.12, y - 0.02]]); break;
    case 'smallSmile': ln([[-0.07, y], [0, y + 0.035], [0.07, y]]); break;
    case 'frown': ln([[-0.1, y + 0.05], [0, y - 0.02], [0.1, y + 0.05]]); break;
    case 'wavy': ln([[-0.12, y], [-0.06, y - 0.03], [0, y + 0.01], [0.06, y - 0.03], [0.12, y]], 0.04); break;
    case 'smirk': ln([[-0.1, y + 0.03], [0.03, y + 0.03], [0.13, y - 0.04]]); break;
    case 'side': ln([[0.0, y + 0.01], [0.14, y - 0.01]]); break;
    case 'o': fill(ell(0, y + 0.02, 0.045, 0.05, 10)); break;
    case 'O': fill(ell(0, y + 0.04, 0.08, 0.1, 12), ell(0, y + 0.11, 0.06, 0.04, 10)); break;
    case 'grin': fill([[-0.14, y - 0.02], [0.14, y - 0.02], [0.08, y + 0.1], [0, y + 0.12], [-0.08, y + 0.1]], ell(0, y + 0.11, 0.07, 0.04, 10)); break;
    case 'laugh': fill([[-0.17, y - 0.04], [0.17, y - 0.04], [0.1, y + 0.14], [0, y + 0.17], [-0.1, y + 0.14]], ell(0, y + 0.15, 0.09, 0.06, 10)); break;
    case 'wail': fill([[-0.12, y], [-0.04, y - 0.03], [0.04, y - 0.03], [0.12, y], [0.1, y + 0.12], [-0.1, y + 0.12]], ell(0, y + 0.12, 0.08, 0.04, 10)); break;
    case 'teeth': sb(ctx, [[-0.13, y - 0.03], [0.13, y - 0.03], [0.13, y + 0.06], [-0.13, y + 0.06]], '#fbf6ee', { lw: 0.045, amp: 0.004, seed: 320, wash: false }); ln([[-0.13, y + 0.015], [0.13, y + 0.015]], 0.03); [-0.065, 0, 0.065].forEach(xx => ln([[xx, y - 0.03], [xx, y + 0.06]], 0.03)); break;
    case 'roar': fill([[-0.18, y - 0.06], [0.18, y - 0.06], [0.14, y + 0.14], [-0.14, y + 0.14]]); for (let i = 0; i < 5; i++) { const xx = -0.14 + i * 0.07; sb(ctx, [[xx, y - 0.06], [xx + 0.07, y - 0.06], [xx + 0.035, y + 0.0]], '#fbf6ee', { lw: 0.025, amp: 0.002, seed: 330 + i, wash: false }); } break;
    case 'zig': ln([[-0.12, y + 0.02], [-0.06, y - 0.02], [0, y + 0.02], [0.06, y - 0.02], [0.12, y + 0.02]], 0.04); break;
    case 'tongue': ln([[-0.12, y - 0.01], [0, y + 0.04], [0.12, y - 0.01]]); sb(ctx, [[0.0, y + 0.03], [0.1, y + 0.02], [0.09, y + 0.12], [0.03, y + 0.13]], '#e8707a', { lw: 0.04, amp: 0.004, seed: 340 }); break;
    case 'blech': ln([[-0.12, y], [0.12, y]]); sb(ctx, [[-0.05, y], [0.05, y], [0.05, y + 0.12], [-0.05, y + 0.12]], '#e8707a', { lw: 0.04, amp: 0.004, seed: 341 }); break;
    case 'cat': ln([[-0.12, y - 0.01], [-0.06, y + 0.04], [0, y], [0.06, y + 0.04], [0.12, y - 0.01]], 0.04); break;
    case 'sly': fill([[-0.14, y - 0.04], [0.16, y - 0.08], [0.08, y + 0.06], [-0.08, y + 0.05]], null); ln([[-0.12, y - 0.03], [0.14, y - 0.07]], 0.02); break;
  }
}

// ---------- 31 种表情 ----------
// eyes, mouth, brow(angry/worried/raise), hands(down/out/up/cheek/hips/chin/fist/front/clasp/wave/point), sprout(up/droop/curl/stiff/fire), fx, body, tilt, squash, look
const EMO = {
  neutral: { eyes: 'dot', mouth: 'flat', hands: 'down', sprout: 'up' },
  happy: { eyes: 'happy', mouth: 'smile', hands: 'out', sprout: 'up', blush: 1 },
  excited: { eyes: 'big', mouth: 'grin', hands: 'up', sprout: 'up', fx: ['sparkle'], squash: -0.06, blush: 1 },
  laugh: { eyes: 'happy', mouth: 'laugh', hands: 'up', sprout: 'up', tilt: -0.08 },
  love: { eyes: 'heart', mouth: 'smallSmile', hands: 'cheek', sprout: 'up', fx: ['hearts'], blush: 1.5 },
  shy: { eyes: 'dot', look: [-0.8, 0.8], mouth: 'wavy', hands: 'cheek', sprout: 'droop', blush: 2, tilt: 0.1 },
  proud: { eyes: 'closed', mouth: 'smile', hands: 'hips', sprout: 'up', fx: ['sparkle'], tilt: -0.05 },
  smug: { eyes: 'half', look: [0.6, 0], mouth: 'smirk', hands: 'hips', sprout: 'up', brow: 'raise' },
  relieved: { eyes: 'closed', mouth: 'smallSmile', hands: 'down', sprout: 'droop', fx: ['drop'] },
  sad: { eyes: 'dot', look: [0, 0.9], mouth: 'frown', brow: 'worried', hands: 'down', sprout: 'droop', fx: ['rain'], body: '#c89660', squash: 0.05 },
  cry: { eyes: 'tight', mouth: 'wail', brow: 'worried', hands: 'down', sprout: 'droop', fx: ['tears'] },
  angry: { eyes: 'dot', mouth: 'teeth', brow: 'angry', hands: 'fist', sprout: 'stiff', fx: ['vein'], body: '#e08a3a' },
  furious: { eyes: 'tight', mouth: 'roar', brow: 'angry', hands: 'up', sprout: 'fire', fx: ['steam'], body: SEED.red, shake: 1 },
  scared: { eyes: 'wide', mouth: 'zig', brow: 'worried', hands: 'front', sprout: 'stiff', fx: ['drop'], body: SEED.pale, squash: -0.08 },
  surprised: { eyes: 'wide', mouth: 'O', hands: 'out', sprout: 'stiff', fx: ['bang'], squash: -0.05 },
  confused: { eyes: 'dot', mouth: 'wavy', brow: 'raise', hands: 'chin', sprout: 'curl', fx: ['question'], tilt: 0.12 },
  thinking: { eyes: 'dot', look: [0.7, -0.8], mouth: 'side', hands: 'chin', sprout: 'up', fx: ['dots'] },
  idea: { eyes: 'big', mouth: 'grin', hands: 'point', sprout: 'up', fx: ['bulb'] },
  determined: { eyes: 'dot', mouth: 'flat', brow: 'angry', hands: 'fist', sprout: 'stiff' },
  sleepy: { eyes: 'line', mouth: 'o', hands: 'down', sprout: 'curl', fx: ['zzz'], tilt: 0.1, squash: 0.04 },
  bored: { eyes: 'half', mouth: 'flat', hands: 'down', sprout: 'droop', squash: 0.06 },
  nervous: { eyes: 'small', mouth: 'zig', brow: 'worried', hands: 'clasp', sprout: 'droop', fx: ['drop'] },
  suspicious: { eyes: 'half', look: [-0.9, 0], mouth: 'side', brow: 'raise', hands: 'down', sprout: 'up', tilt: -0.08 },
  disgusted: { eyes: 'squint', mouth: 'blech', hands: 'front', sprout: 'droop', body: SEED.green, tilt: 0.15 },
  dizzy: { eyes: 'spiral', mouth: 'wavy', hands: 'out', sprout: 'curl', fx: ['stars'], tilt: 0.1 },
  cool: { eyes: 'dot', mouth: 'smirk', hands: 'hips', sprout: 'up', fx: ['shades', 'note'] },
  starstruck: { eyes: 'star', mouth: 'grin', hands: 'clasp', sprout: 'up', fx: ['sparkle2'], blush: 1 },
  KO: { eyes: 'x', mouth: 'o', hands: 'out', sprout: 'droop', fx: ['stars'], ko: 1 },
  playful: { eyes: 'wink', mouth: 'tongue', hands: 'wave', sprout: 'up', tilt: -0.1 },
  mischief: { eyes: 'half', look: [0.5, 0], mouth: 'sly', brow: 'angry', hands: 'clasp', sprout: 'curl', body: '#d8903a' },
  hopeful: { eyes: 'big', look: [0, -0.9], mouth: 'smallSmile', hands: 'clasp', sprout: 'up', fx: ['sparkle'], blush: 0.6 },
};
const EMO_ORDER = ['neutral', 'happy', 'excited', 'laugh', 'love', 'shy', 'proud', 'smug', 'relieved', 'sad', 'cry', 'angry', 'furious', 'scared', 'surprised', 'confused', 'thinking', 'idea', 'determined', 'sleepy', 'bored', 'nervous', 'suspicious', 'disgusted', 'dizzy', 'cool', 'starstruck', 'KO', 'playful', 'mischief', 'hopeful'];

const HANDS = { // 左手, 右手（单位坐标）
  down: [[-0.92, 0.42], [0.92, 0.42]], out: [[-1.12, 0.05], [1.12, 0.05]], up: [[-1.05, -0.55], [1.05, -0.55]],
  cheek: [[-0.5, 0.28], [0.5, 0.28]], hips: [[-0.95, 0.2], [0.95, 0.2]], chin: [[-0.92, 0.42], [0.25, 0.42]],
  fist: [[-0.98, 0.25], [0.98, 0.25]], front: [[-0.36, 0.34], [0.36, 0.34]], clasp: [[-0.13, 0.66], [0.13, 0.66]],
  wave: [[-0.92, 0.42], [1.1, -0.6]], point: [[-0.92, 0.42], [1.05, -0.62]],
};

function drawSeedling(ctx, x, y, s, name, t, extra = {}) {
  const e = Object.assign({ look: [0, 0], tilt: 0, squash: 0, blush: 0 }, EMO[name], extra);
  const bodyCol = e.body || SEED.body;
  ctx.save(); ctx.translate(x, y);
  // 脚下软阴影
  blob(ctx, ell(0, 0, s * 1.0, s * 0.13, 16), rgba('#5a4a3a', 0.18), { line: null, wash: false, amp: 1 });
  if (e.shake) ctx.translate(jit(5, s * 0.04), jit(6, s * 0.03));
  ctx.scale(s, s);
  const breathe = Math.sin(t * 2.4) * 0.015;
  if (e.ko) { ctx.translate(0, -0.75); ctx.rotate(-Math.PI / 2 * 0.95); ctx.translate(0, -0.1); }
  else ctx.translate(0, -1.3);
  ctx.rotate(e.tilt);
  const sq = e.squash + breathe;
  ctx.scale(1 + sq, 1 - sq);
  const lw = 0.05;
  // 腿
  if (!e.ko) [-1, 1].forEach((k, i) => { inkLine(ctx, [[k * 0.32, 0.8], [k * 0.34, 1.05], [k * 0.36, 1.28]], 0.17, INK, 10 + i, 0.006); inkLine(ctx, [[k * 0.32, 0.8], [k * 0.34, 1.05], [k * 0.36, 1.27]], 0.11, SEED.shade, 12 + i, 0.004); sb(ctx, ell(k * 0.42, 1.31, 0.16, 0.07, 10), shade(SEED.shade, -0.25), { lw: 0.035, amp: 0.006, seed: 14 + i }); });
  else [-1, 1].forEach((k, i) => { inkLine(ctx, [[k * 0.3, 0.8], [k * 0.35, 1.25]], 0.15, INK, 10 + i, 0.006); inkLine(ctx, [[k * 0.3, 0.8], [k * 0.35, 1.24]], 0.09, SEED.shade, 12 + i, 0.004); });
  // 嫩芽
  const sp = e.sprout, sway = Math.sin(t * 3) * 0.06;
  const stem = sp === 'droop' ? [[0, -1.08], [0.08, -1.3], [0.28, -1.32], [0.38, -1.18]] : sp === 'curl' ? [[0, -1.08], [0.04, -1.32], [0.18, -1.38], [0.2, -1.26], [0.1, -1.24]] : [[0, -1.08], [0.02 + sway * 0.5, -1.3], [0.04 + sway, -1.48]];
  inkLine(ctx, stem, 0.11, INK, 20, 0.006); inkLine(ctx, stem, 0.06, SEED.leaf2, 21, 0.004);
  const tip = stem[stem.length - 1];
  const leaf = (ax, ay, ang, L) => sb(ctx, [[ax, ay], [ax + Math.cos(ang - 0.5) * L * 0.55, ay + Math.sin(ang - 0.5) * L * 0.55], [ax + Math.cos(ang) * L, ay + Math.sin(ang) * L], [ax + Math.cos(ang + 0.5) * L * 0.55, ay + Math.sin(ang + 0.5) * L * 0.55]], SEED.leaf, { lw: 0.04, amp: 0.006, seed: ax * 30 + ang * 7, edge: 0.06 });
  if (sp === 'droop') leaf(tip[0], tip[1], 1.2, 0.32);
  else if (sp === 'curl') leaf(tip[0], tip[1], 3.4, 0.22);
  else if (sp === 'stiff') { leaf(tip[0], tip[1], -1.57 - 0.6, 0.36); leaf(tip[0], tip[1], -1.57 + 0.6, 0.36); }
  else { leaf(tip[0], tip[1], -1.57 - 0.75 + sway, 0.36); leaf(tip[0], tip[1], -1.57 + 0.75 + sway, 0.4); }
  if (sp === 'fire') { leaf(tip[0], tip[1], -1.57, 0.3); flameTop(ctx, tip[0], tip[1] - 0.12, 0.55, t); }
  // 身体（竖种子形）
  const body = [[0, -1.15], [0.38, -1.0], [0.66, -0.6], [0.84, -0.05], [0.84, 0.38], [0.66, 0.74], [0.3, 0.92], [0, 0.95], [-0.3, 0.92], [-0.66, 0.74], [-0.84, 0.38], [-0.84, -0.05], [-0.66, -0.6], [-0.38, -1.0]];
  sb(ctx, body, bodyCol, { lw, amp: 0.008, seed: 30, edge: 0.14 });
  ctx.save(); trace(ctx, body, true); ctx.clip();
  sb(ctx, ell(0.05, 0.55, 0.5, 0.36, 14), SEED.belly, { line: null, amp: 0.006, alpha: 0.85, wash: false });
  sb(ctx, ell(-0.45, -0.55, 0.12, 0.3, 10, 0.4), rgba('#fff4d8', 0.5), { line: null, wash: false });
  inkLine(ctx, [[0.0, -1.1], [0.05, -0.75]], 0.025, rgba('#7a4a1a', 0.5), 31, 0.004); // 种子缝线
  ctx.restore();
  ctx.__bodyCol = bodyCol;
  // 腮红
  if (e.blush) [-1, 1].forEach(k => { sb(ctx, ell(k * 0.48, 0.12, 0.14, 0.07, 10), rgba('#ef8a8a', 0.45 * Math.min(1, e.blush)), { line: null, wash: false }); if (e.blush > 1.2) for (let i = 0; i < 3; i++) inkLine(ctx, [[k * 0.42 - 0.07 + i * 0.06, 0.08], [k * 0.42 - 0.1 + i * 0.06, 0.16]], 0.022, '#d8606a', 40 + i, 0.003); });
  // 眼
  const ex = 0.3, ey = -0.12;
  if (e.eyes === 'wink') { eye(ctx, -ex, ey, 'dot', -1, e.look, t); eye(ctx, ex, ey, 'happy', 1, e.look, t); }
  else if (e.blink) { eye(ctx, -ex, ey, 'line', -1, e.look, t); eye(ctx, ex, ey, 'line', 1, e.look, t); }
  else { eye(ctx, -ex, ey, e.eyes, -1, e.look, t); eye(ctx, ex, ey, e.eyes, 1, e.look, t); }
  // 眉
  if (e.brow === 'angry') { inkLine(ctx, [[-0.44, -0.36], [-0.18, -0.26]], 0.055, INK, 50, 0.004); inkLine(ctx, [[0.44, -0.36], [0.18, -0.26]], 0.055, INK, 51, 0.004); }
  if (e.brow === 'worried') { inkLine(ctx, [[-0.44, -0.27], [-0.18, -0.36]], 0.05, INK, 52, 0.004); inkLine(ctx, [[0.44, -0.27], [0.18, -0.36]], 0.05, INK, 53, 0.004); }
  if (e.brow === 'raise') { inkLine(ctx, [[-0.44, -0.3], [-0.18, -0.3]], 0.05, INK, 54, 0.004); inkLine(ctx, [[0.16, -0.36], [0.3, -0.44], [0.44, -0.38]], 0.05, INK, 55, 0.004); }
  mouth(ctx, e.mouth, t);
  // 泪
  if ((e.fx || []).includes('tears')) [-1, 1].forEach((k, i) => { sb(ctx, [[k * 0.26, -0.04], [k * 0.36, -0.04], [k * 0.4, 0.62], [k * 0.22, 0.62]], rgba('#8ccaf0', 0.85), { lw: 0.03, line: '#4a8ac8', amp: 0.006, seed: 60 + i }); drop(ctx, k * 0.31, 0.72 + ((t * 0.8 + i * 0.5) % 1) * 0.3, 0.05); });
  // 墨镜
  if ((e.fx || []).includes('shades')) { sb(ctx, [[-0.5, -0.24], [-0.06, -0.24], [-0.1, 0.0], [-0.42, 0.0]], '#2e2838', { lw: 0.04, amp: 0.004, seed: 70 }); sb(ctx, [[0.06, -0.24], [0.5, -0.24], [0.42, 0.0], [0.1, 0.0]], '#2e2838', { lw: 0.04, amp: 0.004, seed: 71 }); inkLine(ctx, [[-0.06, -0.2], [0.06, -0.2]], 0.04, INK, 72, 0.003); sb(ctx, [[-0.42, -0.2], [-0.32, -0.2], [-0.38, -0.08]], rgba('#ffffff', 0.5), { line: null, wash: false }); }
  // 手
  const H = HANDS[e.hands];
  H.forEach(([hx, hy], i) => {
    const k = i ? 1 : -1, bx = k * 0.78, by = 0.12;
    let wy = hy; if (e.hands === 'wave' && i) wy += Math.sin(t * 8) * 0.06;
    if (e.hands === 'clasp') { // 双手合握：两侧手臂收拢，合成一个圆块
      inkLine(ctx, [[bx, by], [k * 0.45, 0.6], [k * 0.12, 0.66]], 0.13, INK, 82 + i, 0.005);
      inkLine(ctx, [[bx, by], [k * 0.45, 0.6], [k * 0.12, 0.66]], 0.075, SEED.shade, 84 + i, 0.004);
      if (i) { sb(ctx, ell(0, 0.66, 0.22, 0.13, 12), bodyCol, { lw: 0.045, seed: 89, edge: 0.05 }); inkLine(ctx, [[0, 0.56], [0, 0.72]], 0.03, INK, 90, 0.003); }
      return;
    }
    inkLine(ctx, [[bx, by], [lerp(bx, hx, 0.5), lerp(by, wy, 0.5) + 0.03], [hx, wy]], 0.13, INK, 82 + i, 0.005);
    inkLine(ctx, [[bx, by], [lerp(bx, hx, 0.5), lerp(by, wy, 0.5) + 0.03], [hx, wy]], 0.075, SEED.shade, 84 + i, 0.004);
    sb(ctx, ell(hx, wy, e.hands === 'fist' ? 0.13 : 0.12, 0.12, 10), bodyCol, { lw: 0.045, amp: 0.006, seed: 86 + i, edge: 0.05 });
    if (e.hands === 'point' && i) inkLine(ctx, [[hx, wy - 0.08], [hx + 0.02, wy - 0.24]], 0.08, INK, 88, 0.004);
  });
  // 周边符号
  (e.fx || []).forEach(f => {
    if (f === 'sparkle') { sparkle(ctx, 0.95, -1.0, 0.14 + 0.03 * Math.sin(t * 5)); sparkle(ctx, 1.15, -0.7, 0.08); }
    if (f === 'sparkle2') { sparkle(ctx, -1.0, -0.9, 0.12); sparkle(ctx, 1.05, -1.05, 0.15); sparkle(ctx, 1.2, -0.55, 0.08); }
    if (f === 'hearts') { heart(ctx, 0.7, -1.3 - Math.sin(t * 2) * 0.05, 0.13, '#e8506a'); heart(ctx, 1.0, -1.05, 0.09, '#e8506a'); }
    if (f === 'drop') drop(ctx, 0.95, -0.85, 0.09);
    if (f === 'rain') rainCloud(ctx, 0, -1.85, t);
    if (f === 'vein') vein(ctx, 0.95, -0.95, 0.15);
    if (f === 'steam') { steam(ctx, -0.9, -0.9, 0.18, t, -1); steam(ctx, 0.9, -0.9, 0.18, t + 0.3, 1); }
    if (f === 'bang') bang(ctx, 1.0, -1.05, 0.25);
    if (f === 'question') question(ctx, 1.0, -1.1, 0.32);
    if (f === 'dots') dots3(ctx, 0.8, -1.1, 0.28);
    if (f === 'bulb') bulb(ctx, 0.0, -1.95, 0.17, t);
    if (f === 'zzz') zzz(ctx, 0.75, -1.1, 0.12, t);
    if (f === 'note') note(ctx, 1.05, -1.0, 0.18);
    if (f === 'stars') for (let i = 0; i < 3; i++) { const a = t * 2.5 + i / 3 * Math.PI * 2; sparkle(ctx, Math.cos(a) * 0.55, -1.35 + Math.sin(a) * 0.12, 0.1, '#f6c84a'); }
  });
  ctx.restore();
}
