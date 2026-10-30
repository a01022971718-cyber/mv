# 第三方代码

- `vosk.js`：[vosk-browser](https://github.com/ccoreilly/vosk-browser) 0.0.8（npm 包 `dist/vosk.js` 原样复制），Vosk / Kaldi 的 WebAssembly 版本，Apache-2.0 许可。
- 识别模型 `vosk-model-small-en-us-0.15`（[alphacephei](https://alphacephei.com/vosk/models)，Apache-2.0）不放在仓库里。游戏会先找同目录下的 `vosk/vosk-model-small-en-us-0.15.tar.gz`，找不到就从 vosk-browser 作者的 GitHub Pages 下载同一个模型，下载一次后存在浏览器里。
- `../voice.js` 里的示范发音由 [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)（Apache-2.0）通过 kokoro-onnx 合成。
