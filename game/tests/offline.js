const { chromium } = require('playwright');
const GAME = require('path').resolve(__dirname, '..'), OUT = process.argv[2] || require('os').tmpdir();   // 用法：node game/tests/<名字>.js 输出目录（run.sh 会帮你跑全部）

const { execSync } = require('child_process');
const wav = GAME + '/tests/fixtures/crack-two-eggs.wav', profile = OUT + '/profile-offline', shot = OUT + '/offline.png';
require('fs').rmSync(profile, { recursive: true, force: true });   // 每次从全新的浏览器开始
const URL0 = 'http://127.0.0.1:8765/game/index.html';
const launch = () => chromium.launchPersistentContext(profile, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['microphone'],
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] });
(async () => {
  // 第一次：联网打开，装好离线缓存，下载模型
  let ctx = await launch(), p = ctx.pages()[0] || await ctx.newPage();
  await p.goto(URL0); await p.waitForTimeout(1500);
  await p.waitForFunction(async () => { const ks = await (await caches.open('doudou-v18')).keys(); return ks.length >= 12; }, null, { timeout: 60000, polling: 500 });
  await p.evaluate(() => loadASR()); console.log('online: model', await p.evaluate(() => ASR.state), 'saved url', await p.evaluate(() => asrSaved()));
  await p.reload(); await p.waitForTimeout(2500);
  console.log('online: controlled by SW', await p.evaluate(() => !!navigator.serviceWorker.controller), 'cache entries', await p.evaluate(async () => (await (await caches.open('doudou-v18')).keys()).map(r => r.url.replace(/^.*\/game\//, '').slice(0, 40))));
  await ctx.close();
  // 关服务器 + 浏览器离线
  process.kill(+require('fs').readFileSync(OUT + '/http.pid', 'utf8').trim());   // 关掉本地服务器 = 断网
  ctx = await launch(); await ctx.setOffline(true); p = ctx.pages()[0] || await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL0); await p.waitForTimeout(3000);
  console.log('offline: farm image', await p.evaluate(() => FARM_IMG.complete && FARM_IMG.naturalWidth));
  console.log('offline: title', await p.title(), '| clips', await p.evaluate(() => Object.keys(window.VOICE_CLIPS || {}).length), '| font', await p.evaluate(() => document.fonts.check('20px "Jersey 10"')));
  await p.evaluate(() => practice([{ k: 'Crack two eggs into a bowl.', en: 'Crack two eggs into a bowl.', zh: '把两个鸡蛋磕进碗里。', v: 'Crack' }], '离线测试'));
  await p.waitForTimeout(500);
  await p.locator('.layer .mic').click();
  await p.waitForFunction(() => document.querySelector('.layer .sp-res').textContent.trim() || /没听到|出错|没准备好/.test(document.querySelector('.layer .sp-state').textContent), null, { timeout: 60000 });
  console.log('offline: ASR', await p.evaluate(() => ASR.state), '|', await p.locator('.layer .sp-state').textContent(), '|', await p.locator('.layer .sp-res').textContent());
  await p.screenshot({ path: shot });
  console.log('offline: errors', errs.length ? errs : 'none');
  await ctx.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
