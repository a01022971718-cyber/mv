#!/usr/bin/env bash
# 把游戏（或者开发者模式导出的某个客户端）打成安卓安装包（.apk）。GitHub Actions 里自动跑，也能在有 Android SDK 的电脑上跑。
#   bash game/tools/build_apk.sh dev            # 打包开发版（完整游戏）
#   bash game/tools/build_apk.sh app-xxxxxx     # 打包 game/apps/app-xxxxxx 这个客户端
# 安装包里有游戏、图片、自带录音、离线识别模型；手机上生成语音用的大模型（92MB）不放进去，用到时从网站下载。
set -euo pipefail
SLUG=${1:-dev}; ROOT=$(cd "$(dirname "$0")/../.." && pwd); OUT=${OUT:-$ROOT/apk-out}; W=$(mktemp -d)
mkdir -p "$OUT" "$W/www"
if [ "$SLUG" = dev ]; then NAME="豆豆的田园厨房"; else NAME=$(node -e "console.log(require('$ROOT/game/apps/$SLUG/game.json').app.name || '我的农场')"); fi
echo "打包：$SLUG（$NAME）"
rsync -a --exclude 'apps/' --exclude 'vendor/kokoro/onnx-community/' --exclude 'art/src/' --exclude 'tests/' --exclude 'tools/' --exclude '*.md' "$ROOT/game/" "$W/www/"
if [ "$SLUG" != dev ]; then mkdir -p "$W/www/apps/$SLUG"; cp "$ROOT/game/apps/$SLUG/"* "$W/www/apps/$SLUG/"; fi
# 入口：一打开就是这个客户端
mv "$W/www/index.html" "$W/www/game.html"
Q=$([ "$SLUG" = dev ] && echo "" || echo "?app=$SLUG")
printf '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>location.replace("game.html%s")</script>' "$Q" > "$W/www/index.html"
cd "$W"
npm init -y >/dev/null
npm i --silent @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6
PKG="com.doudou.$(echo "$SLUG" | tr -c 'a-z0-9\n' '_')"
npx cap init "$NAME" "$PKG" --web-dir www
npx cap add android
# 麦克风（口语打分）权限
sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#&\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />#' android/app/src/main/AndroidManifest.xml
# 图标：客户端有自己的图标就用它，没有就用豆豆
ICON="$W/icon.png"
if [ "$SLUG" != dev ] && [ -f "www/apps/$SLUG/icon.png" ]; then cp "www/apps/$SLUG/icon.png" "$ICON"; else cp www/icon-512.png "$ICON"; fi
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do D=${d%%:*}; S=${d##*:}; for f in ic_launcher ic_launcher_round ic_launcher_foreground; do [ -f "android/app/src/main/res/mipmap-$D/$f.png" ] && convert "$ICON" -resize ${S}x${S} "android/app/src/main/res/mipmap-$D/$f.png"; done; done
npx cap sync android
cd android && ./gradlew assembleDebug --no-daemon -q
cp app/build/outputs/apk/debug/app-debug.apk "$OUT/$SLUG.apk"
echo "好了：$OUT/$SLUG.apk（$(du -h "$OUT/$SLUG.apk" | cut -f1)）"
