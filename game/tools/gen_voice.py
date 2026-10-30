"""用 Kokoro 合成游戏里的全部示范发音 → MP3 → game/voice.js

用法（在仓库根目录）：
  1. node game/tools/export_inventory.js /tmp/voice        # 从游戏导出要合成的清单 inventory.json
  2. pip install kokoro-onnx soundfile；下载 kokoro-v1.0.onnx 和 voices-v1.0.bin 放到 /tmp/voice/models
  3. python3 game/tools/gen_voice.py /tmp/voice           # 生成 game/voice.js（中断后重跑会续上）
需要 ffmpeg。
"""
import json, sys, os, base64, subprocess, time, hashlib, re
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
WORK = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else '/tmp/voice'
GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
inv = json.load(open(f'{WORK}/inventory.json'))
only = sys.argv[2:]  # 调试：只合成这些 key 的子串
k = Kokoro(f'{WORK}/models/kokoro-v1.0.onnx', f'{WORK}/models/voices-v1.0.bin')
os.makedirs(f'{WORK}/wav', exist_ok=True)
out, t0 = {}, time.time()
def trim(x, sr):
    a = np.abs(x); idx = np.where(a > 0.012)[0]
    if len(idx) == 0: return x
    s = max(0, idx[0] - int(.04 * sr)); e = min(len(x), idx[-1] + int(.09 * sr))
    y = x[s:e].copy(); f = int(.01 * sr); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    return y
PHON = {'w|a': 'ɐ.'}  # 单读的 a 用句中的弱读，不读字母音 /eɪ/
items = [x for x in inv if not only or any(o in x['key'] for o in only)]
for i, it in enumerate(items):
    name = hashlib.md5(it['key'].encode()).hexdigest()[:12]
    wav = f'{WORK}/wav/{name}.wav'
    if os.path.exists(wav) and os.path.getsize(wav) > 1000:
        # 续跑：上次已经合成好的直接复用（文件名由 key 决定）
        y, sr = sf.read(wav, dtype='float32')
        mp3 = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '40k', '-f', 'mp3', '-'], capture_output=True, check=True).stdout
        out[it['key']] = base64.b64encode(mp3).decode(); it['wav'] = wav; it['dur'] = round(len(y) / sr, 2)
        continue
    ph = PHON.get(it['key'])
    if ph is None and re.search(r'\btear\b', it['text'], re.I):
        # 多音词：做菜里的 tear 是「撕」/ter/，Kokoro 默认读成「眼泪」/tɪr/
        ph = k.tokenizer.phonemize(it['text'], 'en-us').replace('tˈɪɹ', 'tˈɛɹ')
    if ph is not None: samples, sr = k.create(ph, voice=it['voice'], speed=it['speed'], lang='en-us', is_phonemes=True)
    else: samples, sr = k.create(it['text'], voice=it['voice'], speed=it['speed'], lang='en-us')
    y = trim(np.asarray(samples, dtype=np.float32), sr)
    peak = float(np.max(np.abs(y))) or 1.0
    y = y * min(1.0, 0.89 / peak)  # 统一响度上限，避免爆音
    sf.write(wav + '.tmp.wav', y, sr, subtype='PCM_16'); os.replace(wav + '.tmp.wav', wav)
    mp3 = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '40k', '-f', 'mp3', '-'], capture_output=True, check=True).stdout
    out[it['key']] = base64.b64encode(mp3).decode()
    it['wav'] = wav; it['dur'] = round(len(y) / sr, 2)
    if i % 50 == 0: print(i, len(items), round(time.time() - t0, 1), it['key'], it['dur'], flush=True)
json.dump(items, open(f'{WORK}/generated.json', 'w'))
if not only:
    js = '// 豆豆的田园厨房 · 示范发音包（Kokoro 合成，MP3 base64）。由 gen.py 根据游戏里的 voiceInventory() 生成，请勿手改。\nwindow.VOICE_CLIPS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(f'{GAME}/voice.js', 'w').write(js)
    print('voice.js', len(js), 'bytes, clips', len(out))
print('done', round(time.time() - t0, 1), 's')
