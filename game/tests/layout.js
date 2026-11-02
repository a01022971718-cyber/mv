// 自由摆放：豆豆点哪走哪、物件转/翻/图层、菜地单块编辑（挪、改形状、加地、藏地、开垦价）、场景里走路和物件旋转、界面编辑器（配色、圆角、文字、标签顺序）
const { chromium } = require('playwright');
const OUT = process.argv[2] || require('os').tmpdir();

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const fail = m => { errs.push(m); console.log('FAIL:', m); };
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; VOX.asked = true; S.coins = 500; S.lv = 3; LVQ.length = 0; showArtReport = () => { }; refresh(); });
  await p.evaluate(() => { document.querySelector('#v-farm .ovl').style.visibility = 'hidden'; });
  const scr = (x, y) => p.evaluate(([x, y]) => { const r = farmCv.getBoundingClientRect(); return [r.left + (x + FARM.ox) * r.width / FARM.w, r.top + y * r.height / FARM.h]; }, [x, y]);

  // 1. 豆豆点哪走哪：点一块空地（菜地右下的沙土路）
  await p.evaluate(() => setCam(60));
  const tgt = await p.evaluate(() => [FARM.cam + FARM.w - 30, 182]);
  await p.mouse.click(...await scr(...tgt)); await p.waitForTimeout(150);
  const goal = await p.evaluate(() => [DD.tx, DD.ty]);
  await p.waitForTimeout(4500);
  const at = await p.evaluate(() => [DD.x, DD.y, DD.face]);
  console.log('walk: target', goal.map(Math.round).join(','), '| now at', at.slice(0, 2).map(Math.round).join(','), '| face', at[2]);
  if (Math.hypot(goal[0] - tgt[0], goal[1] - tgt[1]) > 1 || Math.hypot(at[0] - goal[0], at[1] - goal[1]) > 3) fail('豆豆没有走到点的地方');
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/l1-walk.png' });

  // 2. 物件：转、翻、图层
  await p.evaluate(() => startAdjust('scarecrow')); await p.waitForTimeout(300);
  for (const k of ['rr', 'rr', 'f', 'zb', 'zb', '+']) await p.locator(`#adjBar [data-k="${k}"]`).click();
  const pos = await p.evaluate(() => S.cfg.skinPos[skinOn('scarecrow')]);
  console.log('adjust:', JSON.stringify(pos), '| bar:', (await p.locator('#adjBar span').textContent()).trim());
  if (pos.r !== 30 || pos.f !== true || pos.z !== -2) fail('旋转、翻转、图层没记住');
  const spr = await p.evaluate(() => { const o = FP.list.find(o => o.visible && o.texture && o.texture.key === skinKey(skinOn('scarecrow'))); return o ? [o.angle, o.flipX, Math.round(o.depth)] : null; });
  console.log('sprite angle/flip/depth:', spr);
  if (!spr || Math.round(spr[0]) !== 30 || !spr[1]) fail('农场里的稻草人没有转、没有翻');
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/l2-rotated.png' });
  await p.locator('#adjBar [data-k="ok"]').click(); await p.waitForTimeout(200);
  // 点转过以后的稻草人（点它身体中间）：要能读出 scarecrow
  const mid = await p.evaluate(() => { const b = skinBounds(SLOT.scarecrow, skinOn('scarecrow')), q = b.pts; return [(q[0].x + q[2].x) / 2, (q[0].y + q[2].y) / 2]; });
  await p.evaluate(() => { TAPLBL = null; });
  await p.mouse.click(...await scr(...mid)); await p.waitForTimeout(200);
  console.log('tap rotated scarecrow ->', await p.evaluate(() => TAPLBL && TAPLBL.w));
  if (await p.evaluate(() => !(TAPLBL && TAPLBL.w === 'scarecrow'))) fail('点不到转过的稻草人');

  // 3. 菜地：单块地
  await p.evaluate(() => openBgTool('base', 'field')); await p.waitForTimeout(700);
  await p.locator('[data-m=one]').click(); await p.waitForTimeout(150);
  const c0 = await p.evaluate(() => { const m = document.querySelector('.bt-view .bd-map').getBoundingClientRect(), k = m.width / 2048, c = plotsFor(curBg().fq || FQ0, curBg()).centers[0]; return [m.left + c[0] * k, m.top + c[1] * k]; });
  await p.locator('.bt-view').evaluate((v, x) => { v.scrollLeft += x - v.clientWidth / 2; }, c0[0]); await p.waitForTimeout(100);
  const c1 = await p.evaluate(() => { const m = document.querySelector('.bt-view .bd-map').getBoundingClientRect(), k = m.width / 2048, c = plotsFor(curBg().fq || FQ0, curBg()).centers[0]; return [m.left + c[0] * k, m.top + c[1] * k]; });
  await p.mouse.click(c1[0], c1[1]); await p.waitForTimeout(200);
  console.log('selected plot 1:', await p.locator('.bt-h.pt').count(), 'corner handles |', (await p.locator('.btf b').textContent().catch(() => '')).trim());
  if (await p.locator('.bt-h.pt').count() !== 4) fail('选不中单块地');
  // 拖整块地往左下挪
  await p.mouse.move(c1[0], c1[1]); await p.mouse.down(); await p.mouse.move(c1[0] - 40, c1[1] + 30, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
  // 拖一个角改形状
  const hb = await p.locator('.bt-h.pt[data-c="0"]').boundingBox(); await p.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await p.mouse.down(); await p.mouse.move(hb.x + hb.width / 2, hb.y - 20, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(150);
  // 加一块地，开垦价改成 0 金币 1 级
  await p.locator('[data-a=padd]').click(); await p.waitForTimeout(150);
  await p.locator('[data-lc]').fill('0'); await p.locator('[data-ll]').fill('1'); await p.locator('[data-ll]').dispatchEvent('change');
  await p.screenshot({ path: OUT + '/l3-plots.png' });
  // 藏起第 16 块
  const c15 = await p.evaluate(() => { const m = document.querySelector('.bt-view .bd-map').getBoundingClientRect(), k = m.width / 2048, c = plotsFor(curBg().fq || FQ0, curBg()).centers[15]; return [c[0] * k, c[1] * k]; });
  await p.locator('.bt-view').evaluate((v, c) => { v.scrollLeft = c[0] - v.clientWidth / 2; v.scrollTop = c[1] - v.clientHeight / 2; }, c15); await p.waitForTimeout(100);
  const c15b = await p.evaluate(() => { const m = document.querySelector('.bt-view .bd-map').getBoundingClientRect(), k = m.width / 2048, c = plotsFor(curBg().fq || FQ0, curBg()).centers[15]; return [m.left + c[0] * k, m.top + c[1] * k]; });
  await p.mouse.click(c15b[0], c15b[1]); await p.waitForTimeout(150);
  console.log('selected:', (await p.locator('.btf b').textContent()).trim()); await p.locator('[data-a=phide]').click(); await p.waitForTimeout(100);
  await p.locator('.bd-head [data-a=x]').click(); await p.waitForTimeout(800);
  const st = await p.evaluate(() => { const g = S.cfg.bgs.base; return { pq: Object.keys(g.pq || {}), extra: (g.extra || []).length, hide: g.hide, lock: g.lock, plots: PLOTS.length, saved: S.plots.length, order: PLOT_ORDER.length, lock16: PLOT_LOCK[16], soil0: !!(FS.soil && FS.soil[0]), soil16: !!(FS.soil && FS.soil[16]), has15: PLOT_ORDER.includes(15) }; });
  console.log('field saved:', JSON.stringify(st));
  if (st.pq[0] !== '0' || st.extra !== 1 || st.plots !== 17 || st.saved !== 17 || st.order !== 16 || st.has15 || !st.lock16 || st.lock16.c !== 0 || !st.soil16) fail('菜地单块编辑没存好');
  // 在农场里开垦、种新加的那块地
  const q16 = await p.evaluate(() => { setCam(PLOTS[16].x - FARM.w / 2); return [PLOTS[16].x, PLOTS[16].y]; }); await p.waitForTimeout(100);
  await p.mouse.click(...await scr(q16[0], q16[1] - 1)); await p.waitForTimeout(300);
  const ok = p.locator('.layer [data-a=ok]'); if (await ok.count()) { await ok.click(); await p.waitForTimeout(200); }
  console.log('plot 17 open:', await p.evaluate(() => S.plots[16].open));
  if (await p.evaluate(() => !S.plots[16].open)) fail('新加的地开垦不了');
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); plant(16, 'lettuce'); });
  await p.waitForTimeout(900); await p.evaluate(() => setCam(PLOTS[0].x - FARM.w / 2)); await p.waitForTimeout(300);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/l4-farm-plots.png' });
  // 只有一张图的底图（万圣节）：挪过的地也要贴土
  await p.evaluate(() => { S.cfg.bg = 'halloween'; setBgPatch('halloween', { pq: { 2: S.cfg.bgs.base.pq[0] } }); }); await p.waitForTimeout(1500);
  console.log('flat bg soil:', await p.evaluate(() => [FS.soilFlat, !!FS.soil && !!FS.soil[2], !!FS.soil && FS.soil[3] === null]));
  if (await p.evaluate(() => !(FS.soilFlat && FS.soil && FS.soil[2] && FS.soil[3] === null))) fail('万圣节底图上挪过的地没贴土');
  await p.evaluate(() => { S.cfg.bg = 'base'; setFarmBg(); });

  // 4. 场景：点哪走哪、物件转/翻/图层
  await p.evaluate(() => {
    IMG_URL.ictest = 'art/skins/scarecrow-xmas.png';
    setBoard('btest', { custom: true, kind: 'scene', name: '测试场景', parent: 'trend', src: 'art/map/trend.webp', w: 1192, h: 752 });
    MAPX().places.ptest = { id: 'ptest', custom: true, board: 'btest', name: '稻草人', sub: '', x: .3, y: .5, lx: .3, ly: .6, to: '', icon: 'ictest' }; save();
    openBoard('btest');
  });
  await p.waitForTimeout(700);
  const w0 = await p.locator('.bd-walker').boundingBox();
  const vb = await p.locator('.bd-view').boundingBox(); await p.mouse.click(vb.x + vb.width * .8, vb.y + vb.height * .7); await p.waitForTimeout(2800);
  const w1 = await p.locator('.bd-walker').boundingBox();
  console.log('scene walker moved:', Math.round(w1.x - w0.x), Math.round(w1.y - w0.y));
  if (!w0 || Math.hypot(w1.x - w0.x, w1.y - w0.y) < 20) fail('场景里点了不会走');
  await p.locator('[data-a=edit]').click(); await p.waitForTimeout(150); await p.evaluate(() => editPlace('ptest')); await p.waitForTimeout(200);
  for (const k of ['rl', 'flip', 'zf']) await p.locator(`.pe [data-a=${k}]`).click();
  const pl = await p.evaluate(() => { const q = placeOf('ptest'), el = document.querySelector('.bd-ic[data-id=ptest]'); return [q.r, q.f, q.z, el.style.getPropertyValue('--r'), el.style.getPropertyValue('--f')]; });
  console.log('scene item r/f/z:', JSON.stringify(pl));
  if (pl[0] !== -15 || pl[1] !== true || pl[2] !== 1 || pl[3] !== '-15deg' || pl[4] !== '-1') fail('场景物件没有转、翻');
  await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(150);
  await p.screenshot({ path: OUT + '/l5-scene.png' });
  await p.evaluate(() => MV.L.close()); await p.waitForTimeout(200);

  // 5. 界面编辑器：从开发者模式进去
  await p.locator('#bSet').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=dev]').click(); await p.waitForTimeout(300);
  await p.locator('.layer [data-tool=ui]').click(); await p.waitForTimeout(300);
  await p.locator('.uied [data-pre=mint]').click(); await p.waitForTimeout(100);
  await p.locator('.uied [data-corner=round]').click(); await p.locator('.uied [data-pat=plain]').click();
  await p.locator('.uied [data-tx=shop]').fill('商店'); await p.locator('.uied [data-tx=diner]').fill('餐厅');
  await p.locator('.uied [data-up="2"]').click(); await p.waitForTimeout(100);
  await p.screenshot({ path: OUT + '/l6-ui-editor.png' });
  await p.locator('.uied [data-a=x]').click(); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  const ui = () => p.evaluate(() => ({ bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), round: document.body.classList.contains('ui-round'), plain: document.body.classList.contains('ui-plain'), shop: $('#bShop').textContent.trim(), tabs: [...document.querySelectorAll('#tabs [data-v]')].map(t => t.querySelector('span').textContent.trim()).join('/') }));
  const u1 = await ui(); console.log('ui:', JSON.stringify(u1));
  await p.screenshot({ path: OUT + '/l7-ui.png' });
  await p.reload(); await p.waitForTimeout(1500);
  const u2 = await ui(); console.log('ui after reload:', JSON.stringify(u2));
  if (u2.bg !== '#1f5e57' || !u2.round || !u2.plain || u2.shop !== '商店' || u2.tabs !== '农场/餐厅/厨房/学习') fail('界面改动没生效或没记住');
  console.log('after reload: plots', await p.evaluate(() => [PLOTS.length, S.plots[16].open, S.plots[16].crop]));
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
