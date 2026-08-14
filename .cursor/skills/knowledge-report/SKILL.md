---
name: knowledge-report
description: >-
  Rebuilds user-supplied research materials (HTML, outlines, notes, screenshots)
  into a token-driven knowledge-report using the editorial template and parent
  components, while keeping the author's original wording and every source image.
  Use when the user pastes or points to HTML, 大纲, 调研, Inputs, References, or asks
  to 套模板 / 生成汇报 / 输出页面. Recompose layout only; never rewrite the author's copy
  or drop media because search tools ignore binaries.
---

# Knowledge Report

把用户资料套进可换主题的知识汇报页。

换的是壳（模板 + 父组件），不是稿。源 HTML 只当版式蓝本丢弃，作者正文、标题、表格数字、图注和图片全部保留。

## 问题出在哪（必读）

上一版 skill 把两件事混成了一句「重新理解输出」，导致错误执行：

1. **改稿。** 「封面写成判断句」「补导语」「不按源顺序照搬」「按地图重写正文」被理解成改写作者标题和段落，读感变差。正确范围只是：换章节骨架和父组件，**句子仍用原文**。
2. **漏图。** Glob/Read 常读不到 `assets/` 里的 jpg/png（被 ignore）。把「工具搜到 0 个文件」当成「Input 没有图」，再以「避免空图」整段删除。正确做法：从 HTML 的 `src` / `data-src` 建清单，用 `find`/`ls`/`cp` 复制，一张不漏。

## Hard rules

1. **换壳不改稿。** 禁止原 DOM 换皮、搬运源 CSS、发明页面级自定义布局。同样禁止改写作者标题、导语、段落、表头、图注、结论。结构用模板重排；文字用原文粘贴。
2. **原文优先。** `h1`、章节 `h2`、导语、卡片/步骤/表格/条图上的用词，一律取自 Inputs。需要衔接时只加模板需要的壳（编号、导航短标签），不另写一套更「汇报腔」的句子。作者大纲的章节顺序默认保留。
3. **图片一张不漏。** HTML 里出现的每张图都要进 `Outputs/<slug>/assets/`，并用 Media Card / Evidence Figure 就近放回对应原文。禁止因搜索工具找不到二进制、或源页有缩略图切换而省略。
4. **不发明事实。** 不编数字、政策、价格、截图结论。原文已有的判断不要改得更满或更空。
5. **视觉只走 Token。** 颜色、字号、间距、圆角、线宽用 `var(--*)`。主题切换必须整页生效。
6. **只用已有壳、分区和父组件。** 先选壳，再选分区，再填 [modules.md](modules.md) 里的父组件。禁止发明页面种类或页面级自定义布局。没有合适模块时：原文段落 + Section Header。源页「一卡一眼 + 底部缩略图」用 Media Switch，不要拆成 hidden 图或另做画廊。
7. **先建清单再写页。** 未完成原文块清单与图片复制前，不要开始写 `index.html`。

## Workflow

```
- [ ] 1. 收资料：正文块 + 图片清单 + 分类打标（shell，不靠 glob）
- [ ] 2. 内容审计（完整 / 相关 / 缺口）——不改写
- [ ] 3. 页面地图：原文块 → 壳 + 分区（design-system #pages），再填父组件
- [ ] 4. 复制图片与模板壳
- [ ] 5. 套页面输出（粘贴原文）
- [ ] 6. 自检：原文、图片、主题
```

### 1. 收资料

- 源目录优先 `Inputs/<slug>/`，其次用户指定的 HTML / 大纲。
- **正文：** 按作者章节抽出 `h1/h2/h3`、导语、列表、表格、价格条、图注。丢掉的只有 class、布局、配色。
- **图片：** 不要用 Glob 判断有没有图。执行：

```bash
# 列出 HTML 引用
rg -o 'src="[^"]+"|data-src="[^"]+"|data-lightbox-src="[^"]+"' Inputs/<slug>/index.html
# 列出磁盘文件（ignore 挡不住 find）
find Inputs/<slug> -type f \( -name '*.jpg' -o -name '*.png' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.gif' \)
```

清单以 HTML 引用为准，磁盘文件必须全部复制；HTML 引用了但文件缺失才记缺口。

- **图片分类（先量图，再打标）：** 细则见 [modules.md](modules.md#媒体)。不要凭感觉套 4:3/3:4 cover。

| 判断 | Markup |
|---|---|
| 一组 App / 手机截图 | `data-image-kind="shot"` `9:16` 容器，默认 Fit 完整露出，超出则窗口内上下滚动 |
| 通用图片 | `data-image-ratio` + `data-image-fit="fit|fill"`，默认 Fit 不裁切 |
| 宽/高 ≥ 2 | `data-image-kind="strip"`：只放 1 张，左对齐横滑，不限制最大宽高 |
| 源页一卡一眼 + 底部缩略图 | Media Switch：`.evidence-figure.media-switch`，主图按当前比例，缩略图叠在主图底部 |
| 图当封面、标题和字段藏在后面 | Media Switch `.is-cover`：知识从底部铺满图窗；每张图用 `data-hover="on|off"` 决定要不要 hover 展开；开启时仅 hover 主图出现，hover 缩略图不展开 |

- 输出目录：`Outputs/<slug>/`。

### 2. 内容审计

只回答，不改稿：

| 问 | 用途 |
|---|---|
| 作者要读者决定什么？ | 用来选强调模块，不另写封面标题 |
| 哪些图/表支撑哪一句原文？ | 图必须紧挨原句，不要抽走 |
| 是否有重复块？ | 重复仍保留作者写法；不要合并成新段落 |
| 缺什么？ | 只在页脚注明（缺文件、缺口径），不要用新句子补全文 |

### 3. 页面地图

章节跟随作者大纲（源 `h2` / section 标题），不要改成模板默认的「概览 / 信号 / 证据」。

**先选壳，再选分区，再填组件。** 对照设计系统「页面」tab（`design-system/index.html#pages`）和 [modules.md](modules.md#页面)。壳只有报告封面、章节封面、口径说明。分片用 `.page-regions`（1 / 2 / 3 区），格子里只放已有父组件。禁止为材料发明「封面图卡 / 同级双块」这类页面种类。

为**每一块原文**选一个父组件，对照 [modules.md](modules.md)。翻译的是自定义 class，不是句子。

| 源内容 | 父组件 |
|---|---|
| 章节标题 + 原导语 | Section Header（编号在上；`h2`、intro 用原文；导语不截宽） |
| 普通表 / 对比矩阵 | Data Table / `is-matrix` |
| 并列要点 / 深色重点带 | Highlight Band（`facts` 或默认） |
| 大数字建立尺度 | Stat Grid（`.card-grid` + `.stat-value`；数字/标题/说明左对齐） |
| 图 + 标题 + 多行字段 | Media Switch `.is-cover`（知识从底部铺满图窗；仅 hover 主图） |
| 无图、多卡字段要对齐 | Card Grid `is-aligned` + Labeled List |
| 步骤 / 侧轨说明 | Process Steps / `is-rail` |
| 价格条图 | Bar Compare |
| 单图 + 图注 | Evidence Figure（`data-image-fit="natural"`） |
| 一张图 + 分量相当的独立正文 | 配图页（`data-media-page="split|stack"`） |
| 一卡一眼、底部缩略图切换 | Media Switch（`.evidence-figure.media-switch`） |

### 4. 输出包

```
Outputs/<slug>/
  index.html
  assets/          # 从 Inputs/<slug>/assets 整树复制，保持相对路径
  lib/
    components.css     # templates/shared/components.css
    template.css       # templates/editorial-default/assets/template.css
    template.js
    theme-runtime.js
    design-data.js     # design-system/assets/design-data.js
```

复制图片用 `cp -R Inputs/<slug>/assets/. Outputs/<slug>/assets/`，不要手挑「重要的几张」。

`index.html` 必须含：`.theme-control`、`.report-shell.is-deck` → 顶上章节 tab（`.document-nav`）→ `.report-stage` 里的 `.report-slide` → `.report-pager`。封面是第 0 屏；每章先有一屏章节封面（编号 + 章名 + 原 `h2` + 导语），再按作者信息块切 `N.a` / `N.b`，不要按窗口高度自动拆；口径说明是最后一屏。每个分片都展示章节标题（原 `h2`）；分片自己的原 `h3` 放在 `.section-header__part`，没有就只留章节标题，**不要发明句子**。脚本：`design-data.js` → `theme-runtime.js` → `template.js`。

**一屏 = 去掉顶栏和导航（以及底栏翻页）之后的可视区域。** 分片外壳不得把整页撑出滚动条。章内标题壳固定：`.report-deck-head` 在切 `N.a → N.b` 时保留同一句 `h2`，不重播动效；只换编号和 `.section-header__part`。

**分页看关联性，不要机械拆页，也不要为填满而裁切。**

- **合并：** 同一论点的数字 + 把它讲清楚的规则/表（规模数字 + 明细表；航线表 + 机场表；检疫约束 + 犬/猫免疫补充）。
- **拆开：** 两种不同言语行为——证据 vs 判断（对照矩阵 vs 合作建议；超宽条 vs 条上的对照表；大图 vs 结论）。顶栏已经有的标题不要再盖一层在图上。
- **不要拆：** 同一流程的约束 + 物种补充；不要把一张左图右文拆成上图下文。

**分片先选分区，再定区内对齐和区块尺寸。** 对齐不是页面种类。`fit` 跟随内容，`fill` 吃剩余；两个 fill 均分；同一轴不能都是 fit。页面模块高度固定，一屏放得下，组件不得把页面撑高。媒体吃满、9:16、条带横滑写在父组件上。已有输出里的 `data-layout` 可暂留，新页以分区为准。

| 分区 | Markup | 何时套 |
|---|---|---|
| 1 分区 | `.page-regions[data-regions="1"]` | 整屏一块，`data-align="center"` |
| 配图 · 左右 | `[data-media-page="split"]` | 左图右文。图区无图注；右侧定宽，不得用 Grid / Table；Band 最多 6 张且贴边；Bar 默认横向条 |
| 配图 · 上下 | `[data-media-page="stack"]` | 上图下文。图区无图注；底部定高 1 排；Grid 留间隔后铺满内容区 |

媒体仍按父组件打标：封面展开用 Media Switch `.is-cover`（3:4）；超宽条 `data-image-kind="strip"` 左对齐横滑、禁止盖 hover；界面截图 `shot` **9:16 contain**，卡片宽度跟图走。

切屏内 `--image-window-max` 等仍让路。非切屏长页继续用 max。表、长截图只在模块内滚。滚轮不切屏。点空白 / 空格 / 回车 / ↓ 下一屏，↑ 上一屏。跨章横向切，章内纵向淡入（标题除外）。

`content.css` 只用于源材料已有的灯箱交互，且走 Token。禁止把源表格/卡片/条图样式搬进来。多图切换走父组件 Media Switch，不要搬源 `.gallery-*` class。

### 5. 套页面（不是重写）

打开设计系统「页面」，先套壳或分区，再把原文填进格子里的父组件。封面、章节封面、口径说明是壳；分片先定分区和对齐，再放父组件。

- 封面 `h1`、kicker、lead：**用作者原文**（源 `h1` 与其下段落）。不要改写成新的主判断。
- 导航标签取作者章节名的缩短，目标 `id` 对应作者章节。
- 表格单元格、条图标签/数值/公式、步骤标题与正文：原文粘贴。
- 每张图：`assets/...` 相对路径 + 原 `alt` / `figcaption`。源页是「一卡一眼 + 缩略图」时用 Media Switch，缩略图全部保留。每张图有独立图注时用 Evidence 网格。
- 页脚口径说明：用作者原文列表；仅追加「本次未找到的文件」这类生产缺口。

### 6. 自检

- [ ] 抽三段源 `h2`/导语，输出里是原文而不是改写
- [ ] Section Header 编号在上、标题和导语在下；导语没有 max-width 提前换行
- [ ] HTML 引用的每张图在 `Outputs/<slug>/assets/` 都有对应文件，且页面有 `<img>`
- [ ] 一组竖/横图才 cover，顶部对齐；界面截图用 9:16 容器 contain，超出窗内滚；单图 natural 完整显示不裁切；超长横图左起横滑
- [ ] 同一组窗口等高，没有跟原图长度把版面撑爆
- [ ] 源页缩略图切换已套 Media Switch；没有搬源 `.gallery-thumbs` / `data-gallery` class
- [ ] 统计卡数字、标题、说明同一条左缘
- [ ] 网格列数整除张数，没有 3+1 这种孤立行；4 张用 2×2 或 4×1
- [ ] 没有把单图或图注误做成左图右文
- [ ] 一屏一页：每章有封面；每个分片都带章节标题；章内切页时 h2 固定不闪；分页看关联性（同论点合并，证据与判断拆开）；先选壳再选分区再填组件；1 分区居中；图+独立正文用 2 分区左右；条带左起横滑且无 hover；截图 9:16 且卡片跟图宽
- [ ] 1080px 以下卡片/分栏不撑出页面
- [ ] 没有源页面自定义 class（`.plain-table-wrap`、`.airline-matrix` 等）
- [ ] 切换主题后面板、表、条图、重点带都变
- [ ] 无硬编码颜色
- [ ] 未编造数字

完成后只说明：输出路径、壳做了哪些模块替换、图片复制数量、以及文件级缺口（若有）。

## Anti-patterns

- 为了「更像汇报」改写 `h1`、导语、结论
- 把作者章节重排成模板示例的六段节奏
- Glob 不到图就整节删掉证据
- 把单图或图注做成左图右文
- 单图用 4:3 / 3:4 cover 裁切；或界面截图不用 9:16 容器、改用 cover 裁死
- 固定比例的**现场照**窗口用 contain 露底；界面截图的 9:16 容器必须 contain
- 为填满一屏用 cover 裁切截图，或把短卡片拉成半空
- 切屏内仍套 window-max / strip-max 导致大图只占半屏
- 同一信息层级的标题一个进 deck-head `__part`、一个用正文 `h3`，字号不一致
- 数字、大图、对照表和结论叠在同一屏；或把同一论点的数字与明细表拆成空荡荡的两页
- 密内容（表、步骤、左图右文）用 `center` 垂直居中，或把左右两区改成上图下文
- 超宽条上盖 `.is-cover` hover 或重复顶栏标题，导致无法横滑
- 切屏 hero 封面卡 `aspect-ratio: auto` + `flex: 1 1 0` 压成空白细线
- 章内切分片时整段标题跟着淡入淡出
- 源页「一卡一眼 + 缩略图」拆成 hidden 图、证据网格，或搬源 `.gallery-*` class
- 每张图已有独立图注时，误做成 Media Switch
- 统计卡标题比数字更缩进（把带主图卡的 padding 套到所有 `report-card`）
- 网格留下孤立的一行（如 4 张排成 3+1），而不是改成 2×2 / 4×1 或一行横滑
- 发明页面种类（封面图卡、同级双块、判断单独页）或页面级自定义布局，不先选壳和分区
- 输出去读 `../../design-system/`
- 整章当长网页滚，或按窗口高度自动拆屏（必须按作者信息块切 `N.a` / `N.b`）
- 切屏时去掉顶上章节 tab
- 分片只写 `02.b · 章名` 却不展示章节标题
- 滚轮切屏（滚轮只浏览当前分片；切段用空白点击、空格、回车、方向键）
- 分片内容把整页撑出滚动条，或切屏内图卡高度不充满剩余一屏
