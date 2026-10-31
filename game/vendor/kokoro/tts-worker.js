// 发音引擎（后台线程，游戏画面不卡）：在手机里跑 Kokoro，把英文变成语音。
// 主线程发 {t:'init'} 或 {t:'say', id, text, voice, speed}；这里回 {t:'progress'}、{t:'ready'}、{t:'audio', id, pcm, sr}、{t:'error', id, msg}。
// 模型第一次从本网站下载（约 92MB），之后存在浏览器缓存里，断网也能用。
let tts = null, loading = null;
function init() {
  if (tts) return Promise.resolve(tts);
  if (!loading) loading = (async () => {
    self.KOKORO_HOST = new URL('./', self.location.href).href;   // 模型、声音都在 vendor/kokoro/ 下
    const m = await import('./kokoro.web.js');
    m.env.wasmPaths = self.KOKORO_HOST;
    tts = await m.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8', device: 'wasm',
      progress_callback: p => { if (p.status === 'progress' && p.total) postMessage({ t: 'progress', file: p.file, loaded: p.loaded, total: p.total }); },
    });
    postMessage({ t: 'ready' });
    return tts;
  })().catch(e => { loading = null; throw e; });
  return loading;
}
self.onmessage = async e => {
  const d = e.data;
  try {
    if (d.t === 'init') { await init(); return; }
    if (d.t === 'say') {
      const t = await init();
      const a = await t.generate(d.text, { voice: d.voice || 'af_heart', speed: d.speed || .92 });
      const pcm = new Float32Array(a.audio);
      postMessage({ t: 'audio', id: d.id, pcm, sr: a.sampling_rate }, [pcm.buffer]);
    }
  } catch (err) { postMessage({ t: 'error', id: d.id, msg: String((err && err.message) || err) }); }
};
