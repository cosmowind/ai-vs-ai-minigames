# ai-vs-ai-minigames

同一个 prompt，丢给不同的大模型各写一版，然后并排跑一遍。这里是我的实测存档。

不粉饰结论：**每个题目都写清楚了哪几版能跑、哪几版打不开**，因为坏掉的方式本身比"谁赢了"更有信息量。

## 题目

### 1. 合并小球（2048 弹球） · [`2048-balls/`](2048-balls/)

prompt（原文见 [`2048-balls/prompt.txt`](2048-balls/prompt.txt)）：
> 做一个游戏，设置从 2 到 2^20 不同的小球，不同颜色、数字写在球内、大小递增；每次在当前最小球到最大球之间随机选一个球，玩家决定从哪个 x 轴下落，模拟物理碰撞与下落，有下/左/右边界，相同大小的球碰撞后合并成大一级；目标是拼出 2^20 的球。

| 版本 | 文件 | 实测状态 |
|---|---|---|
| Kimi | [`kimi.html`](2048-balls/kimi.html) | ✅ 可玩，零外部依赖（自带物理实现） |
| Doubao | [`doubao.html`](2048-balls/doubao.html) | ⚠ 界面正常，依赖 Tailwind/font-awesome/Google Fonts 三个 CDN |
| GPT-o3 | [`gpto3.html`](2048-balls/gpto3.html) | ⚠ 标题与画布正常、球不出现，依赖 matter-js CDN |
| Grok-4 | [`grok4.py`](2048-balls/grok4.py) | ❌ 交付了 pygame 桌面版，**在浏览器里跑不了**（需 `pip install pygame` 本地运行） |
| Qwen | [`Qwen_html_20250713_elfv9s772.html`](2048-balls/Qwen_html_20250713_elfv9s772.html) | ❌ 白屏。CDN URL 里有一个空格：`npm/matter-js @0.19.0/...` → HTTP 400 |

我当时的排名记录（[`结果.txt`](2048-balls/结果.txt)）：`kimi > grok > claude > doubao > qwen`

### 2. 3D 飞行 · [`3d-fly/`](3d-fly/)

prompt（原文见 [`3d-fly/prompt1.txt`](3d-fly/prompt1.txt)）：
> 帮我写一个 3d three 架构的 3d 飞行游戏，可以有比较简陋的画面，但要有丰富的玩法和详细的玩家引导。

| 版本 | 文件 | 实测状态 |
|---|---|---|
| 未署名基线 | [`3d_flight_game.html`](3d-fly/3d_flight_game.html) | ✅ Three.js r128，画面与 HUD 正常 |
| GPT-o4 | [`gpt-o4.html`](3d-fly/gpt-o4.html) | ⚠ 有画面，依赖 CDN |
| Kimi | [`kimi.html`](3d-fly/kimi.html) | ⚠ 依赖 `three@0.155.0/build/three.min.js`，该路径在新版 three 里已移除，联网时可能 404 |
| Doubao | [`doubao.html`](3d-fly/doubao.html) | ✅ 有完整画面，但依赖面最宽：three@0.160 + PointerLockControls + GLTFLoader + Tailwind + Google Fonts |
| Grok-4 | [`grok4.html`](3d-fly/grok4.html) | ✅ 正常显示 HUD（Score/Health/Level）与 Play 开始界面，点击进入 |
| Qwen | [`Qwen_html_20250713_mtgsk9p2d.html`](3d-fly/Qwen_html_20250713_mtgsk9p2d.html) | ✅ 正常渲染（CDN URL 尾部多一个空格，浏览器容忍了，不影响加载） |

### 3. 3D 坦克大战 · [`tank-battle/`](tank-battle/)

三个不同 AI 工具产出的工程（不只是单文件），所以形态差别最大：

| 版本 | 目录 | 形态 | 实测状态 |
|---|---|---|---|
| Qoder | [`tank-battle/qoder/`](tank-battle/qoder/) | 单页 + 模块化 `js/`（ECS 风格组件/系统分层） | ⚠ 打开显示"浏览器不兼容"。根因是它引用的 `cannon.js/0.20.0` 在 cdnjs 上不存在（404），而页面把这个错误当成 WebGL 不可用来提示 |
| Trae | [`tank-battle/trae/`](tank-battle/trae/) | 单页 + `js/` | ⚠ 自带一个 `js/three.min.js`，但那是模型手写的**简化 THREE 桩**（文件头注释自己写了"由于 CDN 可能无法访问，这里提供一个简化的 Three.js 版本"）——离线能开，画面是降级版 |
| Vite 工程 | [`tank-battle/vite/`](tank-battle/vite/) | Vite + ES 模块 + 设计文档 | 需要 `npm install && npm run dev`（本仓库未包含 `dist/` 构建产物） |

配套的规格文档在 `tank-battle/vite-VIBE-README.md`（VIBE 版设计说明）。

## 复现这些实验

```bash
# 纯静态部分
python -m http.server 8000
# 逐个打开各版本 html，对比同一 prompt 的产出

# Vite 版坦克
cd tank-battle/vite && npm install && npm run dev

# Grok 的 pygame 版
pip install pygame && python 2048-balls/grok4.py
```

## 已验证的失败模式（做同类实验时值得注意）

1. **模型会凭空构造 CDN URL 并写错**——`matter-js @0.19.0`（多了空格）→ 400；`cannon.js/0.20.0`（cdnjs 上根本没有这个版本）→ 404。
2. **依赖不可达时，模型可能自己手写一个"兼容桩"顶替**（Trae 版的 `three.min.js`）。功能看着在，实际是降级实现。
3. **同一个 prompt 可能跨技术栈交付**（Grok 给了 pygame 桌面版），如果验收环境只有浏览器就直接不可用。
4. **把资源加载失败误报成环境问题**（Qoder 版把物理库 404 报成"浏览器不支持 WebGL"），这类误诊会让人往错方向排查。

## 说明

这些产出是各 AI 工具生成的代码，我做了运行验证与状态标注，但没有逐行重写。原始文件名保留（含模型自动生成的时间戳文件名），以便对应回各自的产出。

## License

MIT（我编写的 README 与标注部分）；各版本代码的版权与许可以原生成内容为准。
