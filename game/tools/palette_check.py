"""检查一张素材和色卡差多远，需要的话按色卡校准。

用法：
  python3 game/tools/palette_check.py 素材.png              # 只检查：平均色差、偏离最多的颜色
  python3 game/tools/palette_check.py 素材.png 输出.png     # 检查并输出校准版（每个像素换成色卡里最近的颜色）
色差用 CIE Lab 距离：小于 8 基本看不出差别，8–15 能看出偏色，大于 15 明显不是一套颜色。
校准时最暗的像素（描边）统一换成「描边·暗部」组的暖深棕。
校准只适合角色、作物、道具这类单独的像素素材；整张手绘背景不要硬换，会出现一条条色带。
需要 opencv-python、numpy。
"""
import cv2, numpy as np, json, sys, os
PAL = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'art', 'palette', 'palette.json')))
hexs = [c for g in PAL['scene'] + PAL.get('ext', []) for c in g['colors']]
OUTLINE = [hexs.index(c) for c in PAL['scene'][0]['colors']]   # 描边·暗部 组
rgb = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in hexs], np.uint8)
tolab = lambda a: cv2.cvtColor((np.asarray(a, np.float32) / 255).reshape(-1, 1, 3)[..., ::-1], cv2.COLOR_BGR2LAB).reshape(-1, 3)
P = tolab(rgb)
def nearest(px_rgb):
    L = tolab(px_rgb); out = np.empty(len(L), int); dist = np.empty(len(L))
    for s in range(0, len(L), 200000):
        d = np.sqrt(((L[s:s + 200000, None] - P[None]) ** 2).sum(2)); out[s:s + 200000] = d.argmin(1); dist[s:s + 200000] = d.min(1)
    return out, dist, L[:, 0]
def main(src, dst=None):
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    if im.shape[2] == 3: im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    m = im[..., 3] > 0; px = im[m][:, :3][:, ::-1]
    idx, dist, lum = nearest(px)
    print(f'{os.path.basename(src)}：平均色差 {dist.mean():.1f}，中位 {np.median(dist):.1f}，明显偏色（>15）的像素 {np.mean(dist > 15) * 100:.1f}%')
    far = px[dist > 15] // 24 * 24 + 12
    if len(far):
        u, c = np.unique(far, axis=0, return_counts=True)
        print('偏离最多的颜色：' + ' '.join('#%02x%02x%02x' % tuple(x) for x, n in sorted(zip(u, c), key=lambda t: -t[1])[:8]))
    if dst:
        dark = lum < 22   # 最暗的像素（描边）按规矩换成暖深棕，不管它原来是黑还是深蓝
        Lo = P[OUTLINE]; idx[dark] = np.array(OUTLINE)[np.abs(lum[dark, None] - Lo[None, :, 0]).argmin(1)]
        out = im.copy(); q = out[m]; q[:, :3] = rgb[idx][:, ::-1]; out[m] = q
        cv2.imwrite(dst, out); print('校准版：', dst)
if __name__ == '__main__': main(*sys.argv[1:3])
