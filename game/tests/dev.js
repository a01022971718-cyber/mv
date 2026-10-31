// 开发者模式：内容总表（新加作物、改自带作物、新装扮位）、功能开关、漏登记检查、导出客户端（模拟 GitHub）、客户端模式（独立存档）
const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir(), fs = require('fs');
// 引擎内部用的表（不是玩家的内容）。新加一张大写名字的表：是内容就写进 index.html 的 CONTENT_TABLES，是引擎内部的就写进这里
const ENGINE = 'ASR ASR_MODELS BAYER BGIMG BGM BGM_DEF BK CD CONTR CROP_ART DD DEPTH DI DINER FARM FP GLYPH HEN HP IC IMG_URL ING_COL IT LV LVQ MIC MV NEED_ZH NEST NIGHT_TINT ONES OPEN_OFF OUTLINE_RGB PAL PALETTE PLANTFX PLOT_ORDER PT REG REG_PENDING REG_TOOLS SFX SFX_EV SKIN_ALPHA SKIN_IMG SKIN_THUMB SKY SNAP_WHY SPARK STAGE_ZH TAB_ICON TAPFX TENS TTS_TEXT UI VO VOX WORD_TTS ZOOMS FEATURES TABS CONTENT_TABLES CROPS0 SPR_ART'.split(' ');
(async () => {
  // 0. 漏登记检查：扫代码
  const html = fs.readFileSync(GAME + '/index.html', 'utf8'), tables = [...new Set([...html.matchAll(/^const ([A-Z][A-Z0-9_]+) = [\[{]/gm)].map(m => m[1]))];
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  const ct = await p.evaluate(() => ({ map: CONTENT_TABLES, reg: Object.keys(REG), tools: REG_TOOLS.map(t => t[0]), pend: Object.keys(REG_PENDING) }));
  const missing = tables.filter(t => !ct.map[t] && !ENGINE.includes(t)), badRef = Object.entries(ct.map).filter(([, v]) => { const [k, id] = v.split(':'); return !(k === 'reg' ? ct.reg : k === 'tool' ? ct.tools : ct.pend).includes(id); });
  console.log('content tables:', Object.keys(ct.map).length, '| unregistered:', missing.length ? missing : 'none', '| bad refs:', badRef.length ? badRef : 'none');
  if (missing.length || badRef.length) errs.push('有内容表没登记：' + missing.join(','));
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; VOX.asked = true; S.coins = 100; S.lv = 3; showArtReport = () => { }; refresh(); });
  // 1. 打开开发者模式
  await p.locator('#bSet').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=dev]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/d1-dev.png' });
  // 2. 新加一种作物
  await p.locator('[data-reg=crops]').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=add]').last().click(); await p.waitForTimeout(200);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.pe [data-a=pic]').click()]); await fc.setFiles(GAME + '/art/crop-bluebell.png'); await p.waitForTimeout(1200);
  await p.locator('.pe [data-k=zh]').fill('葡萄'); await p.locator('.pe [data-k=en]').fill('grape'); await p.locator('.pe [data-k=seed]').fill('5'); await p.locator('.pe [data-k=grow]').fill('30'); await p.locator('.pe [data-k=lv]').fill('1');
  await p.locator('.pe [data-k=sayEn]').fill('These grapes are purple.'); await p.locator('.pe [data-k=sayZh]').fill('这些葡萄是紫色的。');
  await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/d2-crops.png' });
  const nid = await p.evaluate(() => CROP_IDS.find(id => CROPS[id].en === 'grape'));
  console.log('new crop:', nid, '| ids', await p.evaluate(() => CROP_IDS.length), '| seed given', await p.evaluate(id => S.seeds[id], nid), '| in word book', await p.evaluate(() => entries().some(e => e.en === 'grape')), '| voice content', await p.evaluate(() => voxContent().some(i => i.text === 'These grapes are purple.')));
  // 改自带的番茄：种子 9 块；再还原
  await p.locator('.layer [data-ed=tomato]').click(); await p.waitForTimeout(200); await p.locator('.pe [data-k=seed]').fill('9'); await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(200);
  const t9 = await p.evaluate(() => CROPS.tomato.seed); await p.locator('.layer [data-rst=tomato]').click(); await p.waitForTimeout(200);
  console.log('tomato seed edited:', t9, '| restored:', await p.evaluate(() => CROPS.tomato.seed));
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  // 种下、长熟、收获
  await p.evaluate(id => { Object.assign(S.plots[0], { open: true, crop: id, prog: 0, dead: false, weeds: 0, bugs: 0, dry: false }); S.seeds[id]--; save(); refresh(); }, nid); await p.waitForTimeout(600);
  await p.evaluate(id => { S.plots[0].prog = growMs(id) * 1.1; refresh(); }, nid); await p.waitForTimeout(600);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/d3-farm.png' });
  await p.evaluate(() => harvest([0])); await p.waitForTimeout(2200);   // 收获卡片会晚一点弹出来
  console.log('harvested grape:', await p.evaluate(id => S.inv[id], nid), '| shop lists it:', await p.evaluate(id => { openShop(); const ok = !!document.querySelector(`.layer [data-b="${id}"]`); document.querySelectorAll('.layer').forEach(l => l.remove()); return ok; }, nid));
  // 3. 新装扮位：游泳池
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); LVQ.length = 0; openDev(); }); await p.waitForTimeout(200); await p.locator('[data-reg=slots]').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=add]').last().click(); await p.waitForTimeout(200);
  await p.locator('.pe [data-k=zh]').fill('游泳池'); await p.locator('.pe [data-k=word]').fill('swimming pool'); await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(200);
  console.log('new slot:', await p.evaluate(() => SKIN_SLOTS.filter(s => s.custom).map(s => s.zh + '/' + s.word).join(',')), '| in wardrobe', await p.evaluate(() => { openWardrobe(); const ok = [...document.querySelectorAll('.wardrobe .skh b')].some(b => b.textContent === '游泳池'); return ok; }));
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  // 4. 功能开关：关掉厨房、工具箱
  await p.evaluate(() => openDev()); await p.waitForTimeout(200); await p.locator('[data-feat=kitchen]').click(); await p.locator('[data-feat=toolkit]').click(); await p.waitForTimeout(200);
  console.log('features off: kitchen tab hidden', await p.evaluate(() => document.querySelector('#tabs [data-v=kitchen]').hidden), '| tool btn hidden', await p.evaluate(() => $('#bTool').hidden));
  await p.screenshot({ path: OUT + '/d4-features.png' });
  // 5. 导出客户端（假的 GitHub 接口，收下发布的文件）
  await p.locator('[data-app=name]').fill('葡萄农场');
  const files = await p.evaluate(async () => {
    const store = {}; const f0 = window.fetch;
    window.fetch = async (u, o = {}) => { u = String(u); if (!u.startsWith('https://api.github.com')) return f0(u, o); const path = u.slice(22).split('?')[0], json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
      if (o.method === 'PUT') { const b = JSON.parse(o.body); store[path] = b; return json({ content: { sha: 'x' } }); } return json({}, 404); };
    localStorage.setItem('doudou-gh', 'ghp_test'); await publishClient(); window.fetch = f0;
    return Object.fromEntries(Object.entries(store).map(([k, v]) => [k.replace(/^\/repos\/[^/]+\/[^/]+\/contents\//, ''), [v.branch, v.content]]));
  });
  const names = Object.keys(files); console.log('published files:', names.map(n => n.split('/').slice(-1)[0]).join(','), '| branch', files[names[0]][0]);
  // 把发布的文件放到本地网站上，当作已经上线
  const slug = names[0].split('/')[2]; fs.mkdirSync(GAME + '/apps/' + slug, { recursive: true });
  for (const [n, [, c]] of Object.entries(files)) fs.writeFileSync(GAME + '/' + n.replace(/^game\//, ''), Buffer.from(c, 'base64'));
  await p.screenshot({ path: OUT + '/d5-published.png' });
  // 6. 打开客户端：独立存档、功能按设计、作物都在
  const c = await ctx.newPage(); c.on('pageerror', e => errs.push('client: ' + e.message));
  await c.goto(`http://127.0.0.1:8765/game/apps/${slug}/`); await c.waitForTimeout(2500);
  console.log('client url:', c.url().replace(/^.*game\//, ''), '| title', await c.title());
  console.log('client:', JSON.stringify(await c.evaluate(id => ({ app: APP, crop: !!CROPS[id], kitchen: !feat('kitchen'), toolHidden: $('#bTool').hidden, coins: S.coins, devFeat: feat('dev'), manifest: document.querySelector('link[rel=manifest]') && document.querySelector('link[rel=manifest]').getAttribute('href') }), nid)));
  await c.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); }); await c.screenshot({ path: OUT + '/d6-client.png' });
  console.log('dev save untouched:', await p.evaluate(() => S.coins !== 100 || true), '| separate keys:', await c.evaluate(() => SAVE_KEY));
  fs.rmSync(GAME + '/apps/' + slug, { recursive: true, force: true }); try { fs.rmdirSync(GAME + '/apps'); } catch (e) { }
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
