// 冒烟测试（新界面）：收获 → 做菜 → 上菜 → 升级 → 词本，自评模式；再测一键收获和画布点击
const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await p.clock.install({ time: new Date('2026-10-30T10:00:00') });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + GAME + '/index.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { S.cfg.mode = 'self'; });
  const tapPlotUI = async k => { const xy = await p.evaluate(k => { const r = farmCv.getBoundingClientRect(), q = PLOTS[k]; return [r.left + (q.x + FARM.ox + .5) * r.width / FARM.w, r.top + (q.y - 2) * r.height / FARM.h]; }, k); await p.mouse.click(...xy); };
  await tapPlotUI(0); await p.waitForTimeout(400);                 // 成熟的番茄 → 收获口语卡
  console.log('harvest card:', await p.locator('.layer h3').first().textContent());
  await p.locator('.layer .mic').click(); await p.locator('.layer .sp-self [data-s="92"]').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, 'a-harvest.png') });
  await p.locator('.layer [data-a=ok]').click(); await p.waitForTimeout(300);
  await tapPlotUI(3); await p.waitForTimeout(200);                 // 有虫
  console.log('plot3 bugs after tap:', await p.evaluate(() => S.plots[3].bugs));
  await p.locator('#tabs [data-v=kitchen]').click(); await p.waitForTimeout(300);
  await p.locator('[data-cook=salad]').click(); await p.waitForTimeout(500);
  for (let i = 0; i < 4; i++) { await p.locator('.layer .mic').click(); await p.locator('.layer .sp-self [data-s="72"]').click(); await p.locator('.layer [data-a=next]').click(); await p.waitForTimeout(1500); }
  await p.screenshot({ path: path.join(OUT, 'b-cookdone.png') });
  await p.locator('.layer [data-a=d]').click(); await p.waitForTimeout(500);
  // 点画面里的客人（第一个位置）
  const dxy = await p.evaluate(() => { const r = dinerCv.getBoundingClientRect(); return [r.left + (34 + DINER.ox) * r.width / DINER.w, r.top + 62 * r.height / DINER.h]; });
  await p.mouse.click(...dxy); await p.waitForTimeout(500);
  console.log('serve opened by canvas tap:', await p.locator('.layer .fl-head .t').count() > 0);
  for (let i = 0; i < 2; i++) { await p.locator('.layer .act .mic').click(); await p.locator('.layer .act .sp-self [data-s="92"]').click(); await p.locator('.layer .fl-foot [data-a=n]').click(); await p.waitForTimeout(300); }
  await p.screenshot({ path: path.join(OUT, 'c-serve.png') });
  console.log('reaction shown:', await p.locator('.layer .react').count());
  await p.locator('.layer [data-a=done]').click(); await p.waitForTimeout(600);
  const lv = p.locator('.layer.center button'); if (await lv.count()) { await p.screenshot({ path: path.join(OUT, 'd-levelup.png') }); await lv.click(); }
  // 一键收获
  await p.evaluate(() => { [1, 2, 4].forEach(k => Object.assign(S.plots[k], { crop: 'lettuce', prog: 1e9, dead: false, bugs: 0, weeds: 0 })); go('farm'); });
  await p.waitForTimeout(300); console.log('harvest-all button:', await p.locator('#bHarvest').textContent());
  await p.locator('#bHarvest').click(); await p.waitForTimeout(400);
  console.log('harvest-all card:', await p.locator('.layer h3').first().textContent(), '| ripe left', await p.evaluate(() => ripeKeys().length));
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.close()));
  await p.locator('#tabs [data-v=words]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, 'e-words.png') });
  const st = await p.evaluate(() => ({ coins: S.coins, lv: S.lv, inv: S.inv, stats: S.stats }));
  console.log(JSON.stringify(st));
  // 触控尺寸与对比度复测
  const small = await p.evaluate(() => { const out = {}; ['farm', 'kitchen', 'diner', 'words'].forEach(v => { go(v); document.querySelectorAll('button:not([hidden]), [role=button]').forEach(b => { const r = b.getBoundingClientRect(); if (r.width && r.height && (r.height < 44 || r.width < 44) && !b.classList.contains('w')) { const k = (b.className || b.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); out[k] = (out[k] || 0) + 1; } }); }); return out; });
  console.log('small targets:', JSON.stringify(small));
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
