// 原创南瓜小人（第 3 版，2.5D）：平视、无透视俯角；转动靠“分面线”滑动 + 眼睛平移变窄 + 轮廓变窄
// 线条粗细跟空间走：外轮廓最重（顶边最重、底边次之），近处四肢中等，远处四肢更细更暗，分面线最细
// 依赖 src/lib.js（ell / hash / trace / wob / chaikin / densify / makeBlotch / rgba / shade / lerp / clamp）
const PK = { body: '#df7638', limb: '#b8582c', stem: '#6d8a3c', stem2: '#4e6a2a', eye: '#2a2230', mouth: '#5a1f22', tongue: '#e48890', tooth: '#fbf4e6', pool: '#9d93b6', groove: '#6a2e18', star: '#f4cf54' };
const BW = 1.25, BD = 0.95, BH = 0.8, LEG = 0.36, NP = 2.4; // 身体宽/厚/高（厚比宽小，侧面会变窄）
const VIEW_TH = { front: 0, q: 0.61, side: Math.PI / 2, qback: Math.PI - 0.61, back: Math.PI };
// 线条层级（单位：身体坐标）
const L_TOP = 0.07, L_NEAR = 0.05, L_FAR = 0.038, L_PLANE = 0.022, L_FINE = 0.013;
const LIGHT = [-0.55, 0.835]; // 光从左前方来（屏幕 x / 朝向观众 z）

const prof = y => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y / BH), NP)), 1 / NP); // 某高度处的半宽比例
function geo(th) { const c = Math.cos(th), s = Math.sin(th); return { c, s, Wv: Math.hypot(BW * c, BD * s) }; }
function az(G, phi, r = 1) { // 赤道上方位角 phi 的点：屏幕 x、朝向（法线）
  const sp = Math.sin(phi), cp = Math.cos(phi);
  return { x: r * (BW * sp * G.c + BD * cp * G.s), nx: sp * G.c + cp * G.s, nz: -sp * G.s + cp * G.c };
}
function silhouette(G) {
  const p = [];
  for (let i = 0; i < 80; i++) {
    const t = i / 80 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    let x = G.Wv * Math.sign(c) * Math.pow(Math.abs(c), 2 / NP), y = BH * Math.sign(s) * Math.pow(Math.abs(s), 2 / NP);
    if (y < 0) y += 0.07 * Math.exp(-Math.pow(x / 0.3, 2)) * (-y / BH); // 顶部梗处微微凹下
    p.push([x, y]);
  }
  return p;
}
function clipY(poly, cut, below) { // 用水平线切多边形
  const out = [], inside = p => below ? p[1] >= cut : p[1] <= cut;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) { const t = (cut - a[1]) / (b[1] - a[1]); out.push([lerp(a[0], b[0], t), cut]); }
  }
  return out;
}
const sarea = pts => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

// ---------- 墨线：实心笔触，粗细由方向权重决定，线头钝 ----------
function inkV(ctx, pts, closed, w, o = {}) {
  if (pts.length < 2) return;
  const col = o.col ?? INK, seed = o.seed ?? 0, wf = o.wf;
  const P = closed && pts.length > 5 && !o.sharp ? chaikin(pts, true, 2) : densify(pts, closed, closed ? 8 : 10), N = P.length;
  const sg = closed ? Math.sign(sarea(P)) || 1 : 1, Lp = [], Rp = [];
  for (let i = 0; i < N; i++) {
    const a = P[closed ? (i - 1 + N) % N : Math.max(0, i - 1)], b = P[closed ? (i + 1) % N : Math.min(N - 1, i + 1)], c = P[i];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let f = wf ? wf(dy * sg, -dx * sg) : 1;
    if (!closed && o.taper) { const u = i / (N - 1); f *= 0.35 + 0.65 * Math.min(1, Math.min(u, 1 - u) / 0.3); }
    f *= 1 + 0.06 * Math.sin(i * 0.31 + seed) + 0.03 * (hash(Math.floor(i / 4) + seed) - 0.5);
    const hw = w * f / 2;
    Lp.push([c[0] - dy * hw, c[1] + dx * hw]); Rp.push([c[0] + dy * hw, c[1] - dx * hw]);
  }
  ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = o.alpha ?? 1; ctx.beginPath();
  if (closed) { Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); Rp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill('evenodd'); }
  else { Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); for (let i = N - 1; i >= 0; i--) ctx.lineTo(...Rp[i]); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// 身体外轮廓的权重：顶边最重，底边次之，背光的右侧稍重
const contourW = (nx, ny) => 0.85 + 0.6 * Math.max(0, -ny) + 0.25 * Math.max(0, ny) + 0.12 * Math.max(0, nx);

// ---------- 水彩：不透明底色 + 下部积色带 + 湿润晕亮 + 颗粒 + 边缘积色 ----------
function fillWC(ctx, pts, col, o = {}) {
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1, px = v => v / sc, seed = o.seed ?? 0;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), h = y1 - y0, wd = x1 - x0;
  ctx.save(); ctx.translate(px(1.3), px(0.9));
  trace(ctx, pts, true); ctx.fillStyle = col; ctx.fill();
  trace(ctx, wob(pts, px(2.2), seed + 9), true); ctx.fillStyle = shade(col, -0.05); ctx.globalAlpha = 0.22; ctx.fill(); ctx.globalAlpha = 1;
  trace(ctx, pts, true); ctx.clip();
  if (o.pool !== false && h * sc > 16) {
    ctx.save(); ctx.filter = `blur(${Math.max(1, Math.round(h * sc * 0.04))}px)`; ctx.fillStyle = shade(col, -0.17); ctx.globalAlpha = 0.4;
    const band = []; for (let i = 0; i <= 12; i++) band.push([x0 - wd * 0.1 + wd * 1.2 * i / 12, y0 + h * (0.64 + 0.035 * Math.sin(i * 1.9 + seed))]);
    band.push([x1 + wd * 0.2, y1 + h], [x0 - wd * 0.2, y1 + h]); trace(ctx, band, true); ctx.fill(); ctx.restore();
    ctx.save(); ctx.filter = `blur(${Math.max(2, Math.round(h * sc * 0.1))}px)`; ctx.fillStyle = shade(col, 0.16); ctx.globalAlpha = 0.25;
    trace(ctx, ell(x0 + wd * 0.38, y0 + h * 0.28, wd * 0.24, h * 0.13, 12), true); ctx.fill(); ctx.restore();
  }
  if (BLOTCH) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28; ctx.drawImage(BLOTCH, 0, 0); ctx.restore(); }
  ctx.save(); ctx.filter = 'blur(1.4px)'; trace(ctx, pts, true); ctx.strokeStyle = shade(col, -0.3); ctx.globalAlpha = 0.32; ctx.lineWidth = px(3.5); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function flatPart(ctx, pts, col, w, o = {}) { fillWC(ctx, pts, col, Object.assign({ pool: false }, o)); inkV(ctx, pts, true, w, { sharp: o.sharp, seed: o.seed ?? 0, wf: o.wf }); }
function pool(ctx, cx, cy, rx, ry, a = 1) { // 不规则淡紫水渍阴影
  ctx.save(); ctx.filter = 'blur(2px)';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba(PK.pool, 0.14 * a); trace(ctx, wob(ell(cx + (hash(i) - 0.3) * rx * 0.25, cy + (hash(i + 7) - 0.5) * ry * 0.4, rx * (0.78 + 0.25 * hash(i + 3)), ry * (0.8 + 0.4 * hash(i + 5)), 18), ry * 0.22, i * 13), true); ctx.fill(); }
  ctx.restore();
}

// ---------- 身体：底色 → 按面分明暗 → 分面线 → 外轮廓 ----------
function bodyPlanes(ctx, G, region) {
  ctx.save(); trace(ctx, region, true); ctx.clip();
  for (let k = 0; k < 6; k++) { // 每一瓣是一个面：背光的面平涂暗一档
    const pc = k * Math.PI / 3, C = az(G, pc);
    if (C.nz < -0.25) continue;
    const dot = C.nx * LIGHT[0] + C.nz * LIGHT[1], a = clamp((0.88 - dot) * 0.42, 0, 0.42);
    if (a < 0.03) continue;
    const bx = [pc - Math.PI / 6, pc + Math.PI / 6].map(f => { const g = az(G, f); return g.nz > 0.02 ? g.x : Math.sign(g.x || C.nx) * G.Wv * 1.4; }).sort((p, q) => p - q);
    const band = [];
    for (let i = 0; i <= 16; i++) { const y = lerp(-BH, BH, i / 16); band.push([bx[0] * prof(y), y]); }
    for (let i = 16; i >= 0; i--) { const y = lerp(-BH, BH, i / 16); band.push([bx[1] * prof(y), y]); }
    ctx.save(); ctx.filter = 'blur(1px)'; trace(ctx, band, true); ctx.fillStyle = rgba(shade(PK.body, -0.38), a); ctx.fill(); ctx.restore();
  }
  for (let k = 0; k < 6; k++) { // 分面线：最细的一级，只画朝前的
    const g = az(G, (k + 0.5) * Math.PI / 3);
    if (g.nz < 0.06 || Math.abs(g.x) > G.Wv * 0.96) continue;
    const ln = []; for (let i = 0; i <= 18; i++) { const y = lerp(-BH * 0.9, BH * 0.94, i / 18); ln.push([g.x * prof(y), y]); }
    inkV(ctx, ln, false, L_PLANE * (0.55 + 0.45 * g.nz), { col: PK.groove, seed: k, taper: true, alpha: 0.85 });
  }
  ctx.restore();
}
function drawBody(ctx, G, region, seed = 1) {
  fillWC(ctx, region, PK.body, { seed });
  bodyPlanes(ctx, G, region);
  inkV(ctx, region, true, L_TOP, { wf: contourW, seed });
}
// ---------- 脸：实心眼睛无描边，随转动平移、变窄 ----------
function face(ctx, G, expr) {
  const ey = -0.2;
  [-0.29, 0.29].forEach((phi, i) => {
    const g = az(G, phi); if (g.nz < 0.22) return;
    const x = g.x * prof(ey) * 0.98, k = 0.3 + 0.7 * g.nz, side = i ? 1 : -1;
    if (expr === 'happy' || expr === 'angry') {
      const pts = expr === 'happy' ? [[x - 0.1 * k, ey + 0.06], [x, ey - 0.06], [x + 0.1 * k, ey + 0.06]] : [[x - side * 0.09 * k, ey - 0.08], [x + side * 0.07 * k, ey], [x - side * 0.09 * k, ey + 0.08]];
      inkV(ctx, pts, false, 0.075, { col: PK.eye, taper: true, seed: i * 7 });
    } else {
      const sz = expr === 'surprised' ? 1.18 : 1, hw = 0.072 * k * sz, hh = 0.13 * sz;
      ctx.save(); trace(ctx, chaikin([[x - hw, ey - hh], [x + hw, ey - hh], [x + hw, ey + hh], [x - hw, ey + hh]], true, 2), true); ctx.fillStyle = PK.eye; ctx.fill();
      trace(ctx, ell(x - hw * 0.35, ey - hh * 0.5, 0.026 * k, 0.034, 10), true); ctx.fillStyle = PK.tooth; ctx.fill(); ctx.restore();
    }
  });
  const m = az(G, 0); if (m.nz < 0.3) return;
  const mx = m.x * prof(0.2), k = 0.3 + 0.7 * m.nz;
  if (expr === 'surprised') flatPart(ctx, ell(mx, 0.22, 0.07 * k, 0.09, 14), PK.mouth, L_FINE, { seed: 5 });
  if (expr === 'happy') inkV(ctx, [[mx - 0.09 * k, 0.15], [mx, 0.2], [mx + 0.09 * k, 0.15]], false, 0.045, { col: PK.eye, taper: true, seed: 6 });
}
function stem(ctx, G) {
  const bx = 0.13 * G.c, by = -BH + 0.05, h = 0.3;
  const p = [[-0.085, by + 0.04], [-0.06 + bx * 0.45, by - h * 0.55], [bx - 0.045, by - h], [bx + 0.05, by - h + 0.02], [0.05 + bx * 0.5, by - h * 0.5], [0.085, by + 0.04]];
  flatPart(ctx, p, PK.stem, L_NEAR, { seed: 21 });
  flatPart(ctx, ell(bx + 0.003, by - h + 0.01, 0.065, 0.045, 10), PK.stem2, L_PLANE * 1.4, { seed: 22 });
}

// ---------- 四肢：扁平的长方形片，近的亮、线中等；远的暗、线更细 ----------
function tab(ctx, a, b, w, near, seed) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2;
  flatPart(ctx, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], near ? PK.limb : shade(PK.limb, -0.2), near ? L_NEAR : L_FAR, { sharp: true, seed });
}
function limbs(G, o) {
  const legs = [-1, 1].map((k, i) => {
    const g = az(G, k * 0.75, 0.48), hy = BH * 0.55;
    const st = o.legs === 'walk' ? Math.sin(o.walk + i * Math.PI) : 0;
    const foot = [g.x + st * 0.32 * G.s, BH + LEG - Math.max(0, -st) * 0.06];
    return { a: [g.x, hy], b: foot, z: g.nz, k };
  });
  const arms = [-1, 1].map((k, i) => {
    const phi = k * Math.PI / 2, g = az(G, phi), y = 0.06, root = [g.x * prof(y) * 0.97, y];
    const psi = phi - k * 0.2, dir = az(G, psi); let v;
    if (o.arms === 'up') v = [Math.sign(root[0] || k) * 0.12, -0.5];
    else if (o.arms === 'raise') v = [Math.sign(root[0] || k) * 0.4, -0.32];
    else if (o.arms === 'back') v = [-0.45, 0.12];
    else if (o.arms === 'swing') { const sw = Math.sin(o.walk + (i ? Math.PI : 0)) * 0.7; v = [Math.sin(sw) * 0.42 * (g.nz > 0 ? 1 : 0.6), Math.cos(sw) * 0.36]; }
    else v = [dir.nx * 0.46 + (Math.abs(dir.nx) < 0.35 ? 0.16 * G.s : 0), 0.12 + (1 - Math.abs(dir.nx)) * 0.1];
    return { a: root, b: [root[0] + v[0], root[1] + v[1]], z: g.nz, k };
  });
  return { legs, arms };
}

// ---------- 主绘制 ----------
function drawPumpkin(ctx, x, y, s, o) {
  o = Object.assign({ view: 'front', expr: 'neutral', legs: 'stand', walk: 0, arms: 'out', lift: 0, lean: 0, lid: 0, acc: null, sx: 1, sy: 1 }, o);
  const th = typeof o.view === 'number' ? o.view : VIEW_TH[o.view], G = geo(th);
  ctx.save(); ctx.translate(x, y);
  pool(ctx, s * 0.06, 3, s * G.Wv * 0.98 * (1 - o.lift * 0.45) * Math.max(1, o.sx), s * 0.15, 1 - o.lift * 0.6);
  ctx.scale(s, s); ctx.translate(0, -o.lift); ctx.rotate(o.lean); ctx.scale(o.sx, o.sy);
  ctx.translate(0, -(LEG + BH)); // 原点移到身体中心
  const { legs, arms } = limbs(G, o), near = (L, other) => L.z >= other.z - 0.2;
  // 腿全部在身体后面（身体底边压住腿的上端）；两条腿前后差明显时，远的那条更暗、线更细
  legs.slice().sort((p, q) => p.z - q.z).forEach((L, i, arr) => tab(ctx, L.a, L.b, 0.22, near(L, arr[1 - i]), 30 + i));
  arms.filter(A => A.z < -0.05).forEach((A, i) => tab(ctx, A.a, A.b, 0.17, false, 40 + i));
  const hat = PK_HATS.includes(o.acc);
  if (o.lid) bodyLid(ctx, G, o, hat);
  else { if (!hat) stem(ctx, G); const sil = silhouette(G); drawBody(ctx, G, sil); face(ctx, G, o.expr); }
  arms.filter(A => A.z >= -0.05).forEach((A, i) => tab(ctx, A.a, A.b, 0.17, true, 50 + i));
  if (o.acc) pkAcc(ctx, o.acc, G, arms);
  ctx.restore();
}
// LID：从中间切开，带眼睛的上半绕右端的铰链张开（平面旋转），露出嘴里的牙和舌头
function bodyLid(ctx, G, o, hat) {
  const sil = silhouette(G), cut = 0.02, lower = clipY(sil, cut, true), upper = clipY(sil, cut, false);
  const hx = G.Wv * prof(cut) * 0.98, ang = o.lid; // 正角度：左端以右侧铰链为轴向上掀起
  const R = ([x, y]) => [hx + (x - hx) * Math.cos(ang) - (y - cut) * Math.sin(ang), cut + (x - hx) * Math.sin(ang) + (y - cut) * Math.cos(ang)];
  const xl = -hx, lidEdge = []; for (let i = 0; i <= 10; i++) lidEdge.push(R([lerp(hx, xl, i / 10), cut]));
  const mouthPoly = [[xl, cut], [hx, cut]].concat(lidEdge.slice(1));
  flatPart(ctx, mouthPoly, PK.mouth, L_NEAR, { seed: 60 });
  ctx.save(); trace(ctx, mouthPoly, true); ctx.clip(); fillWC(ctx, ell(-0.15, cut - 0.02, 0.55, 0.12, 14), PK.tongue, { pool: false }); ctx.restore();
  for (let i = 0; i < 7; i++) { // 下排牙
    const x0 = lerp(xl + 0.12, hx - 0.25, i / 6), w = 0.075;
    flatPart(ctx, [[x0 - w, cut], [x0 + w, cut], [x0, cut - 0.13]], PK.tooth, L_FINE, { sharp: true, seed: 70 + i });
  }
  drawBody(ctx, G, lower, 2);
  ctx.save(); ctx.translate(hx, cut); ctx.rotate(ang); ctx.translate(-hx, -cut);
  for (let i = 0; i < 7; i++) { const x0 = lerp(xl + 0.15, hx - 0.2, i / 6), w = 0.07; flatPart(ctx, [[x0 - w, cut], [x0 + w, cut], [x0, cut + 0.13]], PK.tooth, L_FINE, { sharp: true, seed: 80 + i }); }
  if (!hat) stem(ctx, G);
  drawBody(ctx, G, upper, 3);
  face(ctx, G, 'angry');
  ctx.restore();
}
function star(ctx, x, y, r, seed) { const p = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.3 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } flatPart(ctx, p, PK.star, L_PLANE * 1.2, { sharp: true, seed }); }
function bangMark(ctx, x, y, r) { flatPart(ctx, [[x - r * 0.16, y - r], [x + r * 0.2, y - r], [x + r * 0.07, y + r * 0.35], [x - r * 0.06, y + r * 0.35]], PK.star, L_PLANE * 1.2, { sharp: true, seed: 90 }); flatPart(ctx, ell(x, y + r * 0.66, r * 0.13, r * 0.13, 10), PK.star, L_PLANE * 1.2, { seed: 91 }); }

// ---------- 中国风配饰（耳机、蝴蝶结保留）：平视，帽檐是扁的 ----------
const PK_HATS = ['guapi', 'douli', 'tiger', 'phoenix', 'wusha'];
function pkAcc(ctx, acc, G, arms) {
  const tx = 0, ty = -BH + 0.06, part = (p, c, s, sharp = false) => flatPart(ctx, p, c, L_NEAR, { seed: 100 + s, sharp });
  const dome = (rx, h, col, s) => { const p = []; for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI; p.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * h]); } part(p, col, s); };
  const brim = (rx, col, s, dy = 0) => part([[tx - rx, ty + dy - 0.03], [tx + rx, ty + dy - 0.03], [tx + rx * 0.96, ty + dy + 0.06], [tx - rx * 0.96, ty + dy + 0.06]], col, s, true);
  const thin = (pts, col, s) => inkV(ctx, pts, false, L_PLANE, { col, seed: s, taper: true });
  const dot = (x, y, r, col) => { ctx.save(); trace(ctx, ell(x, y, r, r, 8), true); ctx.fillStyle = col; ctx.fill(); ctx.restore(); };
  const side = az(G, Math.PI / 2), chest = [0, 0.48];
  switch (acc) {
    case 'guapi': dome(0.6, 0.42, '#2f2a38', 1); [-0.3, 0, 0.3].forEach((k, i) => thin([[tx + k * 0.25, ty - 0.4], [tx + k, ty - 0.03]], '#6a6478', 2 + i)); brim(0.62, '#3a3448', 4); part(ell(tx, ty - 0.46, 0.09, 0.09, 12), '#c8342a', 5); break;
    case 'douli': part([[tx - 1.35, ty + 0.03], [tx, ty - 0.66], [tx + 1.35, ty + 0.03], [tx + 1.3, ty + 0.1], [tx - 1.3, ty + 0.1]], '#d6b676', 6, true); for (let i = 1; i < 4; i++) thin([[tx - 1.35 * i / 4, ty + 0.03 - 0.69 * (1 - i / 4)], [tx + 1.35 * i / 4, ty + 0.03 - 0.69 * (1 - i / 4)]], '#9a7a40', 7 + i); break;
    case 'tiger': [-1, 1].forEach((k, i) => part(ell(tx + k * 0.46, ty - 0.38, 0.15, 0.15, 12), '#ec9a30', 11 + i)); dome(0.62, 0.44, '#ec9a30', 13); [-0.12, 0, 0.12].forEach((d, i) => thin([[tx - 0.17, ty - 0.24 + d], [tx + 0.17, ty - 0.24 + d]], '#2f2a38', 14 + i)); brim(0.64, '#c8342a', 17); break;
    case 'phoenix': part([[tx - 0.52, ty + 0.05], [tx - 0.56, ty - 0.32], [tx - 0.26, ty - 0.16], [tx, ty - 0.5], [tx + 0.26, ty - 0.16], [tx + 0.56, ty - 0.32], [tx + 0.52, ty + 0.05]], '#e4b23c', 18, true); part(ell(tx, ty - 0.2, 0.08, 0.1, 10), '#c8342a', 19); [-1, 1].forEach((k, i) => { thin([[tx + k * 0.54, ty], [tx + k * 0.66, ty + 0.42]], '#a8822a', 20 + i); [0, 1, 2].forEach(j => part(ell(tx + k * (0.57 + j * 0.035), ty + 0.12 + j * 0.13, 0.04, 0.04, 8), '#fbf4e6', 22 + j)); }); break;
    case 'wusha': [-1, 1].forEach((k, i) => { thin([[tx + k * 0.42, ty - 0.14], [tx + k * 1.05, ty - 0.24]], INK, 25 + i); part(ell(tx + k * 1.13, ty - 0.25, 0.18, 0.08, 12, k * 0.1), '#2f2a38', 27 + i); }); dome(0.46, 0.5, '#2f2a38', 29); brim(0.56, '#2f2a38', 30); break;
    case 'hairpin': inkV(ctx, [[tx - 0.5, ty - 0.45], [tx + 0.3, ty + 0.1]], false, 0.07, { col: '#a8822a', seed: 31 }); part(ell(tx - 0.52, ty - 0.47, 0.08, 0.08, 10), '#e04a6a', 32); thin([[tx - 0.52, ty - 0.4], [tx - 0.57, ty - 0.12]], '#c8342a', 33); part([[tx - 0.62, ty - 0.13], [tx - 0.52, ty - 0.13], [tx - 0.5, ty + 0.1], [tx - 0.64, ty + 0.1]], '#c8342a', 34, true); break;
    case 'knot': { const x = side.x * prof(0.1) + 0.12, y = 0.15; thin([[side.x * 0.95, -0.12], [x, y - 0.2]], '#c8342a', 35); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); part([[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]], '#c8342a', 36, true); ctx.restore(); part([[x - 0.05, y + 0.2], [x + 0.05, y + 0.2], [x + 0.09, y + 0.5], [x - 0.09, y + 0.5]], '#c8342a', 37, true); break; }
    case 'lock': thin([[chest[0] - 0.55, chest[1] - 0.6], [chest[0] - 0.3, chest[1] - 0.08], [chest[0], chest[1] + 0.02], [chest[0] + 0.3, chest[1] - 0.08], [chest[0] + 0.55, chest[1] - 0.6]], '#9aa0ac', 38); part([[chest[0] - 0.24, chest[1] + 0.02], [chest[0] + 0.24, chest[1] + 0.02], [chest[0] + 0.2, chest[1] + 0.2], [chest[0], chest[1] + 0.3], [chest[0] - 0.2, chest[1] + 0.2]], '#d8dce4', 39); break;
    case 'fan': { const h = arms[1].b, fx = h[0] + 0.12, fy = h[1] - 0.42; inkV(ctx, [[h[0], h[1]], [fx, fy + 0.25]], false, 0.05, { col: '#8a5a3a', seed: 40 }); part(ell(fx, fy, 0.32, 0.32, 20), '#fbf2e4', 41); thin([[fx - 0.2, fy + 0.18], [fx, fy], [fx + 0.12, fy - 0.17]], '#5a4030', 42); [[fx - 0.02, fy - 0.02], [fx + 0.12, fy - 0.15], [fx - 0.13, fy + 0.1]].forEach(([px, py]) => dot(px, py, 0.045, '#ef7aa0')); break; }
    case 'opera': { const c = [0, -0.2]; part([[c[0] - 0.66, c[1] - 0.2], [c[0], c[1] - 0.3], [c[0] + 0.66, c[1] - 0.2], [c[0] + 0.58, c[1] + 0.2], [c[0] + 0.2, c[1] + 0.18], [c[0], c[1] + 0.08], [c[0] - 0.2, c[1] + 0.18], [c[0] - 0.58, c[1] + 0.2]], '#fbf4e6', 46); [-1, 1].forEach(k => { ctx.save(); trace(ctx, [[c[0] + k * 0.12, c[1] - 0.2], [c[0] + k * 0.56, c[1] - 0.22], [c[0] + k * 0.46, c[1] - 0.1]], true); ctx.fillStyle = '#2f2a38'; ctx.fill(); ctx.restore(); dot(c[0] + k * 0.3, c[1] + 0.03, 0.08, '#2f2a38'); }); break; }
    case 'collar': part([[-0.62, 0.36], [0.62, 0.36], [0.58, 0.54], [-0.58, 0.54]], '#2e5aa8', 51, true); [0, 0.14].forEach((d, i) => inkV(ctx, [[-0.12, 0.64 + d], [0.12, 0.64 + d]], false, 0.04, { col: '#e4b23c', seed: 52 + i })); break;
    case 'plum': for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; part(ell(tx + 0.42 + Math.cos(a) * 0.09, ty - 0.02 + Math.sin(a) * 0.09, 0.07, 0.07, 8), '#f490b0', 54 + i); } part(ell(tx + 0.42, ty - 0.02, 0.04, 0.04, 8), '#f6c84a', 59); break;
    case 'panda': inkV(ctx, [[tx - 0.62, ty + 0.1], [tx - 0.42, ty - 0.2], [tx, ty - 0.28], [tx + 0.42, ty - 0.2], [tx + 0.62, ty + 0.1]], false, 0.07, { col: '#2f2a38', seed: 60 }); [-1, 1].forEach((k, i) => part(ell(tx + k * 0.44, ty - 0.28, 0.17, 0.17, 12), '#2f2a38', 61 + i)); break;
    case 'headphones': { const lx = -G.Wv * 0.99, rx = G.Wv * 0.99; inkV(ctx, [[lx, -0.08], [lx + 0.12, ty - 0.18], [tx, ty - 0.34], [rx - 0.12, ty - 0.18], [rx, -0.08]], false, 0.1, { col: '#2f2a38', seed: 63 }); [lx, rx].forEach((px, i) => part(ell(px, -0.05, 0.13, 0.21, 12), '#7a5ac8', 64 + i)); break; }
    case 'bow': part([[tx + 0.34, ty - 0.02], [tx + 0.1, ty - 0.18], [tx + 0.12, ty + 0.12]], '#ef7aa8', 66, true); part([[tx + 0.34, ty - 0.02], [tx + 0.58, ty - 0.18], [tx + 0.56, ty + 0.12]], '#ef7aa8', 67, true); part(ell(tx + 0.34, ty - 0.02, 0.05, 0.05, 8), '#d8507a', 68); break;
  }
}
