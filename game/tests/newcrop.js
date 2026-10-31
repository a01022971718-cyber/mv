const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.clock.install({ time: new Date('2026-10-30T10:30:00') });
  await p.goto('file://' + GAME + '/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    document.querySelectorAll('.layer').forEach(l => l.remove()); ['#setup', '#intro'].forEach(s => { const e = document.querySelector(s); if (e) e.style.display = 'none'; });
    S.lv = 5; S.coins = 120;
    const plan = [['sprout', 1.2], ['bluebell', 1.2], ['tomato', 1.2], ['sprout', .6], ['bluebell', .6], ['carrot', 1.2], ['sprout', .3], [null], [null]];
    S.plots.forEach((pl, k) => { const [c, f] = plan[k] || [null]; Object.assign(pl, { open: k < 9, crop: c, prog: c ? growMs(c) * f : 0, dead: false, weeds: 0, bugs: 0, dry: false }); });
    setCam(0);
  });
  await p.waitForTimeout(800);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/newcrop-farm.png' });
  await p.locator('#bShop').click(); await p.waitForTimeout(300);
  await p.locator('.layer').last().screenshot({ path: OUT + '/newcrop-shop.png' });
  console.log('shop rows:', await p.locator('.layer [data-s] .li').count(), '| sprout unlocked:', await p.locator('.layer [data-b=sprout]').count() > 0, '| bluebell unlocked:', await p.locator('.layer [data-b=bluebell]').count() > 0);
  await p.locator('.layer [data-b=sprout][data-n="1"]').click(); await p.waitForTimeout(150);
  console.log('bought sprout seeds:', await p.evaluate(() => S.seeds.sprout));
  await p.locator('.layer [data-a=x]').last().click(); await p.waitForTimeout(200);
  // 收获成熟的精灵芽 → 收获卡
  await p.evaluate(() => { S.cfg.mode = 'self'; harvest([0]); }); await p.waitForTimeout(400);
  console.log('harvest card:', await p.locator('.layer h3').first().textContent(), '|', (await p.locator('.layer .sp-en').first().textContent()).trim());
  await p.locator('.layer').last().screenshot({ path: OUT + '/newcrop-harvest.png' });
  console.log('inv sprout:', await p.evaluate(() => S.inv.sprout));
  // 种下：在空地上播种精灵芽
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  await p.evaluate(() => { pickSeed(7); }); await p.waitForTimeout(200);
  const opts = await p.locator('.layer [data-id]').evaluateAll(els => els.map(e => e.dataset.id)); console.log('seed choices:', opts.join(','));
  await p.locator('.layer [data-id=sprout]').click(); await p.waitForTimeout(150);
  console.log('plot 7 crop:', await p.evaluate(() => S.plots[7].crop));
  await p.evaluate(() => go('words')); await p.locator('[data-f=food]').click(); await p.waitForTimeout(200);
  console.log('word book food has sprout/bluebell:', await p.locator('#wList .wrow[data-w="sprout"]').count(), await p.locator('#wList .wrow[data-w="bluebell"]').count());
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
