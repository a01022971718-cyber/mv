// 在页面里拼设定图（不写字，用色块标分组）
function sheet(w, h) { const [c, g] = mk(w, h); R(g, 0, 0, w, h, PAL.paper); return [c, g]; }
function tag(g, x, y, w, col) { R(g, x, y, w, 6, col); }

function charactersSheet() {
  const S = 4, poses = ['stand1', 'stand2', 'run1', 'run2', 'raise'];
  const names = [['lan', PAL.scarf], ['kui', PAL.kuiHair], ['shuang', PAL.shHair]];
  const [c, g] = sheet(1880, 1820);
  // 第一部分：三人 × 5 帧
  names.forEach(([n, col], r) => {
    const y = 30 + r * 220;
    poses.forEach((p, i) => blit(g, makeKid(n, p), 30 + i * 150, y, S));
    tag(g, 30, y + 206, 5 * 150 - 14, col);
    // 头像 4 种表情（4 倍）
    ['normal', 'surprise', 'cry', 'smile'].forEach((f, i) => { const x = 800 + i * 270; R(g, x - 4, y - 4, 264, 264, '#e8dcc6'); });
  });
  // 头像单独排成 3 行
  names.forEach(([n, col], r) => {
    ['normal', 'surprise', 'cry', 'smile'].forEach((f, i) => {
      const x = 800 + i * 268, y = 30 + r * 270 - 0;
      R(g, x - 4, y - 4, 264, 264, '#e8dcc6');
      blit(g, makePortrait(n, f), x, y, 4);
    });
    tag(g, 800, 30 + r * 270 + 262, 4 * 268 - 12, col);
  });
  // 第二部分：小焰、巨兽、影鸦
  const y2 = 860;
  [0, 1].forEach(f => blit(g, makeEmberSmall(f), 30 + f * 130, y2 + 60, 5));
  tag(g, 30, y2 + 190, 250, PAL.emb);
  [0, 1].forEach(f => blit(g, makeBeast(f), 320 + f * 410, y2, 4));
  tag(g, 320, y2 + 272, 800, PAL.fl2);
  [0, 1].forEach(f => blit(g, makeVillain(f), 30 + f * 410, y2 + 330, 4));
  tag(g, 30, y2 + 330 + 302, 800, PAL.vilW);
  // 原尺寸（1×）摆一排，看实际游戏尺寸下的辨识度
  const yy = y2 + 360;
  R(g, 880, yy - 10, 960, 300, '#5b9ed8');
  ['lan', 'kui', 'shuang'].forEach((n, i) => blit(g, makeKid(n, 'stand1'), 920 + i * 60, yy + 200, 2));
  blit(g, makeEmberSmall(0), 1110, yy + 250, 2);
  blit(g, makeBeast(0), 1180, yy + 100, 2);
  blit(g, makeVillain(1), 1420, yy + 30, 2);
  return c.toDataURL('image/png');
}

function propsSheet() {
  const [c, g] = sheet(1500, 900), S = 5;
  [0, 1, 2].forEach(s => blit(g, makeAmulet(s), 40 + s * 110, 40, S));
  tag(g, 40, 150, 310, PAL.amber);
  R(g, 410, 10, 440, 270, '#5b9ed8');
  [0, 0.75].forEach((r, i) => blit(g, makeDandelion(r), 420 + i * 170, 20, S));
  blit(g, makeSeed(), 780, 60, S);
  tag(g, 420, 290, 420, '#c9b48a');
  ['leaf', 'ice', 'petal'].forEach((k, i) => blit(g, makeSmall(k), 920 + i * 90, 60, S));
  tag(g, 920, 150, 260, PAL.leaf);
  [0, 1, 2, 3].forEach(f => blit(g, makeFlame(f), 40 + f * 110, 340, S));
  tag(g, 40, 480, 430, PAL.fl1);
  R(g, 510, 320, 330, 280, '#24183c');
  [0, 1, 2].forEach(f => blit(g, makeBolt(f), 530 + f * 100, 330, S));
  tag(g, 510, 610, 330, PAL.fl3);
  R(g, 880, 320, 600, 200, '#3a1a1e');
  [0, 1, 2, 3].forEach(f => blit(g, makeStar(f), 890 + f * 145, 340, 4));
  tag(g, 880, 530, 600, PAL.hi);
  [0, 1, 2, 3].forEach(f => blit(g, makeBoom(f), 40 + f * 260, 640, 4));
  tag(g, 40, 850, 1020, PAL.fl2);
  return c.toDataURL('image/png');
}

function scenesSheet() {
  const [c, g] = sheet(1340, 1150);
  const place = {
    cliff: g2 => { blit(g2, makeKid('lan', 'stand1'), 222, 12, 1); },
    plains: g2 => { blit(g2, makeEmberSmall(0), 150, 118, 1); blit(g2, makeKid('lan', 'run1'), 110, 100, 1); },
    wasteland: g2 => { blit(g2, makeBeast(0), 110, 76, 1); },
    storm: g2 => { blit(g2, makeVillain(1), 110, 40, 1); },
    rain: g2 => { blit(g2, makeKid('lan', 'stand2'), 150, 108, 1); },
    dusk: g2 => { blit(g2, makeKid('lan', 'stand1'), 70, 74, 1); blit(g2, makeEmberSmall(1), 98, 100, 1); },
  };
  Object.keys(place).forEach((n, i) => {
    const sc = makeScene(n); place[n](sc.getContext('2d'));
    blit(g, sc, 20 + (i % 2) * 660, 20 + Math.floor(i / 2) * 375, 2);
  });
  return c.toDataURL('image/png');
}

// 预览动画：草原上阿岚跑步 + 小焰蹦跳 + 篝火
function previewFrame(i) {
  const bg = makeScene('plains');
  const [c, g] = mk(SW, SH);
  const off = (i * 2) % SW;
  g.drawImage(bg, -off, 0); g.drawImage(bg, SW - off, 0);
  const run = makeKid('lan', (Math.floor(i / 3) % 2) ? 'run2' : 'run1');
  blit(g, run, 150, 104 - ((Math.floor(i / 3) % 2) ? 1 : 0), 1);
  const hop = Math.abs(Math.sin(i / 24 * Math.PI * 4));
  blit(g, makeEmberSmall(hop < 0.3 ? 1 : 0), 110, 126 - Math.round(hop * 10), 1);
  blit(g, makeFlame(Math.floor(i / 2) % 4), 250, 134, 1);
  const [o, og] = mk(SW * 4, SH * 4); blit(og, c, 0, 0, 4);
  return o.toDataURL('image/png');
}
