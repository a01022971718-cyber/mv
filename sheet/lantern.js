// 原创角色"灯灯"：红灯笼身体 + 金色顶盖/底座 + 提手 + 红流苏 + 小短腿
// 依赖 src/lib.js 与 sheet/seedling.js（sb / eye / mouth / sparkle / bang / EMO）
const LAN = { body: '#d8432e', body2: '#a82a22', rib: '#9a2620', glow: '#ffb46a', gold: '#e8b43a', gold2: '#b8862a', leg: '#7a2a24', tassel: '#c8302a' };
const LVIEW = { front: 0, q: Math.PI / 4, side: Math.PI / 2, qback: Math.PI * 3 / 4, back: Math.PI };
const LHATS = ['guapi', 'douli', 'tiger', 'phoenix', 'wusha', 'panda'];
const CY = -1.32, RX = 0.95, RY = 0.74;

function lanternBody(ry = RY) { // 圆鼓鼓的灯笼轮廓（上下略平）
  const p = [];
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); p.push([Math.sign(c) * Math.pow(Math.abs(c), 0.8) * RX, CY + Math.sign(s) * Math.pow(Math.abs(s), 0.9) * ry]); }
  return p;
}
function lArm(ctx, bx, by, hx, hy, back, seed) {
  inkLine(ctx, [[bx, by], [(bx + hx) / 2, (by + hy) / 2 + 0.03], [hx, hy]], 0.13, INK, seed, 0.005);
  inkLine(ctx, [[bx, by], [(bx + hx) / 2, (by + hy) / 2 + 0.03], [hx, hy]], 0.075, back ? shade(LAN.body2, -0.15) : LAN.body2, seed + 1, 0.004);
  sb(ctx, ell(hx, hy, 0.12, 0.12, 10), back ? LAN.body2 : LAN.body, { lw: 0.045, seed: seed + 2, edge: 0.05 });
}
function lLeg(ctx, lx, a, tuck, back, seed) {
  const L = tuck ? 0.18 : 0.36, top = CY + RY - 0.05, fx = lx + Math.sin(a) * L, fy = top + Math.cos(a) * L + (tuck ? 0 : 0.06);
  inkLine(ctx, [[lx, top], [fx, fy]], 0.17, INK, seed, 0.005);
  inkLine(ctx, [[lx, top], [fx, fy - 0.01]], 0.11, back ? shade(LAN.leg, -0.2) : LAN.leg, seed + 1, 0.004);
  sb(ctx, ell(fx + 0.05, fy + 0.03, 0.15, 0.07, 10), shade(LAN.leg, -0.3), { lw: 0.035, seed: seed + 2 });
}
function tassel(ctx, t, sway = 0) {
  const top = CY + RY + 0.1, sw = Math.sin(t * 3) * 0.04 + sway;
  inkLine(ctx, [[0, top], [sw * 0.5, top + 0.18]], 0.05, LAN.tassel, 800, 0.003);
  sb(ctx, ell(sw * 0.5, top + 0.2, 0.06, 0.05, 8), LAN.gold, { lw: 0.03, seed: 801 });
  sb(ctx, [[sw * 0.5 - 0.07, top + 0.24], [sw * 0.5 + 0.07, top + 0.24], [sw + 0.11, top + 0.56], [sw - 0.11, top + 0.56]], LAN.tassel, { lw: 0.035, seed: 802, edge: 0.04 });
  for (let i = -1; i <= 1; i++) inkLine(ctx, [[sw * 0.5 + i * 0.03, top + 0.27], [sw + i * 0.06, top + 0.54]], 0.015, LAN.body2, 803 + i, 0.002);
}
function caps(ctx, open = false) {
  const tT = CY - RY, tB = CY + RY;
  if (!open) { inkLine(ctx, [[-0.22, tT - 0.12], [-0.16, tT - 0.4], [0, tT - 0.47], [0.16, tT - 0.4], [0.22, tT - 0.12]], 0.07, LAN.gold2, 810, 0.004); }
  sb(ctx, [[-0.5, tT - 0.14], [0.5, tT - 0.14], [0.56, tT + 0.06], [-0.56, tT + 0.06]], LAN.gold, { lw: 0.045, seed: 811, edge: 0.05 });
  inkLine(ctx, [[-0.5, tT - 0.04], [0.5, tT - 0.04]], 0.025, LAN.gold2, 812, 0.003);
  sb(ctx, [[-0.46, tB - 0.06], [0.46, tB - 0.06], [0.4, tB + 0.12], [-0.4, tB + 0.12]], LAN.gold, { lw: 0.045, seed: 813, edge: 0.05 });
}
function ribsAndFace(ctx, th, E, t, o) {
  const body = lanternBody();
  ctx.save(); trace(ctx, body, true); ctx.clip();
  // 灯笼里的暖光
  const g = ctx.createRadialGradient(Math.sin(-th) * 0.1, CY, 0.05, 0, CY, 1.1);
  g.addColorStop(0, rgba(LAN.glow, 0.75)); g.addColorStop(1, rgba(LAN.glow, 0));
  ctx.fillStyle = g; ctx.fillRect(-1.5, CY - 1, 3, 2);
  // 竖向骨架：随视角转动
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2 - th; if (Math.cos(a) < 0.05) continue;
    const x = Math.sin(a) * RX, bulge = Math.sin(a) * 0.06;
    inkLine(ctx, [[x * 0.55, CY - RY], [x + bulge, CY], [x * 0.55, CY + RY]], 0.03, rgba(LAN.rib, 0.85), 820 + k, 0.004);
  }
  sb(ctx, ell(-0.45, CY - 0.38, 0.14, 0.22, 10, 0.5), rgba('#ffe0c0', 0.45), { line: null, wash: false });
  ctx.restore();
  // 背面：金色盘长结纹样
  const back = Math.cos(th - Math.PI);
  if (back > 0.3) {
    const bx = Math.sin(Math.PI - th) * 0.6;
    ctx.save(); ctx.translate(bx, CY); ctx.scale(back, 1); ctx.rotate(Math.PI / 4);
    sb(ctx, [[-0.18, -0.18], [0.18, -0.18], [0.18, 0.18], [-0.18, 0.18]], null, { lw: 0.05, line: LAN.gold });
    sb(ctx, [[-0.08, -0.08], [0.08, -0.08], [0.08, 0.08], [-0.08, 0.08]], null, { lw: 0.04, line: LAN.gold });
    ctx.restore();
  }
  // 脸
  const fc = Math.cos(th);
  if (fc > -0.1 && !o.lid) {
    const fx = Math.sin(th) * 0.62, ex = o.eyes || E.eyes, look = o.look || E.look || [0, 0];
    ctx.save(); ctx.translate(fx, CY + 0.02);
    if (fc > 0.5) {
      const far = 0.55 + 0.45 * fc;
      eye(ctx, 0.3 * far + (1 - fc) * 0.05, -0.12, ex, 1, look, t);
      ctx.save(); ctx.translate(-0.3 * far, -0.12); ctx.scale(far, 1); eye(ctx, 0, 0, ex, -1, look, t); ctx.restore();
      ctx.save(); ctx.scale(far, 1); mouth(ctx, E.mouth, t); ctx.restore();
      if (E.blush) [-1, 1].forEach(k => sb(ctx, ell(k * 0.5 * far, 0.12, 0.13, 0.07, 10), rgba('#ffb0a0', 0.55), { line: null, wash: false }));
      if (E.brow === 'angry') { inkLine(ctx, [[-0.44, -0.36], [-0.18, -0.26]], 0.055, INK, 830, 0.004); inkLine(ctx, [[0.44, -0.36], [0.18, -0.26]], 0.055, INK, 831, 0.004); }
    } else { eye(ctx, 0.1, -0.12, ex, 1, look, t); ctx.save(); ctx.translate(0.14, 0); ctx.scale(0.45, 1); mouth(ctx, E.mouth, t); ctx.restore(); }
    ctx.restore();
  }
}

// ---------- 中国风配饰（耳机、蝴蝶结这类通用的保留） ----------
function lAcc(ctx, acc, t, th) {
  const top = CY - RY - 0.14, o = (p, c, s) => sb(ctx, p, c, { lw: 0.045, seed: 900 + s, edge: 0.06 });
  switch (acc) {
    case 'guapi': // 瓜皮帽
      o(ell(0, top + 0.02, 0.56, 0.36, 18).filter(p => p[1] <= top + 0.04).concat([[0.56, top + 0.06], [-0.56, top + 0.06]]), '#2e2838', 1);
      o([[-0.58, top + 0.02], [0.58, top + 0.02], [0.58, top + 0.12], [-0.58, top + 0.12]], '#3a3448', 2);
      [-0.28, 0, 0.28].forEach((x, i) => inkLine(ctx, [[x * 0.4, top - 0.33], [x, top]], 0.02, '#5a5468', 903 + i, 0.003));
      sb(ctx, ell(0, top - 0.38, 0.09, 0.09, 10), '#d8302a', { lw: 0.035, seed: 906 }); break;
    case 'douli': // 斗笠
      o([[-1.15, top + 0.08], [0, top - 0.62], [1.15, top + 0.08], [0, top + 0.16]], '#d8b878', 7);
      for (let i = 1; i < 5; i++) inkLine(ctx, [[-1.15 * i / 5, top + 0.08 - 0.7 * (1 - i / 5) + 0.02], [1.15 * i / 5, top + 0.08 - 0.7 * (1 - i / 5) + 0.02]], 0.015, '#a88a4a', 908 + i, 0.003);
      inkLine(ctx, [[-0.5, top + 0.1], [-0.6, CY + 0.2]], 0.02, '#7a5a3a', 913, 0.003); break;
    case 'tiger': // 虎头帽
      o(ell(0, top + 0.02, 0.6, 0.4, 18).filter(p => p[1] <= top + 0.04).concat([[0.6, top + 0.08], [-0.6, top + 0.08]]), '#f0a02a', 14);
      [-1, 1].forEach((k, i) => { sb(ctx, ell(k * 0.46, top - 0.32, 0.15, 0.15, 10), '#f0a02a', { lw: 0.045, seed: 915 + i }); sb(ctx, ell(k * 0.46, top - 0.32, 0.07, 0.07, 8), '#f4d0a0', { line: null, wash: false }); });
      [-0.15, 0, 0.15].forEach((y, i) => inkLine(ctx, [[-0.18, top - 0.2 + y * 0.6], [0.18, top - 0.2 + y * 0.6]], 0.035, '#2e2838', 917 + i, 0.003));
      [-1, 1].forEach((k, i) => inkLine(ctx, [[k * 0.52, top - 0.12], [k * 0.36, top - 0.06]], 0.03, '#2e2838', 920 + i, 0.003));
      o([[-0.62, top + 0.02], [0.62, top + 0.02], [0.62, top + 0.12], [-0.62, top + 0.12]], '#d8302a', 22); break;
    case 'phoenix': // 凤冠
      o([[-0.5, top + 0.08], [-0.55, top - 0.3], [-0.25, top - 0.15], [0, top - 0.48], [0.25, top - 0.15], [0.55, top - 0.3], [0.5, top + 0.08]], LAN.gold, 23);
      sb(ctx, ell(0, top - 0.2, 0.08, 0.1, 10), '#d8302a', { lw: 0.03, seed: 924 }); [-0.3, 0.3].forEach((x, i) => sb(ctx, ell(x, top - 0.05, 0.05, 0.05, 8), '#4aa0c8', { lw: 0.025, seed: 925 + i }));
      [-1, 1].forEach((k, i) => { inkLine(ctx, [[k * 0.52, top + 0.02], [k * 0.66, top + 0.45]], 0.02, LAN.gold2, 927 + i, 0.003); for (let j = 0; j < 3; j++) sb(ctx, ell(k * (0.55 + j * 0.04), top + 0.15 + j * 0.13, 0.035, 0.035, 8), '#fbf6ee', { lw: 0.02, seed: 929 + j }); }); break;
    case 'wusha': // 乌纱帽
      o(ell(0, top + 0.02, 0.45, 0.42, 18).filter(p => p[1] <= top + 0.04).concat([[0.45, top + 0.06], [-0.45, top + 0.06]]), '#2e2838', 32);
      o([[-0.55, top - 0.05], [0.55, top - 0.05], [0.55, top + 0.1], [-0.55, top + 0.1]], '#2e2838', 33);
      [-1, 1].forEach((k, i) => { inkLine(ctx, [[k * 0.5, top - 0.06], [k * 1.05, top - 0.18]], 0.03, '#2e2838', 934 + i, 0.003); sb(ctx, ell(k * 1.12, top - 0.19, 0.17, 0.08, 10, k * 0.15), '#2e2838', { lw: 0.035, seed: 936 + i }); }); break;
    case 'hairpin': // 发簪
      inkLine(ctx, [[-0.42, top - 0.42], [0.36, top + 0.12]], 0.07, LAN.gold2, 940, 0.004);
      sb(ctx, ell(-0.44, top - 0.44, 0.08, 0.08, 10), '#e8506a', { lw: 0.03, seed: 941 });
      inkLine(ctx, [[-0.44, top - 0.38], [-0.5, top - 0.1]], 0.02, '#d8302a', 942, 0.003);
      sb(ctx, [[-0.55, top - 0.12], [-0.45, top - 0.12], [-0.43, top + 0.1], [-0.57, top + 0.1]], '#d8302a', { lw: 0.025, seed: 943 }); break;
    case 'knot': { // 中国结（挂在身侧）
      const x = 0.98, y = CY - 0.1;
      inkLine(ctx, [[0.82, CY - 0.5], [x, y - 0.22]], 0.03, '#d8302a', 944, 0.003);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      sb(ctx, [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]], '#d8302a', { lw: 0.04, seed: 945 });
      inkLine(ctx, [[-0.15, 0], [0.15, 0]], 0.02, '#8a1e1a', 946, 0.002); inkLine(ctx, [[0, -0.15], [0, 0.15]], 0.02, '#8a1e1a', 947, 0.002);
      ctx.restore();
      sb(ctx, [[x - 0.05, y + 0.2], [x + 0.05, y + 0.2], [x + 0.09, y + 0.5], [x - 0.09, y + 0.5]], '#d8302a', { lw: 0.03, seed: 948 }); break; }
    case 'lock': // 长命锁
      inkLine(ctx, [[-0.52, CY - 0.52], [-0.3, CY + 0.12], [0, CY + 0.22], [0.3, CY + 0.12], [0.52, CY - 0.52]], 0.03, '#c8ccd4', 949, 0.003);
      o([[-0.24, CY + 0.25], [0.24, CY + 0.25], [0.2, CY + 0.42], [0, CY + 0.52], [-0.2, CY + 0.42]], '#d8dce4', 50);
      sb(ctx, ell(0, CY + 0.36, 0.05, 0.05, 8), '#d8302a', { line: null, wash: false }); break;
    case 'fan': { // 团扇（右手拿着）
      const x = 1.2, y = CY - 0.25;
      inkLine(ctx, [[x, y + 0.22], [x - 0.05, y + 0.6]], 0.05, '#8a5a3a', 951, 0.003);
      sb(ctx, ell(x, y, 0.32, 0.32, 18), '#fbf2e4', { lw: 0.045, seed: 952, edge: 0.05 });
      inkLine(ctx, [[x - 0.2, y + 0.18], [x, y - 0.02], [x + 0.12, y - 0.18]], 0.025, '#5a4030', 953, 0.003);
      [[x - 0.02, y - 0.03], [x + 0.12, y - 0.16], [x - 0.13, y + 0.1]].forEach(([px, py], i) => sb(ctx, ell(px, py, 0.05, 0.05, 8), '#ef7aa0', { line: null, wash: false })); break; }
    case 'opera': // 京剧脸谱面具
      o([[-0.62, CY - 0.38], [0, CY - 0.44], [0.62, CY - 0.38], [0.55, CY + 0.08], [0.2, CY + 0.06], [0, CY - 0.04], [-0.2, CY + 0.06], [-0.55, CY + 0.08]], '#fbf6ee', 54);
      [-1, 1].forEach((k, i) => { sb(ctx, [[k * 0.12, CY - 0.36], [k * 0.55, CY - 0.4], [k * 0.45, CY - 0.27]], '#2e2838', { line: null, wash: false }); sb(ctx, ell(k * 0.3, CY - 0.1, 0.13, 0.09, 10), '#d8302a', { line: null, wash: false }); });
      sb(ctx, [[-0.04, CY - 0.44], [0.04, CY - 0.44], [0.03, CY - 0.1], [-0.03, CY - 0.1]], '#d8302a', { line: null, wash: false }); break;
    case 'collar': // 立领 + 盘扣
      o([[-0.56, CY - RY - 0.06], [0.56, CY - RY - 0.06], [0.6, CY - RY + 0.14], [-0.6, CY - RY + 0.14]], '#2e5aa8', 57);
      [0, 0.1].forEach((dy, i) => { inkLine(ctx, [[-0.12, CY - RY + 0.2 + dy * 2.5], [0.12, CY - RY + 0.2 + dy * 2.5]], 0.035, LAN.gold, 958 + i, 0.003); sb(ctx, ell(0.14, CY - RY + 0.2 + dy * 2.5, 0.04, 0.04, 8), LAN.gold, { lw: 0.02, seed: 960 + i }); }); break;
    case 'plum': // 梅花
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; sb(ctx, ell(0.4 + Math.cos(a) * 0.09, top - 0.06 + Math.sin(a) * 0.09, 0.07, 0.07, 8), '#f490b0', { lw: 0.025, seed: 962 + i }); }
      sb(ctx, ell(0.4, top - 0.06, 0.04, 0.04, 8), '#f6c84a', { lw: 0.02, seed: 967 }); inkLine(ctx, [[0.28, top + 0.05], [0.12, top + 0.12]], 0.025, '#5a3a2a', 968, 0.003); break;
    case 'panda': // 熊猫耳发箍
      inkLine(ctx, [[-0.58, top + 0.06], [-0.4, top - 0.18], [0, top - 0.26], [0.4, top - 0.18], [0.58, top + 0.06]], 0.06, '#2e2838', 969, 0.004);
      [-1, 1].forEach((k, i) => { sb(ctx, ell(k * 0.42, top - 0.26, 0.17, 0.17, 12), '#2e2838', { lw: 0.04, seed: 970 + i }); sb(ctx, ell(k * 0.42, top - 0.26, 0.07, 0.07, 8), '#5a5468', { line: null, wash: false }); }); break;
    case 'headphones':
      inkLine(ctx, [[-0.92, CY], [-0.75, CY - RY - 0.1], [0, CY - RY - 0.32], [0.75, CY - RY - 0.1], [0.92, CY]], 0.1, '#2e2838', 972, 0.004);
      [-1, 1].forEach((k, i) => sb(ctx, ell(k * 0.98, CY + 0.02, 0.12, 0.2, 10), '#7a5ac8', { lw: 0.045, seed: 973 + i })); break;
    case 'bow':
      o([[0.3, top - 0.08], [0.08, top - 0.22], [0.1, top + 0.06]], '#ef7aa8', 75); o([[0.3, top - 0.08], [0.52, top - 0.22], [0.5, top + 0.06]], '#ef7aa8', 76);
      sb(ctx, ell(0.3, top - 0.08, 0.05, 0.05, 8), '#d8507a', { lw: 0.03, seed: 977 }); break;
  }
}

function drawLantern(ctx, x, y, s, o, t) {
  o = Object.assign({ view: 'front', emo: 'neutral', legs: 'stand', walk: 0, arms: 'down', lift: 0, lean: 0, lid: 0, acc: null, stretch: 0, flip: false }, o);
  const th = LVIEW[o.view], E = EMO[o.emo] || EMO.neutral;
  ctx.save(); ctx.translate(x, y);
  if (WATERCOLOR) { ctx.save(); ctx.filter = 'blur(3px)'; sb(ctx, ell(0, 2, s * 1.0 * (1 - o.lift * 0.4), s * 0.16, 16), rgba('#8a7aa0', 0.32), { line: null, wash: false, amp: 1.5 }); ctx.restore(); }
  else sb(ctx, ell(0, 0, s * 0.95 * (1 - o.lift * 0.4), s * 0.13, 16), rgba('#5a4a3a', 0.18), { line: null, wash: false, amp: 1 });
  ctx.scale(s * (o.flip ? -1 : 1), s); ctx.translate(0, -o.lift); ctx.rotate(o.lean);
  const br = Math.sin(t * 2.4) * 0.012; ctx.scale(1 - o.stretch * 0.5 + br, 1 + o.stretch - br);
  // 腿（侧面时前后重叠）
  const side = Math.abs(Math.sin(th)), legX = [-0.42 * (1 - side * 0.8) - side * 0.08, 0.42 * (1 - side * 0.8) + side * 0.1];
  legX.forEach((lx, i) => lLeg(ctx, lx, o.legs === 'walk' ? Math.sin(o.walk + i * Math.PI) * 0.45 : o.legs === 'tuck' ? (i ? -0.5 : 0.5) : 0, o.legs === 'tuck', side > 0.9 && i === 0, 840 + i * 3));
  tassel(ctx, t, o.legs === 'walk' ? Math.sin(o.walk * 2) * 0.05 : 0);
  // 远侧手臂
  const aY = CY + 0.1, end = { down: [0.4, 0.32], up: [0.28, -0.6], out: [0.38, -0.04] }[o.arms];
  if (o.view === 'q') lArm(ctx, -RX + 0.1, aY, -RX - end[0] * 0.6, aY + end[1], true, 850);
  if (o.view === 'qback') lArm(ctx, RX - 0.1, aY, RX + end[0] * 0.6, aY + end[1], true, 850);
  if (o.view === 'side') lArm(ctx, -0.1, aY, -0.35 - (o.legs === 'walk' ? Math.sin(o.walk) * 0.2 : 0), aY + 0.34, true, 850);
  const hat = LHATS.includes(o.acc);
  if (o.lid > 0) {
    // 下半身
    ctx.save(); ctx.beginPath(); ctx.rect(-2, CY - 0.1, 4, 3); ctx.clip();
    sb(ctx, lanternBody(), LAN.body, { lw: 0.05, amp: 0.008, seed: 860, edge: 0.14 }); ribsAndFace(ctx, th, E, t, o); ctx.restore();
    caps(ctx, true);
    sb(ctx, ell(0, CY - 0.1, RX * 0.88, 0.14, 18), '#4a1414', { lw: 0.04, seed: 861 });
    glow(ctx, 0, CY - 0.15, 0.6, '#ffb040', 0.7);
    flame(ctx, 0, CY - 0.05, 0.12, 0.35, t, 3, ['#f08a2c', '#ffd25a', '#fff2c0']);
    for (let i = 0; i < 6; i++) { const xx = -0.62 + i * 0.25; sb(ctx, [[xx - 0.08, CY - 0.06], [xx + 0.08, CY - 0.06], [xx, CY - 0.26]], '#fbf6ee', { lw: 0.03, seed: 862 + i }); }
    // 掀开的上半身
    const hx = -RX, hy = CY - 0.1;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-o.lid); ctx.translate(-hx, -hy);
    ctx.save(); ctx.beginPath(); ctx.rect(-2, -4, 4, 4 + CY - 0.1); ctx.clip();
    sb(ctx, lanternBody(), LAN.body, { lw: 0.05, amp: 0.008, seed: 870, edge: 0.14 }); ribsAndFace(ctx, th, E, t, o); ctx.restore();
    caps(ctx, false);
    sb(ctx, [[-RX * 0.9, CY - 0.1], [RX * 0.9, CY - 0.1], [RX * 0.8, CY - 0.02], [-RX * 0.8, CY - 0.02]], '#4a1414', { lw: 0.04, seed: 871 });
    for (let i = 0; i < 6; i++) { const xx = -0.62 + i * 0.25; sb(ctx, [[xx - 0.08, CY - 0.06], [xx + 0.08, CY - 0.06], [xx, CY + 0.12]], '#fbf6ee', { lw: 0.03, seed: 872 + i }); }
    eye(ctx, -0.3, CY - 0.42, 'squint', -1, [0, 0], t); eye(ctx, 0.3, CY - 0.42, 'squint', 1, [0, 0], t);
    inkLine(ctx, [[-0.46, CY - 0.62], [-0.18, CY - 0.52]], 0.055, INK, 880, 0.004); inkLine(ctx, [[0.46, CY - 0.62], [0.18, CY - 0.52]], 0.055, INK, 881, 0.004);
    ctx.restore();
  } else {
    sb(ctx, lanternBody(), LAN.body, { lw: 0.05, amp: 0.008, seed: 860, edge: 0.14 });
    ribsAndFace(ctx, th, E, t, o);
    if (!hat || o.acc === 'panda') caps(ctx, false); else caps(ctx, true);
  }
  ctx.__bodyCol = LAN.body;
  // 近侧手臂
  if (o.view === 'front' || o.view === 'back' || o.lid) [-1, 1].forEach((k, i) => lArm(ctx, k * (RX - 0.08), aY, k * (RX + end[0]), aY + end[1] + (o.arms === 'up' ? Math.sin(t * 6 + i) * 0.04 : 0), false, 885 + i * 3));
  if (o.view === 'q') lArm(ctx, RX - 0.08, aY, RX + end[0], aY + end[1], false, 885);
  if (o.view === 'qback') lArm(ctx, -RX + 0.08, aY, -RX - end[0], aY + end[1], false, 885);
  if (o.view === 'side') lArm(ctx, 0.15, aY, 0.42 + (o.legs === 'walk' ? Math.sin(o.walk) * 0.2 : 0), aY + (o.arms === 'out' ? -0.04 : 0.32), false, 885);
  if (o.acc) lAcc(ctx, o.acc, t, th);
  ctx.restore();
}
