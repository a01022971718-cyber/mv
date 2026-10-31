const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + GAME + '/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; refresh(); });
  console.log('default mode:', await p.evaluate(() => S.cfg.play));
  await p.locator('#bSet').click(); await p.waitForTimeout(200);
  await p.locator('.layer [data-p=game]').click(); await p.waitForTimeout(200);
  console.log('after tap 游戏模式:', await p.evaluate(() => S.cfg.play), '| desc:', (await p.locator('.layer [data-pd]').textContent()).slice(0, 18), '| learn-only rows hidden:', await p.locator('.layer [data-learn]').evaluateAll(els => els.every(e => e.hidden)));
  await p.screenshot({ path: OUT + '/mode-settings.png' });
  await p.locator('.layer [data-a=x]').last().click(); await p.waitForTimeout(200);
  // 收获：游戏模式不弹跟读卡
  await p.evaluate(() => { Object.assign(S.plots[0], { open: true, crop: 'tomato', prog: growMs('tomato') * 1.2, dead: false, weeds: 0, bugs: 0 }); harvest([0]); });
  await p.waitForTimeout(1800);
  console.log('harvest in game mode -> dialog:', await p.locator('.layer').count(), '| floating line:', await p.evaluate(() => [...document.querySelectorAll('#farmFx .say')].map(e => e.textContent).join('/')));
  // 做菜：没有麦克风，下一步直接可点，最后两星
  await p.evaluate(() => { Object.assign(S.inv, { lettuce: 4, tomato: 3 }); go('kitchen'); startCook('salad'); }); await p.waitForTimeout(500);
  console.log('cook: mic visible', await p.locator('.layer .mic').isVisible(), '| next enabled', await p.locator('.layer [data-a=next]').isEnabled(), '| link:', await p.locator('.layer [data-a=skip]').textContent());
  await p.screenshot({ path: OUT + '/mode-cook.png' });
  await p.locator('.layer [data-a=skip]').click(); await p.waitForTimeout(150);
  console.log('cook: after 开口说 mic visible', await p.locator('.layer .mic').isVisible());
  for (let i = 0; i < 4; i++) { await p.locator('.layer [data-a=next]').click(); await p.waitForTimeout(1450); }
  console.log('cook result stars:', await p.evaluate(() => S.dishes.map(d => d.q).join(',')), '|', (await p.locator('.layer .big h3').textContent().catch(() => '?')));
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  // 小馆：自动显示回答，点「下一句」走完
  await p.evaluate(() => { S.cust = [{ id: 9, who: 'mimi', dish: 'salad' }]; go('diner'); serve(9); }); await p.waitForTimeout(500);
  console.log('diner: mic visible', await p.locator('.layer .mic').isVisible(), '| next enabled', await p.locator('.layer .fl-foot [data-a=n]').isEnabled());
  await p.screenshot({ path: OUT + '/mode-diner.png' });
  const c0 = await p.evaluate(() => S.coins);
  for (let i = 0; i < 2; i++) { await p.locator('.layer .fl-foot [data-a=n]').click(); await p.waitForTimeout(400); }
  console.log('diner done:', (await p.locator('.layer .big').textContent()).replace(/\s+/g, ' '), '| coins +', await p.evaluate(c => S.coins - c, c0));
  // 切回学习模式：做菜要说
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.cfg.play = 'learn'; Object.assign(S.inv, { lettuce: 4, tomato: 3 }); startCook('salad'); }); await p.waitForTimeout(400);
  console.log('learn cook: mic visible', await p.locator('.layer .mic').isVisible(), '| next enabled', await p.locator('.layer [data-a=next]').isEnabled());
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
