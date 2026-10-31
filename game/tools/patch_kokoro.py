"""发音引擎：把 kokoro-js 的网页版打包文件改成从我们自己的网站下载模型（默认是 huggingface.co，国内常打不开）。
用法（在仓库根目录）：
  npm install kokoro-js@1.2.1     # 在任意临时目录
  python3 game/tools/patch_kokoro.py node_modules/kokoro-js/dist/kokoro.web.js game/vendor/kokoro/kokoro.web.js
  另外要放进 game/vendor/kokoro/：
    ort-wasm-simd-threaded.jsep.mjs / .wasm   （node_modules/@huggingface/transformers/dist/ 里）
    onnx-community/Kokoro-82M-v1.0-ONNX/{config.json,tokenizer.json,tokenizer_config.json,onnx/model_quantized.onnx,voices/af_heart.bin}
      （从 https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX 下载）
改的地方：设置了 globalThis.KOKORO_HOST 时，模型和声音文件都从这个地址下载。
"""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (a, s.count(a)); s = s.replace(a, b)
rep('remoteHost:"https://huggingface.co/"', 'remoteHost:(globalThis.KOKORO_HOST||"https://huggingface.co/")')
rep('remotePathTemplate:"{model}/resolve/{revision}/"', 'remotePathTemplate:(globalThis.KOKORO_HOST?"{model}/":"{model}/resolve/{revision}/")')
rep('const A=`https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/${e}.bin`;', 'const A=(globalThis.KOKORO_HOST?globalThis.KOKORO_HOST+"onnx-community/Kokoro-82M-v1.0-ONNX/voices/":"https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/")+e+".bin";')
open(dst, 'w', encoding='utf-8').write(s); print('patched', dst)
