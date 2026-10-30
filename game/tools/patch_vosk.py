"""给 vendor/vosk.js（vosk-browser 0.0.8）里内嵌的 worker 打补丁：下载时向页面上报进度。

worker 源码以 base64 形式嵌在 vosk.js 里。补丁做两件事：
1. 每写入一块数据，postMessage({event:'dlprogress', loaded, total})；
2. 开始解压时 postMessage({event:'dlprogress', phase:'extract'})。
页面里用 model.on('dlprogress', ...) 接收。脚本可重复运行（已打过补丁就跳过）。
"""
import base64, os, re
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'vendor/vosk.js')
src = open(P, encoding='utf-8').read()
m = re.search(r"createBase64WorkerFactory\('([A-Za-z0-9+/=]+)'", src)
w = base64.b64decode(m.group(1)).decode('utf-8')
if 'dlprogress' in w:
    print('already patched'); raise SystemExit
a = 'bytesWritten=bytesWritten+value.length;'
b = 'bytesWritten=bytesWritten+value.length;self.postMessage({event:"dlprogress",loaded:bytesWritten,total:length||0});'
c = 'yield extract(archivePath,localPath,true);'
d = 'self.postMessage({event:"dlprogress",phase:"extract"});yield extract(archivePath,localPath,true);'
assert w.count(a) == 1 and w.count(c) == 1
w = w.replace(a, b).replace(c, d)
src = src[:m.start(1)] + base64.b64encode(w.encode('utf-8')).decode() + src[m.end(1):]
open(P, 'w', encoding='utf-8').write(src)
print('patched')
