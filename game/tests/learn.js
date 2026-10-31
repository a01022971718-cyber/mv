// 分级学习 + 美术体检 + 成就任务 + 自动备份
const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir(), fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.layer').forEach(l => l.remove()); S.intro = false; S.asrSkip = true; VOX.asked = true; MIC.blocked = true; S.coins = 50; refresh();
    window._ls = ''; const s0 = say; say = (t, o) => { window._ls = t; return s0(t, o); }; });
  // 1. 选级
  await p.locator('#tabs [data-v=words]').click(); await p.waitForTimeout(300);
  console.log('tab label:', (await p.locator('#tabs [data-v=words] span').textContent()));
  await p.screenshot({ path: OUT + '/l1-pick.png' });
  await p.locator('[data-start="1"]').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/l2-level.png' });
  console.log('units L1:', await p.locator('#learn [data-unit]').count(), '| unlocked', await p.evaluate(() => unlocked()));
  // 2. 学一课
  await p.locator('#learn [data-unit="animals"]').click(); await p.waitForTimeout(400);
  console.log('practice open:', await p.locator('.layer .speak').count() > 0, '| first item:', (await p.locator('.layer .sp-en').textContent()).trim());
  await p.locator('.layer [data-a=x]').click(); await p.waitForTimeout(200);
  // 3. 考试：全对
  const answer = async (right = true) => {
    for (let i = 0; i < 20; i++) {
      if (!(await p.locator('.ex-body .ex-opt').count())) break;
      const q = await p.locator('.ex-q').textContent(); const zh = (q.match(/「(.+)」/) || [])[1];
      const ans = zh ? await p.evaluate(z => courseItems().find(e => e.zh === z).en, zh) : await p.evaluate(() => window._ls);
      const opts = p.locator('.ex-opt'); const n = await opts.count(); let idx = 0;
      for (let j = 0; j < n; j++) { const t = (await opts.nth(j).textContent()).trim(); if ((t === ans) === right) { idx = j; break; } }
      await opts.nth(idx).click(); await p.waitForTimeout(60); await p.locator('.fl-foot [data-a=n]').click(); await p.waitForTimeout(80);
    }
  };
  await p.locator('#learn [data-a=exam]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/l3-exam.png' });
  await answer(true); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/l4-pass.png' });
  console.log('L1 exam:', (await p.locator('.ex-score').textContent()), '| passed', await p.evaluate(() => JSON.stringify(LRN().passed)), '| unlocked', await p.evaluate(() => unlocked()), '| coins', await p.evaluate(() => S.coins));
  await p.locator('.fl-foot [data-a=n]').click(); await p.waitForTimeout(300);
  // 4. 不及格
  await p.locator('#learn [data-a=exam]').click(); await p.waitForTimeout(300); await answer(false); await p.waitForTimeout(200);
  console.log('L2 exam (all wrong):', (await p.locator('.ex-score').textContent()), '| L2 passed?', await p.evaluate(() => !!LRN().passed[2]), '| wrong chips', await p.locator('.ex-wrong .chip').count());
  await p.locator('.fl-foot [data-a=n]').click(); await p.waitForTimeout(200);
  // 5. 自己加一课
  await p.locator('#learn [data-a=uadd]').click(); await p.waitForTimeout(200);
  await p.locator('.pe [data-k=zh]').fill('牧场动物'); await p.locator('.pe [data-k=words]').fill('goat = 山羊\nrabbit = 兔子'); await p.locator('.pe [data-k=sents]').fill('The goat eats grass. = 山羊吃草。');
  await p.locator('.pe [data-a=ok]').click(); await p.waitForTimeout(200);
  console.log('custom unit:', await p.evaluate(() => JSON.stringify((S.cfg.units || []).map(u => [u.lv, u.zh, u.words.length, u.sents.length]))), '| in grammar', await p.evaluate(() => grammarJSON().includes('the goat eats grass')));
  // 6. 复习（遗忘曲线）+ 连续打卡 + 任务
  await p.evaluate(() => { credit('cow', 90); credit('pig', 40); Object.values(S.cfg.srs).forEach(r => r.due = Date.now() - 1000); refresh(); renderWords(); });
  console.log('due:', await p.evaluate(() => dueItems().map(e => e.en).join(',')), '| streak', await p.evaluate(() => JSON.stringify(S.cfg.streak)), '| srs ivl cow/pig', await p.evaluate(() => [S.cfg.srs.cow.ivl, S.cfg.srs.pig.ivl]));
  // 7. 毕业
  await p.evaluate(() => { const l = LRN(); [2, 3, 4].forEach(n => { l.passed[n] = Date.now(); l.best[n] = 90; }); l.cur = 5; l.name = '小明'; save(); renderWords(); });
  await p.locator('#learn [data-a=exam]').click(); await p.waitForTimeout(300); await answer(true); await p.waitForTimeout(300);
  console.log('L5 exam:', (await p.locator('.ex-score').textContent()), '| btn', (await p.locator('.fl-foot [data-a=n]').textContent()));
  await p.locator('.fl-foot [data-a=n]').click(); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/l5-cert.png' });
  console.log('graduated:', await p.evaluate(() => !!LRN().grad), '| cert shown', await p.locator('.cert').count());
  await p.locator('.cert [data-a=x]').click(); await p.waitForTimeout(3500);
  console.log('achievements:', await p.evaluate(() => Object.keys(S.cfg.achv || {}).join(',')));
  await p.evaluate(() => { LVQ.length = 0; document.querySelectorAll('.layer').forEach(l => l.remove()); });   // 考试升了好几级，排队的升级弹窗先清掉
  await p.locator('#learn [data-a=achv]').click(); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/l6-achv.png' }); await p.locator('.layer [data-a=x]').last().click();
  // 8. 美术体检：上传一张很暗、贴边的图
  const dark = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 300, 300); g.fillStyle = '#141010'; g.fillRect(0, 40, 260, 260); g.fillStyle = '#e0a030'; g.fillRect(100, 120, 60, 60); return c.toDataURL('image/png').split(',')[1]; });
  fs.writeFileSync(OUT + '/dark.png', Buffer.from(dark, 'base64'));
  await p.evaluate(() => { LVQ.length = 0; document.querySelectorAll('.layer').forEach(l => l.remove()); go('farm'); }); await p.locator('#bSkin').click(); await p.waitForTimeout(300);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('[data-up="mailbox"]').click()]); await fc.setFiles(OUT + '/dark.png'); await p.waitForTimeout(1600);
  const rep = await p.locator('.art-rep li.bad').allTextContents(); console.log('art report warnings:', rep.map(t => t.replace(/^!/, '').slice(0, 14)).join(' | '));
  await p.screenshot({ path: OUT + '/l7-art.png' });
  await p.locator('.layer [data-a=card]').click(); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/l8-style.png' });
  console.log('style card prompt:', (await p.locator('.art-p').first().textContent()).slice(0, 20));
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  // 9. 备份：快照、重新开始、恢复
  await p.evaluate(async () => { await snapDaily(); });
  const before = await p.evaluate(() => [S.lv, S.coins, !!LRN().grad]);
  await p.locator('#bSet').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=reset]').click(); await p.locator('.layer [data-a=yes]').click(); await p.waitForTimeout(600);
  console.log('after reset:', await p.evaluate(() => [S.lv, S.coins, !!(S.cfg.learn && S.cfg.learn.grad)]), '| snaps', await p.evaluate(async () => (await snapList()).map(s => s.why).join(',')));
  await p.locator('#bSet').click(); await p.waitForTimeout(200); await p.locator('.layer [data-a=snaps]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/l9-snaps.png' });
  await p.locator('.snaps [data-snap^="before-reset"]').first().click(); await p.waitForTimeout(200); await p.locator('.layer .mp-opts [data-k=yes]').click(); await p.waitForTimeout(500);
  console.log('restored:', JSON.stringify(await p.evaluate(() => [S.lv, S.coins, !!LRN().grad])), 'expected', JSON.stringify(before));
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  // 10. 云备份（用假的 GitHub 接口测流程）
  const cloud = await p.evaluate(async () => {
    const store = {}; const f0 = window.fetch;
    window.fetch = async (u, o = {}) => { u = String(u); if (!u.startsWith('https://api.github.com')) return f0(u, o); const path = u.slice(22), json = d => new Response(JSON.stringify(d), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (path === '/user') return json({ login: 'tester' }); if (path.startsWith('/gists?')) return json(Object.values(store));
      if (path === '/gists' && o.method === 'POST') { const b = JSON.parse(o.body), id = 'g1'; store[id] = { id, description: b.description, files: Object.fromEntries(Object.entries(b.files).map(([k, v]) => [k, { content: v.content, truncated: false }])) }; return json(store[id]); }
      if (path.startsWith('/gists/')) { const id = path.slice(7); if (o.method === 'PATCH') { const b = JSON.parse(o.body); Object.entries(b.files).forEach(([k, v]) => store[id].files[k] = { content: v.content, truncated: false }); } return json(store[id]); }
      return new Response('{}', { status: 404 }); };
    localStorage.setItem('doudou-gh', 'ghp_test'); S.cfg.cloudTok = 1; await cloudPush(true); const gist = S.cfg.cloudGist, size = store.g1 && store.g1.files['doudou-backup.json'].content.length;
    S.coins = 1; save(); const r = await cloudPull(); return [gist, size > 1000, S.coins !== 1, r.save]; });
  console.log('cloud backup/restore:', JSON.stringify(cloud));
  // 11. 文件备份里带进度
  const dl = p.waitForEvent('download'); await p.evaluate(() => exportPack()); const d = await dl; await d.saveAs(OUT + '/backup.json');
  const pk = JSON.parse(fs.readFileSync(OUT + '/backup.json', 'utf8')); console.log('file backup has save:', !!pk.save, '| v', pk.v, '| lastExport set', await p.evaluate(() => !!S.cfg.lastExport));
  console.log('quests today:', await p.evaluate(() => { S.q = null; ensureQuests(); return S.q.list.map(q => q.id).join(','); }));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
