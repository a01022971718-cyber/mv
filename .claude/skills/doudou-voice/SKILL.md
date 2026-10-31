---
name: doudou-voice
description: 豆豆游戏的语音：游戏内容的英文由手机上的语音包自动生成，一般不用在开发时做发音。只有要更新发音引擎（game/vendor/kokoro）、加新的声音，或者特意要把某些内容预先打包进 voice.js 时用。
---

# 语音包

**默认做法（省时间）**：改游戏内容时只写文案，不做发音。游戏启动后把所有英文当作「文案清单」（`voxContent()`：`voiceInventory()` 的自带内容 + 玩家加的单词、可点的东西、地图地点、玩法里的东西），清单里没语音的，由手机上的发音引擎在后台生成（`voxPackRun()`），存进 IndexedDB 的 `voice`。连 Wi-Fi 时自动下载引擎（`voxAuto()`），也可以在设置/工具箱里点下载。

所以：**加句子、加单词、加客人台词，什么都不用做**。只要新文案进了 `voiceInventory()`（learnerLines / guestLines / WORLD / SPIRITS 等）或者玩家数据，手机就会补齐。

## 什么时候才需要动

1. **新的声音**：客人或精灵用了新的 Kokoro 声音 → 把 `voices/<名字>.bin` 放进 `game/vendor/kokoro/onnx-community/Kokoro-82M-v1.0-ONNX/voices/`（从 huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX 下载，每个 0.5MB）。
2. **更新引擎**：见 `game/tools/patch_kokoro.py` 开头的说明。改完用 `game/tests/systems.js`、`game/tests/toolkit.js` 测（会真的生成并检查缓存）。
3. **读音不对**：在 `index.html` 的 `TTS_TEXT` 里给这句换一种写法（手机生成和打包都会用）。
4. **特意要「打开就有、不等生成」**（比如首屏教学语音）：才重做 `voice.js`：
   ```bash
   W=/tmp/voice; mkdir -p $W/models   # 放 kokoro-v1.0.onnx、voices-v1.0.bin（thewh1teagle/kokoro-onnx releases）
   pip install kokoro-onnx soundfile && node game/tools/export_inventory.js $W && python3 game/tools/gen_voice.py $W
   ```
