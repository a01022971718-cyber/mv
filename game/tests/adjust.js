const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: false })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/game/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('.layer').forEach(l => l.remove()));
  console.log('defaults:', await p.evaluate(() => [skinOn('scarecrow'), skinOn('house'), skinOn('fountain'), skinOn('mailbox')]));
  await p.locator('#bSkin').click(); await p.waitForTimeout(300);
  console.log('first tiles:', await p.evaluate(() => [...document.querySelectorAll('.layer .skrow')].slice(0, 4).map(r => r.querySelector('.skh b').textContent + ':' + [...r.querySelectorAll('.skt span')].map(s => s.textContent).join('/')).join(' | ')));
  // 调整稻草人位置
  await p.locator('.layer [data-adj="scarecrow"]').click(); await p.waitForTimeout(300);
  console.log('adjust bar:', await p.locator('#adjBar').isVisible(), (await p.locator('#adjBar').textContent()).trim());
  const box = await p.evaluate(() => { const b = skinBounds(SLOT.scarecrow, skinOn('scarecrow')), r = farmCv.getBoundingClientRect(); return [r.left + (b.cx + FARM.ox) * r.width / FARM.w, r.top + (b.y + b.h / 2) * r.height / FARM.h]; });
  await p.mouse.move(box[0], box[1]); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(box[0] - i * 5, box[1] + i * 3); await p.mouse.up(); await p.waitForTimeout(200);
  await p.locator('#adjBar [data-k="+"]').click(); await p.locator('#adjBar [data-k="+"]').click(); await p.waitForTimeout(200);
  await p.locator('#v-farm .scene').screenshot({ path: OUT + '/adjusting.png' });
  console.log('pos after drag + 2x 放大:', JSON.stringify(await p.evaluate(() => S.cfg.skinPos)), '| cam', await p.evaluate(() => FARM.cam));
  await p.locator('#adjBar [data-k="ok"]').click(); await p.waitForTimeout(200);
  console.log('done: bar hidden', await p.locator('#adjBar').isHidden(), '| adjust off', await p.evaluate(() => !FARM.adjust));
  // 把喷泉设成「不放」以外…喷泉没有装扮，选房子「不放」试试
  await p.locator('#bSkin').click(); await p.waitForTimeout(200); await p.locator('.layer .skt[data-slot="house"][data-skin="none"]').click(); await p.waitForTimeout(150);
  console.log('house none ->', await p.evaluate(() => skinOn('house')));
  await p.locator('.layer .skt[data-slot="house"][data-skin="halloween"]').click(); await p.locator('.layer [data-a=x]').last().click();
  await p.reload(); await p.waitForTimeout(1500);
  console.log('after reload pos kept:', JSON.stringify(await p.evaluate(() => S.cfg.skinPos)), '| house', await p.evaluate(() => skinOn('house')));
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
