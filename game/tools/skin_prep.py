"""把一张装扮素材处理成游戏用的样子（和游戏里「上传装扮」做的事一样）：
去掉 AI 去背景留下的半透明淡雾 → 裁掉四周空白 → 按装扮位的大小等比缩小 → 再收一次边 →（物件）融进场景 → 按色卡校色。
用法：python3 game/tools/skin_prep.py 原图.png 输出.png 最大宽 最大高 [prop]   （宽高是农场原画的像素，见 index.html 的 SKIN_SLOTS；
      稻草人、房子、喷泉、信箱这类物件加 prop，会做 scene_grade.py 的暗部提亮；作物不加）
"""
import cv2, numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import palette_check, scene_grade
def prep(src, dst, bw, bh, prop=False):
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3: im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    a = im[..., 3]; im[..., 3] = np.where(a >= 128, 255, 0)
    ys, xs = np.where(im[..., 3] > 0); im = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    s = min(1, bw / im.shape[1], bh / im.shape[0])
    im = cv2.resize(im, (max(1, round(im.shape[1] * s)), max(1, round(im.shape[0] * s))), interpolation=cv2.INTER_AREA)
    im[..., 3] = np.where(im[..., 3] >= 128, 255, 0)
    if prop: im[..., 2::-1] = np.round(scene_grade.grade(im[..., 2::-1])).astype(np.uint8)
    cv2.imwrite(dst, im)
    palette_check.main(dst, dst)
if __name__ == '__main__': prep(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), len(sys.argv) > 5 and sys.argv[5] == 'prop')
