"""干净底图合成：把美术用 AI 去掉物件的那张图里补好的几块（稻草人、房子连护栏、喷泉、信箱）贴回原图，其余保留原图像素；颜色按天空、地面分开对齐。
路径写死在下面，换图时改路径。需要 opencv-contrib-python、numpy。
"""
"""干净底图 v2：稻草人、房子（连护栏）、喷泉、信箱的位置用美术交的图，其余保留原图像素；顺便量出每个物件在原图里的范围。"""
import cv2, numpy as np, json
new = cv2.imread('new.jpg').astype(np.float32); old = cv2.imread('/home/user/mv/game/art/src/farm-open.png').astype(np.float32)
H, W = old.shape[:2]
d = np.abs(cv2.GaussianBlur(new, (5, 5), 0) - cv2.GaussianBlur(old, (5, 5), 0)).max(2)
def region(poly=None, ell=None, box=None):
    r = np.zeros((H, W), np.uint8)
    if poly is not None: cv2.fillPoly(r, [np.array(poly, np.int32)], 1)
    if ell is not None: cv2.ellipse(r, ell[0], ell[1], 0, 0, 360, 1, -1)
    if box is not None: r[box[1]:box[3], box[0]:box[2]] = 1
    return r
R = {
  'scarecrow': region(ell=((1122, 388), (108, 170))),
  'house': region(poly=[(1255, 20), (2048, 20), (2048, 560), (1740, 560), (1700, 700), (1560, 760), (1255, 760)]),
  'fence': region(poly=[(1520, 670), (1760, 690), (2048, 770), (2048, 965), (1840, 955), (1520, 800)]),
  'fountain': region(ell=((1876, 650), (160, 105))),
  'mailbox': None,
}
masks, info = {}, {}
mb = np.zeros((H, W), np.uint8); cv2.ellipse(mb, (1697, 905), (72, 48), 0, 0, 360, 1, -1); mb[895:1100, 1628:1766] = 1; cv2.ellipse(mb, (1697, 1096), (74, 26), 0, 0, 360, 1, -1)   # 信箱：按它的轮廓，不按方框（方框会把整块沙地换掉）
for k, r in R.items():
    if r is None: masks[k] = mb; ys, xs = np.where(mb); info[k] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]; continue
    m = ((d > 28) & (r > 0)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = np.isin(lab, [i for i in range(1, n) if st[i][4] > 800]).astype(np.uint8)
    masks[k] = m; ys, xs = np.where(m); info[k] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
print(json.dumps(info))
m = np.zeros((H, W), np.uint8)
for k, v in masks.items():
    if k != 'mailbox': m |= v
cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE); m = np.zeros_like(m); cv2.drawContours(m, cnts, -1, 1, -1)
m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
yy = np.mgrid[0:H, 0:W][0]
def is_sky(img): b, g, r = img[..., 0], img[..., 1], img[..., 2]; return (b > r + 40) & (b > 150) & (yy < 360)
ring = (cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (81, 81))) > 0) & (m == 0)
adj = new.copy(); sky_new = is_sky(new); white = (new.min(2) > 185) & (yy < 360)
for cls_ring, cls_new in [(ring & is_sky(old) & is_sky(new), sky_new), (ring & ~is_sky(old) & (d < 45), ~sky_new)]:
    for c in range(3):
        a = new[..., c][cls_ring]; b = old[..., c][cls_ring]; k, t = np.linalg.lstsq(np.vstack([a, np.ones_like(a)]).T, b, rcond=None)[0]
        sel = cls_new & ~white; adj[..., c][sel] = np.clip(new[..., c][sel] * k + t, 0, 255)
alpha = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 7)[..., None]
mbm = cv2.dilate(masks['mailbox'], cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
for src, dst in [('/home/user/mv/game/art/src/farm-open.png', 'clean2-open.png'), ('/home/user/mv/game/art/src/farm-locked.png', 'clean2-locked.png')]:
    base = cv2.imread(src); out = np.clip(base.astype(np.float32) * (1 - alpha) + adj * alpha, 0, 255).astype(np.uint8)
    # 信箱：用美术图里那一块，但颜色只按信箱周围一小圈来对齐（大范围对齐时主要是草地，沙地会偏色）
    rg = (cv2.dilate(mbm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (71, 71))) > 0) & (mbm == 0)
    loc = new.copy()
    for c in range(3):
        aa = new[..., c][rg]; bb = base[..., c].astype(np.float32)[rg]; k, t = np.linalg.lstsq(np.vstack([aa, np.ones_like(aa)]).T, bb, rcond=None)[0]
        loc[..., c] = np.clip(new[..., c] * k + t, 0, 255)
    a2 = cv2.GaussianBlur(mbm.astype(np.float32), (0, 0), 6)[..., None]; out = np.clip(out * (1 - a2) + loc * a2, 0, 255).astype(np.uint8)
    cv2.imwrite(dst, out)
json.dump(info, open('objects.json', 'w'))
