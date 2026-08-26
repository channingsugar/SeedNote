# 通用右键编辑：菜单与契约

给 Agent 和改编辑器的人看。运行时在 `editor/seed-edit.js`。

## 用户点名的 7 条 vs 现有能力

用户列的是目标。当前 `templates/editorial-flow/editor/` 已经多做了一些，通用版要保留；有些则绑死了流式 class，必须改成探测 + 标注。

| 能力 | 用户是否点名 | 流式编辑器现状 | 通用版怎么做 |
|---|---|---|---|
| 改任何文字（含 SVG 字） | 1 | 有。按节点走，不靠标签白名单 | 原样保留 |
| 改数字带动图形 | 2 | 仅 `.chart-value` + `.rail-growth-chart` | `data-seed-chart-*`；旧 class 兼容 |
| 图/表拖宽高，内容自适应 | 3 | 有，但盒选择器写死 `.shot` / `.plain-table-wrap` 等 | 认 `img`/`video`/`table`/`svg`/`figure`/`data-seed-box` |
| 图片适应 / 铺满 | 4 | 有。另有左/中/右对齐 | 保留对齐；适应=`object-fit: contain`，铺满=`cover` |
| 右键改颜色、间距，立刻更新 | 5 | 仅目录页 `[data-css-var]` token | 悬浮面板：此元素 + `:root` 变量 |
| 动画参数面板 | 6 | **没有** | 探测 `animation` / `transition` / `getAnimations()`，出面板 |
| 撤销重做 | 7 | 有。⌘Z / ⌘⇧Z / Ctrl+Y，约 80 步 | 原样保留，新操作同样进栈 |

用户没点、但通用版要保留的：

- **替换**图片 / 视频 / 内容 SVG（不只是改尺寸）
- 捕获阶段拦住右键，避免系统菜单抢走
- 提交用 `innerHTML`，格子里的 `<small>` / 色字不会被冲掉
- 改动进 IndexedDB，刷新还在，**不写回磁盘**
- 顶栏 / 编辑器自己的 UI 不进菜单

流式里有、通用版**不当作默认能力**（源稿碰巧带那些 class 时编辑器仍可能认出）：

- 编号信息布局三选、数字卡/标注卡、观点色块等**组件变体**
- 主题导入导出（那是目录页的事）

绑不上的（收工说明里写清楚）：

- `<canvas>` / WebGL / ECharts 等 JS 实例图——改数字不会自动重绘，除非页面自己监听 DOM
- 用 JS 写死的 WAAPI 且刷新后不再创建的动画——面板改 CSS 时间轴；刷新后若脚本重跑，以脚本为准

## 菜单是路由器，不是设置页

右键只做**能力探测**，按钮少；参数进悬浮面板。不要把时长、四边 margin、一串 CSS 变量直接铺进右键列表。

```
探测点击目标
  ├ 文字槽        → 编辑
  ├ 图片/视频/内容SVG → 替换
  ├ 可缩放盒      → 调整（手柄 + 对齐/填充条）
  ├ 任意元素      → 颜色 / 间距（面板）
  ├ 有动画/过渡    → 动画参数（面板）
  └ 源稿自带变体标记 → 分类栏（可选，不主动生成）
```

菜单结构（有才显示该块）：

| 分类栏 | 按钮 | 随后 |
|---|---|---|
| （无标题） | 编辑 / 替换 | 就地输入；选文件 |
| 外观 | 调整 / 颜色 / 间距 | 调整：拖右边改宽、拖下边改高；图才显示对齐与填充。颜色、间距：面板 |
| 动画 | 动画参数 | 面板：时长、延迟、缓动、次数、方向、播放 |
| （源稿变体） | 与流式相同的分类栏 | 仅当目标已是已知组件 |

条件：没有文字就不显示「编辑」；装饰图标不显示「替换」；没有 `animation-name` / 非零 `transition` / `getAnimations()` 就不显示动画块。

「显示编号 = 否 则藏后三项」这种条件逻辑仍只属于编号信息变体，不是通用菜单的默认层。

## 面板写到哪里

| 用户改的 | 写入 | 页级效果 |
|---|---|---|
| 此元素颜色 / 边距 | 该节点 `style` | 只影响该节点（及继承） |
| `:root` 自定义属性 | `document.documentElement.style` | 所有 `var(--x)` 立刻变 |
| 动画参数 | 该节点 `animation-*` / `transition-*` | 该节点正在播的 CSS 动画立刻变 |
| 图填充/对齐/宽高 | 盒上 `data-fit` / `data-align` / `style` | 盒内媒体自适应 |

颜色面板字段：文字 `color`、背景 `background-color`、边框 `border-color`；SVG 再加 `fill` / `stroke`。下面列出 `:root` 里看起来像颜色的 `--*`。

间距面板字段：上右下左的 `margin` / `padding`；`display:flex|grid` 时加 `gap`。下面列出看起来像长度的 `--*`。

动画面板字段：名称（只读）、时长、延迟、缓动、次数、方向、`animation-play-state`。若是过渡不是关键帧，改 `transition-duration` / `delay` / `timing-function`。

## Agent 标注（不改外观）

### 缩放盒

图、表、大 SVG 若本身或父级已经是一块盒，标父级即可：

```html
<figure data-seed-box>
  <img src="a.jpg" alt="">
</figure>
```

没有盒、直接裸 `<img>` / `<table>` 也可以，编辑器会拿元素自己当盒。只有「图在更深的裁切框里」才需要把 `data-seed-box` 打在裁切框上。

### 数据可视化

同一图表一个根：

```html
<div data-seed-chart="bar">
  <span data-seed-chart-value data-seed-chart-i="0">42</span>
  <div data-seed-chart-bar data-seed-chart-i="0" data-seed-chart-dir="v"></div>
</div>
```

| 属性 | 用在 | 含义 |
|---|---|---|
| `data-seed-chart` | 根 | `bar` 横条（改宽）/ `bar-v` 或 `col` 竖柱（改高）/ `line` 折线 |
| `data-seed-chart-max` | 根，可选 | 比例分母；不写则按当前数字 `nice` 出上限 |
| `data-seed-chart-value` | 数字文本 | 用户改这个，图形跟着动 |
| `data-seed-chart-i` | 值与图形成对 | 第几项，从 0 |
| `data-seed-chart-series` | 多系列时 | 系列名，值和点/条都要带 |
| `data-seed-chart-bar` | 柱/条节点 | 按比例写 `width` 或 `height` `%` |
| `data-seed-chart-dir` | 条 | `h` 宽 / `v` 高 |
| `data-seed-chart-point` | SVG 点 | 按比例写 `cy`（折线） |

折线还要把对应 `<line>` / `<polyline>` 留在同一 `svg` 里；编辑器会按点坐标重接线。旧稿 `.chart-value` + `.chart-point` 仍能工作，新标只用上表。

数字和图形对不上时，不要猜。宁可不标，在收工说明里写。

### 不要标

- 每个 `<p>` 都加 `data-seed-*`
- 为了编辑给整页加流式 class
- Canvas 图表假装是 SVG 图
