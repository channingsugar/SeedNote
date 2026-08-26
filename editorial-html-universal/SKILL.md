---
name: editorial-html-universal
description: >-
  Turns any user-provided HTML into a right-click-editable page without restyling
  or regenerating content. Attaches editorial-html-universal/editor so text,
  media, charts, colors, spacing, and CSS animations can be edited live, with
  undo/redo. Use when the user asks to 可编辑 / 右键编辑 / 挂编辑器 / 任意 HTML 可改 /
  把现有 HTML 变成可编辑, or pastes/points at HTML and only wants editing. Do not
  use to 规整 / 换皮 / 套组件 / 从大纲生成报告 (editorial-html-flow) or to build a
  paginated 分屏 deck (editorial-html-page).
---

# 任意 HTML → 右键可编辑

只做一件事：把用户给的 HTML 变成可右键编辑的版本。不换皮、不套 `templates/editorial-flow/`、不重写论证、不改数字和口径。

编辑器在 `editorial-html-universal/editor/`。菜单契约与 `data-seed-*` 标注见 [reference.md](reference.md)。

## 先确认走这条

| 用户要什么 | 走哪条 |
|---|---|
| 已有 HTML，只要能右键改 | **本 Skill** |
| 规整 / 换皮 / 套组件 / 从大纲生成流式报告 | 停，改用 `editorial-html-flow` |
| 分页 / 分屏 / 一屏一问 | 停，改用 `editorial-html-page` |

源就是用户指出的文件、粘贴或 URL。没路径就停问。不要问「要不要顺便换成组件库」。

## 产出

拷到 `Outputs/<slug>/`（用户指定路径则用指定的）：

```
Outputs/<slug>/
  index.html
  lib/editor/seed-edit.css
  lib/editor/seed-edit.js
  （源稿自带的 css/js/图原样拷，路径改成相对产出）
```

不要引入 `templates/editorial-flow/` 或 `templates/editorial-page/` 的 CSS、token、组件。

## 步骤

### 1. 原样落地

把源 HTML 和它引用的资源拷到产出。大文件把巨大 `data:` 换成占位再处理，不要整文件读进上下文。

- 不改可见文案、数字、章节树、图、字体。
- 不合并 class、不改布局、不「顺手美化」。
- 源稿已是完整文档就只在里面挂钩子；若是片段，包一层最小 HTML 壳（meta charset、原样式、编辑器），壳不添加视觉皮肤。

### 2. 扫描并标注（不改外观）

只加属性 / 必要时加一层无样式包装，使通用编辑器能认到能力。对照 [reference.md](reference.md)。

| 看到什么 | 做什么 |
|---|---|
| 普通文字、SVG `<text>` | 不用标，编辑器按节点认 |
| `<img>` / `<video>` / 内容 SVG | 不用标；装饰小图标不要当可换图 |
| 图、表、大块 SVG 需要拖宽高 | 缺盒时加 `data-seed-box`（或源稿已有包裹就标它） |
| 柱/条/折线/饼等可视化 | 标 `data-seed-chart`，数字标 `data-seed-chart-value`，图形标 `data-seed-chart-bar` / `data-seed-chart-point` |
| CSS `@keyframes` / `animation` / `transition` | 不用标，右键可出动画面板 |
| Canvas / WebGL / 第三方图表实例 | **不要假标**。在收工说明里写「数字改了图不会动」 |

标注前后像素应对齐。禁止为了标注改 `width`/`height`/`transform` 以外的计算样式。

### 3. 挂编辑器

从 `editorial-html-universal/editor/` 拷 `seed-edit.css`、`seed-edit.js` 到产出 `lib/editor/`。

```html
<link rel="stylesheet" href="lib/editor/seed-edit.css">
<script src="lib/editor/seed-edit.js" defer></script>
```

路径按实际相对位置改。脚本自行 `mount`。不要把编辑逻辑再抄进页面自己的 JS。不要挂 `templates/editorial-flow/editor/`。

改动存在当前域 IndexedDB，刷新还在；**不会写回磁盘 HTML**。

### 4. 收工只报告

路径、加了哪些 `data-seed-*`、哪些图绑定了、哪些可视化绑不上、有没有改可见内容（必须是没有）。

## 编辑器必须做到

这份组件给**任意 HTML**用，不是给某一套模板 class 用的。

- 不要用 `h1, p, .stat-card p` 这类白名单认字。按点击处找最近文字节点（含 `strong` / `small` / SVG `<text>`）。
- 不要只用 `<img>` 认媒体。`<video>`、内容 SVG 都要能「替换」；装饰 sprite / 按钮图标不要当成可换图。
- 右键用捕获阶段拦住，否则会被浏览器默认菜单抢走。
- 提交时存 `innerHTML`，不要用 `textContent` 整格覆盖。
- 缩放对象按标签与 `data-seed-box` 认，不要写死 `.shot` / `.plain-table-wrap` 才能拖。
- 改数字后更新图形：优先 `data-seed-chart-*`；源稿已有 `.chart-value` 等旧约定时编辑器可兼容，但新稿只标 `data-seed-*`。
- 颜色 / 间距 / 动画从右键进**悬浮面板**，改完当前页立刻更新。页面级走 `:root` 自定义属性；元素级写该节点 inline。
- ⌘Z / Ctrl+Z 撤销，⌘⇧Z / Ctrl+Y 重做。

## 不要做

- 不要套流式/分页组件库，不要新增皮肤 token。
- 不要为「更好编辑」重排 DOM 结构（除非只加无样式的 `data-seed-box` 包裹）。
- 不要在报告上做主题导入导出栏。
- 不要实现「导出写回 HTML 文件」（浏览器做不到落盘；用户要落盘另说）。
