// 工具箱：用模板做「牧场」（养成）和「池塘」（钓鱼），玩一遍；从地图进去；特效、音乐、音效、语音包自动补齐
const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; S.coins = 100; VOX.asked = true; refresh(); });   // 「下载语音包？」只问一次，测试里当作问过了
  const pickChoice = async label => { await p.locator('.layer .mp-opts [data-k]', { hasText: label }).first().click(); await p.waitForTimeout(150); };
  const fillAsk = async v => { await p.locator('.layer .inp').last().fill(v); await p.locator('.layer [data-a=ok]').last().click(); await p.waitForTimeout(150); };
  // 1. 工具箱
  await p.locator('#bTool').click(); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/tk1-toolkit.png' });
  // 2. 牧场：养成模板，新加一个地点
  await p.locator('[data-a=newmod]').click(); await p.waitForTimeout(200);
  await pickChoice('养成'); await fillAsk('牧场'); await pickChoice('新加一个地点'); await p.waitForTimeout(600);
  const ranch = await p.evaluate(() => MP && [MP.m.name, MP.m.tpl, MP.edit, MP.m.items.length, MP.m.slots.length, !!placeOf(MP.placeId)]); console.log('ranch:', JSON.stringify(ranch));
  await p.screenshot({ path: OUT + '/tk2-ranch-edit.png' });
  await p.locator('.bd-head [data-a=edit]').click(); await p.waitForTimeout(200);
  await p.locator('.mp-slot[data-s="0"]').click(); await p.waitForTimeout(200); await p.locator('.layer [data-it=hen]').click(); await p.waitForTimeout(300);
  console.log('placed hen, coins', await p.evaluate(() => S.coins));
  await p.evaluate(() => { modSt(MP.id).slots[0].t0 -= 60000; mpItems(); }); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/tk3-ranch-ripe.png' });
  await p.locator('.mp-slot[data-s="0"]').click({ force: true }); await p.waitForTimeout(120);
  await p.screenshot({ path: OUT + '/tk4-ranch-collect.png' });
  console.log('collected:', await p.evaluate(() => [S.coins, modSt(MP.id).got.hen, document.querySelectorAll('.fxp').length > 0]));
  // 加一样新东西（上传图片、填英文），语音包会把它排进去生成
  await p.locator('.bd-head [data-a=edit]').click(); await p.locator('[data-a=items]').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=add]').click(); await p.waitForTimeout(200);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.layer [data-a=pic]').click()]); await fc.setFiles(GAME + '/art/crop-sprout.png'); await p.waitForTimeout(800);
  await p.locator('.layer [data-k=zh]').last().fill('小羊'); await p.locator('.layer [data-k=en]').last().fill('woolly sheep'); await p.locator('.layer [data-k=line]').last().fill('The woolly sheep gives us wool.'); await p.locator('.layer [data-k=grow]').last().fill('20');
  await p.locator('.layer [data-a=ok]').last().click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=x]').last().click(); await p.waitForTimeout(200);
  console.log('items:', await p.evaluate(() => MP.m.items.map(i => i.en).join(',')), '| content has line:', await p.evaluate(() => voxContent().some(i => i.text === 'The woolly sheep gives us wool.')));
  await p.locator('.bd-head [data-a=back]').click(); await p.waitForTimeout(700);
  console.log('back on map:', await p.evaluate(() => MV.bid), '| marker cleared to farm:', await p.evaluate(() => herePlace().id));
  // 3. 从地图进牧场：头像跟过去
  const pid = await p.evaluate(() => allPlaces().find(q => q.to && q.to.startsWith('mod:')).id);
  await p.locator(`.bd-lb[data-id="${pid}"]`).click(); await p.waitForTimeout(300); await p.locator('.bd-foot [data-a=go]').click(); await p.waitForTimeout(500);
  console.log('entered from map:', await p.evaluate(() => [!!MP, MP && MP.m.name, HERE === MP.placeId]));
  await p.locator('.bd-head [data-a=back]').click(); await p.waitForTimeout(500); await p.locator('.bd-head [data-a=back]').click(); await p.waitForTimeout(300); await p.locator('.bd-head [data-a=back]').click(); await p.waitForTimeout(300);
  // 4. 池塘：钓鱼模板，放在「我的乐园」
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.close ? l.close() : l.remove()));
  await p.locator('#bTool').click(); await p.waitForTimeout(200); await p.locator('[data-a=newmod]').click(); await p.waitForTimeout(150);
  await pickChoice('钓鱼'); await fillAsk('池塘'); await pickChoice('我的乐园'); await p.waitForTimeout(500);
  await p.locator('.bd-head [data-a=edit]').click(); await p.waitForTimeout(150);
  await p.locator('.mp-foot [data-a=go]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/tk5-pond-meter.png' });
  await p.evaluate(() => { const r = MP.run; r.pos = r.z0 + r.zw / 2; r.dir = 0; }); await p.locator('.mp-foot [data-a=go]').click(); await p.waitForTimeout(150);
  await p.screenshot({ path: OUT + '/tk6-pond-catch.png' });
  console.log('caught:', await p.evaluate(() => [Object.values(modSt(MP.id).got).reduce((a, b) => a + b, 0), !!document.querySelector('.mp-card')]));
  await p.locator('.mp-foot [data-a=book]').click(); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/tk7-book.png' }); await p.locator('.layer [data-a=x]').last().click();
  await p.locator('.bd-head [data-a=back]').click(); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.close ? l.close() : l.remove()));
  // 5. 特效、音乐、音效
  await p.locator('#bTool').click(); await p.waitForTimeout(200);
  await p.locator('[data-fx=hearts]').click(); await p.waitForTimeout(120); console.log('fx preview particles:', await p.locator('.fxp').count());
  await p.locator('[data-a=bgmon]').click(); await p.waitForTimeout(500); console.log('bgm:', await p.evaluate(() => [S.cfg.bgmOn, BGM.cur]));
  const [fs] = await Promise.all([p.waitForEvent('filechooser'), p.locator('[data-sup=coin]').click()]); await fs.setFiles(GAME + '/tests/fixtures/crack-two-eggs.wav'); await p.waitForTimeout(500);
  console.log('sfx coin uploaded:', await p.evaluate(() => !!(S.cfg.sfxUp && IMG_URL[S.cfg.sfxUp.coin])));
  await p.locator('[data-sre=coin]').click(); await p.locator('[data-a=bgmon]').click();
  await p.screenshot({ path: OUT + '/tk8-toolkit2.png' });
  await p.locator('.toolkit [data-a=x]').click();
  // 6. 语音包：后台自动补齐新文案
  await p.evaluate(() => { S.cfg.vox = 1; }); const t0 = Date.now();
  await p.evaluate(async () => { await voxPackRun(); });
  console.log('pack:', await p.evaluate(() => JSON.stringify(VOX.pack)), Math.round((Date.now() - t0) / 1000) + 's', '| has sheep line:', await p.evaluate(async () => !!(await voxGet('af_heart|The woolly sheep gives us wool.'))));
  // 7. 重新打开：玩法、地点都还在
  await p.reload(); await p.waitForTimeout(1500);
  console.log('after reload:', await p.evaluate(() => [Object.values(MODS()).map(m => m.name).join(','), allPlaces().filter(q => q.to && q.to.startsWith('mod:')).length]));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
