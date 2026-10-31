"""农场底图（两种状态）→ 游戏用的图和地块坐标。
  locked.png：所有地都没开垦（草格）  →  art/farm.webp（底图）
  open.png  ：所有地都开垦好了（土）  →  art/farm-open.webp（只留菜地那一块，按地块裁出来叠在底图上）
用法：python3 game/tools/farm_plots.py locked.png open.png game/art
"""
import cv2, numpy as np, sys, json
lp, op, out = sys.argv[1:4]
L = cv2.imread(lp); O = cv2.imread(op)
assert L.shape == O.shape, '两张图尺寸必须一样'
# 1. 16 块地的中心：在开垦版里找土，按 4×4 网格做 k-means
hb = cv2.cvtColor(O, cv2.COLOR_BGR2HSV); H, S, V = [hb[..., i].astype(int) for i in range(3)]
soil = (H <= 25) & (S > 60) & (V < 120) & (V > 25); soil[:380] = 0; soil[1000:] = 0; soil[:, 1250:] = 0
ys, xs = np.where(soil); P = np.stack([xs, ys], 1).astype(float)
u0, v0 = np.array([-158., 58.]), np.array([129., 68.]); T0 = np.array([652., 500.])
c = np.array([T0 + i * u0 + j * v0 for i in range(4) for j in range(4)])
Minv = np.linalg.inv(np.array([u0, v0]).T); Q = P @ Minv.T
for it in range(20):
    d = ((Q[:, None, :] - (c @ Minv.T)[None]) ** 2).sum(2); a = d.argmin(1); keep = d[np.arange(len(a)), a] < .36
    c = np.array([P[(a == k) & keep].mean(0) for k in range(16)])
C = c.reshape(4, 4, 2)   # C[i, j]：i 往左下数，j 往右下数
# 2. 每块地的四个角：相邻 4 个中心的平均；边上的往外推（盖住土边上的草叶）
def F(s, t):   # 分数格坐标 → 图上坐标（双线性，超出范围就线性外推）
    i0, j0 = min(2, max(0, int(np.floor(s)))), min(2, max(0, int(np.floor(t)))); fs, ft = s - i0, t - j0
    return C[i0, j0] * (1 - fs) * (1 - ft) + C[i0 + 1, j0] * fs * (1 - ft) + C[i0, j0 + 1] * (1 - fs) * ft + C[i0 + 1, j0 + 1] * fs * ft
E = .58
lo = lambda k: -E if k == 0 else k - .5
hi = lambda k: 3 + E if k == 3 else k + .5
quads = [[F(lo(i), lo(j)), F(lo(i), hi(j)), F(hi(i), hi(j)), F(hi(i), lo(j))] for i in range(4) for j in range(4)]
# 3. 开垦版里多出来的那盆花：不是土的地方换回底图的像素（两张图除了地块应该完全一样）
O2 = O.copy(); y0, y1, x0, x1 = 680, 950, 20, 215
reg = O2[y0:y1, x0:x1]; s2 = soil[y0:y1, x0:x1]; reg[~s2] = L[y0:y1, x0:x1][~s2]
# 4. 只留菜地那一块
fx0, fy0, fx1, fy1 = 0, 380, 1260, 1000
cv2.imwrite(f'{out}/farm-open.webp', O2[fy0:fy1, fx0:fx1], [cv2.IMWRITE_WEBP_QUALITY, 95])
cv2.imwrite(f'{out}/farm.webp', L, [cv2.IMWRITE_WEBP_QUALITY, 95])
order = [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (0, 3), (1, 3), (2, 0), (2, 1), (2, 2), (2, 3), (3, 0), (3, 1), (3, 2), (3, 3)]   # 先开后排 6 块，再往前一块块开
res = {'open_offset': [fx0, fy0], 'plots': [{'c': [round(float(v)) for v in C[i, j]], 'q': [[round(float(x)) for x in p] for p in quads[i * 4 + j]]} for i, j in order]}
print(json.dumps(res))
