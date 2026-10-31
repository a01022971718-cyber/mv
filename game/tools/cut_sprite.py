"""把作者画的白底角色/作物图抠成透明 PNG，缩到农场原画的比例（原画像素 ÷ 6 = 游戏逻辑像素）。

用法：python3 game/tools/cut_sprite.py 原图.png 输出.png 目标高度（原画像素，比如作物 150–200）
需要 opencv-python、numpy。
"""
import cv2, numpy as np, sys
def cut(src, out, target_h):
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 4: im = cv2.cvtColor(im, cv2.COLOR_BGRA2BGR)
    h, w = im.shape[:2]
    white = (im.min(axis=2) > 226).astype(np.uint8)        # 接近白的像素
    # 从四周往里灌：只有和边缘连通的白才算背景（叶子里的浅色不会被抠掉）
    mask = np.zeros((h + 2, w + 2), np.uint8); bg = np.zeros((h, w), np.uint8)
    flood = white.copy() * 255
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if flood[y, x] == 255: cv2.floodFill(flood, mask, (x, y), 128)
    bg = (flood == 128).astype(np.uint8)
    bg = cv2.dilate(bg, np.ones((3, 3), np.uint8))          # 去掉一圈发白的毛边
    alpha = (1 - bg) * 255
    ys, xs = np.where(alpha > 0); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([im, alpha])[y0:y1, x0:x1]
    s = target_h / rgba.shape[0]
    small = cv2.resize(rgba, (max(1, round(rgba.shape[1] * s)), target_h), interpolation=cv2.INTER_AREA)
    small[..., 3] = np.where(small[..., 3] > 140, 255, 0)    # 边缘不要半透明，保持像素画的硬边
    cv2.imwrite(out, small)
    print(out, 'content', (x1 - x0, y1 - y0), '->', small.shape[1], 'x', small.shape[0])
if __name__ == '__main__':
    cut(sys.argv[1], sys.argv[2], int(sys.argv[3]))   # 精灵芽：art/src/sprout.png → art/crop-sprout.png 150；蓝铃花：art/src/bluebell.png → art/crop-bluebell.png 200
