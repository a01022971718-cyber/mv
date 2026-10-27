const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 800, height: 300 } });
  await pg.setContent('<html><body style="margin:0"></body></html>');
  for (const f of ['lib/p5.min.js', 'lib/p5.brush.js']) await pg.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '..', f), 'utf8') });
  await pg.evaluate(() => new Promise(res => new p5(p => {
    brush.instance(p);
    p.setup = () => { p.createCanvas(800, 300, p.WEBGL); p.pixelDensity(1); p.noLoop(); brush.scaleBrushes(5); };
    p.draw = () => {
      p.background('#f1e8d6'); p.translate(-400, -150);
      const rect = (x, col) => [[x, 60], [x + 60, 60], [x + 60, 200], [x, 200]];
      // A: fill then wash, wash, wash
      brush.noStroke(); brush.fill('#9d93b6', 120); brush.fillBleed(.06); brush.fillTexture(.7, .3); brush.polygon([[20, 220], [380, 220], [380, 260], [20, 260]]); brush.noFill();
      [40, 140, 240].forEach(x => { brush.noStroke(); brush.wash('#c49a60', 255); brush.polygon(rect(x)); brush.noWash(); });
      // B: wash only, no fill before
      brush.add('ink', { type: 'default', weight: 5, scatter: .25, sharpness: .8, grain: 40, opacity: 235, spacing: .2, pressure: [1.15, .75], noise: .15 });
      [440, 540, 640].forEach(x => { brush.noStroke(); brush.wash('#c49a60', 255); brush.polygon(rect(x)); brush.noWash(); brush.set('ink', '#2a2230', 0.6); brush.beginShape(0); rect(x).forEach(q => brush.vertex(q[0], q[1], 1)); brush.endShape(true); });
      setTimeout(res, 200);
    };
  })));
  await pg.screenshot({ path: process.argv[2] }); await b.close();
})();
