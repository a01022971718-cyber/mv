// 画色卡图：node game/tools/palette_card.js → art/palette/palette-card.png（带色号）和 palette-ref.png（只有色块，给 AI 当参考图）
const { chromium } = require('playwright');
const P = require(require('path').resolve(__dirname, '../art/palette/palette.json'));
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const fg = h => lum(h) > .23 ? '#2d211c' : '#fbefe6';
const sw = (h, label) => `<div class="c" style="background:${h};color:${fg(h)}">${label ? `<i>${label}</i>` : ''}<span>${h}</span></div>`;
const html = `<html><head><meta charset="utf-8"><style>
body{margin:0;background:#faf3ca;font-family:"WenQuanYi Zen Hei",sans-serif;color:#2d211c;width:1500px}
.wrap{padding:30px 36px}h1{margin:0;font-size:34px}.sub{color:#6f584c;font-size:16px;margin:6px 0 4px}
h2{font-size:22px;margin:26px 0 10px;padding-bottom:6px;border-bottom:4px solid #2d211c}
.grid{display:grid;grid-template-columns:230px repeat(8,1fr);gap:6px;align-items:stretch}
.hd{font-size:14px;color:#6f584c;text-align:center;align-self:end}.hd b{display:block;font-size:18px;color:#2d211c}
.lab{display:flex;flex-direction:column;justify-content:center}.lab b{font-size:18px}.lab span{font-size:12.5px;color:#6f584c;line-height:1.35}
.c{height:58px;border:3px solid #2d211c;position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;font:14px/1 ui-monospace,monospace}
.c i{position:absolute;left:6px;top:5px;font:13px "WenQuanYi Zen Hei";font-style:normal}
.tok{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.t{display:flex;gap:10px;align-items:center;background:#fff9e3;border:3px solid #2d211c;padding:6px}
.t .s{width:64px;height:48px;border:3px solid #2d211c;flex:none;display:flex;align-items:center;justify-content:center;font-size:15px}.t b{font-size:16px}.t span{display:block;font-size:12.5px;color:#6f584c}.t em{font-style:normal;font-size:12.5px;color:#2d211c}
.mat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 22px}.m{display:flex;align-items:center;gap:8px}.m b{width:80px;font-size:16px;flex:none}.m .d{width:30px;height:30px;border:2px solid #2d211c}
ol,ul{margin:4px 0 0;padding-left:24px;font-size:16px;line-height:1.75}
</style></head><body><div class="wrap">
<h1>${P.name}</h1><div class="sub">${P.source}。</div>
<h2>色阶（16 组 × 8 级，1 最暗 → 8 最亮）</h2>
<div class="grid"><div></div>${P.L.map((l, i) => `<div class="hd"><b>${i + 1}</b>明度 ${l}</div>`).join('')}
${P.ramps.map(r => `<div class="lab"><b>${r.name}</b><span>${r.use}</span></div>${r.colors.map(c => sw(c)).join('')}`).join('')}</div>
<h2>界面用色（引用上面的色阶；对比度是文字和底色的比值，标准 ≥ 4.5）</h2>
<div class="tok">${P.ui.map(t => `<div class="t"><div class="s" style="background:${t.hex};color:${t.on ? '#2d211c' : fg(t.hex)}">${t.on ? 'Aa字' : ''}</div><div><b>${t.name}</b> <em>${t.ref} ${t.hex}</em><span>${t.use}${t.contrast ? ` · 对比度 ${t.contrast}` : ''}</span></div></div>`).join('')}</div>
<h2>游戏画面用色</h2>
<div class="tok">${P.game.map(t => `<div class="t"><div class="s" style="background:${t.hex}"></div><div><b>${t.name}</b> <em>${t.ref} ${t.hex}</em><span>${t.use}</span></div></div>`).join('')}</div>
<h2>物件用哪几级（画新素材照着选）</h2>
<div class="mat">${P.materials.map(m => `<div class="m"><b>${m.obj}</b>${m.hex.map((h, i) => `<div class="d" title="${m.refs[i]}" style="background:${h}"></div>`).join('')}</div>`).join('')}</div>
<h2>用色规矩</h2><ul>${P.rules.map(r => `<li>${r}</li>`).join('')}</ul>
<h2>比上一版补齐了什么</h2><ol>${P.gaps.map(r => `<li>${r}</li>`).join('')}</ol>
</div></body></html>`;
const ref = `<html><body style="margin:0;background:#faf3ca;width:900px"><div style="padding:14px;display:flex;flex-direction:column;gap:6px">${P.ramps.map(r => `<div style="display:flex;gap:6px">${r.colors.map(c => `<div style="width:104px;height:40px;background:${c}"></div>`).join('')}</div>`).join('')}</div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
  await p.setViewportSize({ width: 1500, height: 800 }); await p.setContent(html); await p.screenshot({ path: require('path').resolve(__dirname, '../art/palette') + '/palette-card.png', fullPage: true });
  await p.setViewportSize({ width: 900, height: 400 }); await p.setContent(ref); await p.screenshot({ path: require('path').resolve(__dirname, '../art/palette') + '/palette-ref.png', fullPage: true });
  await b.close();
})();
