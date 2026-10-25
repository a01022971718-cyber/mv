# 原创配乐 + 音效（纯合成，无外部素材）：python3 -I sheet/music_orbi.py <输出.wav>
import sys, wave
import numpy as np

SR, DUR, BPM = 44100, 41.0, 96
BEAT = 60 / BPM
out = np.zeros(int(SR * DUR) + SR)

def add(sig, t):
    i = int(t * SR); out[i:i + len(sig)] += sig[: max(0, len(out) - i)]

def tone(f, d, amp=0.2, decay=3.0, harm=(1, 0.35, 0.12)):
    t = np.arange(int(SR * d)) / SR
    s = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm))
    env = np.exp(-decay * t) * np.minimum(1, t / 0.005)
    return amp * s * env

def pad(freqs, d, amp=0.05):
    t = np.arange(int(SR * d)) / SR
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return amp * env * sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)

def hz(n): return 440 * 2 ** ((n - 69) / 12)

# 段落：(开始, 结束, 主音, 音阶, 和弦进行, 音符时值(拍), 音量)
MAJ = [0, 2, 4, 7, 9, 12, 14, 16]          # 大调五声
MIN = [0, 3, 5, 7, 10, 12, 15, 17]         # 小调五声
SECTIONS = [
    (0.0, 17.0, 72, MAJ, [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], 1.0, 0.16),   # 摇篮曲
    (17.0, 23.0, 69, MIN, [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 55, 59]], 2.0, 0.12),  # 伤心
    (23.0, 27.0, 72, MAJ, [[53, 57, 60], [55, 59, 62]], 1.0, 0.13),                              # 希望
    (27.0, 36.0, 72, MAJ, [[60, 64, 67], [65, 69, 72], [57, 60, 64], [55, 59, 62]], 0.5, 0.15),  # 欢快
    (36.0, 41.0, 72, MAJ, [[60, 64, 67], [53, 57, 60], [60, 64, 67]], 1.5, 0.12),                # 回到摇篮曲
]
rng = np.random.default_rng(7)
for (a, b, root, scale, chords, step, amp) in SECTIONS:
    bar = BEAT * 4
    n_bars = int(np.ceil((b - a) / bar))
    for k in range(n_bars):
        t0 = a + k * bar
        if t0 >= b: break
        add(pad([hz(n) for n in chords[k % len(chords)]], min(bar, b - t0) + 0.3, 0.035), t0)
        add(tone(hz(chords[k % len(chords)][0] - 12), bar * 0.9, 0.09, 1.2, (1, 0.2)), t0)
    t, idx = a, 0
    while t < b - 0.05:
        idx = int(np.clip(idx + rng.integers(-2, 3), 0, len(scale) - 1))
        if rng.random() > 0.15:
            add(tone(hz(root + scale[idx]), step * BEAT * 2.2, amp, 2.6 if step < 1.5 else 1.6), t)
        t += step * BEAT

# 音效
def noise_sweep(d, f0, f1, amp):
    n = int(SR * d); t = np.arange(n) / SR
    x = rng.standard_normal(n); y = np.zeros(n); fc = np.linspace(f0, f1, n); acc = 0
    for i in range(n):
        a = min(0.99, 2 * np.pi * fc[i] / SR); acc += a * (x[i] - acc); y[i] = acc
    return amp * y * np.sin(np.pi * t / d)
def chirp(d, f0, f1, amp, decay=4):
    t = np.arange(int(SR * d)) / SR; f = np.linspace(f0, f1, len(t))
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-decay * t)

add(noise_sweep(0.9, 300, 3000, 0.25), 3.9)              # 嗖：小月亮追流星
add(tone(hz(88), 0.8, 0.18, 4), 9.0)                     # 叮：发现不见了
add(tone(hz(93), 0.6, 0.12, 5), 9.12)
add(chirp(0.3, 500, 800, 0.12), 13.0)                    # 疑问
add(chirp(1.2, 600, 300, 0.1, 1.5), 19.5)                # 伤心下行
add(tone(hz(55), 0.25, 0.3, 14, (1, 0.6, 0.3)), 27.5)    # 咚：轻敲头
add(chirp(0.5, 200, 700, 0.18, 3), 28.8)                 # 弹跳起跳
add(tone(hz(43), 0.2, 0.25, 16, (1, 0.5)), 29.8)         # 落地
for k, n in enumerate([84, 88, 91, 96]): add(tone(hz(n), 0.5, 0.08, 5), 31.5 + k * 0.08)   # 闪光
add(noise_sweep(0.7, 2000, 600, 0.12), 37.4)             # 结尾流星

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.3) * 0.8
fade = np.minimum(1, np.arange(len(out)) / (SR * 0.5)) * np.minimum(1, (len(out) - np.arange(len(out))) / (SR * 1.5))
pcm = (out * fade * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
