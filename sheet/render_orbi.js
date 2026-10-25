// node sheet/render_orbi.js → sheet/out/orbi_sheet.png + orbi.gif
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
function orbiSheet() {
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
  const p = makePaper(); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1920, 1080); BOIL = 4;
  // 第 1 行：五个转面
  ground(ctx, 360, 1);
  [['front', 'FRONT'], ['q', 'Q'], ['side', 'SIDE'], ['qback', 'QBACK'], ['back', 'BACK']].forEach(([v, l], i) => {
    const cx = 240 + i * 360; drawOrbi(ctx, cx, 360, 78, { view: v }, 0.4 + i * 0.25); label(ctx, l, cx, 398);
  });
  // 第 2 行：12 种表情
  ground(ctx, 690, 2);
  ['neutral', 'happy', 'laugh', 'love', 'shy', 'surprised', 'sad', 'cry', 'angry', 'sleepy', 'dizzy', 'starstruck'].forEach((e, i) => {
    const cx = 85 + i * 159; drawOrbi(ctx, cx, 690, 44, { emo: e }, 0.7 + i * 0.41); label(ctx, e.toUpperCase(), cx, 722, 15);
  });
  // 第 3 行：6 个动作
  ground(ctx, 985, 3); const Y = 985, s = 50;
  drawOrbi(ctx, 170, Y, s, { view: 'side', legs: 'walk', walk: 1.2 }, 1.0); label(ctx, 'WALK', 170, 1020);
  drawOrbi(ctx, 480, Y, s, { emo: 'happy', legs: 'tuck', hands: 'up', lift: 0.45 }, 1.4); label(ctx, 'JUMP', 480, 1020);
  for (let i = 0; i < 3; i++) inkLine(ctx, [[730 - i * 6, Y - 40 - i * 30], [660 - i * 6, Y - 40 - i * 30]], 2.5, 'rgba(42,34,48,0.5)', 600 + i, 1);
  drawOrbi(ctx, 790, Y, s, { view: 'side', legs: 'none', roll: 0.9, moon: false }, 1.6); label(ctx, 'ROLL', 790, 1020);
  drawOrbi(ctx, 1110, Y, s, { emo: 'laugh', squash: 0.22, hands: 'out' }, 1.8); label(ctx, 'SQUASH', 1110, 1020);
  drawOrbi(ctx, 1430, Y, s, { emo: 'happy', hands: 'wave', view: 'q' }, 2.0); label(ctx, 'WAVE', 1430, 1020);
  drawOrbi(ctx, 1750, Y, s, { emo: 'love', hands: 'hug', moon: false }, 2.2); moonAt(ctx, 1750, Y - s * 0.75, 9); label(ctx, 'MOON HUG', 1750, 1020);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(p, 0, 0, 1920, 1080); ctx.restore();
  return c.toDataURL('image/png');
}
// 动图：转一圈 → 跳一下 → 几个表情（光环与小月亮一直在动）
const SPIN = [['front', false], ['q', false], ['side', false], ['qback', false], ['back', false], ['qback', true], ['side', true], ['q', true]];
const MOODS = ['happy', 'surprised', 'sad', 'angry', 'laugh'];
function orbiFrame(f) {
  const t = f / 25, c = document.createElement('canvas'); c.width = 600; c.height = 600; const ctx = c.getContext('2d');
  if (!window.PT) window.PT = makePaper();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 600, 600); BOIL = Math.floor(t * 10);
  inkLine(ctx, [[40, 480], [300, 482], [560, 479]], 2, 'rgba(42,34,48,0.55)', 900, 1.2);
  if (t < 3.2) {
    const [v, fl] = SPIN[Math.min(7, Math.floor(t / 0.4))];
    ctx.save(); if (fl) { ctx.translate(600, 0); ctx.scale(-1, 1); } drawOrbi(ctx, 300, 480, 110, { view: v }, t); ctx.restore();
  } else if (t < 4.2) {
    const u = t - 3.2, h = Math.max(0, Math.sin(u / 0.7 * Math.PI)) * (u < 0.7 ? 1 : 0);
    const sq = u < 0.12 ? 0.18 * Math.sin(u / 0.12 * Math.PI) : u > 0.7 && u < 0.85 ? 0.2 * Math.sin((u - 0.7) / 0.15 * Math.PI) : -0.06 * h;
    drawOrbi(ctx, 300, 480, 110, { emo: 'happy', legs: h > 0.1 ? 'tuck' : 'stand', hands: h > 0.1 ? 'up' : 'down', lift: h * 0.9, squash: sq }, t);
  } else {
    const k = Math.min(MOODS.length - 1, Math.floor((t - 4.2) / 0.36)), u = (t - 4.2) - k * 0.36;
    drawOrbi(ctx, 300, 480, 110, { emo: MOODS[k], squash: u < 0.12 ? -0.08 * Math.sin(u / 0.12 * Math.PI) : 0 }, t);
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(window.PT, 0, 0); ctx.restore();
  return c.toDataURL('image/png');
}
`;

(async () => {
  const out = path.join(__dirname, 'out'), fr = path.join(out, 'oframes');
  fs.mkdirSync(fr, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', e));
  await page.setContent('<html><body></body></html>');
  for (const f of [path.join(__dirname, '..', 'src', 'lib.js'), path.join(__dirname, 'seedling.js'), path.join(__dirname, 'orbi.js')])
    await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  await page.addScriptTag({ content: PAGE });
  const save = (p, d) => fs.writeFileSync(p, Buffer.from(d.split(',')[1], 'base64'));
  save(path.join(out, 'orbi_sheet.png'), await page.evaluate(() => orbiSheet()));
  for (let f = 0; f < 150; f++) save(path.join(fr, `f${String(f).padStart(3, '0')}.png`), await page.evaluate(f => orbiFrame(f), f));
  await browser.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '25', '-i', path.join(fr, 'f%03d.png'),
    '-vf', 'fps=15,scale=480:480,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', path.join(out, 'orbi.gif')]);
})();
