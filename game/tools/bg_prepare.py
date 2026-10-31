"""美术交的干净底图（全开垦）→ 游戏用的两张底图：补右边接缝 → 拼「没开垦」版（原图 art/src/farm-locked.png 的草格菜地贴进来，颜色对齐）→ 两张一起提亮。
用法：python3 game/tools/bg_prepare.py 干净底图.jpg 输出-全开垦.png 输出-没开垦.png，再用 farm_plots.py 生成 art/farm*.webp 和地块坐标。
"""
import cv2, numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art', 'src')
import grade_bg
new = cv2.imread(sys.argv[1]).astype(np.float32); H, W = new.shape[:2]
# 1. 右边接缝：最右边 32 像素换成它左边 32 像素的镜像，边上羽化
x0 = W - 32; strip = new[:, x0 - 32:x0][:, ::-1]
a = np.clip((np.arange(32) - 4) / 12, 0, 1)[None, :, None]
new[250:1000, x0:] = new[250:1000, x0:] * (1 - a) + strip[250:1000] * a
# 2. 没开垦版：原图里「没开垦」和「全开垦」两张不一样的地方就是菜地，把这块原图的草格贴进来
lock0 = cv2.imread(os.path.join(SRC, 'farm-locked.png')).astype(np.float32); open0 = cv2.imread(os.path.join(SRC, 'farm-open.png')).astype(np.float32)
diff = np.abs(cv2.GaussianBlur(lock0, (5, 5), 0) - cv2.GaussianBlur(open0, (5, 5), 0)).max(2)
m = (diff > 30).astype(np.uint8); m[:300] = 0; m[:, 1250:] = 0
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
n, lab, st, _ = cv2.connectedComponentsWithStats(m); m = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE); m = np.zeros_like(m); cv2.drawContours(m, cnts, -1, 1, -1)
m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
ring = (cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61))) > 0) & (m == 0)
adj = lock0.copy()
for c in range(3):
    aa = lock0[..., c][ring]; bb = new[..., c][ring]; k, t = np.linalg.lstsq(np.vstack([aa, np.ones_like(aa)]).T, bb, rcond=None)[0]
    adj[..., c] = np.clip(lock0[..., c] * k + t, 0, 255)
al = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 4)[..., None]
locked = new * (1 - al) + adj * al
# 3. 提亮：暗部不动，中间调和亮部提亮；这张本来就很鲜艳，彩度不再加
grade_bg.CHROMA = 1.0
for img, name in [(new, sys.argv[2]), (locked, sys.argv[3])]:
    g = grade_bg.grade(np.clip(img, 0, 255)[..., ::-1]); cv2.imwrite(name, np.round(g).astype(np.uint8)[..., ::-1])
print('field mask px', int(m.sum()))
