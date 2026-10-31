const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await p.clock.install({ time: new Date('2026-10-30T10:00:00') });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(process.env.URL || 'file://' + GAME + '/index.html'); await p.waitForTimeout(1500);
  const tapAt = async (x, y) => { const xy = await p.evaluate(([x, y]) => { setCam(x - FARM.w / 2); const r = farmCv.getBoundingClientRect(); return [r.left + (x + FARM.ox) * r.width / FARM.w, r.top + y * r.height / FARM.h]; }, [x, y]); await p.mouse.click(...xy); await p.waitForTimeout(150); return p.evaluate(() => [TAPLBL && TAPLBL.w, (VO.el && VO.el.src || '').slice(0, 22)]); };
  await p.evaluate(() => { document.querySelector('#v-farm .ovl').style.visibility = 'hidden'; });   // 左上角按钮会挡住画面顶上的东西
  for (const [n, x, y] of [['house', 1600 / 6, 420 / 6], ['scarecrow', 1122 / 6, 420 / 6], ['cottage', 1340 / 6, 175 / 6], ['bush', 1960 / 6, 260 / 6], ['flowers', 135 / 6, 540 / 6], ['fence', 400 / 6, 400 / 6], ['sea', 330 / 6, 320 / 6], ['path', 1300 / 6, 900 / 6], ['cloud', 600 / 6, 110 / 6], ['mountain', 160 / 6, 230 / 6], ['hill', 1300 / 6, 260 / 6], ['nest', 25, 148]]) console.log('tap', n.padEnd(10), '->', JSON.stringify(await tapAt(x, y)));
  await p.evaluate(() => { HEN.x = 50; HEN.wait = 1e9; }); console.log('tap hen       ->', JSON.stringify(await tapAt(50, 143)));
  console.log('tap nest(empty)->', JSON.stringify(await tapAt(25, 147)));
  // 拖动：从右往左拖 300px，镜头应该右移，而且这一下不算点击
  await p.evaluate(() => { setCam(0); TAPLBL = null; });
  const r0 = await p.evaluate(() => { const r = farmCv.getBoundingClientRect(); return [r.left, r.top, r.width]; });
  await p.mouse.move(r0[0] + 340, r0[1] + 300); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(r0[0] + 340 - i * 30, r0[1] + 300); await p.mouse.up(); await p.waitForTimeout(100);
  console.log('drag: cam', await p.evaluate(() => FARM.cam), 'max', await p.evaluate(() => (FARM.world - FARM.w).toFixed(1)), '| tap fired:', await p.evaluate(() => !!TAPLBL), '| ox', await p.evaluate(() => FARM.ox));
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/panned.png' });
  await p.evaluate(() => { document.querySelector('#v-farm .ovl').style.visibility = ''; });
  await p.locator('#bLabels').click(); console.log('labels on:', await p.evaluate(() => FARM.labels && S.cfg.labels));
  await p.locator('#bLabels').click();
  await p.evaluate(() => go('kitchen'));
  console.log('layers before map:', await p.evaluate(() => [...document.querySelectorAll('.layer')].map(l => l.className + ':' + (l.querySelector('h3,.t') || {}).textContent)));
  await p.locator('#bMap').click(); await p.waitForTimeout(500);
  await p.locator('.bd-lb[data-id="w-trend"]').click(); await p.waitForTimeout(400); await p.locator('.bd-lb[data-id="w-trend"]').click(); await p.waitForTimeout(600);
  console.log('map board:', await p.evaluate(() => MV.bid));
  await p.locator('.bd-lb[data-id="t-farm"]').click(); await p.waitForTimeout(200); await p.locator('.bd-foot [data-a=go]').click(); await p.waitForTimeout(400);
  console.log('after 进去 view =', await p.evaluate(() => VIEW), '| map layer closed:', await p.locator('.layer').count() === 0);
  await p.evaluate(() => go('words')); await p.locator('[data-f=world]').click(); await p.waitForTimeout(200);
  console.log('world words:', await p.locator('#wList .wrow').count(), (await p.locator('#wList .wrow .t').first().textContent()).trim());
  const missing = await p.evaluate(() => WORLD.map(w => w.en).filter(t => !window.VOICE_CLIPS['af_heart|' + t]));
  console.log('missing clips:', missing.length ? missing : 'none');
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
