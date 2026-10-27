// 「豆豆」设计图：用 p5.brush 水彩笔刷画（画法参考 opus-video-skills/painted-animation 的 paint / inkLine 思路，角色为原创）
// 页面端脚本：依赖 p5 2.2 + p5.brush 2.2.3；所有标记都走 paint() / inkLine()，不用 p5 原生图形
const SW = 1920, SH = 1080;
const C = { body: '#f8eedb', limb: '#dcc69c', limbFar: '#c3ab80', side: '#d6b98c', pool: '#e2c896', line: '#7a6a58', eye: '#2a2230', blush: '#f09a98',
  scal: '#79ad4a', scalDk: '#4e7f2e', mouth: '#5a1f22', tongue: '#e48890', tooth: '#fbf4e6', shadow: '#9d93b6', star: '#f2cc52', ink: '#2a2230' };
const TW = 1.7, TD = 1.15, TH = 1.45, TLEG = 0.3;
const VIEW = { front: 0, q: 0.61, side: Math.PI / 2, qback: Math.PI - 0.61, back: Math.PI };
const LIGHT = [-0.55, 0.835];
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lp = (a, b, u) => a + (b - a) * u;

// ---------- 坐标：手动仿射矩阵（不依赖 p5 的 scale，线宽才不会被放大） ----------
let M = [1, 0, 0, 1, 0, 0], S = 1;
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const tr = (x, y) => [1, 0, 0, 1, x, y], sc = (a, b = a) => [a, 0, 0, b, 0, 0], ro = t => [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0];
const T = ([x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
function withM(extra, fn) { const keep = M; M = mul(M, extra); fn(); M = keep; }

// ---------- 两个基本笔法 ----------
function paint(pts, o = {}) {
  const P = pts.map(T);
  if (o.wash || o.fill) {
    brush.noStroke(); brush.noHatch();
    if (o.wash) brush.wash(o.wash, o.washOp ?? 255); else brush.noWash();
    if (o.fill) { brush.fill(o.fill, o.fillOp ?? 170); brush.fillBleed(o.bleed ?? 0.1); brush.fillTexture(o.tex ?? 0.4, o.border ?? 0.35); } else brush.noFill();
    brush.polygon(P);
    brush.noWash(); brush.noFill();
    if (o.fill) flushBrush();
  }
  if (o.ink !== null) {
    brush.noFill(); brush.noWash();
    brush.set(o.br || 'ink', o.ink || C.ink, (o.sw ?? 0.011) * S);
    brush.beginShape(o.curv ?? 0);
    P.forEach((q, i) => brush.vertex(q[0], q[1], o.pr ? o.pr[i] : 1));
    brush.endShape(true);
  }
}
// 和仓库 core.js 一样：水彩 fill 是延迟合成的，画完后用一个屏幕外的极小 fill 把它压实，避免后面的 wash 丢失
function flushBrush() { brush.noStroke(); brush.fill('#000000', 1); brush.fillBleed(0); brush.fillTexture(0, 0); brush.polygon([[-60, -60], [-58, -60], [-58, -58]]); brush.noFill(); }
function inkLine(pts, sw, col = C.ink, br = 'ink', curv = 0.5) {
  brush.noFill(); brush.noWash(); brush.set(br, col, Math.max(0.36, sw * S)); // 太细的笔画会被笔刷吞掉，给个下限
  const P = pts.map(T);
  if (P.length === 2) brush.line(P[0][0], P[0][1], P[1][0], P[1][1]); // spline 至少要 3 个点
  else brush.spline(P, curv);
}
const ellP = (cx, cy, rx, ry, n = 18, rot = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });
// 线宽层级（乘以角色尺寸 S）：外轮廓 / 近处四肢 / 远处四肢 / 分面线和五官细线
const W_BODY = 0.0115, W_NEAR = 0.0085, W_FAR = 0.0068, W_FINE = 0.0075;

// ---------- 2.5D 几何 ----------
function geo(th) {
  const c = Math.cos(th), s = Math.sin(th), px = (x, z) => x * c + z * s;
  const F = [['front', [-TW / 2, TD / 2], [TW / 2, TD / 2], [0, 1]], ['right', [TW / 2, TD / 2], [TW / 2, -TD / 2], [1, 0]], ['back', [TW / 2, -TD / 2], [-TW / 2, -TD / 2], [0, -1]], ['left', [-TW / 2, -TD / 2], [-TW / 2, TD / 2], [-1, 0]]]
    .map(([n, a, b, nr]) => { const nx = nr[0] * c + nr[1] * s, nz = -nr[0] * s + nr[1] * c, x0 = px(...a), x1 = px(...b); return { n, nx, nz, x0: Math.min(x0, x1), x1: Math.max(x0, x1) }; });
  const vis = F.filter(f => f.nz > 0.02);
  return { c, s, px, F, vis, xmin: Math.min(...vis.map(f => f.x0)), xmax: Math.max(...vis.map(f => f.x1)), depth: (x, z) => -x * s + z * c };
}
// 方块外轮廓：一整笔闭合，压力按空间分配——顶边最重、底边次之、背光右边中等、受光左边最轻
function boxOutline(x0, x1, y0, y1, sw) {
  const pts = [], pr = [], edge = (a, b, p, n = 5) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([lp(a[0], b[0], u), lp(a[1], b[1], u)]); pr.push(p); } };
  const ym = (y0 + y1) / 2; // 从受光的左边中点起笔，收笔也落在左边
  edge([x0, ym], [x0, y0], 0.8, 3); edge([x0, y0], [x1, y0], 1.25); edge([x1, y0], [x1, y1], 0.95); edge([x1, y1], [x0, y1], 1.1); edge([x0, y1], [x0, ym], 0.8, 3);
  paint(pts, { ink: C.ink, sw, pr, curv: 0 });
}
function body(G, y0, y1) {
  const x0 = G.xmin, x1 = G.xmax, h = y1 - y0, rect = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  paint(rect, { wash: C.body, ink: null });
  // 颜料在下部堆积：一层暖棕水彩，带晕边
  paint([[x0 + 0.03, y0 + h * 0.6], [x1 - 0.03, y0 + h * 0.64], [x1 - 0.03, y1 - 0.03], [x0 + 0.03, y1 - 0.03]], { fill: C.pool, fillOp: 70, bleed: 0.06, tex: 0.6, border: 0.3, ink: null });
  // 背光的面：叠一层水彩暗面
  G.vis.forEach(f => { const dot = f.nx * LIGHT[0] + f.nz * LIGHT[1], a = cl((0.9 - dot) * 0.32, 0, 0.3); if (a > 0.03) paint([[f.x0 + 0.02, y0 + 0.02], [f.x1 - 0.02, y0 + 0.02], [f.x1 - 0.02, y1 - 0.02], [f.x0 + 0.02, y1 - 0.02]], { fill: C.side, fillOp: 60 + a * 330, bleed: 0.04, tex: 0.55, border: 0.4, ink: null }); });
  // 分面线：最细一级
  G.vis.map(f => f.x0).filter(x => x > x0 + 0.02).forEach(x => inkLine([[x, y0 + 0.05], [x + 0.006, (y0 + y1) / 2], [x, y1 - 0.05]], W_FINE * 0.75, C.line, 'inkfine', 0.5));
  boxOutline(x0, x1, y0, y1, W_BODY);
}
function face(G, y, expr) {
  const f = G.F[0], edge = f.nz <= 0.15 && G.c > -0.05;
  if (f.nz <= 0.15 && !edge) return;
  const fx = edge ? G.xmax - 0.1 : (f.x0 + f.x1) / 2, k = edge ? 0.4 : (f.x1 - f.x0) / TW;
  const eyes = edge ? [fx] : [fx - TW * 0.2 * k, fx + TW * 0.2 * k];
  eyes.forEach((ex, i) => {
    const sd = eyes.length === 1 ? 1 : (i ? 1 : -1);
    if (expr === 'happy') inkLine([[ex - 0.1 * k, y + 0.05], [ex, y - 0.06], [ex + 0.1 * k, y + 0.05]], W_NEAR * 1.1, C.eye, 'ink', 0.3);
    else if (expr === 'angry') inkLine([[ex - sd * 0.09 * k, y - 0.08], [ex + sd * 0.08 * k, y], [ex - sd * 0.09 * k, y + 0.08]], W_NEAR * 1.1, C.eye, 'ink', 0.1);
    else { const r = expr === 'surprised' ? 1.3 : 1; paint(ellP(ex, y, 0.085 * k * r, 0.095 * r, 16), { wash: C.eye, ink: null }); paint(ellP(ex - 0.03 * k * r, y - 0.035 * r, 0.026 * k, 0.03, 10), { wash: C.tooth, ink: null }); }
    if (!edge) paint(ellP(ex + sd * 0.07 * k, y + 0.19, 0.11 * k, 0.05, 14), { fill: C.blush, fillOp: 90, bleed: 0.12, tex: 0.3, border: 0.2, ink: null });
  });
  if (edge) return;
  const my = y + 0.17;
  if (expr === 'surprised') paint(ellP(fx, my + 0.04, 0.07 * k, 0.085, 14), { wash: C.mouth, ink: C.ink, sw: W_FINE * 0.8, br: 'inkfine', curv: 0.5 });
  else if (expr === 'happy') paint([[fx - 0.1 * k, my - 0.02], [fx + 0.1 * k, my - 0.02], [fx + 0.05 * k, my + 0.08], [fx - 0.05 * k, my + 0.08]], { wash: C.mouth, ink: C.ink, sw: W_FINE * 0.8, br: 'inkfine', curv: 0.4 });
  else if (expr === 'neutral') inkLine([[fx - 0.07 * k, my], [fx - 0.025 * k, my + 0.035], [fx, my + 0.012], [fx + 0.025 * k, my + 0.035], [fx + 0.07 * k, my]], W_FINE * 0.8, C.eye, 'inkfine', 0.5);
}
function scallion(G, top) {
  const k = 0.35 + 0.65 * Math.abs(G.c), sg = G.c >= 0 ? 1 : -1;
  const blade = (tx, ty, w) => paint([[-w, top + 0.03], [tx * 0.45 - w * 0.6, top + ty * 0.55], [tx, top + ty], [tx * 0.45 + w * 0.6, top + ty * 0.5], [w, top + 0.03]], { wash: C.scal, ink: C.ink, sw: W_FAR, curv: 0.4 });
  blade(-0.12 * k * sg, -0.36, 0.05); blade(0.17 * k * sg, -0.28, 0.045);
  paint(ellP(0, top + 0.01, 0.07, 0.04, 12), { wash: C.scalDk, ink: C.ink, sw: W_FINE * 0.7, br: 'inkfine', curv: 0.5 });
}
function tab(a, b, w, near, mitten) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2, col = near ? C.limb : C.limbFar;
  paint([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], { wash: col, ink: C.ink, sw: near ? W_NEAR : W_FAR });
  if (mitten) paint(ellP(b[0], b[1], w * 0.62, w * 0.6, 14), { wash: col, ink: C.ink, sw: near ? W_NEAR : W_FAR, curv: 0.5 });
}

// ---------- 一个角色 ----------
function tofu(x, y, s, o) {
  o = Object.assign({ view: 'front', expr: 'neutral', legs: 'stand', walk: 0, arms: 'out', lift: 0, lean: 0, lid: 0, acc: null, sx: 1, sy: 1 }, o);
  const th = typeof o.view === 'number' ? o.view : VIEW[o.view], G = geo(th), bot = -TLEG, top = bot - TH, ey = top + TH * 0.4;
  S = s;
  // 地上的淡紫水渍（在屏幕坐标里画，不跟着倾斜）
  M = mul(tr(x, y), sc(s));
  const sw0 = (G.xmax - G.xmin) * 0.55 * (1 - o.lift * 0.45) * Math.max(1, o.sx);
  paint(ellP(0.06, 0.02, sw0, 0.12 * (1 - o.lift * 0.3), 22), { fill: C.shadow, fillOp: 120 * (1 - o.lift * 0.5), bleed: 0.06, tex: 0.7, border: 0.3, ink: null });
  M = mul(mul(mul(tr(x, y), sc(s)), mul(tr(0, -o.lift), ro(o.lean))), sc(o.sx, o.sy));
  const legs = [-1, 1].map((k, i) => {
    const wx = k * TW * 0.24, xx = G.px(wx, 0), z = G.depth(wx, 0);
    const st = o.legs === 'walk' ? Math.sign(z || (i ? 1 : -1)) * Math.abs(Math.sin(o.walk)) : 0;
    const ax = xx + z * 0.12 + st * 0.07 * G.s;
    return { a: [ax, bot - 0.08], b: [ax + st * 0.3 * G.s, -Math.max(0, -st) * 0.05], z };
  }).sort((p, q) => p.z - q.z);
  legs.forEach((L, i) => tab(L.a, L.b, 0.22, Math.abs(legs[0].z - legs[1].z) < 0.3 || i === 1, false));
  const ay = top + TH * 0.6;
  const arms = [-1, 1].map((k, i) => {
    const wx = k * TW / 2, root = [G.px(wx, 0), ay], z = G.depth(wx, 0); let v;
    if (o.arms === 'up') v = [Math.sign(root[0] || k) * 0.1, -0.52];
    else if (o.arms === 'raise') v = [Math.sign(root[0] || k) * 0.4, -0.34];
    else if (o.arms === 'back') v = [-0.46, 0.1];
    else if (o.arms === 'swing') { const sw = Math.sin(o.walk + (i ? Math.PI : 0)) * 0.7; v = [Math.sin(sw) * 0.4, Math.cos(sw) * 0.34]; }
    else { const dx = k * G.c + 0.28 * G.s; v = Math.abs(dx) < 0.35 ? [0.26 * Math.sign(G.s || 1), 0.22] : [dx * 0.46, 0.13 + (1 - Math.min(1, Math.abs(dx))) * 0.1]; }
    return { a: root, b: [root[0] + v[0], root[1] + v[1]], z };
  });
  arms.filter(A => A.z < -0.05).forEach(A => tab(A.a, A.b, 0.15, false, true));
  const hat = ['guapi', 'douli', 'tiger', 'phoenix', 'wusha'].includes(o.acc);
  if (o.lid) lidBody(G, top, bot, o, hat);
  else { if (!hat) scallion(G, top); body(G, top, bot); face(G, ey, o.expr); }
  arms.filter(A => A.z >= -0.05).forEach(A => tab(A.a, A.b, 0.15, true, true));
  if (o.acc) acc(o.acc, G, top, bot, arms);
}
function lidBody(G, top, bot, o, hat) {
  const cut = top + TH * 0.52, hx = G.xmax, xl = G.xmin, ang = o.lid;
  const R = ([x, y]) => [hx + (x - hx) * Math.cos(ang) - (y - cut) * Math.sin(ang), cut + (x - hx) * Math.sin(ang) + (y - cut) * Math.cos(ang)];
  const edgePts = []; for (let i = 0; i <= 8; i++) edgePts.push(R([lp(hx, xl, i / 8), cut]));
  paint([[xl, cut], [hx, cut]].concat(edgePts.slice(1)), { wash: C.mouth, ink: C.ink, sw: W_NEAR });
  paint(ellP(-0.15, cut - 0.06, 0.5, 0.1, 16), { fill: C.tongue, fillOp: 200, bleed: 0.05, tex: 0.3, border: 0.2, ink: null });
  for (let i = 0; i < 6; i++) { const x0 = lp(xl + 0.15, hx - 0.3, i / 5), w = 0.08; paint([[x0 - w, cut], [x0 + w, cut], [x0, cut - 0.14]], { wash: C.tooth, ink: C.ink, sw: W_FINE * 0.55, br: 'inkfine' }); }
  body(G, cut, bot);
  withM(mul(mul(tr(hx, cut), ro(ang)), tr(-hx, -cut)), () => {
    for (let i = 0; i < 6; i++) { const x0 = lp(xl + 0.2, hx - 0.25, i / 5), w = 0.075; paint([[x0 - w, cut], [x0 + w, cut], [x0, cut + 0.14]], { wash: C.tooth, ink: C.ink, sw: W_FINE * 0.55, br: 'inkfine' }); }
    if (!hat) scallion(G, top);
    body(G, top, cut);
    face(G, top + TH * 0.3, 'angry');
  });
}
function star(x, y, r) { const p = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.3 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } paint(p, { wash: C.star, ink: C.ink, sw: W_FINE * 0.8, br: 'inkfine' }); }
function bang(x, y, r) { paint([[x - r * 0.16, y - r], [x + r * 0.2, y - r], [x + r * 0.07, y + r * 0.35], [x - r * 0.06, y + r * 0.35]], { wash: C.star, ink: C.ink, sw: W_FINE * 0.8, br: 'inkfine' }); paint(ellP(x, y + r * 0.66, r * 0.13, r * 0.13, 12), { wash: C.star, ink: C.ink, sw: W_FINE * 0.8, br: 'inkfine', curv: 0.5 }); }

// ---------- 中国风配饰（耳机、蝴蝶结保留） ----------
function acc(a, G, top, bot, arms) {
  const tx = 0, ty = top + 0.02, ey = top + TH * 0.4;
  const part = (p, col, curv = 0) => paint(p, { wash: col, ink: C.ink, sw: W_NEAR, curv });
  const thin = (p, col) => inkLine(p, W_FINE * 0.8, col, 'inkfine', 0.5);
  const dome = (rx, h, col) => { const p = []; for (let i = 0; i <= 14; i++) { const t = Math.PI + i / 14 * Math.PI; p.push([tx + Math.cos(t) * rx, ty + Math.sin(t) * h]); } part(p, col, 0.3); };
  const brim = (rx, col) => part([[tx - rx, ty - 0.04], [tx + rx, ty - 0.04], [tx + rx * 0.96, ty + 0.06], [tx - rx * 0.96, ty + 0.06]], col);
  const dot = (x, y, r, col) => paint(ellP(x, y, r, r, 10), { wash: col, ink: null });
  switch (a) {
    case 'guapi': dome(0.62, 0.44, '#2f2a38'); [-0.3, 0, 0.3].forEach(k => thin([[tx + k * 0.25, ty - 0.42], [tx + k, ty - 0.04]], '#8a8498')); brim(0.66, '#3a3448'); part(ellP(tx, ty - 0.48, 0.09, 0.09, 12), '#c8342a', 0.5); break;
    case 'douli': part([[tx - 1.4, ty + 0.02], [tx, ty - 0.68], [tx + 1.4, ty + 0.02], [tx + 1.35, ty + 0.1], [tx - 1.35, ty + 0.1]], '#d6b676'); for (let i = 1; i < 4; i++) thin([[tx - 1.4 * i / 4, ty + 0.02 - 0.7 * (1 - i / 4)], [tx + 1.4 * i / 4, ty + 0.02 - 0.7 * (1 - i / 4)]], '#9a7a40'); break;
    case 'tiger': [-1, 1].forEach(k => part(ellP(tx + k * 0.48, ty - 0.4, 0.16, 0.16, 14), '#ec9a30', 0.5)); dome(0.66, 0.46, '#ec9a30'); [-0.12, 0, 0.12].forEach(d => thin([[tx - 0.17, ty - 0.25 + d], [tx + 0.17, ty - 0.25 + d]], '#2f2a38')); brim(0.7, '#c8342a'); break;
    case 'phoenix': part([[tx - 0.55, ty + 0.05], [tx - 0.6, ty - 0.34], [tx - 0.28, ty - 0.17], [tx, ty - 0.52], [tx + 0.28, ty - 0.17], [tx + 0.6, ty - 0.34], [tx + 0.55, ty + 0.05]], '#e4b23c'); part(ellP(tx, ty - 0.21, 0.08, 0.1, 12), '#c8342a', 0.5); [-1, 1].forEach(k => { thin([[tx + k * 0.57, ty], [tx + k * 0.7, ty + 0.44]], '#a8822a'); [0, 1, 2].forEach(j => dot(tx + k * (0.6 + j * 0.035), ty + 0.12 + j * 0.13, 0.04, '#fbf4e6')); }); break;
    case 'wusha': [-1, 1].forEach(k => { thin([[tx + k * 0.45, ty - 0.16], [tx + k * 1.12, ty - 0.26]], C.ink); part(ellP(tx + k * 1.2, ty - 0.27, 0.19, 0.08, 14, k * 0.1), '#2f2a38', 0.5); }); dome(0.5, 0.52, '#2f2a38'); brim(0.6, '#2f2a38'); break;
    case 'hairpin': inkLine([[tx - 0.52, ty - 0.46], [tx + 0.3, ty + 0.1]], W_NEAR * 1.2, '#a8822a', 'ink', 0.2); part(ellP(tx - 0.54, ty - 0.48, 0.08, 0.08, 12), '#e04a6a', 0.5); thin([[tx - 0.54, ty - 0.41], [tx - 0.59, ty - 0.13]], '#c8342a'); part([[tx - 0.64, ty - 0.14], [tx - 0.54, ty - 0.14], [tx - 0.52, ty + 0.09], [tx - 0.66, ty + 0.09]], '#c8342a'); break;
    case 'knot': { const hw = (G.xmax - G.xmin) / 2, x = hw + 0.14, y = top + TH * 0.62; thin([[hw - 0.02, top + TH * 0.35], [x, y - 0.2]], '#c8342a'); part([[x, y - 0.2], [x + 0.2, y], [x, y + 0.2], [x - 0.2, y]], '#c8342a'); part([[x - 0.05, y + 0.2], [x + 0.05, y + 0.2], [x + 0.09, y + 0.5], [x - 0.09, y + 0.5]], '#c8342a'); break; }
    case 'lock': { const cy = top + TH * 0.78; thin([[-0.55, cy - 0.5], [-0.3, cy - 0.06], [0, cy + 0.02], [0.3, cy - 0.06], [0.55, cy - 0.5]], '#9aa0ac'); part([[-0.24, cy + 0.02], [0.24, cy + 0.02], [0.2, cy + 0.2], [0, cy + 0.3], [-0.2, cy + 0.2]], '#d8dce4', 0.2); break; }
    case 'fan': { const h = arms[1].b, fx = h[0] + 0.12, fy = h[1] - 0.44; inkLine([[h[0], h[1]], [fx, fy + 0.26]], W_NEAR, '#8a5a3a', 'ink', 0.2); part(ellP(fx, fy, 0.33, 0.33, 20), '#fbf2e4', 0.5); thin([[fx - 0.2, fy + 0.18], [fx, fy], [fx + 0.12, fy - 0.17]], '#5a4030'); [[fx - 0.02, fy - 0.02], [fx + 0.12, fy - 0.15], [fx - 0.13, fy + 0.1]].forEach(([px, py]) => dot(px, py, 0.045, '#ef7aa0')); break; }
    case 'opera': part([[-0.7, ey - 0.2], [0, ey - 0.3], [0.7, ey - 0.2], [0.62, ey + 0.2], [0.2, ey + 0.18], [0, ey + 0.08], [-0.2, ey + 0.18], [-0.62, ey + 0.2]], '#fbf4e6', 0.2); [-1, 1].forEach(k => { paint([[k * 0.12, ey - 0.2], [k * 0.6, ey - 0.22], [k * 0.5, ey - 0.1]], { wash: '#2f2a38', ink: null }); dot(k * 0.34, ey + 0.02, 0.08, '#2f2a38'); paint(ellP(k * 0.4, ey + 0.13, 0.12, 0.05, 12), { fill: '#c8342a', fillOp: 160, bleed: 0.05, tex: 0.3, border: 0.2, ink: null }); }); break;
    case 'collar': part([[G.xmin - 0.02, top + 0.06], [G.xmax + 0.02, top + 0.06], [G.xmax + 0.02, top + 0.24], [G.xmin - 0.02, top + 0.24]], '#2e5aa8'); [0, 0.14].forEach(d => inkLine([[-0.12, top + 0.36 + d], [0.12, top + 0.36 + d]], W_NEAR, '#e4b23c', 'ink', 0)); break;
    case 'plum': for (let i = 0; i < 5; i++) { const t = i / 5 * Math.PI * 2 - Math.PI / 2; part(ellP(tx + 0.5 + Math.cos(t) * 0.09, ty - 0.02 + Math.sin(t) * 0.09, 0.07, 0.07, 10), '#f490b0', 0.5); } dot(tx + 0.5, ty - 0.02, 0.04, '#f6c84a'); break;
    case 'panda': inkLine([[G.xmin + 0.05, ty + 0.12], [tx - 0.45, ty - 0.18], [tx, ty - 0.26], [tx + 0.45, ty - 0.18], [G.xmax - 0.05, ty + 0.12]], W_NEAR * 1.3, '#2f2a38', 'ink', 0.5); [-1, 1].forEach(k => part(ellP(tx + k * 0.5, ty - 0.27, 0.18, 0.18, 14), '#2f2a38', 0.5)); break;
    case 'headphones': { const lx = G.xmin - 0.02, rx = G.xmax + 0.02, cy = top + TH * 0.42; inkLine([[lx, cy], [lx + 0.06, ty - 0.12], [tx, ty - 0.3], [rx - 0.06, ty - 0.12], [rx, cy]], W_NEAR * 1.6, '#2f2a38', 'ink', 0.5); [lx, rx].forEach(px => part(ellP(px, cy, 0.13, 0.22, 14), '#7a5ac8', 0.5)); break; }
    case 'bow': part([[tx + 0.42, ty - 0.02], [tx + 0.18, ty - 0.18], [tx + 0.2, ty + 0.12]], '#ef7aa8'); part([[tx + 0.42, ty - 0.02], [tx + 0.66, ty - 0.18], [tx + 0.64, ty + 0.12]], '#ef7aa8'); dot(tx + 0.42, ty - 0.02, 0.05, '#d8507a'); break;
  }
}

// 笔刷系统第一次画线时会重置缓冲，之前画的平涂会丢：开画前先用纸色画一笔看不见的线"预热"
function warmUp() { brush.set('inkfine', '#f1e8d6', 0.1); brush.line(1, 1, 2, 1); brush.noStroke(); }
// ---------- 整张设计图 ----------
const LABELS = [];
function sheetDraw() {
  warmUp();
  const ground = y => { M = [1, 0, 0, 1, 0, 0]; S = 1; brush.noFill(); brush.noWash(); brush.set('inkfine', '#8f8696', 0.32); brush.line(30, y, 1890, y + 1); };
  // 第 1 行：转面
  ground(425);
  [['front', 'FRONT'], ['q', 'Q'], ['side', 'SIDE'], ['qback', 'QBACK'], ['back', 'BACK']].forEach(([v, l], i) => { const cx = 240 + i * 360; tofu(cx, 425, 112, { view: v }); LABELS.push([l, cx, 468, 22]); });
  // 第 2 行：动作
  ground(735); const s = 74, Y = 735;
  tofu(180, Y - 4, s, { view: 'side', legs: 'walk', walk: 1.25, arms: 'swing', lean: 0.05 }); LABELS.push(['WALK (SIDE)', 180, 772, 22]);
  tofu(490, Y, s, { view: 1.1, arms: 'out' }); LABELS.push(['TURN / SPINVIEW', 490, 772, 22]);
  // SMEAR：干笔刷痕 + 速度线
  M = [1, 0, 0, 1, 0, 0]; S = 1;
  for (let i = 0; i < 7; i++) { const yy = Y - s * (TLEG + 0.15 + i * 0.19); brush.noFill(); brush.noWash(); brush.set('dry', '#d2b07c', 0.55); brush.line(840 - s * 0.55, yy, 840 - s * (1.4 + (i % 3) * 0.3), yy + 2); }
  for (let i = 0; i < 3; i++) { brush.set('inkfine', '#4a4250', 0.3); brush.line(840 - s * 1.2, Y - s * (0.75 + i * 0.4), 840 - s * 1.9, Y - s * (0.77 + i * 0.4)); }
  tofu(840, Y, s, { view: 'side', lean: 0.1, arms: 'back', sx: 1.15, sy: 0.93 });
  M = mul(tr(840, Y), sc(s)); S = s; star(1.2, -2.05, 0.3); star(1.52, -1.75, 0.14); LABELS.push(['SMEAR', 820, 772, 22]);
  tofu(1120, Y, s, { expr: 'happy', arms: 'raise', lift: 0.28 }); LABELS.push(['JUMP', 1120, 772, 22]);
  tofu(1430, Y, s, { expr: 'surprised', arms: 'up', sy: 1.06 }); M = mul(tr(1430, Y), sc(s)); S = s; bang(1.15, -2.15, 0.38); LABELS.push(['TAKE', 1430, 772, 22]);
  tofu(1740, Y, s, { lid: 0.55, arms: 'out' }); LABELS.push(['LID', 1740, 772, 22]);
  // 第 3 行：配饰
  ground(985);
  [['guapi', 'GUAPI'], ['douli', 'DOULI'], ['tiger', 'TIGER'], ['phoenix', 'PHOENIX'], ['wusha', 'WUSHA'], ['hairpin', 'HAIRPIN'], ['knot', 'KNOT'], ['lock', 'LOCK'], ['fan', 'FAN'], ['opera', 'OPERA'], ['collar', 'COLLAR'], ['plum', 'PLUM'], ['panda', 'PANDA'], ['headphones', 'HEADPHONES'], ['bow', 'BOW']].forEach(([a, l], i) => {
    const cx = 80 + i * 126.5; tofu(cx, 985, 41, { acc: a, expr: a === 'headphones' ? 'happy' : 'neutral' }); LABELS.push([l, cx, 1020, 15]);
  });
}
// 只画一个正面（用于先看笔触）
function testDraw() { warmUp(); tofu(480, 470, 230, { view: 'front' }); }
