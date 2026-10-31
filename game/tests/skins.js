const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.clock.install({ time: new Date('2026-10-30T10:30:00') });
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; S.lv = 5;
    S.plots.forEach((pl, k) => Object.assign(pl, { open: k < 9, crop: k < 6 ? ['pumpkin', 'tomato', 'pumpkin', 'carrot', 'sprout', 'pumpkin'][k] : null, prog: 0, dead: false, weeds: 0, bugs: 0, dry: false }));
    S.plots.forEach(pl => { if (pl.crop) pl.prog = growMs(pl.crop) * 1.2; }); Object.assign(S.plots[2], { prog: growMs('pumpkin') * .6 }); refresh(); });
  // 打开装扮窗口，换上三套自带装扮
  await p.locator('#bSkin').click(); await p.waitForTimeout(300);
  console.log('wardrobe rows:', await p.locator('.layer .skrow').count(), '| tiles:', await p.locator('.layer .skt').count());
  for (const [slot, skin] of [['scarecrow', 'xmas'], ['house', 'halloween'], ['crop:pumpkin', 'spirit']]) await p.locator(`.layer .skt[data-slot="${slot}"][data-skin="${skin}"]`).click();
  await p.waitForTimeout(200);
  console.log('equipped:', JSON.stringify(await p.evaluate(() => S.cfg.skins)), '| painted note shown:', await p.locator('.layer .skrow .meta').count());
  await p.locator('.layer').last().screenshot({ path: OUT + '/skin-wardrobe.png' });
  // 上传一张白底图到「稻草人」
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.layer [data-up="scarecrow"]').click()]);
  await chooser.setFiles(GAME + '/art/src/sprout.png'); await p.waitForTimeout(2500);
  const up = await p.evaluate(() => { const s = SKINS.find(s => s.up); return s && { slot: s.slot, zh: s.zh, on: S.cfg.skins.scarecrow === s.id, w: SKIN_IMG[s.id].naturalWidth, h: SKIN_IMG[s.id].naturalHeight }; });
  console.log('uploaded:', JSON.stringify(up));
  // 删掉上传的，回到圣诞稻草人
  await p.locator('.layer [data-del]').first().click(); await p.waitForTimeout(300);
  console.log('after delete: uploads', await p.evaluate(() => SKINS.filter(s => s.up).length), '| scarecrow skin', await p.evaluate(() => S.cfg.skins.scarecrow || 'default'));
  await p.locator('.layer .skt[data-slot="scarecrow"][data-skin="xmas"]').click(); await p.locator('.layer [data-a=x]').last().click(); await p.waitForTimeout(300);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/skin-farm-left.png' });
  await p.evaluate(() => setCam(999)); await p.waitForTimeout(300);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/skin-farm-right.png' });
  // 点新房子、新稻草人
  const tap = async (x, y) => { const xy = await p.evaluate(([x, y]) => { setCam(x - FARM.w / 2); const r = farmCv.getBoundingClientRect(); return [r.left + (x + FARM.ox) * r.width / FARM.w, r.top + y * r.height / FARM.h]; }, [x, y]); await p.mouse.click(...xy); await p.waitForTimeout(200); return p.evaluate(() => TAPLBL && TAPLBL.w); };
  console.log('tap new house ->', await tap(1700 / 6, 500 / 6), '| tap new scarecrow ->', await tap(1115 / 6, 420 / 6));
  // 重新打开：存档和上传的装扮还在
  await p.reload(); await p.waitForTimeout(1500);
  console.log('after reload skins:', JSON.stringify(await p.evaluate(() => S.cfg.skins)), '| pumpkin icon uses skin:', (await p.evaluate(() => itemImg('pumpkin'))).includes('crop-pumpkin-spirit'));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
