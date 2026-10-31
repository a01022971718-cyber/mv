#!/usr/bin/env bash
# 一键跑全部自动测试（改完代码、发布之前都跑一遍）：
#   bash game/tests/run.sh [输出目录]
# 每个测试的输出和截图在输出目录里；最后一行 ERRORS none 才算过。断网测试放在最后（会关掉本地服务器）。
# 需要：node + playwright（云端环境自带）、python3。
set -u
cd "$(dirname "$0")/../.."
OUT=${1:-/tmp/doudou-tests}; mkdir -p "$OUT"
python3 -m http.server 8765 --bind 127.0.0.1 --directory . > "$OUT/http.log" 2>&1 & echo $! > "$OUT/http.pid"
for i in $(seq 200); do curl -s -o /dev/null http://127.0.0.1:8765/ && break; done
fail=0
for t in smoke newfeat spirits newcrop fx modes oldsave skins adjust map wardrobe systems offline; do
  printf '%-10s ' "$t"
  if timeout 400 node game/tests/$t.js "$OUT" > "$OUT/$t.log" 2>&1 && tail -3 "$OUT/$t.log" | grep -qi "errors none"; then echo ok; else echo FAIL; fail=1; tail -4 "$OUT/$t.log" | sed 's/^/    /'; fi
done
kill "$(cat "$OUT/http.pid")" 2>/dev/null
[ $fail = 0 ] && echo "全部通过" || echo "有测试没通过，看 $OUT 里的日志"
exit $fail
