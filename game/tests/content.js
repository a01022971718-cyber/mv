// 开发者模式 · 菜谱、小馆客人、小馆对话：新加一道菜 → 做出来；新加一位客人和一句点菜的话 → 客人来点这道菜、上菜收钱；改自带的再还原
const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; VOX.asked = true; S.coins = 100; S.lv = 3; S.cfg.play = 'game'; S.inv = {}; S.dishes = []; showArtReport = () => { }; save(); refresh(); });
  const clear = () => p.evaluate(() => { LVQ.length = 0; document.querySelectorAll('.layer').forEach(l => l.remove()); });
  // 1. 新加一道菜
  await p.evaluate(() => openDev()); await p.waitForTimeout(200); await p.locator('[data-reg=recipes]').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/c1-recipes.png' });
  await p.locator('.layer [data-a=add]').last().click(); await p.waitForTimeout(200);
  const f = s => p.locator('.pe ' + s);
  await f('[data-k=zh]').fill('番茄蛋汤'); await f('[data-k=en]').fill('Tomato Egg Soup'); await f('[data-k=p]').fill('a bowl of tomato egg soup'); await f('[data-k=price]').fill('30'); await f('[data-k=lv]').fill('1');
  await f('[data-ni="0"]').selectOption('tomato'); await f('[data-nadd]').click(); await f('[data-ni="1"]').selectOption('egg');
  await f('[data-se="0"]').fill('Cut the tomatoes.'); await f('[data-sz="0"]').fill('把番茄切开。'); await f('[data-sa="0"]').selectOption('cut'); await f('[data-si="0"]').selectOption('tomato');
  await f('[data-sadd]').click(); await f('[data-se="1"]').fill('Crack an egg into the soup.'); await f('[data-sz="1"]').fill('往汤里磕一个蛋。'); await f('[data-sa="1"]').selectOption('crack'); await f('[data-si="1"]').selectOption('egg');
  await f('[data-sadd]').click(); await f('[data-se="2"]').fill('Boil it for five minutes.'); await f('[data-sa="2"]').selectOption('boil');
  await p.screenshot({ path: OUT + '/c2-recipe-form.png' });
  await f('[data-a=ok]').click(); await p.waitForTimeout(300);
  const rid = await p.evaluate(() => RECIPES.find(r => r.en === 'Tomato Egg Soup').id);
  console.log('new recipe:', JSON.stringify(await p.evaluate(id => { const r = RECIPE[id]; return [r.zh, r.price, r.need, r.steps.map(s => s.v + '/' + s.act + '/' + (s.ing || '-')).join(' '), S.inv]; }, rid)));
  // 改自带的沙拉价格，再还原
  await p.locator('.layer [data-ed=salad]').click(); await p.waitForTimeout(150); await f('[data-k=price]').fill('99'); await f('[data-a=ok]').click(); await p.waitForTimeout(150);
  const s99 = await p.evaluate(() => RECIPE.salad.price); await p.locator('.layer [data-rst=salad]').click(); await p.waitForTimeout(150);
  console.log('salad price edited:', s99, '| restored:', await p.evaluate(() => RECIPE.salad.price));
  await clear();
  // 2. 去厨房做出来（游戏模式：每步点「做这一步」）
  await p.evaluate(() => go('kitchen')); await p.waitForTimeout(300);
  console.log('kitchen lists it:', await p.evaluate(id => !!document.querySelector(`#recipes [data-cook="${id}"]`), rid));
  await p.screenshot({ path: OUT + '/c3-kitchen.png' });
  await p.evaluate(id => startCook(id), rid); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/c4-cook.png' });
  for (let i = 0; i < 3; i++) { await p.locator('.layer [data-a=next]').click(); await p.waitForTimeout(1450); }
  console.log('cooked:', await p.evaluate(id => S.dishes.filter(d => d.id === id).length, rid), '| inv left', JSON.stringify(await p.evaluate(() => S.inv)));
  await clear();
  // 3. 新加一位客人（传图）、一句点菜的话
  await p.evaluate(() => openDev()); await p.waitForTimeout(200); await p.locator('[data-reg=critters]').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=add]').last().click(); await p.waitForTimeout(200);
  await f('[data-k=name]').fill('Lily'); await f('[data-k=zh]').fill('小狐狸'); await f('[data-k=ear]').selectOption('cat'); await f('[data-k=fur]').fill('#e8743a'); await f('[data-k=voice]').selectOption('am_puck');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), f('[data-pick=pic]').click()]); await fc.setFiles(GAME + '/art/skins/crop-pumpkin-spirit.png'); await p.waitForTimeout(1200);
  await f('[data-a=ok]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/c5-critters.png' });
  const kid = await p.evaluate(() => Object.keys(CRITTERS).find(w => CRITTERS[w].name === 'Lily'));
  console.log('new guest:', kid, JSON.stringify(await p.evaluate(w => [CRITTERS[w].zh, CRITTERS[w].voice, !!CRITTERS[w].pic], kid)));
  await clear(); await p.evaluate(() => openDev()); await p.waitForTimeout(200); await p.locator('[data-reg=talk]').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=add]').last().click(); await p.waitForTimeout(200);
  await f('[data-k=kind]').selectOption('order'); await f('[data-k=en]').fill('Yummy smell! One {p}, please!'); await f('[data-k=zh]').fill('好香！来一份{p}！');
  await f('[data-a=ok]').click(); await p.waitForTimeout(200);
  console.log('order lines:', await p.evaluate(() => T_ORDER.length), '| guest lines has it:', await p.evaluate(() => guestLines().includes('Yummy smell! One a bowl of tomato egg soup, please!')), '| voice content (puck):', await p.evaluate(w => voxContent().some(i => i.voice === 'am_puck' && /tomato egg soup/.test(i.text)), kid));
  // 4. 让其他客人先不来，新客人来点新菜
  await clear();
  await p.evaluate(() => { Object.keys(CRITTERS0).forEach(w => { GD().critters[w] = { ...(GD().critters[w] || {}), off: true }; }); applyGD(); S.cust = []; S.lv = 1; RECIPES.forEach(r => { if (r.lv <= 1 && !r.custom) GD().recipes[r.id] = { off: true }; }); applyGD(); spawnCustomer(); save(); });
  const cu = await p.evaluate(() => S.cust[0]); console.log('spawned:', JSON.stringify(cu));
  await p.evaluate(() => go('diner')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/c6-diner.png' });
  const c0 = await p.evaluate(() => S.coins); await p.evaluate(id => serve(id), cu.id); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/c7-serve.png' });
  for (let i = 0; i < 4 && await p.locator('.layer .fl-foot [data-a=n]').count(); i++) { await p.locator('.layer .fl-foot [data-a=n]').click(); await p.waitForTimeout(400); }
  console.log('served: coins +', await p.evaluate(c => S.coins - c, c0), '| dishes left', await p.evaluate(id => S.dishes.filter(d => d.id === id).length, rid));
  await clear();
  // 5. 存档重新打开：都还在
  await p.reload(); await p.waitForTimeout(1500);
  console.log('after reload:', JSON.stringify(await p.evaluate(([r, k]) => [!!RECIPE[r], !!CRITTERS[k], T_ORDER.some(t => t.en.startsWith('Yummy smell')), CRITTERS.mimi.off], [rid, kid])));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
