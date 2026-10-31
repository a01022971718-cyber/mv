const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // 1. 旧版本：玩一会儿，升到 Lv5，拿到它的存档
  // 旧版本：从 git 里取第一版带录音的游戏（1ae01f8），放到输出目录里打开
  const fs = require('fs'), dir = OUT + '/oldver'; fs.mkdirSync(dir, { recursive: true });
  for (const f of ['index.html', 'voice.js']) fs.writeFileSync(dir + '/' + f, require('child_process').execSync(`git -C "${GAME}" show 1ae01f8:game/${f}`, { maxBuffer: 64 << 20 }));
  await p.goto('file://' + dir + '/index.html'); await p.waitForTimeout(1200);
  const old = await p.evaluate(() => { S.lv = 5; S.xp = 290; S.coins = 40; S.stats.spoken = 23; S.words = { tomato: 92, 'Wash the lettuce.': 80 }; save(); return localStorage.getItem('doudou-farm-kitchen-v1'); });
  console.log('old save keys', Object.keys(JSON.parse(old)).join(','), '| plots', JSON.parse(old).plots.length);
  // 2. 新版本：同一个存档
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('new: ' + e.message));
  await p2.goto('file://' + GAME + '/index.html'); await p2.waitForTimeout(300);
  await p2.evaluate(o => { localStorage.setItem('doudou-farm-kitchen-v1', o); }, old); await p2.reload(); await p2.waitForTimeout(1500);
  console.log('new loads old save:', await p2.evaluate(() => [S.lv, S.xp, S.coins, S.plots.length, S.plots.filter(x => x.open).length, Object.keys(S.words).length, $('#lvText').textContent]));
  // 3. 存档码来回
  const rt = await p2.evaluate(() => { const c = encodeSave(S), d = decodeSave('随便一段话 ' + c + ' 结尾'); return [c.slice(0, 12), c.length, JSON.stringify(d) === JSON.stringify(S), decodeSave('DOUDOU1.abc'), decodeSave('hello')]; });
  console.log('code roundtrip:', rt);
  // 4. 设置界面：复制 / 粘贴存档码
  await p2.locator('#bSet').click(); await p2.waitForTimeout(200);
  console.log('version line:', (await p2.locator('.layer .li').last().textContent()).replace(/\s+/g, ' ').trim());
  await p2.locator('.layer [data-a=code-out]').click(); await p2.waitForTimeout(200);
  const code = await p2.locator('.layer textarea').last().inputValue(); console.log('export box:', code.slice(0, 20), '| info:', await p2.locator('.layer [data-info]').last().textContent());
  await p2.locator('.layer [data-a=x]').last().click(); await p2.waitForTimeout(150);
  // 换成一份新游戏，再把存档码贴回去
  await p2.evaluate(() => { localStorage.removeItem('doudou-farm-kitchen-v1'); }); await p2.reload(); await p2.waitForTimeout(1200);
  console.log('fresh game lv', await p2.evaluate(() => S.lv));
  await p2.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  await p2.locator('#bSet').click(); await p2.waitForTimeout(200); await p2.locator('.layer [data-a=code-in]').click(); await p2.waitForTimeout(200);
  await p2.locator('.layer textarea').last().fill('垃圾'); await p2.locator('.layer [data-a=imp]').last().click(); console.log('bad code:', await p2.locator('.layer [data-info]').last().textContent());
  await p2.locator('.layer textarea').last().fill(code); await p2.locator('.layer [data-a=imp]').last().click(); console.log('confirm:', await p2.locator('.layer [data-info]').last().textContent());
  await Promise.all([p2.waitForNavigation(), p2.locator('.layer [data-a=imp]').last().click()]); await p2.waitForTimeout(1200);
  console.log('after import:', await p2.evaluate(() => [S.lv, S.coins, S.stats.spoken, S.plots.length]));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
