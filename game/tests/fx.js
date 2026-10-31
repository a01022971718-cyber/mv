const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + GAME + '/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); ['#setup', '#intro'].forEach(s => { const e = document.querySelector(s); if (e) e.style.display = 'none'; });
    S.cfg.mode = 'self'; S.cfg.talk = true; S.lv = 5; S.seeds.tomato = 5; S.seeds.sprout = 3;
    S.plots.forEach((pl, k) => Object.assign(pl, { open: k < 9, crop: null, prog: 0, dead: false, weeds: 0, bugs: 0, dry: false }));
    Object.assign(S.plots[0], { crop: 'tomato', prog: growMs('tomato') * 1.2 }); Object.assign(S.plots[1], { crop: 'sprout', prog: growMs('sprout') * 1.2 }); Object.assign(S.plots[3], { crop: 'carrot', prog: growMs('carrot') * 1.2 });
    setCam(0); refresh(); });
  await p.waitForTimeout(400);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/fx-ripe.png' });
  const tapPlot = async k => { const xy = await p.evaluate(k => { const q = PLOTS[k]; const r = farmCv.getBoundingClientRect(); return [r.left + (q.x + FARM.ox) * r.width / FARM.w, r.top + (q.y - 2) * r.height / FARM.h]; }, k); await p.mouse.click(...xy); };
  // 种植：点空地 → 选番茄 → 之后连着点空地
  await tapPlot(2); await p.waitForTimeout(300);
  await p.locator('.layer [data-id=tomato]').click(); await p.waitForTimeout(180);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/fx-plant-air.png' });
  await p.waitForTimeout(330);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/fx-plant-pop.png' });
  console.log('seed hand chip:', await p.locator('#seedHand').isVisible(), (await p.locator('#seedHand').textContent()).trim());
  await p.waitForTimeout(600);
  await tapPlot(4); await p.waitForTimeout(150); await tapPlot(5); await p.waitForTimeout(150);
  console.log('continuous planting:', await p.evaluate(() => [S.plots[2].crop, S.plots[4].crop, S.plots[5].crop, S.seeds.tomato]), '| dialog open:', await p.locator('.layer').count());
  await p.waitForTimeout(500);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/fx-tip.png' });
  console.log('tip:', (await p.locator('#farmFx .ptip').last().textContent()).replace(/\s+/g, ' '));
  await p.locator('#seedHand button').click(); console.log('chip after 完成:', await p.locator('#seedHand').isVisible());
  // 收获：一键收获，截飞行中的画面
  await p.locator('#bHarvest').click(); await p.waitForTimeout(260);
  await p.screenshot({ path: OUT + '/fx-harvest-pop.png' });
  await p.waitForTimeout(450);
  await p.screenshot({ path: OUT + '/fx-harvest-fly.png' });
  console.log('flyers in flight:', await p.locator('.flyer').count());
  await p.waitForTimeout(1300);
  console.log('after: flyers', await p.locator('.flyer').count(), '| card:', await p.locator('.layer h3').first().textContent().catch(() => 'none'));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
