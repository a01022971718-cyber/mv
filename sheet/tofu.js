// 原创角色"豆豆"：一块小豆腐（奶白色、接近立方体、两条短腿、圆手、圆点眼 + 腮红、头顶一小撮葱）
// 2.5D：平视；转动时正面/侧面互换宽度，中间一条细分面线；每个面一个平涂色值
// 依赖 src/lib.js 与 sheet/pumpkin.js 里的画法工具（inkV / fillWC / flatPart / pool / star / bangMark / contourW / LIGHT / L_*）
const TF = { body: '#f7eedb', limb: '#d9c49b', blush: '#f2a2a0', scal: '#78ad48', scal2: '#4e7f2e', eye: '#2a2230', line: '#7a6a58' };
const TW = 1.7, TD = 1.15, TH = 1.45, TLEG = 0.3;
const TVIEW = { front: 0, q: 0.61, side: Math.PI / 2, qback: Math.PI - 0.61, back: Math.PI };

function tGeo(th) {
  const c = Math.cos(th), s = Math.sin(th), px = (x, z) => x * c + z * s;
  const F = [
    { n: 'front', a: [-TW / 2, TD / 2], b: [TW / 2, TD / 2], nrm: [0, 1] },
    { n: 'right', a: [TW / 2, TD / 2], b: [TW / 2, -TD / 2], nrm: [1, 0] },
    { n: 'back', a: [TW / 2, -TD / 2], b: [-TW / 2, -TD / 2], nrm: [0, -1] },
    { n: 'left', a: [-TW / 2, -TD / 2], b: [-TW / 2, TD / 2], nrm: [-1, 0] },
  ].map(f => { const nx = f.nrm[0] * c + f.nrm[1] * s, nz = -f.nrm[0] * s + f.nrm[1] * c, x0 = px(...f.a), x1 = px(...f.b); return Object.assign(f, { nx, nz, x0: Math.min(x0, x1), x1: Math.max(x0, x1) }); });
  const vis = F.filter(f => f.nz > 0.02), xmin = Math.min(...vis.map(f => f.x0)), xmax = Math.max(...vis.map(f => f.x1));
  return { c, s, px, F, vis, xmin, xmax, depth: (x, z) => -x * s + z * c };
}
function boxRect(x0, x1, y0, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
// 身体一段（y0~y1）：底色 → 背光的面暗一档 → 面与面之间的细分面线 → 外轮廓（顶边最重）
function tBody(ctx, G, y0, y1, seed = 1, edges = { top: true, bot: true }) {
  const sil = boxRect(G.xmin, G.xmax, y0, y1);
  fillWC(ctx, sil, TF.body, { seed, sharp: true });
  ctx.save(); ctx.beginPath(); ctx.rect(G.xmin, y0, G.xmax - G.xmin, y1 - y0); ctx.clip();
  G.vis.forEach(f => { const dot = f.nx * LIGHT[0] + f.nz * LIGHT[1], a = clamp((0.9 - dot) * 0.32, 0, 0.3); if (a > 0.02) { ctx.fillStyle = rgba(shade(TF.body, -0.3), a); ctx.fillRect(f.x0, y0 - 1, f.x1 - f.x0, y1 - y0 + 2); } });
  ctx.restore();
  const xs = G.vis.map(f => f.x0).filter(x => x > G.xmin + 0.02);
  xs.forEach((x, i) => inkV(ctx, [[x, y0 + 0.05], [x + 0.004, (y0 + y1) / 2], [x, y1 - 0.05]], false, L_PLANE, { col: TF.line, seed: 5 + i, taper: true, alpha: 0.85 }));
  inkV(ctx, sil, true, L_TOP, { wf: contourW, sharp: true, seed });
}
function tFace(ctx, G, y, expr) {
  const f = G.F[0], edgeCheat = f.nz <= 0.15 && G.c > -0.05; // 正侧面：像模板一样在前边缘留一只眼
  if (f.nz <= 0.15 && !edgeCheat) return;
  const fx = edgeCheat ? G.xmax - 0.1 : (f.x0 + f.x1) / 2, k = edgeCheat ? 0.4 : (f.x1 - f.x0) / TW;
  const eyes = edgeCheat ? [fx] : [fx - TW * 0.2 * k, fx + TW * 0.2 * k];
  eyes.forEach((ex, i) => {
    const sd = eyes.length === 1 ? 1 : (i ? 1 : -1);
    if (expr === 'happy' || expr === 'angry') {
      const pts = expr === 'happy' ? [[ex - 0.1 * k, y + 0.05], [ex, y - 0.06], [ex + 0.1 * k, y + 0.05]] : [[ex - sd * 0.09 * k, y - 0.08], [ex + sd * 0.08 * k, y], [ex - sd * 0.09 * k, y + 0.08]];
      inkV(ctx, pts, false, 0.075, { col: TF.eye, taper: true, seed: i * 7 });
    } else {
      const r = expr === 'surprised' ? 1.3 : 1;
      ctx.save(); trace(ctx, ell(ex, y, 0.085 * k * r, 0.095 * r, 16), true); ctx.fillStyle = TF.eye; ctx.fill();
      trace(ctx, ell(ex - 0.03 * k * r, y - 0.035 * r, 0.026 * k, 0.03, 8), true); ctx.fillStyle = '#fbf4e6'; ctx.fill(); ctx.restore();
    }
    if (!edgeCheat) { ctx.save(); ctx.filter = 'blur(1px)'; trace(ctx, ell(ex + sd * 0.07 * k, y + 0.19, 0.11 * k, 0.05, 12), true); ctx.fillStyle = rgba(TF.blush, 0.55); ctx.fill(); ctx.restore(); }
  });
  if (edgeCheat) return;
  const my = y + 0.17;
  if (expr === 'surprised') flatPart(ctx, ell(fx, my + 0.04, 0.07 * k, 0.085, 14), PK.mouth, L_FINE, { seed: 5 });
  else if (expr === 'happy') flatPart(ctx, [[fx - 0.1 * k, my - 0.02], [fx + 0.1 * k, my - 0.02], [fx + 0.05 * k, my + 0.08], [fx - 0.05 * k, my + 0.08]], PK.mouth, L_FINE, { seed: 6 });
  else if (expr === 'neutral') inkV(ctx, [[fx - 0.07 * k, my], [fx - 0.02 * k, my + 0.035], [fx, my + 0.01], [fx + 0.02 * k, my + 0.035], [fx + 0.07 * k, my]], false, 0.032, { col: TF.eye, taper: true, seed: 6 });
}
function scallion(ctx, G, top) { // 头顶一小撮葱：标志物，转动时弯的方向按投影变化
  const k = 0.35 + 0.65 * Math.abs(G.c), sg = G.c >= 0 ? 1 : -1;
  const blade = (tipx, tipy, w, seed) => { const p = [[-w, top + 0.03], [tipx * 0.45 - w * 0.6, top + tipy * 0.55], [tipx, top + tipy], [tipx * 0.45 + w * 0.6, top + tipy * 0.5], [w, top + 0.03]]; flatPart(ctx, p, TF.scal, L_NEAR * 0.85, { seed }); };
  blade(-0.12 * k * sg, -0.36, 0.05, 31); blade(0.17 * k * sg, -0.28, 0.045, 32);
  flatPart(ctx, ell(0, top + 0.01, 0.07, 0.04, 10), TF.scal2, L_PLANE * 1.3, { seed: 33 });
}
function tTab(ctx, a, b, w, near, seed, mitten = false) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2, col = near ? TF.limb : shade(TF.limb, -0.2);
  flatPart(ctx, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], col, near ? L_NEAR : L_FAR, { sharp: true, seed });
  if (mitten) flatPart(ctx, ell(b[0], b[1], w * 0.62, w * 0.6, 12), col, near ? L_NEAR : L_FAR, { seed: seed + 1 });
}
function drawTofu(ctx, x, y, s, o) {
  o = Object.assign({ view: 'front', expr: 'neutral', legs: 'stand', walk: 0, arms: 'out', lift: 0, lean: 0, lid: 0, acc: null, sx: 1, sy: 1 }, o);
  const th = typeof o.view === 'number' ? o.view : TVIEW[o.view], G = tGeo(th);
  const bot = -TLEG, top = bot - TH, ey = top + TH * 0.4;
  ctx.save(); ctx.translate(x, y);
  pool(ctx, s * 0.06, 3, s * (G.xmax - G.xmin) * 0.55 * (1 - o.lift * 0.45) * Math.max(1, o.sx), s * 0.15, 1 - o.lift * 0.6);
  ctx.scale(s, s); ctx.translate(0, -o.lift); ctx.rotate(o.lean); ctx.scale(o.sx, o.sy);
  // 腿（都在身体后面，底边压住腿的上端）
  const legs = [-1, 1].map((k, i) => {
    const wx = k * TW * 0.24, xx = G.px(wx, 0), z = G.depth(wx, 0), st = o.legs === 'walk' ? Math.sin(o.walk + i * Math.PI) : 0;
    const ax = xx + z * 0.12;
    return { a: [ax, bot - 0.08], b: [ax + st * 0.28 * G.s, -Math.max(0, -st) * 0.05], z };
  }).sort((p, q) => p.z - q.z);
  legs.forEach((L, i) => tTab(ctx, L.a, L.b, 0.22, Math.abs(legs[0].z - legs[1].z) < 0.3 || i === 1, 20 + i));
  // 手臂：从左右侧面的中心伸出，方向按投影；近的在身体前面，远的在后面
  const ay = top + TH * 0.6;
  const arms = [-1, 1].map((k, i) => {
    const wx = k * TW / 2, root = [G.px(wx, 0), ay], z = G.depth(wx, 0);
    let v;
    if (o.arms === 'up') v = [Math.sign(root[0] || k) * 0.1, -0.52];
    else if (o.arms === 'raise') v = [Math.sign(root[0] || k) * 0.4, -0.34];
    else if (o.arms === 'back') v = [-0.46, 0.1];
    else if (o.arms === 'swing') { const sw = Math.sin(o.walk + (i ? Math.PI : 0)) * 0.7; v = [Math.sin(sw) * 0.4, Math.cos(sw) * 0.34]; }
    else { const dx = k * G.c + 0.28 * G.s; v = [dx * 0.46 + (Math.abs(dx) < 0.35 ? 0.12 : 0), 0.13 + (1 - Math.min(1, Math.abs(dx))) * 0.1]; }
    return { a: root, b: [root[0] + v[0], root[1] + v[1]], z };
  });
  arms.filter(A => A.z < -0.05).forEach((A, i) => tTab(ctx, A.a, A.b, 0.15, false, 40 + i, true));
  const hat = ['guapi', 'douli', 'tiger', 'phoenix', 'wusha'].includes(o.acc);
  if (o.lid) tLid(ctx, G, top, bot, o, hat);
  else { if (!hat && G.vis.length) scallion(ctx, G, top); tBody(ctx, G, top, bot); tFace(ctx, G, ey, o.expr); }
  arms.filter(A => A.z >= -0.05).forEach((A, i) => tTab(ctx, A.a, A.b, 0.15, true, 50 + i, true));
  if (o.acc) tAcc(ctx, o.acc, G, top, bot, arms);
  ctx.restore();
}
// LID：上半块以右侧为铰链掀起，露出嘴里的牙和舌头，眼睛在掀起的那块上
function tLid(ctx, G, top, bot, o, hat) {
  const cut = top + TH * 0.52, hx = G.xmax, xl = G.xmin, ang = o.lid;
  const R = ([x, y]) => [hx + (x - hx) * Math.cos(ang) - (y - cut) * Math.sin(ang), cut + (x - hx) * Math.sin(ang) + (y - cut) * Math.cos(ang)];
  const edge = []; for (let i = 0; i <= 8; i++) edge.push(R([lerp(hx, xl, i / 8), cut]));
  const mouth = [[xl, cut], [hx, cut]].concat(edge.slice(1));
  flatPart(ctx, mouth, PK.mouth, L_NEAR, { seed: 60 });
  ctx.save(); trace(ctx, mouth, true); ctx.clip(); fillWC(ctx, ell(-0.1, cut - 0.03, 0.6, 0.14, 14), PK.tongue, { pool: false }); ctx.restore();
  for (let i = 0; i < 6; i++) { const x0 = lerp(xl + 0.15, hx - 0.3, i / 5), w = 0.08; flatPart(ctx, [[x0 - w, cut], [x0 + w, cut], [x0, cut - 0.14]], '#fbf4e6', L_FINE, { sharp: true, seed: 70 + i }); }
  tBody(ctx, G, cut, bot, 2);
  ctx.save(); ctx.translate(hx, cut); ctx.rotate(ang); ctx.translate(-hx, -cut);
  for (let i = 0; i < 6; i++) { const x0 = lerp(xl + 0.2, hx - 0.25, i / 5), w = 0.075; flatPart(ctx, [[x0 - w, cut], [x0 + w, cut], [x0, cut + 0.14]], '#fbf4e6', L_FINE, { sharp: true, seed: 80 + i }); }
  if (!hat) scallion(ctx, G, top);
  tBody(ctx, G, top, cut, 3);
  tFace(ctx, G, top + TH * 0.3, 'angry');
  ctx.restore();
}
// 中国风配饰（耳机、蝴蝶结保留），平视、帽檐扁
function tAcc(ctx, acc, G, top, bot, arms) {
  const tx = 0, ty = top + 0.02, hw = (G.xmax - G.xmin) / 2, part = (p, c, s, sharp = false) => flatPart(ctx, p, c, L_NEAR, { seed: 100 + s, sharp });
  const dome = (rx, h, col, s) => { const p = []; for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI; p.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * h]); } part(p, col, s); };
  const brim = (rx, col, s) => part([[tx - rx, ty - 0.04], [tx + rx, ty - 0.04], [tx + rx * 0.96, ty + 0.06], [tx - rx * 0.96, ty + 0.06]], col, s, true);
  const thin = (pts, col, s) => inkV(ctx, pts, false, L_PLANE, { col, seed: s, taper: true });
  const dot = (x, y, r, col) => { ctx.save(); trace(ctx, ell(x, y, r, r, 8), true); ctx.fillStyle = col; ctx.fill(); ctx.restore(); };
  const ey = top + TH * 0.4;
  switch (acc) {
    case 'guapi': dome(0.62, 0.44, '#2f2a38', 1); [-0.3, 0, 0.3].forEach((k, i) => thin([[tx + k * 0.25, ty - 0.42], [tx + k, ty - 0.04]], '#6a6478', 2 + i)); brim(0.66, '#3a3448', 4); part(ell(tx, ty - 0.48, 0.09, 0.09, 12), '#c8342a', 5); break;
    case 'douli': part([[tx - 1.4, ty + 0.02], [tx, ty - 0.68], [tx + 1.4, ty + 0.02], [tx + 1.35, ty + 0.1], [tx - 1.35, ty + 0.1]], '#d6b676', 6, true); for (let i = 1; i < 4; i++) thin([[tx - 1.4 * i / 4, ty + 0.02 - 0.7 * (1 - i / 4)], [tx + 1.4 * i / 4, ty + 0.02 - 0.7 * (1 - i / 4)]], '#9a7a40', 7 + i); break;
    case 'tiger': [-1, 1].forEach((k, i) => part(ell(tx + k * 0.48, ty - 0.4, 0.16, 0.16, 12), '#ec9a30', 11 + i)); dome(0.66, 0.46, '#ec9a30', 13); [-0.12, 0, 0.12].forEach((d, i) => thin([[tx - 0.17, ty - 0.25 + d], [tx + 0.17, ty - 0.25 + d]], '#2f2a38', 14 + i)); brim(0.7, '#c8342a', 17); break;
    case 'phoenix': part([[tx - 0.55, ty + 0.05], [tx - 0.6, ty - 0.34], [tx - 0.28, ty - 0.17], [tx, ty - 0.52], [tx + 0.28, ty - 0.17], [tx + 0.6, ty - 0.34], [tx + 0.55, ty + 0.05]], '#e4b23c', 18, true); part(ell(tx, ty - 0.21, 0.08, 0.1, 10), '#c8342a', 19); [-1, 1].forEach((k, i) => { thin([[tx + k * 0.57, ty], [tx + k * 0.7, ty + 0.44]], '#a8822a', 20 + i); [0, 1, 2].forEach(j => part(ell(tx + k * (0.6 + j * 0.035), ty + 0.12 + j * 0.13, 0.04, 0.04, 8), '#fbf4e6', 22 + j)); }); break;
    case 'wusha': [-1, 1].forEach((k, i) => { thin([[tx + k * 0.45, ty - 0.16], [tx + k * 1.12, ty - 0.26]], INK, 25 + i); part(ell(tx + k * 1.2, ty - 0.27, 0.19, 0.08, 12, k * 0.1), '#2f2a38', 27 + i); }); dome(0.5, 0.52, '#2f2a38', 29); brim(0.6, '#2f2a38', 30); break;
    case 'hairpin': inkV(ctx, [[tx - 0.52, ty - 0.46], [tx + 0.3, ty + 0.1]], false, 0.07, { col: '#a8822a', seed: 31 }); part(ell(tx - 0.54, ty - 0.48, 0.08, 0.08, 10), '#e04a6a', 32); thin([[tx - 0.54, ty - 0.41], [tx - 0.59, ty - 0.13]], '#c8342a', 33); part([[tx - 0.64, ty - 0.14], [tx - 0.54, ty - 0.14], [tx - 0.52, ty + 0.09], [tx - 0.66, ty + 0.09]], '#c8342a', 34, true); break;
    case 'knot': { const x = hw + 0.14, y = top + TH * 0.62; thin([[hw - 0.02, top + TH * 0.35], [x, y - 0.2]], '#c8342a', 35); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); part([[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]], '#c8342a', 36, true); ctx.restore(); part([[x - 0.05, y + 0.2], [x + 0.05, y + 0.2], [x + 0.09, y + 0.5], [x - 0.09, y + 0.5]], '#c8342a', 37, true); break; }
    case 'lock': { const cx = 0, cy = top + TH * 0.78; thin([[cx - 0.55, cy - 0.5], [cx - 0.3, cy - 0.06], [cx, cy + 0.02], [cx + 0.3, cy - 0.06], [cx + 0.55, cy - 0.5]], '#9aa0ac', 38); part([[cx - 0.24, cy + 0.02], [cx + 0.24, cy + 0.02], [cx + 0.2, cy + 0.2], [cx, cy + 0.3], [cx - 0.2, cy + 0.2]], '#d8dce4', 39); break; }
    case 'fan': { const h = arms[1].b, fx = h[0] + 0.12, fy = h[1] - 0.44; inkV(ctx, [[h[0], h[1]], [fx, fy + 0.26]], false, 0.05, { col: '#8a5a3a', seed: 40 }); part(ell(fx, fy, 0.33, 0.33, 20), '#fbf2e4', 41); thin([[fx - 0.2, fy + 0.18], [fx, fy], [fx + 0.12, fy - 0.17]], '#5a4030', 42); [[fx - 0.02, fy - 0.02], [fx + 0.12, fy - 0.15], [fx - 0.13, fy + 0.1]].forEach(([px, py]) => dot(px, py, 0.045, '#ef7aa0')); break; }
    case 'opera': part([[-0.7, ey - 0.2], [0, ey - 0.3], [0.7, ey - 0.2], [0.62, ey + 0.2], [0.2, ey + 0.18], [0, ey + 0.08], [-0.2, ey + 0.18], [-0.62, ey + 0.2]], '#fbf4e6', 46); [-1, 1].forEach(k => { ctx.save(); trace(ctx, [[k * 0.12, ey - 0.2], [k * 0.6, ey - 0.22], [k * 0.5, ey - 0.1]], true); ctx.fillStyle = '#2f2a38'; ctx.fill(); ctx.restore(); dot(k * 0.34, ey + 0.02, 0.08, '#2f2a38'); trace(ctx, ell(k * 0.4, ey + 0.13, 0.12, 0.05, 10), true); ctx.fillStyle = rgba('#c8342a', 0.75); ctx.fill(); }); break;
    case 'collar': part([[G.xmin - 0.02, top + 0.06], [G.xmax + 0.02, top + 0.06], [G.xmax + 0.02, top + 0.24], [G.xmin - 0.02, top + 0.24]], '#2e5aa8', 51, true); [0, 0.14].forEach((d, i) => inkV(ctx, [[-0.12, top + 0.36 + d], [0.12, top + 0.36 + d]], false, 0.04, { col: '#e4b23c', seed: 52 + i })); break;
    case 'plum': for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; part(ell(tx + 0.5 + Math.cos(a) * 0.09, ty - 0.02 + Math.sin(a) * 0.09, 0.07, 0.07, 8), '#f490b0', 54 + i); } part(ell(tx + 0.5, ty - 0.02, 0.04, 0.04, 8), '#f6c84a', 59); break;
    case 'panda': inkV(ctx, [[G.xmin + 0.05, ty + 0.12], [tx - 0.45, ty - 0.18], [tx, ty - 0.26], [tx + 0.45, ty - 0.18], [G.xmax - 0.05, ty + 0.12]], false, 0.07, { col: '#2f2a38', seed: 60 }); [-1, 1].forEach((k, i) => part(ell(tx + k * 0.5, ty - 0.27, 0.18, 0.18, 12), '#2f2a38', 61 + i)); break;
    case 'headphones': { const lx = G.xmin - 0.02, rx = G.xmax + 0.02, cy = top + TH * 0.42; inkV(ctx, [[lx, cy], [lx + 0.06, ty - 0.12], [tx, ty - 0.3], [rx - 0.06, ty - 0.12], [rx, cy]], false, 0.1, { col: '#2f2a38', seed: 63 }); [lx, rx].forEach((px, i) => part(ell(px, cy, 0.13, 0.22, 12), '#7a5ac8', 64 + i)); break; }
    case 'bow': part([[tx + 0.42, ty - 0.02], [tx + 0.18, ty - 0.18], [tx + 0.2, ty + 0.12]], '#ef7aa8', 66, true); part([[tx + 0.42, ty - 0.02], [tx + 0.66, ty - 0.18], [tx + 0.64, ty + 0.12]], '#ef7aa8', 67, true); part(ell(tx + 0.42, ty - 0.02, 0.05, 0.05, 8), '#d8507a', 68); break;
  }
}
