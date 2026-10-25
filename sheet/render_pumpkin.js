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
  const U = (x, y, s, fn) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore(); }; // 在身体单位坐标里画小符号
  // 第 1 行：转面（平视 2.5D）
  ground(ctx, 425, 1);
  [['front', 'FRONT'], ['q', 'Q'], ['side', 'SIDE'], ['qback', 'QBACK'], ['back', 'BACK']].forEach(([v, l], i) => {
    const cx = 240 + i * 360; drawPumpkin(ctx, cx, 425, 92, { view: v }); label(ctx, l, cx, 468);
  });
  // 第 2 行：动作
  ground(ctx, 735, 2); const s = 62, Y = 735;
  drawPumpkin(ctx, 180, Y - 4, s, { view: 'side', legs: 'walk', walk: 1.25, arms: 'swing', lean: 0.05 }); label(ctx, 'WALK (SIDE)', 180, 772);
  drawPumpkin(ctx, 490, Y, s, { view: 1.1, arms: 'out' }); label(ctx, 'TURN / SPINVIEW', 490, 772);
  // SMEAR：身后拖出干笔刷痕
  ctx.save(); for (let i = 0; i < 8; i++) { const yy = Y - s * (0.55 + i * 0.19), len = s * (0.9 + hash(i * 3) * 0.8), x0 = 830 - s * 0.55; ctx.fillStyle = rgba(PK.body, 0.62 - i * 0.03); ctx.beginPath(); ctx.moveTo(x0, yy - 6); for (let k = 0; k <= 6; k++) ctx.lineTo(x0 - len * k / 6, yy - 6 + k * 0.8 + (hash(i * 9 + k) - 0.5) * 3); ctx.lineTo(x0 - len * 0.93, yy + 5); ctx.lineTo(x0, yy + 6); ctx.closePath(); ctx.fill(); } ctx.restore();
  for (let i = 0; i < 3; i++) inkLine(ctx, [[830 - s * 1.0, Y - s * (0.75 + i * 0.4)], [830 - s * 1.75, Y - s * (0.77 + i * 0.4)]], 1.3, 'rgba(42,34,48,0.75)', 420 + i, 0.4);
  drawPumpkin(ctx, 840, Y, s, { view: 'side', lean: 0.1, arms: 'back', sx: 1.15, sy: 0.93 });
  U(840, Y, s, () => { star(ctx, 1.55, -2.35, 0.32, 1); star(ctx, 1.9, -2.0, 0.15, 2); }); label(ctx, 'SMEAR', 820, 772);
  drawPumpkin(ctx, 1120, Y, s, { expr: 'happy', arms: 'raise', lift: 0.28 }); label(ctx, 'JUMP', 1120, 772);
  drawPumpkin(ctx, 1430, Y, s, { expr: 'surprised', arms: 'up', sy: 1.06 }); U(1430, Y, s, () => bangMark(ctx, 1.35, -2.5, 0.42)); label(ctx, 'TAKE', 1430, 772);
  drawPumpkin(ctx, 1740, Y, s, { lid: 0.5, arms: 'out' }); label(ctx, 'LID', 1740, 772);
  // 第 3 行：中国风配饰（耳机、蝴蝶结保留）
  ground(ctx, 985, 3);
  [['guapi', 'GUAPI'], ['douli', 'DOULI'], ['tiger', 'TIGER'], ['phoenix', 'PHOENIX'], ['wusha', 'WUSHA'], ['hairpin', 'HAIRPIN'], ['knot', 'KNOT'], ['lock', 'LOCK'], ['fan', 'FAN'], ['opera', 'OPERA'], ['collar', 'COLLAR'], ['plum', 'PLUM'], ['panda', 'PANDA'], ['headphones', 'HEADPHONES'], ['bow', 'BOW']].forEach(([a, l], i) => {
    const cx = 80 + i * 126.5; drawPumpkin(ctx, cx, 985, 34, { acc: a, expr: a === 'headphones' ? 'happy' : 'neutral' }); label(ctx, l, cx, 1020, 15);
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
  for (const f of [path.join(__dirname, '..', 'src', 'lib.js'), path.join(__dirname, 'pumpkin.js')])
    await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  await page.addScriptTag({ content: PAGE });
  const d = await page.evaluate(f => sheet(f), font);
  fs.writeFileSync(path.join(out, 'pumpkin_sheet.png'), Buffer.from(d.split(',')[1], 'base64'));
  await browser.close();
})();
