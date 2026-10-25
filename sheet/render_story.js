// 用法：
//   node render.js frames <起始帧> <结束帧> <输出.mp4>
//   node render.js stills <输出目录> <t1> <t2> ...   （秒）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function openPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent('<html><body style="margin:0"><canvas id="c" width="1280" height="720"></canvas></body></html>');
  for (const f of ['../src/lib.js', 'seedling.js', 'orbi.js', 'story.js']) {
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, f), 'utf8') });
  }
  page.on('pageerror', e => console.error('pageerror', e));
  await page.evaluate(() => storyInit());
  return { browser, page };
}

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const { browser, page } = await openPage();
  if (mode === 'stills') {
    const [dir, ...ts] = args;
    fs.mkdirSync(dir, { recursive: true });
    for (const t of ts) {
      const d = await page.evaluate(t => storyFrame(+t), t);
      fs.writeFileSync(path.join(dir, `t${(+t).toFixed(2).padStart(7, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
  } else {
    const [a, b, out] = args;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '25', '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = +a; f < +b; f++) {
      const d = await page.evaluate(f => storyFrame(f / 25), f);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 100 === 0) console.log(out, f);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
