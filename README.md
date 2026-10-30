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
| GPT-o3 | [`gpto3.html`](2048-balls/gpto3.html) | ✅ 已修复（原 `integrity` SRI 哈希是编造的，浏览器拒载脚本 → `Matter` 未定义 → 画布恒空）。需点击画布才投放球 |
| Grok-4 | [`grok4.py`](2048-balls/grok4.py) | ❌ 交付了 pygame 桌面版，**在浏览器里跑不了**（需 `pip install pygame` 本地运行） |
| Qwen | [`Qwen_html_20250713_elfv9s772.html`](2048-balls/Qwen_html_20250713_elfv9s772.html) | ✅ 已修复（原 CDN URL 里有一个空格 → HTTP 400 白屏） |

我当时的排名记录（[`结果.txt`](2048-balls/结果.txt)）：`kimi > grok > claude > doubao > qwen`

### 2. 3D 飞行 · [`3d-fly/`](3d-fly/)

prompt（原文见 [`3d-fly/prompt1.txt`](3d-fly/prompt1.txt)）：
> 帮我写一个 3d three 架构的 3d 飞行游戏，可以有比较简陋的画面，但要有丰富的玩法和详细的玩家引导。

| 版本 | 文件 | 实测状态 |
|---|---|---|
| 未署名基线 | [`3d_flight_game.html`](3d-fly/3d_flight_game.html) | ✅ Three.js r128，画面与 HUD 正常 |
| GPT-o4 | [`gpt-o4.html`](3d-fly/gpt-o4.html) | ⚠ 有画面，依赖 CDN |
| Kimi | [`kimi.html`](3d-fly/kimi.html) | ⚠ 依赖 `three@0.155.0/build/three.min.js`（实测该路径仍可达 200/644 KB） |
| Doubao | [`doubao.html`](3d-fly/doubao.html) | ✅ 有完整画面，但依赖面最宽：three@0.160 + PointerLockControls + GLTFLoader + Tailwind + Google Fonts |
| Grok-4 | [`grok4.html`](3d-fly/grok4.html) | ✅ 正常显示 HUD（Score/Health/Level）与 Play 开始界面，点击进入 |
| Qwen | [`Qwen_html_20250713_mtgsk9p2d.html`](3d-fly/Qwen_html_20250713_mtgsk9p2d.html) | ✅ 正常渲染（CDN URL 尾部多一个空格，浏览器容忍了，不影响加载） |

### 3. 3D 坦克大战 · [`tank-battle/`](tank-battle/)

四个不同 AI 工具产出的工程（不只是单文件），所以形态差别最大：

| 版本 | 目录 | 形态 | 实测状态 |
|---|---|---|---|
| Qoder | [`tank-battle/qoder/`](tank-battle/qoder/) | 单页 + 模块化 `js/`（ECS 风格组件/系统分层） | ✅ 已修复（`cannon.js/0.20.0` 在 cdnjs 上不存在，改 0.6.2）。现在渲染出完整 3D 竞技场与组件面板；面板里有 `7.199999999999999m/s²` 这类未格式化的浮点 |
| Trae | [`tank-battle/trae/`](tank-battle/trae/) | 单页 + `js/` | ✅ 已改引用真·Three.js r128（控制台零报错）；模型手写的**简化 THREE 桩**保留为 `js/three-STUB.js`，文件头注释自己写着"由于CDN可能无法访问，这里提供一个简化的Three.js版本" |
| Claude | [`tank-battle/claude/`](tank-battle/claude/) | **单个 58,287 B 的 `index.html`**（内联脚本 38,346 字符）+ 自带 `SPEC.md` 规格清单 | ✅ **一字未改就能玩**：点 START BATTLE 进战斗（`#main-menu` 转 `display:none`、`gameState.isPlaying=true`）、TAB 打开改装面板、主场景与 150×150 小地图两块 canvas、跑起来 Console 零报错。依赖 cdnjs `three.js/r128`（实测 200 / 603,445 B）+ Google Fonts，**断网打不开**。开火/命中/波次刷怪我没有逐项验，不在此宣称 |
| Vite 工程 | [`tank-battle/vite/`](tank-battle/vite/) | Vite + ES 模块 + 设计文档 | 需要 `npm install && npm run dev`（本仓库未包含 `dist/` 构建产物） |

配套的规格文档：`tank-battle/vite-VIBE-README.md`（VIBE 版设计说明）、`tank-battle/claude/SPEC.md`（Claude 版自带的分系统验收清单，含"60 FPS with 15+ enemies""input lag < 50ms"这类它自己给自己定的目标）。

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

我在上传前把可修的依赖问题修好了，但**保留了坏掉的证据**（桩文件、原始注释都在），因为失败原因比"谁赢了"更有参考价值。

1. **模型会凭空构造 CDN URL 并写错**——Qwen 版写成 `npm/matter-js @0.19.0/...`（中间多一个空格）→ HTTP 400 → 整页白屏。
2. **模型会编造 SRI 完整性哈希**——GPT-o3 版的 `integrity="sha512-d38qo4…"` 与 cdnjs 上 `matter-js@0.19.0/matter.min.js` 的真实哈希 `sha512-0z8URj…` 不匹配，浏览器**直接拒绝执行脚本**，于是 `Matter` 未定义、画布永远空白。这类失败最坑：URL 是对的、网络是通的、控制台报错也指向"资源问题"，很难一眼看出是哈希错了。
3. **模型会引用不存在的版本号**——Qoder 坦克版引用 `cdnjs/.../cannon.js/0.20.0/cannon.min.js`，cdnjs 上 cannon.js 根本没有 0.20.0（实际最高 0.6.2）→ 404。更糟的是页面把这个加载失败**误诊成"您的浏览器不支持 WebGL"**，弹窗让人去换浏览器，排查方向当场被带偏。
4. **依赖不可达时，模型可能自己手写一个"兼容桩"顶替**——Trae 坦克版自带的 `js/three.min.js` 并不是 Three.js，文件头注释自己写着"由于CDN可能无法访问，这里提供一个简化的Three.js版本"。功能看着在跑（控制台正常输出初始化日志），实际是降级实现。
5. **同一个 prompt 可能跨技术栈交付**——Grok-4 在 2048 题目上给了 pygame 桌面版，验收环境只有浏览器时直接不可用。
6. **浮点精度会漏到 UI 上**——修好物理库后，Qoder 坦克版的组件面板里出现 `加速度: 7.199999999999999m/s²`（应为 7.2），说明生成代码没有做任何数值格式化。

### 本次实际改动（4 处，均可逆）

| 文件 | 改动 | 验证方式 |
|---|---|---|
| `2048-balls/Qwen_*.html` | 去掉 CDN URL 里的空格 | 截图从纯白（4.7 KB）变为小球正常下落 |
| `2048-balls/gpto3.html` | `integrity` 换成 cdnjs 官方真实哈希 | URL 本身 200/55 KB 可达；画布仍需点击才投放球，故未做完整玩法验证 |
| `tank-battle/qoder/index.html` | `cannon.js/0.20.0` → `0.6.2` | 从"浏览器不兼容"弹窗变为完整 3D 场景 + 组件面板渲染 |
| `tank-battle/trae/index.html` | 改引用真·Three.js r128；原桩文件**改名为 `js/three-STUB.js` 保留** | 控制台 3 条初始化日志、零报错 |

未改动的已知问题：`3d-fly/doubao.html` 引用的 `three@0.160.0/examples/js/{controls/PointerLockControls,loaders/GLTFLoader}.js` 在 CDN 上已不存在（r149 起只发 ESM 版本），但这两个控件在代码里并未实际使用，场景仍能正常渲染，所以保持原样。

## 说明

这些产出是各 AI 工具生成的代码，我做了运行验证与状态标注，但没有逐行重写。原始文件名保留（含模型自动生成的时间戳文件名），以便对应回各自的产出。

## License

MIT（我编写的 README 与标注部分）；各版本代码的版权与许可以原生成内容为准。
