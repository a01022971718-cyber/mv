// node sheet/render_pumpkin.js → sheet/out/pumpkin_sheet.png（只出这一张设计图）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAGE = `
function label(ctx, txt, cx, y, size = 19) {
  ctx.save(); ctx.font = 'italic bold ' + size + "px 'FreeSans'"; ctx.fillStyle = '#3a3440'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const w = size * 0.68, x0 = cx - (txt.length - 1) * w / 2;
  [...txt].forEach((ch, i) => { ctx.save(); ctx.translate(x0 + i * w + jit(i * 3 + cx, 0.7), y + jit(i * 5 + cx, 1.0)); ctx.rotate(jit(i * 7 + cx, 0.05)); ctx.fillText(ch, 0, 0); ctx.restore(); });
  ctx.restore();
}
function ground(ctx, y, seed) { inkLine(ctx, [[40, y], [700, y + 1], [1300, y - 1], [1880, y + 1]], 1.6, 'rgba(58,52,64,0.6)', seed, 0.8); }
function sheet() {
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
  BLOTCH = makeBlotch(1920, 1080); BOIL = 2;
  const p = makePaper(); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1920, 1080);
  // 第 1 行：转面
  ground(ctx, 425, 1);
  [['front', 'FRONT'], ['q', 'Q'], ['side', 'SIDE'], ['qback', 'QBACK'], ['back', 'BACK']].forEach(([v, l], i) => {
    const cx = 240 + i * 360; drawPumpkin(ctx, cx, 425, 92, { view: v }, 0.5); label(ctx, l, cx, 468);
  });
  // 第 2 行：动作
  ground(ctx, 735, 2); const s = 64, Y = 735;
  drawPumpkin(ctx, 180, Y, s, { view: 'side', legs: 'walk', walk: 1.1 }, 1); label(ctx, 'WALK (SIDE)', 180, 772);
  [[1.25, -0.25], [1.42, 0.25]].forEach(([r, a0], i) => { const q = []; for (let k = 0; k <= 10; k++) { const a = a0 + Math.PI * (0.92 + k / 10 * 0.55); q.push([490 + Math.cos(a) * r * s, Y - s * 1.25 + Math.sin(a) * r * 0.42 * s]); } inkLine(ctx, q, 2.2, 'rgba(58,52,64,0.6)', 410 + i, 0.8); });
  drawPumpkin(ctx, 490, Y, s, { view: Math.PI * 0.3, expr: 'surprised', arms: 'out' }, 1); label(ctx, 'TURN / SPINVIEW', 490, 772);
  ctx.save(); [0.36, 0.26, 0.17].forEach((a, i) => { ctx.globalAlpha = a; ctx.save(); ctx.translate(820 - s * (0.55 + i * 0.42), 0); ctx.scale(1.12 + i * 0.1, 1); ctx.translate(-820, 0); flatFill(ctx, outlineOf((() => { const P = mkProj(Math.PI / 2, -(LEG + RY)); const q = []; for (let m = 0; m < 48; m++) for (let n = 0; n <= 16; n++) { const r = P(surf(m / 48 * Math.PI * 2, n / 16 * Math.PI)); q.push([820 + r[0] * s, Y + r[1] * s]); } return q; })(), 820, Y - (LEG + RY) * s), PK.body, false); ctx.restore(); }); ctx.restore();
  for (let i = 0; i < 3; i++) inkLine(ctx, [[820 - s * 0.95, Y - s * (0.85 + i * 0.4)], [820 - s * 2.0, Y - s * (0.88 + i * 0.4)]], 1.8, 'rgba(58,52,64,0.55)', 420 + i, 0.8);
  drawPumpkin(ctx, 820, Y, s, { view: 'side', lean: 0.18, legs: 'walk', walk: 2.3, arms: 'out' }, 1); sparkle(ctx, 905, Y - s * 2.35, 17); sparkle(ctx, 930, Y - s * 2.0, 9); label(ctx, 'SMEAR', 820, 772);
  drawPumpkin(ctx, 1120, Y, s, { expr: 'happy', legs: 'tuck', arms: 'up', lift: 0.38 }, 1); label(ctx, 'JUMP', 1120, 772);
  drawPumpkin(ctx, 1430, Y, s, { expr: 'surprised', arms: 'up', stretch: 0.1 }, 1); bang(ctx, 1500, Y - s * 2.6, 24); label(ctx, 'TAKE', 1430, 772);
  drawPumpkin(ctx, 1740, Y, s, { expr: 'angry', lid: 0.75, arms: 'out' }, 1); label(ctx, 'LID', 1740, 772);
  // 第 3 行：中国风配饰（耳机、蝴蝶结保留）
  ground(ctx, 985, 3);
  [['guapi', 'GUAPI'], ['douli', 'DOULI'], ['tiger', 'TIGER'], ['phoenix', 'PHOENIX'], ['wusha', 'WUSHA'], ['hairpin', 'HAIRPIN'], ['knot', 'KNOT'], ['lock', 'LOCK'], ['fan', 'FAN'], ['opera', 'OPERA'], ['collar', 'COLLAR'], ['plum', 'PLUM'], ['panda', 'PANDA'], ['headphones', 'HEADPHONES'], ['bow', 'BOW']].forEach(([a, l], i) => {
    const cx = 80 + i * 126.5; drawPumpkin(ctx, cx, 985, 34, { acc: a, arms: a === 'fan' ? 'fan' : 'down', expr: a === 'headphones' ? 'happy' : 'neutral' }, 1); label(ctx, l, cx, 1020, 14);
  });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.65; ctx.drawImage(p, 0, 0, 1920, 1080); ctx.restore();
  return c.toDataURL('image/png');
}
`;

(async () => {
  const out = path.join(__dirname, 'out');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', e));
  await page.setContent('<html><body></body></html>');
  for (const f of [path.join(__dirname, '..', 'src', 'lib.js'), path.join(__dirname, 'seedling.js'), path.join(__dirname, 'pumpkin.js')])
    await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  await page.addScriptTag({ content: PAGE });
  const d = await page.evaluate(() => sheet());
  fs.writeFileSync(path.join(out, 'pumpkin_sheet.png'), Buffer.from(d.split(',')[1], 'base64'));
  await browser.close();
})();
