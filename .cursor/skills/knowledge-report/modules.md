# 父组件选用

画布定义在 `design-system/index.html`。输出里只写 markup 与变体 class，不要带 `data-editable`。

**先选壳，再选分区，再填父组件。** 页面画布在 `design-system/index.html#pages`。分区只切空间；格子里只能放已有父组件。不要发明「封面图卡 / 同级双块 / 判断单独页」这类页面种类。

## 页面

一屏 = 去掉顶栏、章节 tab、底栏翻页之后的可视区域。套模板时复制壳或分区 markup，把占位换成作者原文和图。

### 壳

整份文档角色，就这几种：

| 壳 | 何时套 | Markup |
|---|---|---|
| 报告封面 | 整份汇报第 0 屏 | `.report-slide` > `.report-cover`：kicker + `h1` + lead + CTA。原文，不改写成判断句 |
| 章节封面 | 每章第一屏 | `.report-slide.is-chapter-cover` > `.chapter-cover`：编号 + 章名 + 原 `h2` + 导语 |
| 口径说明 | 最后一屏 | `.report-slide` > `.report-notes`：作者口径列表；仅追加生产缺口。也可用 1 分区，不必单独发明页 |

### 分区

章内标题走 `.report-deck-head`（切 `N.a → N.b` 时同一句 `h2` 不重播）。分片里的 `.section-header` 用 clip 藏起。分片自己的原 `h3`：该屏只有一个小节时放 `.section-header__part`；**一屏两个同级小节时两段都用正文 `h3`**，不要一个进顶栏、一个用 `h3`。

区内 `data-align` 不是页面种类：`center` 居中，`start` 顶对齐可滚。1 分区只居中。配图页一边固定是图。已有输出的 `data-layout` 可暂留。

| 分区 | Markup | 何时套 |
|---|---|---|
| 1 分区 | `.page-regions[data-regions="1"]` | 整屏一块，居中 |
| 配图 · 左右 | `[data-media-page="split"]` | 左图右文。图区不是 Evidence，不显示图注；右侧定宽，默认文案或 List / Steps / Band / Bar Compare。不得用 Card Grid、Data Table。Band 最多 6 张且贴边；Bar Compare 默认横向条；其余留间距后 fill |
| 配图 · 上下 | `[data-media-page="stack"]` | 上图下文。图区不是 Evidence，不显示图注。图 fill 宽度，剩余高度给图；底部定高只排 1 行，默认文案或 Callout / Highlight Band / Card Grid / Stat Grid。Grid 四周留间隔后，再上下左右铺满剩余内容区 |

```html
<div class="page-regions" data-regions="1" data-align="center">
  <div class="page-region" data-size="fill">…父组件…</div>
</div>
<div class="page-regions" data-regions="2" data-split="rows" data-track="fit-fill">
  <div class="page-region" data-size="fit">…</div>
  <div class="page-region" data-size="fill">…</div>
</div>
<div class="page-regions" data-regions="3" data-track-x="fill-fill" data-track-y="fill-fit">
  <div class="page-region" data-size="fill">左</div>
  <div class="page-region" data-size="fill">右</div>
  <div class="page-region" data-span="foot" data-size="fit">底</div>
</div>
```

分页看关联性：同论点合并；证据 vs 判断拆开；同一流程不要拆。判断可放 1 分区居中，不要为此再发明一页。

## 结构

| 内容信号 | 组件 | Markup |
|---|---|---|
| 章节开场：作者原标题 + 原导语 | Section Header | `.section-header`：编号在上，标题和导语在下。`h2`、intro 贴原文。导语不要设 max-width，避免提前换行 |
| 页内跳转 | Document Navigation | `nav.document-nav.nav-underline.is-sticky`；切屏模式下仍保留顶上章节 tab，点 tab 进该章第一屏 |
| 左右分栏（比较条 + 侧轨、步骤 + 约束） | 模板布局 | `.report-split`（不是父组件，可与父组件组合） |
| 一屏一页 | 模板切屏 | `.report-shell.is-deck`。章内标题用 `.report-deck-head`，切分片时 `h2` 不动。分页看关联性。分片用 `.page-regions` 或配图页 `[data-media-page]`。居中分区左右拉满。图 + 独立正文用配图页。封面展开用 `.is-cover`，Hover 按每张图 `data-hover="on|off"` 开关。 |

## 观点与清单

| 内容信号 | 组件 | Markup / 变体 |
|---|---|---|
| 多个并列判断，每卡一个主题 | Card Grid | `.card-grid`，`--component-columns` |
| 图 + 标题 + 多行字段 | Media Switch 封面展开 | `.media-switch.is-cover`：主图当封面；`.media-switch__label` 放原标题；`.media-switch__panel` 从底部铺满图窗（`inset: 0`，边缘不留白），内含原导语和 `.list-block`，超出则面板内滚动。Hover 按每张图 `data-hover` 开关；开启时仅 hover 主图出现，hover 底部缩略图不展开。桌面 hover，触控或关闭 hover 时点主图 |
| 无图、多卡字段要对齐 | Card Grid 行对齐 | `.card-grid.is-aligned` + 每卡 `.list-block`；清单行数写 `--aligned-list-rows`。超过 1 列时标签在上、内容在下；行内间距用 `--space-2`，不要用卡片默认 `--card-padding` |
| 大数字建立尺度 | Stat Grid | `.card-grid` 内 `.stat-value` + 标题 + 口径说明；**同一条左缘** |
| 规则 / 条件 / 字段定义 | Labeled List | `.list-block` > `.list-row`（`.list-row__label` + `.list-row__text`） |
| 深色关键观点带 | Highlight Band | `.highlight-band`（默认深色分割） |
| 浅色并列要点（原 Fact Columns） | Highlight Band | `.highlight-band[data-decoration="facts"]`，列数用 `--component-columns` |
| 结论收束、比较原则、风险边界 | Decision Callout | `aside.callout`，常用 `data-decoration="left"` |

Highlight Band 不要同时当深色带和浅色要点用在同一视觉角色里：强调用深色，说明性并列用 `facts`。

## 流程

| 内容信号 | 组件 | Markup / 变体 |
|---|---|---|
| 有先后顺序的步骤 | Process Steps | `.steps` > `.step`（`.step__index` + `.step__title` + `.step__body`） |
| 无编号的侧轨说明（原 Rail List） | Process Steps | `.steps.is-rail`；侧轨项仍用 `.step`，可省略编号 |

## 数据

| 内容信号 | 组件 | Markup / 变体 |
|---|---|---|
| 行=对象、列=字段 | Data Table 标准表 | `.table-wrap` > `table.data-table` |
| 列=对象、行=维度；可带 TOP 徽章 | Data Table 矩阵 | `table.data-table.is-matrix`；徽章用 `.badge.success` / `.warning` |
| 同类量的横向比较（价格、占比） | Bar Compare | `.bar-compare` > `.bar-compare__item` |
| 同类量的纵向并排竖条 | Bar Compare | `.bar-compare.is-vertical` |

Data Table：同一数据源只出一种朝向。优劣单元格用 `.cell-best` / `.cell-weak`，比率用 `.cell-ratio`。

Bar Compare：

- 横向：标签 | 轨道 | 数值三列用同一条网格对齐（subgrid），列宽分别跟最宽标签 / 最宽数值走，列间距一致；说明在 `.bar-compare__note`。轨道不得伸进数值列
- 纵向：条目并排；每项网格为 标签 → 等高轨道 → 数值 → 说明；填充用 `--bar-size` 或横向 `width:%`。纵向轨道宽度 = 横向轨道高度（`--bar-thickness`）
- 语义色：`data-tone="warning|danger|success"`，默认走 `--accent`
- 条目数量 = 可见项数。不要再设独立「列数」

## 媒体

默认 **上图下文**。先量图、再打标，不要凭感觉套 cover。

**怎么分类**

1. 量宽高。宽/高 ≥ 2 → `data-image-kind="strip"`。
2. 默认不裁切：`data-image-fit="fit"`（contain）。需要铺满窗口时用 `fill`（cover）。
3. 窗口比例用 `data-image-ratio`（1:1 / 4:3 / 3:4 / 9:16），切换必须改变容器。App / 手机截图锁定 `shot` + 9:16。
4. 源页「一卡一眼 + 底部缩略图切换」用 Media Switch。每张图有独立图注时用 Evidence 单行。不要再单独做「单图」种类。

| 素材 | 窗口 |
|---|---|
| 通用图片 | `data-image-ratio` + `data-image-fit="fit|fill"`。默认 Fit 完整露出 |
| App / 手机界面截图 | `data-image-kind="shot"` + `9:16`：固定 9:16；默认 Fit，超出窗内滚 |
| **超长横图**（宽/高 ≥ 2） | `data-image-kind="strip"`：只放 1 张，左对齐，过宽横滑。不要限制最大宽高 |
| **同一窗口切换多图** | Media Switch：主图按当前比例；缩略图叠在主图底部；点主图放大 |
| **图当封面、知识藏在后面** | Media Switch `.is-cover`：知识从底部铺满图窗；每张图用 `data-hover="on|off"` 决定要不要 hover 展开 |

| 内容信号 | 组件 | Markup |
|---|---|---|
| 一组独立证据图（各有图注） | Evidence Figure 单行 | `.image-grid.evidence-gallery` > `figure.evidence-figure`：只排一排，高度铺满，宽度 = 高度 × 比例；放得下均分边距，放不下横滑并露出 N 张半 |
| 一张图 + 图注 | Evidence Figure | `figure.evidence-figure` 或一行一张的 `.evidence-gallery`，`data-image-fit="fit"` |
| 一张图 + 分量相当的独立正文 | 配图页 | `.page-regions[data-media-page="split|stack"]`：一边是纯图（无图注），另一边默认文案或可替换父组件 |
| 一卡一眼、底部缩略图切换 | Media Switch | `figure.evidence-figure.media-switch`；主图 `[data-media-main]`；`.media-switch__thumbs` > `.media-switch__thumb` |
| 图 + 标题 + 字段藏在封面后 | Media Switch 封面 | 同上并加 `.is-cover`；`.media-switch__label` + `.media-switch__panel` |

**配图页：** 不是父组件。`.page-regions[data-media-page]`。图槽不是 Evidence，左右和上下都不显示图注。左右：图 fill 高；右侧定宽，可换默认文案 / List / Steps / Band / Bar Compare，不得用 Card Grid、Data Table；右侧模块留间距后铺满宽高，Band 最多 6 张且贴边、不要上下左右 padding；Bar Compare 默认横向条。上下：图 fill 宽，底部定高且 1 排，可换默认文案 / Callout / Highlight Band / Card Grid / Stat Grid；Grid 四周留间隔后，再上下左右铺满剩余内容区。默认文案用原来 Media Card 的标题/正文/来源样式。

**Media Switch：** Evidence 的一种。源页已经是「一张主图 + 底部缩略图切换」时使用。主图窗口遵循当前素材规则（现场照 3:4 cover，截图 shot）。点缩略图只换主图；点主图进灯箱。有标题和字段要省空间时加 `.is-cover`，知识从底部铺满图窗，不要再把清单铺在图下面。Hover 按每张图 `data-hover` 开关；开启时仅 hover 主图展开，hover 底部缩略图不展开。不要搬源 `.gallery-thumbs` / `data-gallery`。每张图有自己的图注时，改用 Evidence 单行。排列数量是一行里的张数，缩略图数量单独设。

**Evidence：** 永远只有一排，禁止折成第二排。高度铺满格子，宽度 = 高度 × 所选比例（截图锁定 9:16，条带跟图宽）。1 张水平居中；多张且一屏放得下时，左边距 = 图间距 = 右边距；放不下则横滑，触发张数按当前比例一屏能放下几张自动算，首屏露出 N 张半。默认 Fit 不裁切，可选 Fill。条带只放 1 张。不要限制最大宽高。不要对 Evidence 套 2×2 均分网格。图下文字区等高，最多 2 行（标题 1 行 + 说明 1 行，超出省略）。左右分区里只放 1 张。

**分区约束：** 居中分区左右拉满页面宽度，不要再收成窄栏。配图页图槽不是 Evidence，不显示图注。Labeled List / Process Steps / Data Table / Bar Compare 默认宽度拉满、高度 fill；条目均分高度并在各自格子里垂直居中；不要顶部装饰线。左右留白写在页面分区，不要写进父组件：1 分区用 `--page-region-inset`；左右配图写在 copy 槽的 `--media-copy-inset`（Band 贴边、不要 padding）；上下配图写在 copy 槽自己的 padding。横滑和区内滚动不显示滚动条。左右配图不得用 Data Table，Bar Compare 默认横向条，Band 最多 6 张。

**Stat Grid：** 数字、标题、说明从卡片内边距开始排，同一条左缘。2×2 时两行卡片等高。不要把带主图卡的额外 padding 套到统计卡上。

**列数必须整除张数，不要留下孤立的一行。** 这条只约束 Card Grid / Stat Grid / Highlight Band：4 张用 2×2 或 4×1，5 张用一排 5 列，6 张用 3×2 或 2×3。7 张以及 9 张及以上强制一行横滑（`.is-horizontal`），卡宽固定为一屏 5.5 张（右侧露出半张），不要收成 1 列竖排，也不要出现 3+1。写上 `data-item-count`。1080px 时 `.is-horizontal` 仍横滑。Evidence 不走这套，始终单行，能否放下按当前比例自动算。

**Highlight Band / Card Grid / Stat Grid：** 标题和说明在格子里垂直居中。多组并排时，说明行跟文字最多的那组等高。

源 HTML 引用的图片全部保留：先 `cp -R` 源 `assets/`，再按原 `src` 写相对路径。不要用无 `src` 的色块占位。图注、`alt` 用原文。灯箱交互可放 `content.css`，不能当漏图的理由。

## 自适应

父组件已有断点，不要在输出页另写一套布局：

| 宽度 | 行为 |
|---|---|
| > 1080px | 按 `--component-columns` 分列；网格轨道用 `minmax(0, 1fr)` |
| ≤ 1080px | Card Grid / Highlight Band：偶数张收成 2 列，奇数张 1 列（`.is-horizontal` 除外）；Evidence 仍单行横滑；`.report-split` 与多列 `.page-regions` 单列 |
| ≤ 900px | 配图页单列 |
| ≤ 620px | 全部单列（`.is-horizontal` 除外） |

宽表只在 `.table-wrap` 内横向滚动，不能把整页撑出视口。章节栈、分栏、卡片都要 `min-width: 0`。

## 选用原则

- 先选壳，再选分区，再往格子里填父组件。不要为单份材料发明新的页面种类。
- 能用表说清的不要拆成一堆卡片；能用三条步骤说清的不要做成时间线自定义布局。
- 同一节里同类信息只用一种模块。
- 选模块依据是信息关系（并列、顺序、比较、证据），不是源 CSS。作者章节顺序和原文仍保留。
