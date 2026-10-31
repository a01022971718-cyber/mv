"""开垦地块的贴图：直接从农场原画的土垄上取——土的纹理、种植小坑都是原画里的像素，边缘按原画的像素块（4px）走。
用法：python3 game/tools/soil_tiles.py 原画.png 输出目录    → soil-wet.png（256×104，中心 (128,50)），干湿共用一张，缺水看头顶的气泡
"""
import cv2, numpy as np, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'src.png'; outdir = sys.argv[2] if len(sys.argv) > 2 else '.'
rng = np.random.default_rng(7)
im = cv2.imread(src).astype(np.float32)
hsv = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_BGR2HSV); H, S, V = [hsv[..., i].astype(int) for i in range(3)]
# 1. 土的纹理：土垄上整块都是土的 40×22 小方块，拼起来（不缩放，原画像素原样）
soil = ((H <= 22) & (S > 70) & (V > 62) & (V < 160)).astype(np.uint8); soil[:380] = 0; soil[700:] = 0; soil[:, :500] = 0; soil[:, 1250:] = 0
soil = cv2.erode(soil, np.ones((3, 3), np.uint8))
PW, PH = 40, 22; ii = cv2.integral(soil)
cands = [(x, y) for y in range(380, 700 - PH, 3) for x in range(500, 1250 - PW, 3) if ii[y + PH, x + PW] - ii[y, x + PW] - ii[y + PH, x] + ii[y, x] == PW * PH]
patches = [im[y:y + PH, x:x + PW] for x, y in cands[::max(1, len(cands) // 12)]]
TW, TH = 300, 140; tex = np.zeros((TH, TW, 3), np.float32); wsum = np.zeros((TH, TW, 1), np.float32)
ramp = np.minimum(1, np.minimum(np.arange(PW)[None, :] + 1, PW - np.arange(PW)[None, :]) / 7) * np.minimum(1, np.minimum(np.arange(PH)[:, None] + 1, PH - np.arange(PH)[:, None]) / 7)
for y in range(-8, TH, PH - 8):
    for x in range(-8, TW, PW - 8):
        p = patches[rng.integers(len(patches))]
        if rng.random() < .5: p = p[:, ::-1]
        x0, y0, x1, y1 = max(0, x), max(0, y), min(TW, x + PW), min(TH, y + PH)
        w = ramp[y0 - y:y1 - y, x0 - x:x1 - x, None]; tex[y0:y1, x0:x1] += p[y0 - y:y1 - y, x0 - x:x1 - x] * w; wsum[y0:y1, x0:x1] += w
tex /= np.maximum(wsum, 1e-3)
# 2. 形状：和草格同方向的平行四边形，比草格小一圈；边缘按 4px 像素块判断，带一点随机，像手画的
a, b = np.array([147., 64.]), np.array([168., -48.]); W, Hh, C, s, B = 256, 104, np.array([128., 50.]), .74, 4
P0 = C - (a + b) / 2 * s; Minv = np.linalg.inv(np.array([a * s, b * s]).T)
def uv(x, y): d = np.array([x - P0[0], y - P0[1]]); return Minv @ d
img = np.zeros((Hh, W, 4), np.float32)
img[..., :3] = tex[(np.arange(Hh)[:, None] + 18) % TH, (np.arange(W)[None, :] + 20) % TW]
la, lb = np.linalg.norm(a * s), np.linalg.norm(b * s)
dark = np.array([19., 37., 71.])     # 土垄边上那种深土色（BGR）
for by in range(0, Hh, B):
    for bx in range(0, W, B):
        u, v = uv(bx + B / 2, by + B / 2); j = (rng.random() - .5) * 2.2 / la
        if not (-j <= u <= 1 + j and -j * la / lb <= v <= 1 + j * la / lb): continue
        img[by:by + B, bx:bx + B, 3] = 255
        e_ul, e_ur, e_lr = u * la, (1 - v) * lb, (1 - u) * la
        if e_lr < B * 1.2: img[by:by + B, bx:bx + B, :3] = dark                     # 右下边：像土垄右端那道深边
        elif e_ul < B * 1.1 or e_ur < B * 1.1: img[by:by + B, bx:bx + B, :3] *= .8   # 上面两条边：草沿压下来的一点影子
# 3. 种植小坑：直接从原画土垄上第三个坑抠下来（只要坑本身的深色像素）
cut = im[536:584, 896:992]; lum = cut[..., 2] * .3 + cut[..., 1] * .59 + cut[..., 0] * .11
dk = (lum < 36).astype(np.uint8)                      # 坑里是近黑的深棕（亮度 20 左右），土是 60 左右
n_, lab = cv2.connectedComponents(dk); hm = lab == lab[558 - 536, 944 - 896]   # 只要坑中心所在的那一块
hm = cv2.dilate(hm.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)    # 带上一圈坑边的过渡色
ys, xs = np.where(hm); hy0, hx0 = ys.min(), xs.min(); hc = cut[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; hmc = hm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
oy, ox = int(C[1] + 6 - hc.shape[0] / 2), int(C[0] - hc.shape[1] / 2)
reg = img[oy:oy + hc.shape[0], ox:ox + hc.shape[1], :3]; reg[hmc] = hc[hmc]
out = np.clip(img, 0, 255).astype(np.uint8)
cv2.imwrite(f'{outdir}/soil-wet.png', out)
print('soil tile', out.shape, 'hole', hc.shape)
prev = np.full((Hh + 20, W + 20, 3), (96, 188, 140), np.uint8); al = out[..., 3:4] / 255
prev[10:10 + Hh, 10:10 + W] = (out[..., :3] * al + prev[10:10 + Hh, 10:10 + W] * (1 - al)).astype(np.uint8)
cv2.imwrite(f'{outdir}/soil_prev2.png', cv2.resize(prev, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST))
