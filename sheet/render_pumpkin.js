// node sheet/render_pumpkin.js → sheet/out/pumpkin_sheet.png（只出这一张设计图）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAGE = `
function label(ctx, txt, cx, y, size = 22) {
  ctx.save(); ctx.font = size + "px 'Marker'"; ctx.fillStyle = '#3e3a44'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.translate(cx, y); ctx.transform(1, 0, -0.12, 1, 0, 0); ctx.fillText(txt, 0, 0); ctx.restore();
}
// W4：地平线是一条淡灰细线
function ground(ctx, y, seed) { inkLine(ctx, [[30, y], [700, y + 1], [1300, y - 1], [1890, y]], 1.2, 'rgba(70,64,76,0.55)', seed, 0.6); }
async function sheet(fontData) {
  const f = new FontFace('Marker', 'url(' + fontData + ')'); await f.load(); document.fonts.add(f);
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
  BLOTCH = makeBlotch(1920, 1080); BOIL = 2;
  const p = makePaper(); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1920, 1080);
  // 第 1 行：转面
  ground(ctx, 425, 1);
  [['front', 'FRONT'], ['q', 'Q'], ['side', 'SIDE'], ['qback', 'QBACK'], ['back', 'BACK']].forEach(([v, l], i) => {
    const cx = 240 + i * 360; drawPumpkin(ctx, cx, 425, 88, { view: v }, 0); label(ctx, l, cx, 468);
  });
  // 第 2 行：动作（每个都有重心变化）
  ground(ctx, 735, 2); const s = 60, Y = 735;
  drawPumpkin(ctx, 180, Y - 6, s, { view: 'side', legs: 'walk', walk: 1.2, arms: 'swing', lean: 0.07 }, 0); label(ctx, 'WALK (SIDE)', 180, 772);
  [[1.3, -0.3], [1.48, 0.2]].forEach(([r, a0], i) => { const q = []; for (let k = 0; k <= 10; k++) { const a = a0 + Math.PI * (0.9 + k / 10 * 0.55); q.push([490 + Math.cos(a) * r * s, Y - s * 1.2 + Math.sin(a) * r * 0.4 * s]); } inkLine(ctx, q, 1.6, 'rgba(42,34,48,0.75)', 410 + i, 0.5); });
  drawPumpkin(ctx, 490, Y, s, { view: 1.0, expr: 'surprised', arms: 'out', sx: 1.05, sy: 0.96 }, 0); label(ctx, 'TURN / SPINVIEW', 490, 772);
  // SMEAR：身体被拉长，后面拖出干笔刷痕
  ctx.save(); ctx.filter = 'blur(0.6px)'; for (let i = 0; i < 7; i++) { const yy = Y - s * (0.5 + i * 0.22), len = s * (1.2 + hash(i) * 0.9); ctx.fillStyle = rgba('#e0773a', 0.55 - i * 0.03); ctx.beginPath(); ctx.moveTo(820 - s * 0.6, yy - 7); ctx.lineTo(820 - s * 0.6 - len, yy - 3 + hash(i + 3) * 4); ctx.lineTo(820 - s * 0.6 - len * 0.9, yy + 4); ctx.lineTo(820 - s * 0.6, yy + 7); ctx.closePath(); ctx.fill(); } ctx.restore();
  for (let i = 0; i < 3; i++) inkLine(ctx, [[820 - s * 1.3, Y - s * (0.7 + i * 0.45)], [820 - s * 2.2, Y - s * (0.72 + i * 0.45)]], 1.4, 'rgba(42,34,48,0.7)', 420 + i, 0.5);
  drawPumpkin(ctx, 830, Y, s, { view: 'side', lean: 0.14, legs: 'walk', walk: 2.4, arms: 'back', sx: 1.18, sy: 0.92 }, 0); sparkle(ctx, 930, Y - s * 2.2, 16); sparkle(ctx, 955, Y - s * 1.85, 9); label(ctx, 'SMEAR', 820, 772);
  drawPumpkin(ctx, 1120, Y, s, { expr: 'happy', legs: 'dangle', arms: 'up', lift: 0.5, sy: 1.1, sx: 0.94 }, 0); label(ctx, 'JUMP', 1120, 772);
  drawPumpkin(ctx, 1430, Y, s, { expr: 'surprised', arms: 'up', legs: 'brace', lean: -0.12, sy: 1.08, sx: 0.95 }, 0); bang(ctx, 1515, Y - s * 2.65, 24); label(ctx, 'TAKE', 1430, 772);
  drawPumpkin(ctx, 1740, Y, s, { lid: 0.62, arms: 'out' }, 0); label(ctx, 'LID', 1740, 772);
  // 第 3 行：中国风配饰（耳机、蝴蝶结保留）
  ground(ctx, 985, 3);
  [['guapi', 'GUAPI'], ['douli', 'DOULI'], ['tiger', 'TIGER'], ['phoenix', 'PHOENIX'], ['wusha', 'WUSHA'], ['hairpin', 'HAIRPIN'], ['knot', 'KNOT'], ['lock', 'LOCK'], ['fan', 'FAN'], ['opera', 'OPERA'], ['collar', 'COLLAR'], ['plum', 'PLUM'], ['panda', 'PANDA'], ['headphones', 'HEADPHONES'], ['bow', 'BOW']].forEach(([a, l], i) => {
    const cx = 80 + i * 126.5; drawPumpkin(ctx, cx, 985, 33, { acc: a, arms: a === 'fan' ? 'fan' : 'down', expr: a === 'headphones' ? 'happy' : 'neutral' }, 0); label(ctx, l, cx, 1020, 15);
  });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.7; ctx.drawImage(p, 0, 0, 1920, 1080); ctx.restore();
  return c.toDataURL('image/png');
}
`;

(async () => {
  const out = path.join(__dirname, 'out');
  fs.mkdirSync(out, { recursive: true });
  const font = 'data:font/ttf;base64,' + fs.readFileSync(path.join(__dirname, 'fonts', 'PermanentMarker-Regular.ttf')).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', e));
  await page.setContent('<html><body></body></html>');
  for (const f of [path.join(__dirname, '..', 'src', 'lib.js'), path.join(__dirname, 'seedling.js'), path.join(__dirname, 'pumpkin.js')])
    await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  await page.addScriptTag({ content: PAGE });
  const d = await page.evaluate(f => sheet(f), font);
  fs.writeFileSync(path.join(out, 'pumpkin_sheet.png'), Buffer.from(d.split(',')[1], 'base64'));
  await browser.close();
})();
