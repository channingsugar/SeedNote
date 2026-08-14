---
name: knowledge-report
description: >-
  Rebuilds user-supplied research materials (HTML pages, outlines, notes, screenshots)
  into a token-driven knowledge-report page using the editorial template and parent
  components. Use when the user pastes or points to HTML, 大纲, 调研, 知识汇报, References,
  or asks to 套模板 / 生成汇报 / 输出页面. Never restyles the source HTML; always re-understand
  then recompose.
---

# Knowledge Report

把用户资料做成可换主题的知识汇报页。输入只当内容来源，不当版式蓝本。

## Hard rules

1. **重新理解输出。** 即使用户给的是已有完整样式的 HTML，也必须先拆内容、再组章节、再用模板与父组件重写。禁止：原 DOM 换 class、原结构换皮、大段搬运源页面 markup、把源 CSS 当视觉系统。
2. **不发明事实。** 可补结构、导语、章节节奏、模块选型、口径说明的写法。不可编造数字、政策、价格、截图结论。缺证据就显式标明缺口，不要用空话填满。
3. **视觉只走 Token。** 颜色、字号、间距、圆角、线宽一律 `var(--*)`。禁止硬编码色值（`#hex` / `rgb`）。主题切换必须整页生效。
4. **只用已有父组件。** 选型见 [modules.md](modules.md)。没有合适模块时用段落 + Section Header，不要发明新的页面级自定义布局。
5. **先分析再写页。** 未完成内容审计与模块地图前，不要开始写 `Outputs/`。

## Workflow

复制并跟踪：

```
- [ ] 1. 收资料并定位源文件
- [ ] 2. 内容审计（完整 / 相关 / 缺口）
- [ ] 3. 章节命题与模块地图
- [ ] 4. 搭输出包（模板壳 + 主题运行时）
- [ ] 5. 按地图重写正文
- [ ] 6. 自检：主题、组件、事实、禁止项
```

### 1. 收资料

- 读用户粘贴的正文、附件、`References/<name>/`、截图与表格。
- HTML 源：抽标题层级、判断句、数据、比较维度、流程、证据图及其说明。丢掉 class、布局、配色。
- 大纲源：识别已有命题与空洞节点；空洞只补结构，不补假数据。
- 项目 slug：英文短横线，如 `market-summary`。输出目录固定为 `Outputs/<slug>/`。

### 2. 内容审计

对材料回答四问（内部完成，不必长篇回复用户）：

| 问 | 通过标准 |
|---|---|
| 这份汇报要让读者决定什么？ | 能写成一句封面主判断 |
| 证据是否支撑判断？ | 数据/截图/规则与结论相邻，口径一致 |
| 哪些块彼此无关或重复？ | 删掉或降级，不按源页面顺序照搬 |
| 缺什么会让读者无法行动？ | 列缺口：结论、比较口径、下一步、样本边界 |

完善范围：理顺章节、补导语、统一口径表述、把散点收成可比较字段。不把源页面的装饰性分区当成必须保留的章节。

### 3. 章节与模块地图

默认阅读节奏（按内容裁剪，不要为了套模板而凑满六节）：

1. 封面：范围 + 主判断
2. 尺度 / 概览
3. 分题展开（供给、规则、流程、价格等）
4. 比较与证据
5. 结论与下一步

每一节只回答一个问题。为每个内容块选**一个**父组件，对照 [modules.md](modules.md)。

源 HTML 里的自定义块必须翻译，例如：

- 普通表 / 对比矩阵 → Data Table（`plain` 或 `is-matrix`）
- 并列要点 / 深色重点 → Highlight Band（`dividers` 或 `data-decoration="facts"`）
- 步骤 / 侧轨说明 → Process Steps（默认或 `is-rail`）
- 价格条图 → Bar Compare（横向默认；纵向用 `is-vertical`，条目数=并排项数）

### 4. 输出包

从模板复制壳，做成自包含输出：

```
Outputs/<slug>/
  index.html
  assets/          # 源里用到的图片；路径改为相对 assets/
  lib/
    components.css     # 来自 templates/shared/components.css
    template.css       # 来自 templates/editorial-default/assets/template.css
    template.js        # 来自 templates/editorial-default/assets/template.js
    theme-runtime.js   # 来自 templates/shared/theme-runtime.js
    design-data.js     # 来自 design-system/assets/design-data.js（不要用过期副本）
```

`index.html` 必须包含：

- `.theme-control` 整块（select / 导入 / hint / toast），文案与模板一致
- `.report-shell` → `.report-cover` → `.document-nav` → `.report-main` → `.report-notes`
- 章节用 `.report-section` + `.section-header` + `.report-section__stack`
- 脚本顺序：`lib/design-data.js` → `lib/theme-runtime.js` → `lib/template.js`

`content.css` 仅用于源材料特有的交互（灯箱、画廊），且仍走 Token。禁止把源页面的表格/卡片/条图样式搬进来。

### 5. 重写正文

- 封面 `h1` 是判断或议题，不是源 `<title>` 直贴。
- 导航链接与 `id` 一一对应，条目随真实章节变，不要沿用模板的「概览/信号/证据」。
- 表格用 `.table-wrap` > `table.data-table`；矩阵加 `is-matrix`；优劣用 `.cell-best` / `.cell-weak`。
- 证据图紧挨它所支持的判断；每张图有说明文字，关键信息不只存在于图内。
- 页脚 `report-notes` 改成该项目的口径、样本、时间与未核实项，不要留模板使用说明。

### 6. 自检

- [ ] 源 HTML 的主要 class/结构没有出现在输出里
- [ ] 切换主题后封面、导航、表、条图、重点带都变
- [ ] 无硬编码颜色
- [ ] 每个自定义块都能指回一个父组件
- [ ] 数字与判断能在源材料中找到出处
- [ ] `Outputs/<slug>/index.html` 可直接打开

完成后用一两句话告诉用户：输出路径、相对源材料做了哪些结构重组、以及显式缺口。

## Anti-patterns

- 把 `References/.../index.html` 包进模板壳就算交付
- 保留 `.plain-table-wrap`、`.airline-matrix`、`.process-frictions` 这类源页面 class
- 为「看起来完整」编造价格或覆盖率
- Bar Compare 再加一套「列数」控件；纵向比较时条目并排、轨道等高、间距一致
- 输出去读 `../../design-system/`——交付包必须自包含
