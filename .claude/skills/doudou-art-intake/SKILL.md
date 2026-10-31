---
name: doudou-art-intake
description: 用户（美术）交来的素材怎么接进豆豆游戏：底图/主题、装扮物件、作物、地图、地点图标。先检查规格再处理，处理用 game/tools 里的脚本，检查不过就按 ART.md 告诉用户改哪里。
---

# 美术素材入库

规格总表在 `game/ART.md`。原则：**能让用户在游戏里自己上传的，就不要我来改代码**（装扮窗口、底图、地图编辑、可点的东西都能上传）。只有要做成「自带」的才走下面的流程。

## 底图 / 主题（整张背景）

1. `python3 game/tools/bg_theme.py 原图.png <名字>` → `game/art/themes/<名字>.webp`，看生成的对齐检查图：16 个黄框要压在土地上。
2. 在 `index.html` 的 `BGS0` 加一项：`{ zh, open: 'art/themes/<名字>.webp', locked?: 没开垦版, fq?: 菜地四角, spots: [...] }`；在 `THEMES0` 加主题（`bg: '<名字>'`）。
3. 可点的东西 `spots`：`[单词, [x, y, 宽, 高], 名牌位置|null]`，按 2048×1152 原画像素；新单词加进 `WORLD`（中文、音标），再用 `doudou-voice` 重做自带录音。
4. 底图加进 `sw.js` 的 `CORE`。

## 装扮（稻草人、房子、树……）和作物

`python3 game/tools/skin_prep.py 原图.png game/art/skins/<名字>.png 宽 高`（宽高见 `SKIN_SLOTS` 的 box），在 `SKINS` 登记。检查：透明背景、一张一样东西、光从左上、描边暖深棕。

## 地图

底图不要字、不要按钮、不要画死的小头像（地名是游戏叠上去的，可改）。自带地图在 `BOARDS`，地点在 `PLACES`（原图像素）。截图类素材先清掉界面（参考 `art/src/map/` 和提交记录里的处理方法）。

## 检查不过时

用大白话告诉用户哪里不对、怎么改（用户只有手机、是新手），并把记录写进 `ART.md` 的作业记录。
