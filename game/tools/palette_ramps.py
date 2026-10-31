"""用法：python3 game/tools/palette_ramps.py ramps.json   （生成色阶；界面用色、物件对照、规矩写在 art/palette/palette.json 里，改了色阶要同步更新那里的 hex）

专业色卡 v2：16 组 × 8 级。
- 统一明度阶（OKLab L）：每组第 n 级明度相同，换色不乱明暗
- 色相偏移：亮部往黄（100°）偏、暗部往蓝紫（300°）偏
- 彩度曲线：中间几级最饱和，两头收；超出 sRGB 的按色相不变往里收
- 基准色相、彩度取自高清重绘参考图（target.png）的聚类结果
"""
import numpy as np, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oklab import *
LSTEP = [0.26, 0.37, 0.48, 0.59, 0.70, 0.80, 0.89, 0.96]   # 亮部给 3 级：参考图的主体颜色都在 0.8–0.93
CCURVE = [0.50, 0.70, 0.88, 1.00, 1.06, 1.02, 0.82, 0.45]   # 彩度峰值放在偏亮的第 5–6 级（高调、明快）
SHIFT = [-15, -10, -5, 0, 3, 6, 9, 12]          # 负 = 往 300° 偏（暗部），正 = 往 100° 偏（亮部）
RAMPS = [  # id, 名字, 用在哪, 基准色相, 基准彩度, 色相偏移倍数, 参考图里的来源
  ('ink',    '暖灰·墨',   '描边（第 1 级）、阴影、文字、奶油白高光（第 7 级）', 52, 0.040, .6, '#502b16 / #281a12 / #f7e4b7'),
  ('stone',  '冷灰',      '石头、金属、铲子、云的暗部',                       235, 0.035, .6, '#5c8f9b'),
  ('soil',   '泥土',      '菜地、土路、坑',                                   45, 0.080, 1, '#502b16 / #6e380e'),
  ('wood',   '木头',      '栅栏、树干、木牌、篮子、界面木框',                  58, 0.120, 1, '#905216 / #ae6a21'),
  ('skin',   '肤色·桃',   '角色皮肤、腮红、饼干、桃子',                       50, 0.100, 1, '#f3a97c'),
  ('red',    '红',        '草莓、番茄、屋顶、蘑菇、危险提示',                  29, 0.190, 1, '#da4739 / #8b1712'),
  ('orange', '橙',        '胡萝卜、南瓜、稻草人头发、警告提示',                52, 0.170, 1, '#f3a97c / #c7822f（补）'),
  ('gold',   '金黄',      '星星、金币、玉米、稻草、主按钮',                    84, 0.170, 1, '#f1ab33 / #fcdc37'),
  ('sand',   '沙土·奶油', '小路、沙地、奶油、面板底色',                        90, 0.120, 1, '#fddb79 / #f7d37a'),
  ('lime',   '草绿',      '草坪、草格、嫩叶、成功提示',                       128, 0.200, 1, '#93d839 / #a2e844'),
  ('green',  '叶绿',      '树冠、灌木、深色叶子',                             146, 0.175, 1, '#41aa34 / #209043'),
  ('teal',   '青绿',      '树叶背光面、远山、薄荷',                           172, 0.130, 1, '#0fa588 / #6dd2be'),
  ('sky',    '天蓝',      '天空、海、喷泉、信息提示',                         226, 0.155, 1, '#05bdfd / #20d4fd'),
  ('blue',   '蓝',        '深水、夜空、次要按钮、牛仔布',                     268, 0.190, 1, '#4d5ae7 / #4149a9'),
  ('purple', '紫',        '蓝铃花、洋葱、精灵 Swirl、魔法（补）',             305, 0.175, 1, '#d48df2'),
  ('pink',   '粉',        '樱花、花朵、腮红、果实高光（补）',                 352, 0.160, 1, '樱花树（补）'),
]
def hue_toward(h, target, amt):
    d = ((target - h + 180) % 360) - 180
    return (h + np.sign(d) * min(abs(amt), abs(d))) % 360
out = []
for rid, name, use, h0, c0, sk, src in RAMPS:
    cols = []
    for i, L in enumerate(LSTEP):
        s = SHIFT[i] * sk
        h = hue_toward(h0, 300, -s) if s < 0 else hue_toward(h0, 100, s)
        C = gamut_clip(L, c0 * CCURVE[i], h)
        cols.append(rgbhex(oklab_to_rgb(from_lch(np.array(L), np.array(C), np.array(h)))))
    out.append({'id': rid, 'name': name, 'use': use, 'src': src, 'hue': h0, 'chroma': c0, 'colors': cols})
json.dump({'L': LSTEP, 'ramps': out}, open(sys.argv[1] if len(sys.argv) > 1 else 'ramps.json', 'w'), ensure_ascii=False, indent=1)
for r in out: print(f"{r['name']:6s}", ' '.join(r['colors']))
allc = np.array([hexrgb(c) for r in out for c in r['colors']])
o = lch(rgb_to_oklab(allc)); hi = o[o[:, 0] >= .74]; print(f'亮部（L≥0.74）彩度中位 {np.median(hi[:,1]):.3f}')
print(f'新色卡 明度中位 {np.median(o[:,0]):.3f}  彩度中位 {np.median(o[:,1]):.3f}  P90 {np.percentile(o[:,1],90):.3f}  共 {len(allc)} 色')
