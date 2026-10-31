const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const out = OUT, base = 'http://127.0.0.1:8765/game/index.html';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(base); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; S.lv = 4; [0, 1, 3].forEach(k => Object.assign(S.plots[k], { open: true, crop: 'tomato', prog: 1e9, dead: false, weeds: 0, bugs: 0, dry: false })); refresh(); });
  // 1. 主题：万圣节
  await p.locator('#bSkin').click(); await p.waitForTimeout(300);
  await p.locator('[data-theme=halloween]').click(); await p.waitForTimeout(900);
  console.log('bg:', await p.evaluate(() => [curBg().id, FARM.flat, FARM.spots.length, FS.bgImg && FS.bgImg.texture.key]));
  await p.screenshot({ path: out + '/s1-wardrobe.png' });
  await p.locator('.wardrobe [data-a=x]').click(); await p.waitForTimeout(600);
  await p.locator('#v-farm .scene').screenshot({ path: out + '/s2-halloween-left.png' });
  await p.evaluate(() => setCam(FARM.world)); await p.waitForTimeout(400); await p.locator('#v-farm .scene').screenshot({ path: out + '/s3-halloween-right.png' });
  // 点月亮
  const moon = await p.evaluate(() => { setCam(1020 / 6 - FARM.w / 2); const r = farmCv.getBoundingClientRect(); return [r.left + (1020 / 6 + FARM.ox) * r.width / FARM.w, r.top + (150 / 6) * r.height / FARM.h]; });
  await p.evaluate(() => { document.querySelector('#v-farm .ovl').style.visibility = 'hidden'; }); await p.mouse.click(...moon); await p.waitForTimeout(150);
  console.log('tap moon ->', await p.evaluate(() => TAPLBL && TAPLBL.w), '| src', (await p.evaluate(() => VO.el && VO.el.src || '')).slice(0, 22));
  await p.evaluate(() => { document.querySelector('#v-farm .ovl').style.visibility = ''; });
  // 2. 可点的东西：加一个
  await p.evaluate(() => openBgTool('halloween', 'spots')); await p.waitForTimeout(600);
  await p.screenshot({ path: out + '/s4-spots.png' });
  await p.locator('[data-a=add]').click(); const vb = await p.locator('.bt-view').boundingBox(); await p.mouse.click(vb.x + vb.width * .3, vb.y + vb.height * .85); await p.waitForTimeout(300);
  await p.locator('.pe [data-k=w]').fill('graveyard'); await p.locator('.pe [data-k=zh]').fill('墓地'); await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(200);
  console.log('spots now:', await p.evaluate(() => spotsOf(bgOf('halloween')).length), '| myWords:', await p.evaluate(() => JSON.stringify(S.cfg.myWords)));
  await p.locator('[data-a=x]').first().click(); await p.waitForTimeout(300);
  // 3. 对齐菜地
  await p.evaluate(() => openBgTool('halloween', 'field')); await p.waitForTimeout(600);
  const h0 = await p.locator('.bt-h[data-h="0"]').boundingBox(); await p.mouse.move(h0.x + 17, h0.y + 17); await p.mouse.down(); await p.mouse.move(h0.x + 37, h0.y + 27, { steps: 4 }); await p.mouse.up();
  await p.screenshot({ path: out + '/s5-field.png' });
  await p.locator('.bd-head [data-a=x]').click(); await p.waitForTimeout(300);
  console.log('fq saved:', await p.evaluate(() => JSON.stringify(S.cfg.bgs.halloween.fq[0])), '| plot0 moved:', await p.evaluate(() => PLOT_QUAD[0][0].map(Math.round).join(',')));
  // 4. 上传一张新底图
  await p.locator('#bSkin').click(); await p.waitForTimeout(300);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('[data-a=bgup]').click()]);
  await fc.setFiles(GAME + '/art/src/farm-clean-ai.jpg'); await p.waitForTimeout(1500);
  console.log('custom bg:', await p.evaluate(() => [curBg().id, curBg().custom, !!document.querySelector('.bt-h')]));
  await p.locator('.bd-head [data-a=x]').click(); await p.waitForTimeout(500);
  await p.locator('#v-farm .scene').screenshot({ path: out + '/s6-custom.png' });
  // 5. 发音引擎：生成一个没录过的词
  await p.evaluate(() => { S.cfg.vox = 1; });
  const t0 = Date.now(); const ok = await p.evaluate(async () => { const u = await voxGen('graveyard party'); return !!u; }); console.log('vox gen:', ok, (Date.now() - t0) + 'ms', '| state', await p.evaluate(() => VOX.st));
  const t1 = Date.now(); await p.evaluate(async () => { await voxGen('graveyard party'); }); console.log('vox cached:', (Date.now() - t1) + 'ms', '| stored', await p.evaluate(async () => (await voxKeys()).size));
  await p.evaluate(() => say('graveyard party')); await p.waitForTimeout(300); console.log('say uses:', (await p.evaluate(() => VO.el.src)).slice(0, 10));
  // 6. 词本：我加的
  await p.evaluate(() => go('words')); await p.locator('[data-f=mine]').click(); await p.waitForTimeout(200);
  console.log('mine rows:', await p.locator('#wList .wrow[data-w]').count(), '| grammar has graveyard:', await p.evaluate(() => grammarJSON().includes('graveyard')));
  await p.screenshot({ path: out + '/s7-mine.png' });
  // 7. 素材包导出、清空、导入
  const dl = p.waitForEvent('download'); await p.evaluate(() => exportPack()); const d = await dl; const path = out + '/pack.json'; await d.saveAs(path);
  console.log('pack size KB:', Math.round(require('fs').statSync(path).size / 1024));
  await p.evaluate(async () => { delete S.cfg.bgs; S.cfg.bg = 'base'; S.cfg.myWords = []; save(); const db = await skinDB(); await new Promise(r => { const tx = db.transaction('imgs', 'readwrite'); tx.objectStore('imgs').clear(); tx.oncomplete = r; }); });
  await p.evaluate(() => { const i = document.createElement('input'); i.type = 'file'; i.id = 'pk'; document.body.append(i); });
  await p.setInputFiles('#pk', path);
  const r = await p.evaluate(async () => importPack(document.getElementById('pk').files[0]));
  console.log('import:', JSON.stringify(r), '| bg', await p.evaluate(() => curBg().id && curBg().custom), '| myWords', await p.evaluate(() => (S.cfg.myWords || []).length));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
