const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const out = OUT, base = 'http://127.0.0.1:8765/game/index.html';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.clock.install({ time: new Date('2026-10-30T10:30:00') });
  await p.goto(base); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; refresh(); });
  await p.locator('#bMap').click(); await p.waitForTimeout(900);
  await p.screenshot({ path: out + '/m1-world.png' });
  const info = await p.evaluate(() => ({ bid: MV.bid, places: placesOn('world').length, me: markerOn('world') && markerOn('world').name, W: MV.W, H: MV.H }));
  console.log('world', JSON.stringify(info));
  // 点潮流街区：先反馈 + 信息，再点一次进去
  await p.locator('.bd-lb[data-id="w-trend"]').click(); await p.waitForTimeout(150);
  await p.screenshot({ path: out + '/m2-tap.png' });
  console.log('foot after tap:', (await p.locator('.bd-foot').innerText()).replace(/\s+/g, ' '));
  await p.waitForTimeout(500);
  await p.locator('.bd-lb[data-id="w-trend"]').click(); await p.waitForTimeout(900);
  console.log('after 2nd tap board:', await p.evaluate(() => MV.bid), '| me on trend:', await p.evaluate(() => markerOn('trend').name));
  await p.screenshot({ path: out + '/m3-trend.png' });
  // 点一个没开放的地点
  await p.locator('.bd-lb[data-id="t-home"]').click(); await p.waitForTimeout(200);
  console.log('foot home:', (await p.locator('.bd-foot').innerText()).replace(/\s+/g, ' '));
  await p.screenshot({ path: out + '/m4-home.png' });
  // 编辑：改名字
  await p.locator('[data-a=edit]').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: out + '/m5-edit.png' });
  const lb = p.locator('.bd-lb[data-id="t-home"]'); const bb = await lb.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/m6-editor.png' });
  await p.locator('.pe [data-k=name]').fill('豆豆的家'); await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(200);
  console.log('renamed:', await p.evaluate(() => placeOf('t-home').name));
  // 拖动地点
  const bb2 = await p.locator('.bd-lb[data-id="t-home"]').boundingBox();
  await p.mouse.move(bb2.x + 10, bb2.y + 8); await p.mouse.down(); await p.mouse.move(bb2.x + 40, bb2.y + 38, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(200);
  const ph = await p.evaluate(() => placeOf('t-home')); console.log('moved:', ph.lx.toFixed(3), ph.ly.toFixed(3));
  // 加地点 + 给它加一个场景（上传底图）
  await p.locator('[data-a=add]').click(); await p.waitForTimeout(100);
  const mb = await p.locator('.bd-map').boundingBox(); const vb = await p.locator('.bd-view').boundingBox();
  await p.mouse.click(vb.x + vb.width * .5, vb.y + vb.height * .6); await p.waitForTimeout(300);
  console.log('custom places:', await p.evaluate(() => Object.values(MAPX().places).filter(x => x.custom).length));
  await p.locator('.pe [data-k=name]').fill('海边小屋'); await p.locator('.pe [data-k=en]').fill('beach house');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.pe [data-kind=scene]').click()]);
  await fc.setFiles(GAME + '/art/src/farm-clean-ai.jpg'); await p.waitForTimeout(1500);
  const np = await p.evaluate(() => { const q = Object.values(MAPX().places).find(x => x.custom); return { name: q.name, to: q.to, kind: targetOf(q) && targetOf(q).kind }; }); console.log('new place:', JSON.stringify(np));
  await p.locator('.pe [data-a=open]').click(); await p.waitForTimeout(900);
  console.log('in scene:', await p.evaluate(() => [MV.bid === MV.b.id, MV.b.kind, MV.b.name, HERE && placeOf(HERE).name]));
  await p.screenshot({ path: out + '/m7-scene.png' });
  // 场景里加一个东西，上传图标
  await p.locator('[data-a=edit]').click(); await p.locator('[data-a=add]').click();
  const vb2 = await p.locator('.bd-view').boundingBox(); await p.mouse.click(vb2.x + vb2.width * .4, vb2.y + vb2.height * .55); await p.waitForTimeout(300);
  await p.locator('.pe [data-k=name]').fill('稻草人'); await p.locator('.pe [data-k=en]').fill('scarecrow');
  const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.pe [data-a=icon]').click()]);
  await fc2.setFiles(GAME + '/art/skins/scarecrow-xmas.png'); await p.waitForTimeout(1200);
  await p.locator('.pe [data-a=ok]').click(); await p.locator('[data-a=edit]').click(); await p.waitForTimeout(300);
  await p.locator('.bd-ic').first().click(); await p.waitForTimeout(120);
  await p.screenshot({ path: out + '/m8-scene-tap.png' });
  // 回到地图：头像在海边小屋
  await p.locator('[data-a=back]').click(); await p.waitForTimeout(700);
  console.log('back to', await p.evaluate(() => MV.bid), '| marker at', await p.evaluate(() => markerOn(MV.bid).name));
  await p.screenshot({ path: out + '/m9-back.png' });
  // 进农场
  await p.locator('.bd-lb[data-id="t-farm"]').click(); await p.waitForTimeout(300); await p.locator('[data-a=go]').click(); await p.waitForTimeout(500);
  console.log('after farm: layer open', await p.evaluate(() => !!MV.L), 'VIEW', await p.evaluate(() => VIEW), 'HERE', await p.evaluate(() => HERE));
  // 重新载入：改的东西都还在
  await p.reload(); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); });
  await p.locator('#bMap').click(); await p.waitForTimeout(600); await p.locator('.bd-lb[data-id="w-trend"]').click(); await p.waitForTimeout(300); await p.locator('[data-a=go]').click(); await p.waitForTimeout(800);
  console.log('after reload:', await p.evaluate(() => [placeOf('t-home').name, placesOn('trend').length, !!document.querySelector('.bd-lb')]));
  const cp = await p.evaluate(() => { const q = Object.values(MAPX().places).find(x => x.custom && x.board === 'trend'); return q && [q.name, !!IMG_URL[boardOf(q.to.slice(6)).bg]]; }); console.log('custom scene bg kept:', JSON.stringify(cp));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
