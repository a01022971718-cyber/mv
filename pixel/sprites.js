// 原创角色与道具的像素精灵（全部为程序化逐像素绘制）
const KIDS = {
  lan: { hair: PAL.lanHair, hair2: PAL.lanHair2, eye: PAL.amber, top: PAL.jacket, top2: PAL.jacket2, trim: PAL.teal, leg: PAL.pants, leg2: PAL.pants2, scarf: true, type: 'spiky' },
  kui: { hair: PAL.kuiHair, hair2: PAL.kuiHair2, eye: PAL.kuiEye, top: PAL.cloak, top2: PAL.cloak2, trim: PAL.gold, leg: PAL.cloak2, leg2: '#1f4a2e', scarf: false, type: 'bob' },
  shuang: { hair: PAL.shHair, hair2: PAL.shHair2, eye: PAL.shEye, top: PAL.coat, top2: PAL.coat2, trim: PAL.silver, leg: PAL.coat2, leg2: '#161e34', scarf: false, type: 'long' },
};
// 姿势：肩→肘→手，髋→膝→脚（32×48 精灵坐标）
const KPOSE = {
  stand1: { dy: 0, aB: [[11, 23], [9, 28], [9, 32]], aF: [[21, 23], [23, 28], [23, 32]], lB: [[14, 34], [14, 40], [14, 45]], lF: [[18, 34], [18, 40], [18, 45]], tail: 0 },
  stand2: { dy: 1, aB: [[11, 24], [8, 29], [9, 33]], aF: [[21, 24], [24, 29], [23, 33]], lB: [[14, 34], [14, 40], [14, 45]], lF: [[18, 34], [18, 40], [18, 45]], tail: 1 },
  run1: { dy: 0, lean: 1, aB: [[11, 23], [7, 27], [5, 30]], aF: [[21, 23], [25, 26], [28, 23]], lB: [[15, 34], [11, 39], [7, 41]], lF: [[17, 34], [21, 38], [23, 44]], tail: 2 },
  run2: { dy: 1, lean: 1, aB: [[11, 24], [14, 28], [17, 30]], aF: [[21, 24], [19, 29], [16, 31]], lB: [[15, 34], [16, 40], [15, 45]], lF: [[17, 34], [20, 39], [17, 42]], tail: 3 },
  raise: { dy: 0, aB: [[11, 23], [8, 28], [7, 32]], aF: [[21, 23], [25, 17], [26, 10]], lB: [[13, 34], [12, 40], [11, 45]], lF: [[19, 34], [20, 40], [21, 45]], tail: 1 },
};

function kidHead(g, k, hx, hy, face = 'normal') {
  // 后发
  if (k.type === 'spiky') {
    E(g, hx, hy - 1, 9, 8, k.hair);
    poly(g, [[hx - 9, hy - 2], [hx - 8, hy - 11], [hx - 4, hy - 6]], k.hair);
    poly(g, [[hx - 5, hy - 6], [hx - 3, hy - 13], [hx + 1, hy - 7]], k.hair);
    poly(g, [[hx - 1, hy - 7], [hx + 3, hy - 13], [hx + 5, hy - 6]], k.hair);
    poly(g, [[hx + 3, hy - 6], [hx + 9, hy - 10], [hx + 8, hy - 2]], k.hair);
    poly(g, [[hx + 7, hy - 2], [hx + 12, hy], [hx + 8, hy + 3]], k.hair);
    poly(g, [[hx - 8, hy - 1], [hx - 12, hy + 1], [hx - 8, hy + 4]], k.hair);
  } else if (k.type === 'bob') {
    E(g, hx, hy - 1, 9, 8, k.hair); R(g, hx - 9, hy - 1, 3, 8, k.hair); R(g, hx + 7, hy - 1, 3, 8, k.hair);
    P(g, hx - 10, hy + 6, k.hair); P(g, hx + 9, hy + 6, k.hair);
  } else {
    E(g, hx, hy - 1, 9, 8, k.hair);
    poly(g, [[hx + 6, hy - 6], [hx + 14, hy - 3], [hx + 13, hy + 8], [hx + 9, hy + 2]], k.hair); // 马尾
  }
  // 脸
  E(g, hx, hy + 1, 7, 6.5, PAL.skin);
  R(g, hx - 7, hy + 2, 1, 3, PAL.skin2);
  // 刘海
  if (k.type === 'spiky') {
    poly(g, [[hx - 8, hy - 3], [hx - 7, hy - 8], [hx + 7, hy - 8], [hx + 8, hy - 3], [hx + 5, hy - 4], [hx + 4, hy - 1], [hx + 2, hy - 4], [hx, hy], [hx - 2, hy - 4], [hx - 4, hy - 1], [hx - 5, hy - 4]], k.hair);
    line(g, hx + 2, hy - 7, hx + 1, hy - 3, PAL.streak, 1); P(g, hx + 3, hy - 6, PAL.streak);
    line(g, hx - 5, hy - 7, hx - 3, hy - 8, k.hair2, 1);
  } else if (k.type === 'bob') {
    R(g, hx - 8, hy - 8, 16, 5, k.hair); for (let x = -7; x <= 6; x += 3) P(g, hx + x, hy - 3, k.hair);
    line(g, hx - 5, hy - 7, hx - 2, hy - 8, k.hair2, 1);
    mat(g, hx + 4, hy - 9, ['.ll', 'lLl', 'll.'], { l: PAL.leaf, L: PAL.stem }); // 叶子发卡
  } else {
    poly(g, [[hx - 8, hy + 2], [hx - 8, hy - 7], [hx + 8, hy - 8], [hx + 8, hy - 3], [hx + 2, hy - 5], [hx - 4, hy - 2]], k.hair);
    line(g, hx - 4, hy - 7, hx + 3, hy - 7, k.hair2, 1);
  }
  // 眼
  const em = { k: PAL.ink, a: k.eye, i: PAL.hi, w: PAL.hi, b: '#a8dcff' };
  if (face === 'happy') { [hx - 4, hx + 2].forEach(x => mat(g, x, hy, ['.k.', 'k.k'], em)); }
  else { [hx - 4, hx + 2].forEach(x => mat(g, x, hy - 1, ['kkk', 'aia', '.a.'], em)); }
  // 嘴
  if (face === 'happy') mat(g, hx - 1, hy + 4, ['m.m', '.m.'], { m: PAL.mouth }); else P(g, hx, hy + 4, PAL.mouth);
  if (k.type !== 'spiky') { P(g, hx - 5, hy + 3, PAL.blush); P(g, hx + 5, hy + 3, PAL.blush); }
}

function makeKid(name, poseName) {
  const k = KIDS[name], p = KPOSE[poseName];
  const [c, g] = mk(34, 50);
  g.translate(1, 1);
  const dy = p.dy, lx = p.lean || 0;
  // 长发在身后
  if (k.type === 'long') { R(g, 7 + lx, 10 + dy, 18, 20, k.hair); R(g, 8 + lx, 30 + dy, 16, 2, k.hair2); }
  // 围巾尾
  if (k.scarf) { const w = p.tail; polyline(g, [[12, 21 + dy], [8, 22 + dy + (w % 2)], [5, 21 + dy + (w > 1 ? 1 : 0)], [2, 23 + dy - (w % 2)]], PAL.scarf, 2); }
  limbO(g, p.lB, k.leg2, 3); R(g, p.lB[2][0] - 1, p.lB[2][1], 4, 2, PAL.shoe);
  limbO(g, p.aB, k.top2, 2); R(g, p.aB[2][0] - 1, p.aB[2][1] - 1, 2, 2, PAL.skin2);
  // 躯干
  if (name === 'kui') poly(g, [[10 + lx, 21 + dy], [22 + lx, 21 + dy], [25, 36], [7, 36]], k.top);
  else if (name === 'shuang') poly(g, [[10 + lx, 21 + dy], [22 + lx, 21 + dy], [23, 38], [9, 38]], k.top);
  else poly(g, [[10 + lx, 21 + dy], [22 + lx, 21 + dy], [22, 34], [10, 34]], k.top);
  R(g, 10 + lx, 22 + dy, 1, 11, k.top2);
  line(g, 16 + lx, 22 + dy, 16, 32, k.trim, 1);
  if (name === 'lan') { R(g, 10, 32, 12, 2, PAL.belt); P(g, 16, 33, PAL.amber2); }
  if (name === 'kui') { R(g, 12 + lx, 21 + dy, 8, 1, k.trim); }
  if (k.scarf) { R(g, 11 + lx, 19 + dy, 10, 3, PAL.scarf); R(g, 11 + lx, 21 + dy, 10, 1, PAL.scarf2); }
  limbO(g, p.lF, k.leg, 3); R(g, p.lF[2][0] - 1, p.lF[2][1], 4, 2, PAL.shoe);
  kidHead(g, k, 16 + lx, 11 + dy, poseName === 'raise' ? 'normal' : 'normal');
  limbO(g, p.aF, k.top, 2); R(g, p.aF[2][0] - 1, p.aF[2][1] - 1, 2, 2, PAL.skin);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return outline(c);
}

// 64×64 头像：normal / surprise / cry / smile
function makePortrait(name, face) {
  const k = KIDS[name];
  const [c, g] = mk(64, 64);
  const hx = 32, hy = 30;
  // 后发
  if (k.type === 'spiky') {
    E(g, hx, hy - 3, 22, 19, k.hair);
    [[-22, -6, -20, -26, -10, -16], [-12, -16, -7, -32, 2, -18], [-2, -18, 7, -33, 12, -17], [8, -16, 21, -26, 20, -6], [18, -6, 29, 0, 19, 6], [-18, -4, -29, 2, -19, 8]]
      .forEach(([a, b, cc, d, e, f]) => poly(g, [[hx + a, hy + b], [hx + cc, hy + d], [hx + e, hy + f]], k.hair));
  } else if (k.type === 'bob') {
    E(g, hx, hy - 3, 22, 19, k.hair); R(g, hx - 22, hy - 3, 8, 22, k.hair); R(g, hx + 14, hy - 3, 8, 22, k.hair);
  } else {
    E(g, hx, hy - 3, 22, 19, k.hair); R(g, hx - 22, hy - 3, 44, 40, k.hair);
  }
  // 肩
  poly(g, [[4, 64], [8, 54], [22, 49], [42, 49], [56, 54], [60, 64]], k.top);
  poly(g, [[24, 49], [40, 49], [35, 58], [29, 58]], k.trim);
  if (k.scarf) { poly(g, [[18, 46], [46, 46], [48, 53], [32, 56], [16, 53]], PAL.scarf); R(g, 18, 52, 28, 1, PAL.scarf2); }
  R(g, 28, 44, 8, 4, PAL.skin2);
  // 脸
  E(g, hx, hy + 3, 17, 16, PAL.skin);
  poly(g, [[hx - 12, hy + 12], [hx + 12, hy + 12], [hx + 2, hy + 20], [hx - 2, hy + 20]], PAL.skin);
  R(g, hx - 17, hy + 2, 2, 8, PAL.skin2);
  // 刘海
  if (k.type === 'spiky') {
    poly(g, [[hx - 19, hy - 2], [hx - 17, hy - 17], [hx + 17, hy - 17], [hx + 19, hy - 2], [hx + 14, hy - 6], [hx + 12, hy + 1], [hx + 7, hy - 7], [hx + 3, hy + 2], [hx - 1, hy - 7], [hx - 6, hy + 1], [hx - 9, hy - 7], [hx - 13, hy], [hx - 15, hy - 6]], k.hair);
    poly(g, [[hx + 3, hy - 16], [hx + 7, hy - 16], [hx + 5, hy - 2], [hx + 3, hy + 1]], PAL.streak);
    line(g, hx - 12, hy - 14, hx - 5, hy - 16, k.hair2, 2);
  } else if (k.type === 'bob') {
    R(g, hx - 19, hy - 17, 38, 11, k.hair);
    for (let x = -17; x <= 15; x += 6) poly(g, [[hx + x, hy - 6], [hx + x + 4, hy - 6], [hx + x + 2, hy - 3]], k.hair);
    line(g, hx - 12, hy - 15, hx - 4, hy - 16, k.hair2, 2);
    mat(g, hx + 10, hy - 20, ['..ll.', '.llLl', 'lLll.', 'll...'], { l: PAL.leaf, L: PAL.stem });
  } else {
    poly(g, [[hx - 19, hy + 6], [hx - 18, hy - 17], [hx + 17, hy - 18], [hx + 19, hy - 4], [hx + 6, hy - 9], [hx - 8, hy - 3]], k.hair);
    line(g, hx - 10, hy - 15, hx + 6, hy - 16, k.hair2, 2);
  }
  // 眼睛 7×9
  const em = { k: PAL.ink, a: k.eye, d: PAL.ink2, i: PAL.hi, w: '#fbf6ee', b: '#a8dcff' };
  const EYE = {
    normal: ['.kkkkk.', 'kkkkkkk', 'waaaaaw', 'wadiaaw', 'waddaaw', 'waaaiaw', '.waaaw.', '..www..'],
    surprise: ['.kkkkk.', 'kwwwwwk', 'wwaaaww', 'wwadaww', 'wwaiaww', 'wwaaaww', '.wwwww.', '.......'],
    cry: ['.......', 'kk.....', '.kkkkkk', 'waaaaaw', 'waddiaw', 'waaaaaw', 'bbwwwbb', '.b...b.'],
    smile: ['.......', '.......', '.kkkkk.', 'k.....k', '.......', '.......', '.......', '.......'],
  };
  [[hx - 13, 0], [hx + 6, 1]].forEach(([x, side]) => {
    const rows = EYE[face].map(r => side && face === 'cry' ? [...r].reverse().join('') : r);
    mat(g, x, hy - 1, rows, em);
  });
  // 眉
  const brow = { normal: [0, 0], surprise: [-2, -2], cry: [1, -2], smile: [0, 0] }[face];
  line(g, hx - 13, hy - 4 + brow[0], hx - 8, hy - 4 + brow[1], PAL.ink, 1);
  line(g, hx + 8, hy - 4 + brow[1], hx + 13, hy - 4 + brow[0], PAL.ink, 1);
  // 泪
  if (face === 'cry') { for (let i = 0; i < 6; i++) { P(g, hx - 11, hy + 8 + i, '#a8dcff'); P(g, hx + 10, hy + 8 + i, '#a8dcff'); } }
  // 鼻、嘴、腮红
  P(g, hx, hy + 9, PAL.skin2);
  const mm = { m: PAL.mouth, t: '#e07a7e', k: PAL.ink };
  if (face === 'normal') mat(g, hx - 2, hy + 13, ['kkkk'], mm);
  if (face === 'surprise') mat(g, hx - 2, hy + 12, ['.mm.', 'mmmm', 'mttm', '.mm.'], mm);
  if (face === 'cry') mat(g, hx - 3, hy + 13, ['.k..k.', 'k.kk.k'], mm);
  if (face === 'smile') mat(g, hx - 3, hy + 12, ['k....k', 'kmmmmk', '.mttm.'], mm);
  if (face === 'smile' || k.type !== 'spiky') { R(g, hx - 15, hy + 9, 4, 1, PAL.blush); R(g, hx + 11, hy + 9, 4, 1, PAL.blush); }
  return outline(c);
}

// 小焰：小形态 24×20，2 帧
function makeEmberSmall(f) {
  const [c, g] = mk(26, 22); g.translate(1, 1);
  const sq = f === 1 ? 1 : 0;
  // 尾巴火苗
  const tip = f ? [0, 1] : [1, 0];
  poly(g, [[6, 12], [1 + tip[0], 4], [4, 7], [3, 1 + tip[1]], [8, 9]], PAL.fl1);
  poly(g, [[6, 12], [3, 6], [5, 8], [5, 4], [8, 10]], PAL.fl2);
  P(g, 5, 8, PAL.fl3); P(g, 6, 9, PAL.fl3);
  E(g, 11, 13 + sq, 7, 5 - sq, PAL.emb);
  E(g, 12, 15 + sq, 4, 2, PAL.embL);
  R(g, 6, 17, 3, 2, PAL.emb2); R(g, 14, 17, 3, 2, PAL.emb2);
  // 头
  poly(g, [[11, 5 + sq], [12, -1 + sq], [15, 4 + sq]], PAL.emb); poly(g, [[17, 4 + sq], [21, 0 + sq], [20, 6 + sq]], PAL.emb);
  P(g, 12, 2 + sq, PAL.fl2); P(g, 20, 2 + sq, PAL.fl2);
  E(g, 16, 8 + sq, 6, 5, PAL.emb);
  E(g, 18, 10 + sq, 3, 2, PAL.embL);
  mat(g, 14, 7 + sq, ['k..k', 'k..k'], { k: PAL.ink });
  P(g, 14, 7 + sq, PAL.ink); P(g, 19, 9 + sq, PAL.mouth);
  P(g, 16, 4 + sq, PAL.amber2);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return outline(c);
}
// 火鬃（按帧变化的火舌）
function maneTongue(g, x, y, ang, len, w, f, i) {
  const L = len * (0.75 + 0.35 * hash(i * 7 + f * 13));
  const cs = [PAL.fl1, PAL.fl2, PAL.fl3];
  cs.forEach((col, k) => {
    const s = 1 - k * 0.3;
    const tx = x + Math.cos(ang) * L * s, ty = y + Math.sin(ang) * L * s;
    const nx = -Math.sin(ang) * w * s, ny = Math.cos(ang) * w * s;
    poly(g, [[x + nx, y + ny], [tx, ty], [x - nx, y - ny]], col);
  });
}
// 巨兽：96×64，2 帧奔跑
function makeBeast(f) {
  const [c, g] = mk(98, 66); g.translate(1, 1);
  // 尾焰
  for (let i = 0; i < 4; i++) maneTongue(g, 22 - i * 3, 30 - i, Math.PI + 0.25 - i * 0.12, 18, 4, f, i + 40);
  const legs = f ? [[[28, 40], [22, 50], [16, 56]], [[60, 40], [70, 48], [76, 56]]] : [[[28, 40], [34, 50], [32, 60]], [[60, 40], [56, 50], [60, 60]]];
  const legsB = f ? [[[34, 40], [40, 50], [44, 58]], [[66, 40], [60, 50], [54, 57]]] : [[[34, 40], [28, 50], [22, 58]], [[66, 40], [74, 49], [80, 56]]];
  legsB.forEach(l => { limbO(g, l, PAL.emb2, 5); R(g, l[2][0] - 2, l[2][1], 6, 3, PAL.emb2); });
  E(g, 46, 32, 27, 12, PAL.emb);
  E(g, 48, 38, 20, 5, PAL.embL);
  [36, 46, 56].forEach(x => poly(g, [[x - 2, 20], [x + 2, 20], [x, 28]], PAL.fl1));
  legs.forEach(l => { limbO(g, l, PAL.emb, 5); R(g, l[2][0] - 2, l[2][1], 6, 3, PAL.emb2); });
  // 头 + 火鬃
  for (let i = 0; i < 11; i++) { const a = Math.PI * (0.55 + i / 10 * 1.25); maneTongue(g, 76, 24, a, 22, 4, f, i); }
  poly(g, [[66, 18], [76, 12], [86, 16], [94, 24], [92, 30], [82, 33], [70, 32]], PAL.emb);
  poly(g, [[80, 26], [94, 25], [92, 31], [82, 32]], PAL.embL);
  poly(g, [[70, 14], [72, 4], [77, 13]], PAL.emb);
  mat(g, 80, 19, ['wwww.', 'wrrkw', '.www.'], { w: '#fff2c4', r: PAL.fl1, k: PAL.ink });
  P(g, 93, 26, PAL.mouth); R(g, 74, 15, 2, 2, PAL.amber2);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return outline(c);
}
// 影鸦：96×72，0 = 收翼，1 = 展翼
function makeVillain(f) {
  const [c, g] = mk(98, 74); g.translate(1, 1);
  const cx = 48;
  // 烟尾（抖动）
  for (let y = 50; y < 72; y++) for (let x = cx - 10; x < cx + 10; x++) {
    const t = 1 - (y - 50) / 22 - Math.abs(x - cx) / 14;
    if (t > 0) P(g, x, y, dpick(x, y, Math.min(1, t * 1.6), null, PAL.vil) || undefined);
  }
  const wing = (k) => {
    const pts = f
      ? [[cx + k * 6, 22], [cx + k * 20, 8], [cx + k * 36, 4], [cx + k * 47, 12], [cx + k * 42, 18], [cx + k * 45, 26], [cx + k * 37, 28], [cx + k * 39, 36], [cx + k * 30, 36], [cx + k * 30, 44], [cx + k * 20, 40], [cx + k * 8, 42]]
      : [[cx + k * 6, 20], [cx + k * 14, 14], [cx + k * 20, 22], [cx + k * 22, 36], [cx + k * 19, 48], [cx + k * 15, 44], [cx + k * 12, 52], [cx + k * 8, 46]];
    poly(g, pts, PAL.vilW);
    if (f) { polyline(g, [[cx + k * 8, 24], [cx + k * 22, 12], [cx + k * 36, 8]], PAL.vilW2, 1); polyline(g, [[cx + k * 10, 30], [cx + k * 28, 26], [cx + k * 40, 22]], PAL.vilW2, 1); }
    else polyline(g, [[cx + k * 9, 22], [cx + k * 16, 30], [cx + k * 17, 44]], PAL.vilW2, 1);
  };
  wing(-1); wing(1);
  poly(g, [[cx - 7, 18], [cx, 12], [cx + 7, 18], [cx + 8, 38], [cx, 52], [cx - 8, 38]], PAL.vil);
  // 头、角、喙
  poly(g, [[cx - 6, 16], [cx - 9, 2], [cx - 3, 8], [cx, 5], [cx + 3, 8], [cx + 9, 2], [cx + 6, 16], [cx, 20]], '#3f3060');
  poly(g, [[cx - 2, 15], [cx + 2, 15], [cx, 21]], PAL.ink2);
  const ey = { r: PAL.red, d: PAL.red2, h: '#ffd0d0' };
  mat(g, cx - 5, 10, ['dd', 'rh', 'rr'], ey); mat(g, cx + 3, 10, ['dd', 'hr', 'rr'], ey);
  [[cx, 26], [cx - 3, 32], [cx + 3, 32], [cx, 38]].forEach(([x, y]) => mat(g, x - 1, y - 1, ['.d.', 'drd', '.d.'], ey));
  g.setTransform(1, 0, 0, 1, 0, 0);
  return outline(c);
}

// ---------- 道具 ----------
function makeAmulet(state) { // 0 亮 1 暗 2 碎
  const [c, g] = mk(16, 20); g.translate(2, 1);
  const a = state === 1 ? '#9a6a3a' : PAL.amber2, a2 = state === 1 ? '#6a4a2a' : PAL.amber;
  line(g, 6, 0, 6, 3, PAL.belt, 1);
  if (state === 2) {
    poly(g, [[5, 4], [1, 9], [2, 15], [5, 17]], a); poly(g, [[8, 5], [12, 10], [11, 16], [8, 18]], a2);
    P(g, 6, 9, PAL.fl3); P(g, 7, 12, PAL.fl3);
  } else {
    poly(g, [[6, 3], [11, 9], [10, 15], [6, 18], [2, 15], [1, 9]], a);
    poly(g, [[6, 3], [11, 9], [10, 15], [6, 18]], a2);
    if (state === 0) { R(g, 4, 7, 1, 3, PAL.hi); P(g, 5, 6, PAL.hi); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  return outline(c);
}
function makeSeed() {
  const [c, g] = mk(11, 13); g.translate(1, 1);
  const w = PAL.hi;
  [[4, 0], [1, 1], [7, 1], [0, 3], [8, 3]].forEach(([x, y]) => line(g, 4, 4, x, y, w, 1));
  line(g, 4, 4, 4, 9, '#d8cfc0', 1); R(g, 3, 9, 3, 2, '#8a6a4a');
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
function makeDandelion(rel) {
  const [c, g] = mk(30, 52); g.translate(3, 1);
  line(g, 12, 14, 13, 30, PAL.stem, 1); line(g, 13, 30, 11, 50, PAL.stem, 1);
  poly(g, [[12, 38], [6, 34], [9, 40]], PAL.stem);
  E(g, 12, 12, 2.5, 2.5, '#c9b48a');
  for (let i = 0; i < 18; i++) {
    if (hash(i * 3.3) < rel) continue;
    const a = i / 18 * Math.PI * 2, x = 12 + Math.cos(a) * 10, y = 12 + Math.sin(a) * 10;
    line(g, 12 + Math.cos(a) * 3, 12 + Math.sin(a) * 3, x, y, '#ece6dc', 1);
    P(g, x, y, PAL.hi); P(g, x + Math.cos(a + 1.6), y + Math.sin(a + 1.6), PAL.hi);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
function makeSmall(kind) {
  const [c, g] = mk(12, 12); g.translate(1, 1);
  if (kind === 'leaf') { mat(g, 1, 1, ['....ll..', '..llll..', '.llLll..', 'llLlll..', 'lLlll...', 'Lll.....', 'L.......'], { l: PAL.leaf, L: PAL.stem }); }
  if (kind === 'ice') { poly(g, [[5, 0], [9, 5], [5, 10], [1, 5]], PAL.ice); line(g, 5, 1, 5, 9, PAL.hi, 1); poly(g, [[5, 5], [9, 5], [5, 10]], PAL.ice2); }
  if (kind === 'petal') { E(g, 5, 5, 4, 2.5, PAL.petal); P(g, 3, 4, PAL.petal2); P(g, 4, 4, PAL.petal2); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  return kind === 'ice' ? outline(c, '#2e4c7a') : outline(c);
}
// 特效序列
function makeFlame(f) {
  const [c, g] = mk(18, 26); g.translate(1, 1);
  const tip = (k) => [8 + Math.round((hash(f * 5 + k) - 0.5) * 6), 1 + Math.round(hash(f * 7 + k) * 4) + k * 5];
  [[PAL.fl1, 8, 0], [PAL.fl2, 6, 1], [PAL.fl3, 3.5, 2]].forEach(([col, w, k]) => {
    const t = tip(k);
    poly(g, [[8 - w, 23], [8 - w, 16 - k], [t[0] - 2, t[1] + 6], t, [t[0] + 2, t[1] + 7], [8 + w, 15 - k], [8 + w, 23], [8, 24]], col);
  });
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
function makeBolt(f) {
  const [c, g] = mk(16, 50);
  const pts = [[8, 0]];
  for (let i = 1; i <= 8; i++) pts.push([8 + Math.round((hash(f * 11 + i) - 0.5) * 10), i * 6]);
  polyline(g, pts, PAL.fl3, 3); polyline(g, pts, PAL.hi, 1);
  return c;
}
function makeStar(f) {
  const [c, g] = mk(33, 33); const r = [4, 9, 15, 12][f], cx = 16;
  poly(g, [[cx, cx - r], [cx + 2, cx - 2], [cx + r, cx], [cx + 2, cx + 2], [cx, cx + r], [cx - 2, cx + 2], [cx - r, cx], [cx - 2, cx - 2]], f === 3 ? PAL.fl3 : PAL.hi);
  if (f >= 1) { E(g, cx, cx, 2.5, 2.5, PAL.hi); }
  if (f === 3) [[4, 4], [28, 6], [6, 27], [27, 28]].forEach(([x, y]) => P(g, x, y, PAL.fl3));
  return c;
}
function makeBoom(f) {
  const [c, g] = mk(50, 50); const cx = 25;
  const lay = (r, col, s) => { const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, rr = r * (0.75 + 0.4 * hash(i * 3 + s)); pts.push([cx + Math.cos(a) * rr, cx + Math.sin(a) * rr]); } poly(g, pts, col); };
  if (f < 3) {
    const R0 = [8, 16, 22][f];
    lay(R0, PAL.fl1, 1); lay(R0 * 0.75, PAL.fl2, 2); lay(R0 * 0.45, PAL.fl3, 3); if (f < 2) lay(R0 * 0.25, PAL.hi, 4);
  } else {
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; E(g, cx + Math.cos(a) * 17, cx + Math.sin(a) * 17, 5, 5, i % 2 ? '#8a7a8a' : '#a89aa8'); }
    lay(6, PAL.fl2, 5);
  }
  return outline(c);
}
