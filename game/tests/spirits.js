const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.clock.install({ time: new Date('2026-10-30T10:00:00') });
  await p.goto('file://' + GAME + '/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.plots.forEach(pl => Object.assign(pl, { crop: null, dead: false, weeds: 0, bugs: 0, dry: false }));
    Object.assign(S.plots[0], { crop: 'sprout', prog: growMs('sprout') * .3 }); Object.assign(S.plots[1], { crop: 'bluebell', prog: growMs('bluebell') * .3 }); });
  const tapPlot = async k => { const xy = await p.evaluate(k => { const q = PLOTS[k]; setCam(q.x - FARM.w / 2); const r = farmCv.getBoundingClientRect(); return [r.left + (q.x + FARM.ox) * r.width / FARM.w, r.top + (q.y - 2) * r.height / FARM.h]; }, k); await p.mouse.click(...xy); await p.waitForTimeout(500); };
  for (const k of [0, 0, 1, 1]) { await tapPlot(k); console.log('plot', k, '->', await p.evaluate(() => [TAPLBL && TAPLBL.w, [...document.querySelectorAll('#farmFx .float')].map(e => e.textContent).join(' / '), (VO.el && VO.el.src || 'no-clip').slice(0, 22)])); await p.waitForTimeout(300); }
  await p.evaluate(() => go('words')); await p.locator('[data-f=spirit]').click(); await p.waitForTimeout(200);
  console.log('word book spirit entries:', await p.locator('#wList .wrow').count());
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
