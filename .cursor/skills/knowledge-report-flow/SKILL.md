---
name: knowledge-report-flow
description: >-
  Builds a long-form document-column report in templates/editorial-flow/.
  Follow the user's source and instructions first; map content onto Grid/Content.
  Use when the user asks for 流式, 文档栏, editorial-flow, 长文阅读, or a non-paginated
  knowledge report. Do not use for 分屏 / 一屏一问 decks (knowledge-report /
  editorial-default).
---

# Knowledge Report Flow（流式）

把材料套成**可滚动的文档栏**。分屏是另一套：`templates/editorial-default/`，skill 是 `knowledge-report`。两套不能互切。

页只许套 `templates/editorial-flow/`。不要抄源文件的外壳和一次性 class，也不要抄分屏翻页壳。

## 1. 用户输入优先

用户说了怎么切、保什么、改什么、用哪份源、叫什么名——按用户的做。不要用分屏 skill 的「听众问句重切」覆盖用户，也不要在用户没要求时另编一套树。

| 用户说了 | 做 |
|---|---|
| 按原文 / 换皮 / 别改结构 / 别改句子 | 树和措辞跟源稿 |
| 重切 / 按听众问 / 重新组织 | 按用户给的切法；仍用流式叠块，不要做成一屏一问 |
| 只要组织 / 先写稿 | 交 `report.md` 后停 |
| 要页 / 套模板 | 先有稿，再填 HTML |
| 图怎么处理、缺口怎么标 | 按用户的 |
| 没说切法 | 源稿已有导航或明确章节 → 跟源稿；否则停下来问 |

材料从用户指出的文件、粘贴、文件夹来。不要擅自拿仓库里另一份产出当切法。

数字、口径、判断句：用户没让改就不要改。标题不要写成字段名，也不要把数字再念一遍。

## 2. 流式怎么排

一章回答一件事，但**一章可以有多块**，上下排，不是翻页。

- 章：`.report-section.report-slide`，共用同一个 `data-chapter`。判断句写在该章第一块的 `data-flow-title`。
- 块：一个 `.page-grid` **只放一种** Content。格数 = 实例数。不许空格，不许混装。
- 源里一张复合卡（图+要点、判断+底下列表）拆成上下两块，不要发明新组件。
- 不要插章封面。封面仍整页。口径/来源若用户要收在文末，用最后一章 `.report-notes`。
- 多格、图、表不要重复章标题。只有 1 格 `copy` / `point` 把开口句留在内容标题。

### Content

| Content | 标记 | 一格 / 一块是什么 |
|---|---|---|
| 纯文字 | `data-content="copy"` | 标题 + 正文。只进 1 格 |
| 观点 | `data-content="point"` | 结论 + 一句。只进 1 格 |
| 带序号观点 | `data-content="signal"` | SIGNAL + 标题 + 说明 |
| 数据 | `data-content="stat"` | 大数字 + 名 + 口径 |
| 列表 | `data-content="list"` | **一条**：标签 + 说明 |
| 编号列表 | `data-content="step"` | **一步**：序号在左。只宜 1–2 格 |
| 编号列表纵向 | `data-content="step-stack"` | Grid 3 / 5–9 / 10+ |
| 表格 | `data-content="table"` | 整表。高随内容 |
| Bar | `.bar-compare` | 一组条 + 组标题 |
| Evidence | `.image-grid.evidence-gallery` | 图 + 图注。不进 Grid 格 |
| Media Switch | `.media-switch.is-cover` | 一卡一眼，底部缩略图换主图 |
| 因子公式 | `.formula` | 这个数怎么乘出来。最多 5 个因子 |
| Matrix | `.matrix` | 两轴四象限。不要加第 5 格 |
| Line Chart | `.line-chart` | 同一指标随时间。最多 2 条线 |
| Venn | `.venn` | 2 或 3 圈 |

Evidence：通用图 Fill；截图 `shot` + `0.46:1` Fit；宽/高 ≥ 2 用 `strip`（流式里竖着叠）。Media Switch 锁定 `9:16` Fill。

公式 / Matrix / Line / Venn / Evidence / Media Switch 只进 1 块，不要放进 2 格及以上。全屏有图/无图几乎用不到。

模板没有的形态（分叉流程、网络图、视频播放器）：压成 `step-stack` / 表 / Evidence 静帧。不要新分页、不要新组件。

### 列数（文档栏约 1160，不是分屏卡高）

| 格子 | 宽屏 | 变窄 |
|---|---|---|
| 1 格 copy / point | 1 栏，正文宽 880 | 1 |
| 1 格 table / formula / 图 | 栏内拉满，高随内容 | 1 |
| 2 格 | 2 列 | ≤820 → 1 |
| 3 格 | 3 列 | ≤900 → 1 |
| 4 格 stat / signal / step | 一排 4 | ≤900 → 2 · ≤620 → 1 |
| 4 格 list | 行表：标签 + 说明 | ≤820 标签改上 |
| 5 格 | 一排 5 | ≤980 → 3 · ≤620 → 2 |
| 6–9 格 | 3 列折行，一次铺开 | ≤900 → 2 · ≤620 → 1 |
| 10+ 格 | 折行 3 列，**不要横滑** | ≤900 → 2 · ≤620 → 1 |
| Evidence 多张竖图 | 按栏宽能排几列排几列 | 折行 |
| Evidence 条带 | 竖着叠，宽 100% | 1 |
| Media Switch | 一排 4 | ≤900 → 2 · ≤620 → 1 |

Grid 3 / 5–9 / 10+ 的编号列表用 `step-stack`。表和条的行数留在块内，高度跟内容。

## 3. 图

用户指定了图怎么来，按用户的。没说时：

1. 从源文件收集用到的图（文件、相对路径、或嵌入图）。
2. 落到 `Outputs/<slug>/assets/`，稿里写路径和一句说明。
3. 磁盘有、文中无：拷进 `assets/`，稿里标缺口。
4. 视频 / 交互图：先静帧当 Evidence；用户要求可点再停下来问。
5. 字体用 `templates/shared/fonts/`，不要把源稿里的嵌入字体带进产出。

## 4. 壳

- `.report-shell.is-flow`。没有 `.is-deck`，没有 `.report-pager`，没有 `.report-deck-head`。
- 拷到 `Outputs/<slug>/lib/`：`templates/editorial-flow/assets/` 的 `template.css`、`flow.css`、`template.js`，以及 `templates/shared/` 的 `components.css`、`theme-runtime.js`、`design-data.js`、字体。
- `<head>` 同时链 `lib/template.css` 和 `lib/flow.css`。不要输出去读 `../../design-system/`。
- 报告不要带 `data-catalog`。
- 封面整页。导航 52px 吸顶。栏宽约 1160 居中。
- 不要加「分屏演示 / 流式阅读」按钮。

## 5. 先写稿

没有 `Outputs/<slug>/report.md`，禁止写 HTML。稿记录**用户认定的树**和每块用哪种 Content，不是另写一份汇报。

```markdown
# [报告名]

主判断：（用户给的，或源稿里已经能复述的那句）

## 树

- 00 封面
- 01 [章名] · [判断句]
  - 01.a [Content] · [一句说明]
- …

## 01 [章名]

判断：…
`data-flow-title`：…

### 01.a

形式：formula / stat×4 / list×7 / Evidence / …
正文：…
图：
- `assets/…` — 说明
缺口：…
```

只组织：交稿，停。要页：按稿填 `editorial-flow`。

## 6. 硬禁

- 用 `knowledge-report` 第 1–2 节当本 skill 的默认切法
- 无视用户对树、措辞、源文件的指定
- 抄分屏翻页壳、`.is-deck`、`report-pager`、`report-deck-head`
- 加切换按钮，或去掉 `flow.css`
- 报告带 `data-catalog`
- 绕过 `report.md` 从源文件出 HTML；稿和页各改各的
- 抄源稿一次性 class，或发明复合卡 / 流程图 / 网络图 / 播放器
- 一个 `.page-grid` 混两种 Content，或留下空格
- 10+ 横滑；5–9 必须一次铺开
- 把章题复制到每一块；标题写成字段名或把数字再念一遍
- Formula > 5 因子，Matrix 第 5 格，Venn 4 圈，Line 3 条线
- 把公式 / Matrix / Line / Venn / Evidence / Media Switch 放进 2 格及以上

## 7. 工作流程

```
- [ ] 读用户指定的源和切法；没切法且源无章节 → 停问
- [ ] 图落到 Outputs/<slug>/assets/（按用户或第 3 节）
- [ ] 写 report.md
- [ ] 只组织 → 交稿，停
- [ ] 要页 → 抄 editorial-flow 壳；同章多块；is-flow
```

### 停下来问

- 用户没给切法，源稿也没有明确章节。
- 有好几句都像主判断，用户没指定。
- 复合块拆开后，原判断是否被拆没了。
- 图对不上任何一块。
- 视频 / 交互图除了静帧是否必须可点。
- 没说只要组织还是要页。

做完只报告：`report.md` 路径、主判断、章数、HTML 路径（若已做）、块数、图、缺口。
