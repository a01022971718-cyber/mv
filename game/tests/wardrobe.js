const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const out = OUT;
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; refresh(); });
  await p.locator('#bSkin').click(); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/w1.png' });
  console.log('slots:', await p.evaluate(() => [...document.querySelectorAll('.wardrobe .skh b')].map(e => e.textContent).join(',')));
  // 上传一张绿树
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('[data-up="tree"]').click()]);
  await fc.setFiles(GAME + '/art/src/sprout.png'); await p.waitForTimeout(1500);
  console.log('tree skin:', await p.evaluate(() => skinOn('tree')));
  // 改名
  await p.locator('[data-ren]').first().click(); await p.waitForTimeout(200); await p.locator('.layer .inp').last().fill('大绿树'); await p.locator('.layer [data-a=ok]').last().click(); await p.waitForTimeout(300);
  console.log('renamed:', await p.evaluate(() => SKINS.find(s => s.id === skinOn('tree')).zh));
  // 存成主题
  await p.locator('[data-a=saveth]').click(); await p.waitForTimeout(200); await p.locator('.layer .inp').last().fill('绿树主题'); await p.locator('.layer [data-a=ok]').last().click(); await p.waitForTimeout(300);
  console.log('themes:', await p.evaluate(() => themesAll().map(t => t.zh).join(',')));
  await p.locator('[data-theme=plain]').click(); await p.waitForTimeout(200);
  console.log('after 空地:', await p.evaluate(() => JSON.stringify([skinOn('scarecrow'), skinOn('house'), skinOn('tree')])));
  const tid = await p.evaluate(() => S.cfg.themes[0].id); await p.locator(`[data-theme="${tid}"]`).click(); await p.waitForTimeout(200);
  console.log('after 绿树主题:', await p.evaluate(() => JSON.stringify([skinOn('scarecrow'), skinOn('house'), !!skinOn('tree')])), '| pressed:', await p.locator(`[data-theme="${tid}"]`).getAttribute('aria-pressed'));
  await p.screenshot({ path: out + '/w2.png' });
  await p.locator('.wardrobe [data-a=x]').click(); await p.waitForTimeout(500);
  // 农场：点稻草人，看波纹和弹跳
  await p.evaluate(() => setCam(150)); await p.waitForTimeout(300);
  const pos = await p.evaluate(() => { const sl = SLOT.scarecrow, b = skinBounds(sl, skinOn('scarecrow')), r = farmCv.getBoundingClientRect(); return [r.left + (b.cx + FARM.ox) * r.width / FARM.w, r.top + (b.top + b.h * .5) * r.height / FARM.h]; });
  await p.evaluate(() => { document.querySelector('#v-farm .ovl').style.visibility = 'hidden'; });
  await p.mouse.click(...pos); await p.waitForTimeout(110);
  console.log('tapped:', await p.evaluate(() => TAPLBL && TAPLBL.w), '| rings', await p.evaluate(() => TAPFX.rings.length), '| pop', await p.evaluate(() => !!TAPFX.pop['skin:scarecrow']));
  await p.locator('#v-farm .scene').screenshot({ path: out + '/w3-farm-tap.png' });
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
