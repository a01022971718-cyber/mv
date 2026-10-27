// node sheet/brush/render_tofu_brush.js [test] → sheet/out/tofu_sheet.png（test：只画一个正面 → sheet/out/tofu_brush_test.png）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const test = process.argv[2] === 'test';
  const Wd = test ? 960 : 1920, Hd = test ? 600 : 1080;
  const root = path.join(__dirname, '..');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: Wd, height: Hd } });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.setContent(`<html><body style="margin:0;background:#f1e8d6;overflow:hidden">
    <div id="stage" style="position:relative;width:${Wd}px;height:${Hd}px"></div></body></html>`);
  for (const f of [path.join(__dirname, 'lib', 'p5.min.js'), path.join(__dirname, 'lib', 'p5.brush.js'), path.join(root, '..', 'src', 'lib.js'), path.join(__dirname, 'tofu_brush.js')])
    await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  const font = 'data:font/ttf;base64,' + fs.readFileSync(path.join(root, 'fonts', 'PermanentMarker-Regular.ttf')).toString('base64');
  await page.evaluate(({ Wd, Hd, test, font }) => new Promise(resolve => {
    new p5(p => {
      brush.instance(p);
      p.setup = () => {
        const cv = p.createCanvas(Wd, Hd, p.WEBGL); cv.parent('stage'); p.pixelDensity(1); p.noLoop();
        brush.scaleBrushes(5);
        // 与仓库同一套笔刷参数
        brush.add('ink', { type: 'default', weight: 5, scatter: .25, sharpness: .8, grain: 40, opacity: 235, spacing: .2, pressure: [1.15, .75], noise: .15 });
        brush.add('inkfine', { type: 'default', weight: 2.6, scatter: .15, sharpness: .85, grain: 40, opacity: 230, spacing: .2, pressure: [1.1, .8], noise: .1 });
        brush.add('dry', { type: 'default', weight: 14, scatter: 3, sharpness: .3, grain: 6, opacity: 90, spacing: .6, pressure: [1, .6], noise: .4 });
      };
      p.draw = async () => {
        p.background('#f1e8d6');
        p.translate(-Wd / 2, -Hd / 2);
        p.randomSeed(7); p.noiseSeed(7);
        if (test) testDraw(); else sheetDraw();
        // 叠加层：纸纹（正片叠底）+ 手写标签
        const stage = document.getElementById('stage');
        const paper = document.createElement('canvas'); paper.width = Wd; paper.height = Hd;
        paper.style.cssText = 'position:absolute;left:0;top:0;mix-blend-mode:multiply;opacity:.75';
        paper.getContext('2d').drawImage(makePaper(), 0, 0, Wd, Hd); stage.appendChild(paper);
        const lab = document.createElement('canvas'); lab.width = Wd; lab.height = Hd; lab.style.cssText = 'position:absolute;left:0;top:0';
        const f = new FontFace('Marker', 'url(' + font + ')'); await f.load(); document.fonts.add(f);
        const g = lab.getContext('2d'); g.fillStyle = '#3e3a44'; g.textAlign = 'center'; g.textBaseline = 'middle';
        LABELS.forEach(([t, x, y, sz]) => { g.save(); g.font = sz + "px 'Marker'"; g.translate(x, y); g.transform(1, 0, -0.12, 1, 0, 0); g.fillText(t, 0, 0); g.restore(); });
        stage.appendChild(lab);
        setTimeout(resolve, 300);
      };
    });
  }), { Wd, Hd, test, font });
  const out = path.join(root, 'out', test ? 'tofu_brush_test.png' : 'tofu_sheet.png');
  await page.screenshot({ path: out, timeout: 120000 });
  await browser.close();
  console.log(out);
})();
