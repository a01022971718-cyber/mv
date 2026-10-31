"""物件融进场景：把装扮物件（稻草人、房子、喷泉、信箱）的暗部提亮、往场景的暖棕色靠，彩度略加。
为什么要做：底图最暗的地方也只有中等亮度（OKLab L≈0.62），AI 出的物件常有大片接近黑色的暗部和黑描边，
贴上去就像一块剪影，和画面「不是一张画」。亮部基本不动，越暗提得越多。
游戏里「上传装扮」用的是同一组数字（index.html 的 sceneGrade），两边要一起改。
用法：python3 game/tools/scene_grade.py 输入.png 输出.png   （一般不单独用，skin_prep.py 处理物件时会自动做）
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oklab import rgb_to_oklab, oklab_to_rgb
PIVOT, LIFT, TINT, CHROMA = .62, .5, .45, 1.15   # 比 PIVOT 暗的部分往上提 LIFT 倍的差距；越暗越往暖棕色 AT 靠
AT = (.035, .06)                                  # 暖棕色（OKLab 的 a、b）
def grade(rgb):
    lab = rgb_to_oklab(np.asarray(rgb, float)); L = lab[..., 0]
    d = np.clip(PIVOT - L, 0, None); w = d / PIVOT
    lab[..., 0] = L + LIFT * d
    for i, t in ((1, AT[0]), (2, AT[1])): c = lab[..., i] * CHROMA; lab[..., i] = c + (t - c) * w * TINT
    return oklab_to_rgb(lab)
if __name__ == '__main__':
    import cv2
    im = cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED); im[..., 2::-1] = np.round(grade(im[..., 2::-1])).astype(np.uint8)
    cv2.imwrite(sys.argv[2], im)
