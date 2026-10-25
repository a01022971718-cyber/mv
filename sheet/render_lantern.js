// node sheet/render_lantern.js → sheet/out/lantern_sheet.png + lantern_turn.gif
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PAGE = `
function label(ctx, txt, cx, y, size = 18) {
  ctx.save(); ctx.font = 'bold ' + size + "px 'DejaVu Sans Mono'"; ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const w = size * 0.72, x0 = cx - (txt.length - 1) * w / 2;
  [...txt].forEach((ch, i) => { ctx.save(); ctx.translate(x0 + i * w + jit(i * 3 + cx, 0.8), y + jit(i * 5 + cx, 1.2)); ctx.rotate(jit(i * 7 + cx, 0.06)); ctx.fillText(ch, 0, 0); ctx.restore(); });
  ctx.restore();
}
function ground(ctx, y, seed) { inkLine(ctx, [[40, y], [700, y + 2], [1300, y - 1], [1880, y + 1]], 2, 'rgba(42,34,48,0.55)', seed, 1.2); }
function turnSheet() {
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
  const p = makePaper(); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1920, 1080); BOIL = 2;
  ground(ctx, 425, 1);
  [['front', 'FRONT'], ['q', 'Q'], ['side', 'SIDE'], ['qback', 'QBACK'], ['back', 'BACK']].forEach(([v, l], i) => {
    const cx = 240 + i * 360; drawLantern(ctx, cx, 425, 88, { view: v }, 0.6); label(ctx, l, cx, 466);
  });
  ground(ctx, 735, 2); const s2 = 62, Y = 735;
  drawLantern(ctx, 180, Y, s2, { view: 'side', legs: 'walk', walk: 1.2 }, 1.1); label(ctx, 'WALK (SIDE)', 180, 770);
  spinArcs(ctx, 490, Y + 10, s2); drawLantern(ctx, 490, Y, s2, { view: 'q', emo: 'surprised', arms: 'out' }, 1.3); label(ctx, 'TURN / SPINVIEW', 490, 770);
  for (let i = 0; i < 5; i++) blob(ctx, ell(820 - s2 * (0.7 + i * 0.35), Y - s2 * 1.35, s2 * (0.6 - i * 0.06), s2 * (0.7 - i * 0.08), 14), rgba('#d8432e', 0.4 - i * 0.07), { line: null, wash: false, amp: 2 });
  for (let i = 0; i < 4; i++) inkLine(ctx, [[820 - s2 * 0.8, Y - s2 * (0.85 + i * 0.3)], [820 - s2 * 2.2, Y - s2 * (0.9 + i * 0.3)]], 2, 'rgba(42,34,48,0.45)', 400 + i, 1);
  drawLantern(ctx, 820, Y, s2, { view: 'side', lean: 0.2, legs: 'walk', walk: 2.4, arms: 'out' }, 1.5); sparkle(ctx, 885, Y - s2 * 2.45, 18); sparkle(ctx, 910, Y - s2 * 2.1, 10); label(ctx, 'SMEAR', 820, 770);
  drawLantern(ctx, 1120, Y, s2, { emo: 'happy', legs: 'tuck', arms: 'up', lift: 0.35 }, 1.7); label(ctx, 'JUMP', 1120, 770);
  drawLantern(ctx, 1430, Y, s2, { emo: 'surprised', arms: 'up', stretch: 0.1 }, 1.9); bang(ctx, 1500, Y - s2 * 2.55, 24); label(ctx, 'TAKE', 1430, 770);
  drawLantern(ctx, 1740, Y, s2, { lid: 0.6, arms: 'out' }, 2.1); label(ctx, 'LID', 1740, 770);
  ground(ctx, 985, 3);
  [['guapi', 'GUAPI CAP'], ['douli', 'DOULI'], ['tiger', 'TIGER HAT'], ['phoenix', 'PHOENIX'], ['wusha', 'WUSHA'], ['hairpin', 'HAIRPIN'], ['knot', 'KNOT'], ['lock', 'LOCK'], ['fan', 'FAN'], ['opera', 'OPERA'], ['collar', 'COLLAR'], ['plum', 'PLUM'], ['panda', 'PANDA'], ['headphones', 'HEADPHONES'], ['bow', 'BOW']].forEach(([a, l], i) => {
    const cx = 80 + i * 126.5; drawLantern(ctx, cx, 985, 36, { acc: a, eyes: a === 'headphones' ? 'closed' : null }, 0.3 + i * 0.4); label(ctx, l, cx, 1020, 13);
  });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(p, 0, 0, 1920, 1080); ctx.restore();
  return c.toDataURL('image/png');
}
// 动图：转一圈（8 个视角各 0.4 秒）+ 侧面走路
const SPIN = [['front', false], ['q', false], ['side', false], ['qback', false], ['back', false], ['qback', true], ['side', true], ['q', true]];
function turnFrame(f) {
  const t = f / 25, c = document.createElement('canvas'); c.width = 600; c.height = 600; const ctx = c.getContext('2d');
  if (!window.PT) window.PT = makePaper();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 600, 600); BOIL = Math.floor(t * 10);
  if (t < 3.2) {
    inkLine(ctx, [[40, 470], [300, 472], [560, 469]], 2, 'rgba(42,34,48,0.55)', 900, 1.2);
    const [v, fl] = SPIN[Math.min(7, Math.floor(t / 0.4))];
    drawLantern(ctx, 300, 470, 120, { view: v, flip: fl }, t);
  } else {
    const u = t - 3.2, off = (u * 140) % 120;
    for (let i = -1; i < 7; i++) inkLine(ctx, [[i * 120 - off, 470], [i * 120 - off + 60, 471]], 2, 'rgba(42,34,48,0.55)', 900 + i, 1.2);
    drawLantern(ctx, 300, 470 - Math.abs(Math.sin(u * 7)) * 6, 120, { view: 'side', legs: 'walk', walk: u * 7 }, t);
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(window.PT, 0, 0); ctx.restore();
  return c.toDataURL('image/png');
}
`;

(async () => {
  const out = path.join(__dirname, 'out'), fr = path.join(out, 'lframes');
  fs.mkdirSync(fr, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', e));
  await page.setContent('<html><body></body></html>');
  for (const f of [path.join(__dirname, '..', 'src', 'lib.js'), path.join(__dirname, 'seedling.js'), path.join(__dirname, 'turnaround.js'), path.join(__dirname, 'lantern.js')])
    await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  await page.addScriptTag({ content: PAGE });
  const save = (p, d) => fs.writeFileSync(p, Buffer.from(d.split(',')[1], 'base64'));
  save(path.join(out, 'lantern_sheet.png'), await page.evaluate(() => turnSheet()));
  for (let f = 0; f < 150; f++) save(path.join(fr, `f${String(f).padStart(3, '0')}.png`), await page.evaluate(f => turnFrame(f), f));
  await browser.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '25', '-i', path.join(fr, 'f%03d.png'),
    '-vf', 'fps=15,scale=480:480,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', path.join(out, 'lantern_turn.gif')]);
})();
