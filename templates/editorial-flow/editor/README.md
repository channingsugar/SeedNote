# seed-edit

只给流式模板 `templates/editorial-flow/` 用。分屏 `editorial-page` 用自己的 `assets/template.js` 编辑器，不要挂这份。

- 文字右键 →「编辑」→ 就地输入 →「完成」（Esc 取消，Enter 提交）
- 图片 / 视频 / SVG 图示右键 →「替换」→ 选本地图片或视频
- 编号信息右键可切换变体：编号在左 / 在上 / 列表 / 行 / 标签列，以及小号 / 大编号
- 数字信息右键可切换：数字卡（数字·标题·说明）/ 标注卡（标签 + 数字 + 旁注）
- 无编号信息可切换默认底 / 浅底 / 夹线；观点可切换色块 / 浅底；图可切换照片 / 裁切 / 可滚动 / 宽图 / 海报
- 图表数据点改数字后，纵轴刻度按新最大值重算，折线和锚点留在图内
- 图 / 表 / 折线右键「调整」：拖右边改宽、拖下边改高；折线拖高后绘图区跟着拉高
- 基础 token 右键改数值，立刻作用于整页并写入当前主题；颜色点色块用取色器，也可改 hex；主题导入导出在目录 `index.html`
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

目录页引用同文件夹：`editor/seed-edit.css`。脚本会自行 `mount`。也可 `SeedEdit.mount()`。

右键图片还可「调整」：对齐（左/中/右）、拖右边改宽、拖下边改高、适应 / 铺满。表和折线图同样可拖宽高。
