---
name: doudou-voice
description: 豆豆游戏的发音：重做自带录音包 game/voice.js（游戏里的英文内容改了以后），或者更新手机里的发音引擎 game/vendor/kokoro。加单词、加句子、改场景词以后用。
---

# 发音系统

两层：
- **自带录音** `game/voice.js`：游戏内容里的所有英文（`voiceInventory()` 导出），Kokoro 预先合成，打开就能放、断网也能放。
- **发音引擎** `game/vendor/kokoro/`：在手机浏览器里跑 Kokoro（同一个声音 af_heart），玩家自己填的英文（地图地点、场景里的东西、可点的东西、我加的单词）第一次读时现场生成，存在 IndexedDB 的 `voice` 里。代码在 `index.html` 的「发音系统」一节（`voxGen` / `voxSay` / `voxPrep`）。

## 重做自带录音（内容改了以后）

```bash
W=/tmp/voice; mkdir -p $W/models
# 模型（第一次）：kokoro-v1.0.onnx、voices-v1.0.bin 放进 $W/models（https://github.com/thewh1teagle/kokoro-onnx/releases）
pip install kokoro-onnx soundfile          # 需要 ffmpeg
node game/tools/export_inventory.js $W     # 导出清单（也会重画主屏幕图标）
python3 game/tools/gen_voice.py $W         # 生成 game/voice.js；中断重跑会续上，已有的直接复用
```
读音不对：在 `gen_voice.py` 的 `FIX`（音标替换）或 `index.html` 的 `TTS_TEXT`（换一种写法让它读对）里改。

## 更新发音引擎

见 `game/tools/patch_kokoro.py` 开头的说明：装 `kokoro-js`、打补丁（模型改从本网站下载）、拷 ORT 的 wasm 和 `onnx-community/Kokoro-82M-v1.0-ONNX` 的 q8 模型与 af_heart 声音。改完用 `game/tests/systems.js` 测（里面会真的生成一句并检查缓存）。
