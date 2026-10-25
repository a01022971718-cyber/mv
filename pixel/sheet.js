// node pixel/sheet.js → pixel/out/{characters,props,scenes}.png + preview.gif
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

(async () => {
  const out = path.join(__dirname, 'out'), fr = path.join(out, 'frames');
  fs.mkdirSync(fr, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', e));
  await page.setContent('<html><body></body></html>');
  for (const f of ['palette.js', 'sprites.js', 'scenes.js', 'compose.js'])
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, f), 'utf8') });
  const save = (name, d) => fs.writeFileSync(path.join(out, name), Buffer.from(d.split(',')[1], 'base64'));
  save('characters.png', await page.evaluate(() => charactersSheet()));
  save('props.png', await page.evaluate(() => propsSheet()));
  save('scenes.png', await page.evaluate(() => scenesSheet()));
  for (let i = 0; i < 24; i++) fs.writeFileSync(path.join(fr, `f${String(i).padStart(2, '0')}.png`), Buffer.from((await page.evaluate(i => previewFrame(i), i)).split(',')[1], 'base64'));
  await browser.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '12', '-i', path.join(fr, 'f%02d.png'),
    '-vf', 'scale=640:360:flags=neighbor,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', '-loop', '0', path.join(out, 'preview.gif')]);
})();
