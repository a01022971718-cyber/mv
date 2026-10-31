---
name: doudou-release
description: 发布豆豆的田园厨房（game/）的新版本：改版本号、按需重做字体和发音包、跑全部自动测试、提交推送、确认 GitHub Pages 上线、更新预览页。每次改完游戏要交给用户时用。
---

# 发布一个新版本

游戏是 `game/index.html` 一个文件，加上 `game/` 下的素材。手机上装的是 GitHub Pages 版（`https://a01022971718-cyber.github.io/mv/game/index.html`），靠版本号提示更新。

## 步骤

1. **版本号三处一起改**（只能变大，手机上比大小决定要不要提示更新）：
   - `game/index.html`：`const BUILD = N, BUILD_DATE = 'YYYY-MM-DD';`
   - `game/sw.js`：`const V = 'doudou-vN';`；新加的、离线要用的素材加进 `CORE`
   - `game/version.json`：`build`、`date`、`note`（一句中文，用户在更新提示里看到）
2. **改了中文文字** → `python3 game/tools/build_fonts.py`（只内联用到的字；没内联的字由完整字体按需补，不重做也能显示，但重做后首屏更快）。
3. **改了游戏里的英文内容**（句子、单词、场景词）→ 用 `doudou-voice` 技能重做自带录音。玩家在游戏里自己加的英文不用管，手机上的发音引擎会生成。
4. **跑全部测试**：`bash game/tests/run.sh /tmp/doudou-tests`，必须「全部通过」。新功能要在 `game/tests/` 里加测试，并加进 `run.sh` 的列表。
5. **提交推送**到当前开发分支（见会话说明），提交信息写清楚做了什么。
6. **确认上线**：轮询 `https://a01022971718-cyber.github.io/mv/game/version.json` 直到 build 变成 N（一般 1–2 分钟）。
7. **更新预览页**（claude.ai 的 Artifact）：发布 `game/index.html`，`files` 里带上这次改过的素材（voice.js、新图片、version.json）。
8. 告诉用户：手机上从桌面图标打开 → 点「更新」。

## 注意

- 不要在没准备好用户素材时先做；用户是美术新手、只有手机，说明用大白话。
- 大文件（>50MB）只放发音引擎模型；其他素材尽量压成 webp。
