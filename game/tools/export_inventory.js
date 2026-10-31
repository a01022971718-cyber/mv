// 从游戏里导出要合成的发音清单（voiceInventory()）和宽松识别用的词表，并重画主屏幕图标。
// 用法：node game/tools/export_inventory.js <输出目录>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(800);
  const inv = await p.evaluate(() => voiceInventory());
  const gram = await p.evaluate(() => JSON.parse(grammarJSON()));
  fs.mkdirSync(process.argv[2], { recursive: true }); fs.writeFileSync(process.argv[2] + '/inventory.json', JSON.stringify(inv, null, 1));
  fs.writeFileSync(process.argv[2] + '/grammar.json', JSON.stringify(gram, null, 1));
  // 主屏幕图标：豆豆放大到 192 / 512，像素不插值（写到 game/ 下）
  for (const size of [192, 512]) {
    const d = await p.evaluate(size => { const [c, g] = mk(size, size); g.fillStyle = '#9aca42'; g.fillRect(0, 0, size, size); const s = Math.floor(size / 28); const sp = ddSpr('farm', 0); g.imageSmoothingEnabled = false; g.fillStyle = '#76aa2a'; for (let y = 0; y < size; y += s * 2) for (let x = (y / (s * 2)) % 2 * s; x < size; x += s * 2) g.fillRect(x, y, s, s); g.drawImage(sp, Math.round((size - sp.width * s) / 2), Math.round((size - sp.height * s) / 2 + s), sp.width * s, sp.height * s); return c.toDataURL(); }, size);
    fs.writeFileSync(require('path').resolve(__dirname, `../icon-${size}.png`), Buffer.from(d.split(',')[1], 'base64'));
  }
  const cnt = inv.reduce((a, x) => { const k = x.key.startsWith('w|') ? 'word' : x.voice; a[k] = (a[k] || 0) + 1; return a; }, {});
  console.log('items', inv.length, JSON.stringify(cnt), 'grammar', gram.length, 'errors', errs.length ? errs : 'none');
  await b.close();
})();
