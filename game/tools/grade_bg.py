"""底图调色：暗部（描边）基本不动，中间调和亮部提亮，彩度提高。两张状态图用同一条曲线，保证除地块外仍然一模一样。
用法：python3 game/tools/grade_bg.py 输入.png 输出.png
"""
import cv2, numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oklab import rgb_to_oklab, oklab_to_rgb
LIFT, CHROMA = 0.62, 1.10
def grade(rgb):
    lab = rgb_to_oklab(rgb.astype(float)); L = lab[..., 0]
    lab[..., 0] = np.clip(L + LIFT * L * L * (1 - L), 0, 1)          # 亮的地方提得多，暗的地方几乎不动
    lab[..., 1:] *= CHROMA
    return oklab_to_rgb(lab)                                        # 超出 sRGB 的直接截断
if __name__ == '__main__':
    im = cv2.imread(sys.argv[1])[..., ::-1]
    cv2.imwrite(sys.argv[2], np.round(grade(im)).astype(np.uint8)[..., ::-1])
