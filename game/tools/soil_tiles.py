import cv2, numpy as np
rng = np.random.default_rng(7)
im = cv2.imread('src.png').astype(np.float32)
hsv = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_BGR2HSV)
H, S, V = [hsv[..., i].astype(int) for i in range(3)]
a, b = np.array([147., 64.]), np.array([168., -48.])
c2 = np.array([[486, 483], [627, 541], [772, 601], [914, 661]], float)
strip = np.zeros(im.shape[:2], np.uint8)
L = c2[0] + b - (a + b) / 2; R = c2[3] + b + (a + b) / 2
strip[380:700, 500:1250] = 1
soil = ((H <= 22) & (S > 70) & (V > 62) & (V < 160)).astype(np.uint8) * strip
soil = cv2.erode(soil, np.ones((3, 3), np.uint8))
# 干净的土块：72×40 的窗口里全是土
PW, PH = 40, 22
ii = cv2.integral(soil)
cands = []
for y in range(380, 700 - PH, 3):
    for x in range(500, 1250 - PW, 3):
        if ii[y + PH, x + PW] - ii[y, x + PW] - ii[y + PH, x] + ii[y, x] == PW * PH: cands.append((x, y))
print('clean windows', len(cands))
patches = [im[y:y + PH, x:x + PW] for x, y in cands[::max(1, len(cands) // 12)]]
# 拼成一大块土（patch 之间 10px 线性融合）
TW, TH = 300, 140
tex = np.zeros((TH, TW, 3), np.float32); wsum = np.zeros((TH, TW, 1), np.float32)
ramp = np.minimum(1, np.minimum(np.arange(PW)[None, :] + 1, PW - np.arange(PW)[None, :]) / 7) * np.minimum(1, np.minimum(np.arange(PH)[:, None] + 1, PH - np.arange(PH)[:, None]) / 7)
for y in range(-8, TH, PH - 8):
    for x in range(-8, TW, PW - 8):
        p = patches[rng.integers(len(patches))]
        if rng.random() < .5: p = p[:, ::-1]
        x0, y0 = max(0, x), max(0, y); x1, y1 = min(TW, x + PW), min(TH, y + PH)
        sub = p[y0 - y:y1 - y, x0 - x:x1 - x]; w = ramp[y0 - y:y1 - y, x0 - x:x1 - x, None]
        tex[y0:y1, x0:x1] += sub * w; wsum[y0:y1, x0:x1] += w
tex /= np.maximum(wsum, 1e-3)
# 地块形状：和草格同方向的平行四边形，比草格小一圈，露出草边
W, Hh, C = 256, 104, np.array([128., 50.])
s = .74
P0 = C - (a + b) / 2 * s
poly = np.array([P0, P0 + a * s, P0 + (a + b) * s, P0 + b * s])
yy, xx = np.mgrid[0:Hh, 0:W].astype(np.float32) + .5
M = np.array([a * s, b * s]).T; Minv = np.linalg.inv(M)
uv = np.einsum('ij,jhw->ihw', Minv, np.stack([xx - P0[0], yy - P0[1]]))
u, v = uv[0], uv[1]
inside = (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1)
img = np.zeros((Hh, W, 4), np.float32)
img[..., :3] = tex[(np.arange(Hh)[:, None] + 18) % TH, (np.arange(W)[None, :] + 20) % TW]
# 上面两条边（u≈0 左上、v≈1 右上）：草的阴影压在土上；外圈一道深色土边
du = u * np.linalg.norm(a * s); dv = (1 - v) * np.linalg.norm(b * s); dl = (1 - u) * np.linalg.norm(a * s); dd = v * np.linalg.norm(b * s)
edge_top = np.minimum(du, dv); edge_bot = np.minimum(dl, dd); edge = np.minimum(edge_top, edge_bot)
shade = np.clip(1 - (7 - edge_top) / 7 * .45, .55, 1)[..., None]
img[..., :3] *= shade
rim = (edge < 2.2)[..., None]
img[..., :3] = np.where(rim, img[..., :3] * .55, img[..., :3])
img[..., 3] = inside * 255
# 种植小坑：照图里土垄上的坑画——深棕近黑的椭圆，按 4px 一格取样，边缘有像素台阶；上沿更暗，下沿一道亮一点的土唇
hx0, hy0, rx, ry, B4 = C[0], C[1] + 6, 31, 12.5, 4
alpha = np.zeros((Hh, W, 1), np.float32)
for by in range(int(hy0 - ry - B4), int(hy0 + ry + B4 * 2), B4):
    for bx in range(int(hx0 - rx - B4), int(hx0 + rx + B4), B4):
        cx_, cy_ = bx + B4 / 2, by + B4 / 2
        d = ((cx_ - hx0) / rx) ** 2 + ((cy_ - hy0) / ry) ** 2
        lip = ((cx_ - hx0) / (rx + 2)) ** 2 + ((cy_ - hy0 - 4) / (ry + 1)) ** 2
        if d <= 1:
            col = (8, 13, 26) if cy_ < hy0 - ry * .35 else (12, 20, 38)     # BGR
            img[by:by + B4, bx:bx + B4, :3] = col; alpha[by:by + B4, bx:bx + B4] = 1
        elif lip <= 1 and cy_ > hy0:
            img[by:by + B4, bx:bx + B4, :3] = img[by:by + B4, bx:bx + B4, :3] * .55 + np.array((44, 80, 122)) * .45
# 下面两条边：草叶压在土上（颜色取自图里土垄边上的草）
G = [np.array(c, float)[::-1] for c in [(170, 222, 82), (124, 196, 58), (78, 150, 44), (44, 104, 38)]]
edge_pts = [(P0 + a * s * t) for t in np.linspace(.03, .97, 26)] + [(P0 + a * s + b * s * t) for t in np.linspace(.03, .97, 26)]
for i, (px, py) in enumerate(edge_pts):
    if rng.random() < .35: continue
    hgt = rng.integers(5, 11); lean = rng.integers(-3, 4); base = rng.integers(2, 4)
    for k in range(hgt):
        t = k / hgt; x = px + lean * t; y = py + 2 - k
        wdt = max(1, round(base * (1 - t)))
        for dx in range(-wdt, wdt + 1):
            X, Y = int(round(x + dx)), int(round(y))
            if 0 <= X < W and 0 <= Y < Hh:
                col = G[3] if (dx == -wdt or dx == wdt) and wdt > 0 else (G[0] if t > .7 else G[1] if dx < 0 else G[2])
                img[Y, X, :3] = col; img[Y, X, 3] = 255
wet = img.copy()
dry = img.copy(); soilpx = (dry[..., 3] > 0) & (np.abs(dry[..., 0] - dry[..., 2]) > 10) & (dry[..., :3].mean(axis=2) > 40) & (alpha[..., 0] == 0)
dusty = np.array([92, 128, 170], float)   # BGR：泛白的干土
dry[..., :3] = np.where(soilpx[..., None], dry[..., :3] * .62 + dusty * .38, dry[..., :3])
for name, arr in [('soil-wet.png', wet), ('soil-dry.png', dry)]:
    cv2.imwrite(name, np.clip(arr, 0, 255).astype(np.uint8))
prev = np.full((Hh * 2 + 10, W, 3), (90, 200, 150), np.uint8)
for k, arr in enumerate([wet, dry]):
    al = arr[..., 3:4] / 255; prev[k * (Hh + 10):k * (Hh + 10) + Hh] = (arr[..., :3] * al + prev[k * (Hh + 10):k * (Hh + 10) + Hh] * (1 - al)).astype(np.uint8)
cv2.imwrite('soil_prev.png', cv2.resize(prev, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST))
