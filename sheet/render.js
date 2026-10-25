// node sheet/render.js → sheet/out/seedling_sheet.png + seedling_moods.gif
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// 页面端：拼表情表与动态帧
const PAGE = `
function label(ctx, txt, cx, y) {
  ctx.save(); ctx.font = "bold 17px 'DejaVu Sans Mono'"; ctx.fillStyle = INK; ctx.textBaseline = 'middle';
  const w = 13, x0 = cx - (txt.length - 1) * w / 2;
  [...txt].forEach((ch, i) => { ctx.save(); ctx.translate(x0 + i * w + jit(i * 3 + cx, 0.8), y + jit(i * 5 + cx, 1.2)); ctx.rotate(jit(i * 7 + cx, 0.06)); ctx.textAlign = 'center'; ctx.fillText(ch, 0, 0); ctx.restore(); });
  ctx.restore();
}
function sheetPNG() {
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
  PAPER_TEX = makePaper1920();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1920, 1080);
  BOIL = 3;
  for (let r = 0; r < 4; r++) {
    const gy = 200 + r * 268;
    inkLine(ctx, [[30, gy], [700, gy + 2], [1300, gy - 1], [1890, gy + 1]], 2, 'rgba(42,34,48,0.55)', 900 + r, 1.2);
    for (let col = 0; col < 8; col++) {
      const i = r * 8 + col; if (i >= EMO_ORDER.length) continue;
      const cx = 120 + col * 240, n = EMO_ORDER[i];
      drawSeedling(ctx, cx, gy, 52, n, 0.7 + i * 0.37);
      label(ctx, n.toUpperCase(), cx, gy + 44);
    }
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(PAPER_TEX, 0, 0); ctx.restore();
  return c.toDataURL('image/png');
}
// 1920 尺寸纸纹：把 1280 纸纹拉伸铺满
function makePaper1920() { const p = makePaper(); const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; c.getContext('2d').drawImage(p, 0, 0, 1920, 1080); return c; }
// 动态：依次切换表情，切换处眨眼 + 挤压回弹
const SEQ = ['neutral', 'happy', 'surprised', 'sad', 'angry', 'laugh'];
function moodFrame(f) {
  const t = f / 25, c = document.createElement('canvas'); c.width = 600; c.height = 600; const ctx = c.getContext('2d');
  if (!window.PT) window.PT = makePaper();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 600, 600);
  BOIL = Math.floor(t * 10);
  inkLine(ctx, [[40, 470], [300, 472], [560, 469]], 2, 'rgba(42,34,48,0.55)', 900, 1.2);
  const k = Math.min(SEQ.length - 1, Math.floor(t)), u = t - k;
  const sw = k > 0 && u < 0.16; // 刚切换：眨眼
  const bounce = k > 0 ? Math.sin(Math.min(1, u / 0.35) * Math.PI) * 0.12 * (1 - u) : 0;
  drawSeedling(ctx, 300, 470, 120, SEQ[k], t, { blink: sw, squash: (EMO[SEQ[k]].squash || 0) - bounce });
  label(ctx, SEQ[k].toUpperCase(), 300, 530);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(window.PT, 0, 0); ctx.restore();
  return c.toDataURL('image/png');
}
`;

(async () => {
  const out = path.join(__dirname, 'out'), fr = path.join(out, 'frames');
  fs.mkdirSync(fr, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', e));
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '..', 'src', 'lib.js'), 'utf8') });
  await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'seedling.js'), 'utf8') });
  await page.addScriptTag({ content: PAGE });
  const save = (p, d) => fs.writeFileSync(p, Buffer.from(d.split(',')[1], 'base64'));
  save(path.join(out, 'seedling_sheet.png'), await page.evaluate(() => sheetPNG()));
  for (let f = 0; f < 150; f++) save(path.join(fr, `f${String(f).padStart(3, '0')}.png`), await page.evaluate(f => moodFrame(f), f));
  await browser.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '25', '-i', path.join(fr, 'f%03d.png'),
    '-vf', 'fps=15,scale=480:480,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', path.join(out, 'seedling_moods.gif')]);
})();
