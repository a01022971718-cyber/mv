"""把一张底图做成游戏自带的主题底图，并检查菜地对不对得上。
用法（在仓库根目录）：
  python3 game/tools/bg_theme.py 美术交的底图.png halloween      → game/art/themes/halloween.webp + 对齐检查图
做的事：铺满 2048×1152（多的裁掉）→ 存 webp → 把游戏里 16 块地的框画在图上（…-check.jpg），看框和土地是不是重合。
不重合：在 index.html 的 BGS0 里给这张底图写 fq（菜地四个角：上、右、下、左），或者在游戏里「装扮 → 对齐菜地」拖好以后，
把设置里导出的素材包里 bgs.<id>.fq 抄过来。可点的东西（spots）同理：游戏里框好，再抄进 BGS0。
"""
import sys, os, re, json, cv2, numpy as np
src, name = sys.argv[1], sys.argv[2]
GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = cv2.imread(src); H, W = 1152, 2048; s = max(W / im.shape[1], H / im.shape[0])
im = cv2.resize(im, (round(im.shape[1] * s), round(im.shape[0] * s)), interpolation=cv2.INTER_AREA)
y0, x0 = (im.shape[0] - H) // 2, (im.shape[1] - W) // 2; im = im[y0:y0 + H, x0:x0 + W]
os.makedirs(f'{GAME}/art/themes', exist_ok=True); out = f'{GAME}/art/themes/{name}.webp'
cv2.imwrite(out, im, [cv2.IMWRITE_WEBP_QUALITY, 90]); print('底图：', out, os.path.getsize(out) // 1024, 'KB')
html = open(f'{GAME}/index.html', encoding='utf-8').read()
Q = json.loads(re.search(r'const PLOT_QUAD = (\[.*?\]);\n', html).group(1))
chk = im.copy()
for k, q in enumerate(Q):
    cv2.polylines(chk, [np.array(q, np.int32)], True, (0, 255, 255), 3); c = np.mean(q, 0).astype(int); cv2.putText(chk, str(k), tuple(c), 0, 1, (255, 255, 255), 2)
cp = out.replace('.webp', '-check.jpg'); cv2.imwrite(cp, cv2.resize(chk, None, fx=.5, fy=.5), [cv2.IMWRITE_JPEG_QUALITY, 85]); print('对齐检查图（不用提交）：', cp)
