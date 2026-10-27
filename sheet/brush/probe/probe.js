const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 700, height: 420 } });
  pg.on('console', m => console.log('console:', m.text()));
  pg.on('pageerror', e => console.log('pageerror:', e.message));
  await pg.setContent('<html><body style="margin:0;background:#fff"></body></html>');
  for (const f of ['lib/p5.min.js', 'lib/p5.brush.js']) await pg.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '..', f), 'utf8') });
  await pg.addScriptTag({ content: `
    window.done = false;
    new p5(p => {
      brush.instance(p);
      p.setup = () => {
        p.createCanvas(700, 420, p.WEBGL); p.pixelDensity(1); p.noLoop();
        brush.scaleBrushes(5);
        brush.add('ink', { type: 'default', weight: 5, scatter: .25, sharpness: .8, grain: 40, opacity: 235, spacing: .2, pressure: [1.15, .75], noise: .15 });
      };
      p.draw = () => {
        p.background('#f3ead8');
        p.translate(-350, -210);
        brush.noStroke(); brush.fill('#9b90b4', 120); brush.fillBleed(.3); brush.fillTexture(.8, .4);
        brush.polygon([[220, 330], [480, 330], [470, 350], [230, 352]]);
        brush.noFill(); brush.wash('#f7eedb', 255); brush.set('ink', '#2a2230', 1.4);
        brush.beginShape(0); [[230, 120], [470, 120], [470, 320], [230, 320]].forEach(q => brush.vertex(q[0], q[1])); brush.endShape(true);
        brush.noWash(); brush.set('ink', '#2a2230', 0.6); brush.spline([[400, 130], [404, 220], [400, 310]], .5);
        window.done = true;
      };
    });`});
  await pg.waitForFunction(() => window.done, null, { timeout: 60000 });
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: process.argv[2] });
  await b.close();
})();
