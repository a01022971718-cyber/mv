"""把游戏用到的字体内联进 index.html（/*FONTS:BEGIN*/ 与 /*FONTS:END*/ 之间）。

- 中文：Fusion Pixel 12px Proportional SC（OFL，保留字体名），只抽取 index.html 里出现过的字，
  按 OFL 要求改名为 "Doudou Pixel CJK"。
- 英文和数字：Jersey 10（OFL），原样内联。
改了游戏里的中文之后重新运行：python3 game/tools/build_fonts.py（需要 pip install fonttools brotli）
"""
import base64, io, os, re
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
PAGE = os.path.join(GAME, 'index.html')
SRC_CJK = os.path.join(GAME, 'vendor/fonts/fusion-pixel-12px-proportional-sc.woff2')
SRC_EN = os.path.join(GAME, 'vendor/fonts/jersey10-latin.woff2')
FAMILY = 'Doudou Pixel CJK'

html = open(PAGE, encoding='utf-8').read()
begin, end = '/*FONTS:BEGIN*/', '/*FONTS:END*/'
a, b = html.index(begin), html.index(end)
body = html[:a] + html[b:]
chars = set(body) | {chr(c) for c in range(0x20, 0x7f)} | set('，。、：；！？「」（）·…—～×÷％￥')
chars = {c for c in chars if ord(c) >= 0x20}

font = TTFont(SRC_CJK)
opts = Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
sub = Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(font)
for rec in font['name'].names:  # OFL 保留字体名：修改版必须改名
    if rec.nameID in (1, 3, 4, 6, 16, 17):
        old = rec.toUnicode()
        new = FAMILY if rec.nameID in (1, 16) else ('Regular' if rec.nameID in (2, 17) else re.sub(r'Fusion[ -]?Pixel[^,]*', FAMILY, old) if 'Fusion' in old else FAMILY)
        rec.string = new.replace(' ', '') if rec.nameID == 6 else new
buf = io.BytesIO(); font.flavor = 'woff2'; font.save(buf)
cjk = base64.b64encode(buf.getvalue()).decode()
en = base64.b64encode(open(SRC_EN, 'rb').read()).decode()
css = (begin + '\n'
       f"@font-face{{font-family:'Jersey 10';font-style:normal;font-weight:400;font-display:block;src:url(data:font/woff2;base64,{en}) format('woff2')}}\n"
       f"@font-face{{font-family:'{FAMILY}';font-style:normal;font-weight:400;font-display:block;src:url(data:font/woff2;base64,{cjk}) format('woff2')}}\n")
open(PAGE, 'w', encoding='utf-8').write(html[:a] + css + html[b:])
print(f'{len(chars)} chars, CJK subset {len(buf.getvalue())//1024} KB, Jersey {os.path.getsize(SRC_EN)//1024} KB')
