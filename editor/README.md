# seed-edit

右键改字、换图。分页（`editorial-html-page`）和流式规整（`editorial-html-normalize`）共用这一份，不要在 skill 目录再拷一份。

- 文字右键 →「编辑」→ 就地输入 →「完成」（Esc 取消，Enter 提交）
- 图片 / 视频 / SVG 图示右键 →「替换」→ 选本地图片或视频
- 编号信息右键可切换变体：编号在左 / 在上 / 列表 / 行 / 标签列，以及小号 / 大编号
- 无编号信息可切换默认底 / 浅底 / 夹线；观点可切换色块 / 浅底；图可切换照片 / 裁切 / 可滚动 / 宽图 / 海报
- 图表数据点改数字后，折线和锚点跟着动
- ⌘Z / Ctrl+Z 撤销，⌘⇧Z / Ctrl+Y 重做（含改字、换图、变体、调整）
- SVG 里的字也可以编辑；点空白图形则整图替换
- 带内部标签的格子（如价格 `<small>`）按 HTML 保存，不把样式冲掉
- 改动存在当前域的 IndexedDB，刷新还在；不写回磁盘上的 HTML

## 接入

把本目录拷到报告旁（建议 `lib/editor/`），在 HTML 里：

```html
<link rel="stylesheet" href="lib/editor/seed-edit.css">
<script src="lib/editor/seed-edit.js" defer></script>
```

目录页可直接引用仓库根：`../../editor/seed-edit.css`。脚本会自行 `mount`。也可 `SeedEdit.mount()`。

分发两套 skill 时，把本目录与 skill 一起带走。

右键图片还可「调整」：对齐（左/中/右）、拖右边手柄改容器宽度（等比）、适应 / 铺满。
