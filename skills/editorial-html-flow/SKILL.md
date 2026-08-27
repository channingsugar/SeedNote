---
name: editorial-html-flow
description: >-
  Builds or regularizes a long-form 流式 HTML report from templates/editorial-flow/,
  then attaches editor/ so text and images can be right-click edited. Use when
  the user asks to 规整 / 换皮 / 套组件 / 视觉规范 / 流式 / 独立版, pastes 大纲 / 笔记 / 想法,
  or wants a 可编辑 HTML 文档 without 分页. If there is no source HTML, compose
  from the catalog. Do not use to generate a paginated 分屏 deck
  (that is editorial-html-page).
---

# 流式 HTML 文档

给任意 Agent 用。路径相对带着 `templates/` 的仓库根。分页 / 分屏 / 一屏一问走 `editorial-html-page`。没说分页，默认这套：`templates/editorial-flow/`。

## 先选路径

| 用户给了什么 | 走哪条 |
|---|---|
| 已有长文 HTML | **规整**：梳理 → 合并确认 → 换皮 → 挂编辑器 |
| 大纲 / 笔记 / 想法 / 让你先写大纲 | **生成**：先树，再对照目录套组件 → 写出报告 → 挂编辑器 |
| 明确要分页、一屏一问 | 停，改用 `editorial-html-page` |

没有 HTML 不要问「源文件在哪」。用目录里的父组件实现用户的文档。缺了才新增。

## 生成（没有源 HTML）

组件目录：`templates/editorial-flow/index.html`（由 `_build_catalog.py` 生成）。报告壳：`templates/editorial-flow/report.html`。

### 1. 章节树

材料不够就先写大纲（章名 + 每章判断句 + 拟用组件），确认后再做。用户说直接做，跳过确认。

不编数字、不编口径、不把笔记里没有的判断写成事实。缺数就留空或写「待填」，让用户右键补。

### 2. 对照目录选组件

按**结构和作用**选，不按章节名另起皮肤。先打开目录，能对上就复用，变体用 `data-*` / `is-*`。

| 这块像什么 | 用 |
|---|---|
| 章主张 / 判断句 | `.slide-head`，下方必须紧跟强线 `.rule` |
| 一段解释 | `.research-lead` |
| 来源 | `.source-note`，贴在所属证据下 |
| 并列大数字 / 数字 + 名 + 说明 | `.stat-card` / `.stat-grid`。横排是紧凑排 `.stat-grid.is-compact`。右键勾选前缀 / 后缀 / 说明，列数 2–5 |
| 编号步骤 / 标签列 | `.info` / `.info-grid`。布局四选：**格子 A** `cols`（左侧竖线，含第一格）/ **格子 B** `cols` + `data-grid="b"`（四周框）/ **列表 A** `stack`（≥5 条默认）/ **列表 B** `row`（提问）。≤4 条默认格子。2 条 `data-cols="2"`，4 条 `data-cols="4"`。编号位置 `data-pos`：`top` 顶部 / `left` 左侧。`data-index`：默认数字 / `alpha` 字母 / `q` 问题 / `label` 标签 / `off` 隐藏。勾选「背景」`data-bg`，默认纯色 `--tint-2`（不要用 `--grad-tint`），色用 `--info-bg`。整组右键勾选「配图」插入一张 `.shot`，放在一组信息的左 / 右（`data-aside="left"` / `"right"`，配图面板在编号位置右侧），不要给每一条单独配图。配图右键可换 `data-kind`（裁切 / 可滚动 / 宽图 / 海报），底部保留 figcaption。尺寸只拖配图外框（和图片组一样），内部图高度始终铺满外框；拖高时整组与左侧信息跟着变高。P0、属性名用类型「标签」（默认直角 `--r-none`，小圆角只用 `--r-sm` 4px，不是胶囊），提问用类型「问题」。右键按分类切换布局、是否显示编号、背景、位置、类型、字号 |
| 提问（Q1…） | `.info-grid[data-layout=row]`，不要再叠无编号 |
| 无编号要点 | 同一套 `.info` / `.info-grid`，默认 `data-index="off"`。右键勾选「显示编号」即可变成编号信息；格子 A / 格子 B、列数、配图与编号信息相同 |
| 一句判断 | `.point` |
| 议题格（编号议题 + 格内证据） | `.pain-text-list` > `.pain-topic`。`data-cols` 1–5（默认 2）；格子 A 每格左侧竖线（含第一格，不要底边）；格子 B `data-grid="b"` 四周框。整组右键可勾选「配图」，图在一组议题的左 / 右 |
| 自定义文本（自由编辑：字号 / 颜色 / 加粗 / 弱分割线） | `.finding` |
| 图文卡（方案名 + 对比句 + 属性行 + 缩略图） | `.transport-cards` > `.transport-card` |
| 图 | `.shot` / `.shot-grid`；方案标签用 `.shot-plan`。右键可新增一条，列数 1–5。拖整组高度时各行均分，内部卡片铺满；填充「适应 / 铺满」批量作用到组内每张；铺满只裁切且不超出容器 |
| 表 | `.plain-table-wrap`。浅底表头、横竖弱线、左列加粗。两行表头用 `.table-level` / `.table-score`；强调列 `th.is-accent` |
| 公式 | `.market-formula` |
| 折线 | `.rail-growth-chart` |
| 四象限矩阵 | `.ansoff-grid` |
| 漏斗 | `.hotel-funnel-chart` |
| 关系网络（起点—终点连线） | `.hotel-city-network` |
| 节点表 | `.network-node-table` |
| 排行榜 | `.hotel-ranking-block` |
| 韦恩 | `.venn-wrap` |
| 导航 | `.topbar`（目录页和报告都用这个） |

利益点、步骤、问答不是数字卡。卡内条目不要抬成新的一排。公式、议题格、图文卡、提问、韦恩只放内容，不要把章头、分割线、导语画进去。

### 3. 缺了才新增

现有父组件槽对不上（形态或语义真不同）才新增。新增前先写：名称、结构槽、为什么现有的不行。用户没点头不要改 CSS。

点头之后：

1. 在 `_build_catalog.py` 加一条 `lab()`，样式进 `assets/lib.css`（变体 `data-*` / `is-*`）。
2. 不得新增字号或颜色档，只用已有 token。
3. `python3 templates/editorial-flow/_build_catalog.py` 重出目录。
4. 报告里用同一套 class。

不要为这一份报告私造一套皮肤。

### 4. 写出报告

从 `templates/editorial-flow/report.html` 拷到 `Outputs/<slug>/index.html`。不要抄 `index.html` 目录页，不要加 `data-catalog`，不要包 `.flow-lab`。

产出目录建议：

```
Outputs/<slug>/
  index.html
    lib/
    lib/
    components.css, design-data.js, theme-runtime.js   ← templates/editorial-flow/design-system/
    template.css, flow.css, source.css, lib.css, v2.css
    template.js, source.js, network.js（用到关系网络才拷）
    editor/seed-edit.css, seed-edit.js                 ← templates/editorial-flow/editor/
```

HTML 里的路径按实际相对位置改。章结构：`.report-slide` 一章一块，块内 `.flow-stack` 上下叠。每章 `.slide-head` 下必须有 `.rule`。导航 `.toc` 要带 `data-component-id="navigation"`，链到各章 `id`。

用到关系网络才引入 `network.js`。图用占位框也可以，用户右键替换。

做完挂编辑器（见下）。只报告：路径、用了哪些父组件、有没有新增、数字是否都来自用户材料。

## 规整（已有 HTML）

用户指出的文件就是源。没路径就停问。大文件把 `data:` 换成占位再抽结构，不要整文件读进上下文。不重写论证，不改数字、口径、判断句、章节树、图和字体。

先交组件库文档（含 token 和视觉自查），确认后再改源 HTML。有现成目录时对照 `templates/editorial-flow/`。

四步。前三步顺序不能倒；第一、二步只写文档；第三步才改 HTML；第四步挂编辑器。

### 第一步：全量梳理，生成组件库，自查视觉问题

列出源稿里实际出现的每一类块：出现位置、结构槽、现行 class、视觉问题。

组件库必须带可复用 token，合并和改 HTML 都只用这套。目录页必须陈列基础 token，不能只写在 CSS 注释里：

| 种类 | 收成什么 |
|---|---|
| 圆角 | `--r-none` 直角 0、`--r-sm` 小圆角 4。标签编号默认用直角，不要用胶囊。必须有 token 名和 px |
| 间隔 | `--s-in` 区内、`--s-stack` 换排、`--s-chapter` 换章，以及图墙内部。必须有 token 名和 px |
| 颜色 | 正文、次级、三级、线、强调；表数据栏另备正负向 `--c-pos` / `--c-neg`。种类尽量少 |
| 字号 | 章题、小节、**数据**、编号（含大编号）、正文、辅助。同级必须同号 |
| 分割线 | 强 / 弱。主标题下必有强线 |

token 从源稿现用值收敛，不另起一套。合并后只减不增。目录里还要有编号信息的**大编号**变体（`.info.is-lg` 或 `data-no="lg"`），以及数字、标题、副标题纵向叠、卡片横向排的变体（`data-layout="cols"`）。

自查至少覆盖：叠线、段线画进组件、间距一刀切、来源和证据脱节、同行底不齐、无意义横滚、字号种类过多、颜色过花、**主标题下缺横线**、小节标题下多线。问题记在该类下面，这一步不改 HTML。

### 第二步：合并结构和作用接近的块

结构和作用接近 → 同一父组件，变体用 `data-*` / `is-*`。形态或语义真不同 → 不合并。交合并后的组件库，停。用户改了表或 token，按改过的执行。

### 第三步：按确认后的库换皮

按父组件换皮；按固定规则收标题、线、间隔；CSS 只引用组件库里的 token。大文件 tokenize → 改 markup/CSS → 还原。不要重写图。

做完只报告：改了哪个文件、相对确认稿有无出入、有没有动数字和树。

## 挂上编辑组件

生成和规整的最后一步相同。编辑器只属于流式：`templates/editorial-flow/editor/`。不要挂到分屏模板，也不要在本说明旁再拷一份。

改编辑器只改 `templates/editorial-flow/editor/`，再同步已经挂到产出里的 `lib/editor/`。

**接到产出：**

1. 从 `templates/editorial-flow/editor/` 把 `seed-edit.css`、`seed-edit.js` 拷到报告旁，建议 `lib/editor/`。
2. 设计语言从 `templates/editorial-flow/design-system/` 拷 `components.css`、`design-data.js`、`theme-runtime.js` 和 `fonts/`。不要读 `templates/editorial-page/design-system/`，也不要读仓库根的旧 `design-system/`。
3. 在 HTML `<head>` 或文末引入（路径按实际相对位置改）：

```html
<link rel="stylesheet" href="lib/editor/seed-edit.css">
<script src="lib/editor/seed-edit.js" defer></script>
```

4. 脚本会自行挂上。不依赖分屏壳、不要求 `[data-report-stage]`。不要再复制一份编辑逻辑进报告自己的 JS。
5. 改动存在浏览器 IndexedDB，刷新还在；**不会写回磁盘上的 HTML**。需要落盘就让用户导出或另存。
6. 主题导入导出只在目录 `templates/editorial-flow/index.html`。报告壳 `report.html` 不要做主题栏。

用法：文字右键 →「编辑」→「完成」（Esc 取消，Enter 提交；编辑时可选颜色，也可点旁边的 token 色块换成主题色；自定义文本还可改字号、插入整行弱分割线）；标题右键「删除本组」会删掉标题及其下组件；页面空白处右键「新增组件」插入目录里的父组件；悬停左侧六点手柄拖动排序（拖动时只显示标题，拖到底部垃圾桶可删除；组件排序时封面不显示）；编号信息等条目可右键新增/删除一条，也可在组件内拖拽排序。图片 / 视频 / SVG 图示右键 →「替换」或「尺寸」。封面右键切版式（左齐 / 居中 / 配图 / 图文分栏），配图封面可替换图片；图文分栏封面高度固定为一屏。编号信息右键改布局（格子 A / 格子 B / 列表 A / 列表 B），勾选「显示编号」后编号位置 / 类型 / 字号出现在菜单右侧，勾选「背景」后可设背景色，格子列数用 − N +（2–5）。编号信息和议题格右键可勾选「配图」；图在整组信息的左 / 右，配图面板在编号位置右侧，不要给每一条单独配图。配图右键可换裁切 / 可滚动 / 宽图 / 海报；拖配图高度时整组与左侧信息跟着变高。数字信息右键勾选前缀 / 后缀 / 说明，列数用 − N +（2–5）；横排数字是同一父组件的紧凑排。无编号信息和议题格可切格子 A / B，议题格列数 1–5。观点可切换色块 / 浅底；图可切换裁切 / 可滚动 / 宽图 / 海报，右键可新增一条并用 − N + 改列数（1–5）。图墙拖高后各行均分，铺满只裁切且不超出容器。图表改数字后曲线跟着动。⌘Z / Ctrl+Z 撤销，⌘⇧Z / Ctrl+Y 重做（含换图、删组、新增、排序）。尺寸可改对齐（左/中/右）、容器宽度（拖右边手柄）、高度（拖下边手柄）、填充（适应 fit / 铺满 fill）。表和折线图同样可拖宽高。图表改数字后纵轴刻度按新最大值重算。基础 token 右键改数值，立刻作用于整页并写入当前主题；颜色 token 点色块用取色器，也可改 hex。主题导入导出在目录页。SVG 上的字可编辑，点空白图形则整图替换。

**编辑器必须做到（不要退回分屏白名单版）：**

这份组件是给任意长文 HTML 用的，不是给某一套模板 class 用的。从 `template.js` 抽出时踩过这些坑，不要再写回去：

- 不要用 `h1, p, .stat-card p` 这类白名单认字。按点击处找最近的文字节点（含 `strong` / `b` / `small` / 卡内短句 / SVG `<text>`）。
- 不要只用 `<img>` 认媒体。`<video>`、内容 SVG（韦恩图、漏斗、路线图）都要能「替换」；装饰用的 sprite / 工具按钮图标不要当成可换图。
- 右键用捕获阶段拦住，否则会被浏览器默认的图片/视频菜单抢走。
- 提交时存 `innerHTML`，不要用 `textContent` 整格覆盖——表格里「店名 + 红色价格」会被冲成一行黑字。
- 顶栏、目录可以排除；不要把所有 `button` / `nav` 都排除，图墙缩略图往往包在按钮里。

## 原则

### 梳理

按结构和作用认块，不按章节名。同一结构在多章出现，算同一组件。先穷尽再分类。语义跟着槽走：大数字是主角才是数字信息；编号+标题+说明是编号信息。利益点、步骤、问答不是数字卡。卡内条目不要记成新的一排。

### 合并

结构和作用接近 → 同一父组件，不要为每一章另起皮肤。变体用 `data-*` / `is-*`。形态不同或语义不同 → 不合并。有现成目录就对照提案并写差异；没有就在这份源稿的 class 上合并。不要把案例里的名字硬套到下一份源稿。

### 优化

只使用已确认组件库里的父组件和 token。组件不自带段线。来源贴在所属证据下，用区内间隔。同行并列底边齐。表能放下就不要用 `min-width` 挤出横滚。不要做成圆角大卡片壳、一屏一问，也不要把组合再收成另一套标题组件。组件目录里公式、韦恩图、提问、议题格、图文卡只陈列内容，不自带章头、分割线和导语。议题四格、图文四卡、宽图（含方案标签）在组件区完整铺开。提问不要再叠一块无编号信息。

### 标题、分割线、间隔（固定）

**标题**只保留 token 里的档。章头（kicker + 判断句，可带副题）与小节标题不得混用字号。不要把数字再写成标题。

**分割线**是独立组件，不画进标题或信息块。两块信息中间最多一条。封面不加章线。下一块若已自带段线，删掉那条，只留独立线。

- **每个主标题**（章头 `.slide-head` / 判断句 h2）下方必须紧跟一条可见的**强线** `.rule`。不得省略，不得用「下一块顶线」替代，CSS 不得把这条线 `display:none`。缺线时补 markup；没有 `.rule` 时才允许用标题 `::after` 兜底，二者不要叠成双线。
- 小节标题 → 本节：**不加线**，只用间隔。不要给 `.subsection > h3` 画 `border-bottom`，也不要在小节下插 `.rule`
- 其余块之间：不加线，只用间隔
- 表 / list / 卡内部：只用弱线

**间隔**只用 token 三档。不要给章的每个直接子元素同一档 `gap`。

- 区内 `--s-in`：标签→数字→来源；**章头→强线**；图墙内部
- 换排 `--s-stack`：强线→第一块；导语↔卡、图↔观点、小节与小节
- 换章 `--s-chapter`：本章末到下一章 kicker

**字号与颜色**：组件库有几档，HTML 就只用几档。新皮肤不得新增。对比靠层级和字重；普通数字、表头、表左列、徽章默认用正文色。**表的数据栏**可用 `--c-pos` / `--c-neg` 做正负向突出，不要涂到表头。编号信息默认小号编号；需要强调步骤序号时用大编号变体。条数不超过 4 用「编号在上」，不要用「编号列表」。

## 案例

一次长文源稿有几十个一次性 class。第一步列出全部块并记叠线、间距一刀切、表色过花；收敛间隔三档、灰阶正文色、有限字号。第二步把横排数字、数字卡、编号信息、无编号、观点、图、表各自收成父组件；利益点不并进数字卡；公式、议题格、图文卡、韦恩图独立。第三步按确认后的库换皮，章头一条强线，其余换排只留间隔。第四步把 `editor/` 拷进产出并引入，右键改字换图。

没有源 HTML 时：大纲里并列的议题四格对上 `.pain-text-list`，方案对照四卡对上 `.transport-cards`，不要各写一套卡。目录里没有雷达图，先提案再新增，不要拿四象限矩阵顶上。

当时父组件与 token（示例，不是下一份源稿的必用名）：

| 内容 | 父组件 | 变体 |
|---|---|---|
| 封面 | `.chapter-cover` | `data-cover`：省略左齐；`center` 居中；`image` 全幅配图；`split` 图文分栏 |
| 章头 | `.slide-head` | 可带 `.sub` |
| 强 / 弱线 | `.rule` / `.rule.is-soft` | — |
| 数字信息 | `.stat-card` / `.stat-grid` | 紧凑横排 `.is-compact`；`data-prefix` / `data-suffix` / `data-kicker`；`data-cols` 2–5。旧 `data-variant="note"` 等同后缀+说明 |
| 编号信息 | `.info` / `.info-grid` | 布局：格子 A `cols` / 格子 B `cols`+`data-grid="b"` / 列表 A `stack` / 列表 B `row`；`data-pos`：顶部 `top` / 左侧 `left`；`data-index`：数字 / `alpha` / `q` 问题 / `label` 标签 / `off` 隐藏（即原无编号）；`.is-lg` / `data-no="lg"` 大编号；`data-bg` 背景，默认纯色 `--tint-2`，`--info-bg` 色。配图挂在整组：`.info-grid > .comp-media` > `.shot`，`data-aside="left"` / `"right"`；配图可换 `data-kind`，底部保留 figcaption。尺寸只拖 `.comp-media` 外框，内部图高度铺满，拖高时整组与左侧跟着变、不裁切文字和说明。旧 `data-layout="label"` 等同列表 A + 类型标签 |
| 议题格 | `.pain-text-list` / `.pain-topic` | `data-cols` 1–5；格子 A 左侧竖线；格子 B `data-grid="b"` 四周框；整组可配图 |
| 观点 | `.point` | `.is-soft` |
| 图 | `.shot` / `.shot-grid` | `data-kind`；`.shot-plan`；`data-align` / `data-fit`；设高后行均分、铺满裁切且不超出容器 |
| 表 | `.plain-table-wrap` | 浅底表头；`.table-level` / `.table-score`；`th.is-accent`；数据栏 `.best`/`.weak` 或 `.is-pos`/`.is-neg` |
| 来源 | `.source-note` | 区内贴证据 |
| 圆角 | `--r-none` 0 直角；`--r-sm` 4 小圆角（编号类型「标签」默认直角） | — |
| 间隔 | `--s-in` 16 区内；`--s-stack` 40 换排；`--s-chapter` 96 换章 | — |
| 字号 | `--t-h1` 章题 / `--t-h2` 20 / `--t-num` 数据 / `--t-no-lg` 大编号 / `--t-body` 16 / `--t-aux` 12 | — |
| 颜色 | `--c-text` 档 / `--c-line` / `--c-accent` / `--c-pos` / `--c-neg` | — |

编号列若有分支：编号占满左列，其余进正文列。`.shot-plan` 标签和名称同号。
