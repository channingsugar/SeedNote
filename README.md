# README

# Agent 须知

本仓库的工作说明在 `skills/`，任何 Agent（Cursor、Claude Code、Codex、ChatGPT、其它 IDE）动手前先读对应 `SKILL.md`，路径相对仓库根。

没说分页，默认流式。流式和分页不能互切，不要交叉引用 `design-system/` 或编辑器。把已有 HTML 变成可右键编辑、不要换皮时，走 `editorial-html-universal`。


| 用户要什么 | 先读 |
|---|---|
| 规整 / 换皮 / 套组件 / 流式 / 独立版 / 大纲笔记出长文 | `skills/editorial-html-flow/SKILL.md` |
| 分页 / 分屏 / 一屏一问 / deck | `skills/editorial-html-page/SKILL.md` |
| 任意已有 HTML → 右键可编辑（不换皮） | `editorial-html-universal/SKILL.md` |


模板在 `templates/editorial-flow/` 与 `templates/editorial-page/`。详细触发词和步骤以 Skill 正文为准。

# 工作说明

两套 Agent 工作说明（Skill），对应两套不能互切的 HTML 模板。正文在 `skills/`，不绑 Cursor。没说分页时默认走流式。


|               | 流式                                                                           | 分页 / 分屏                                                                      |
| ------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Skill         | `editorial-html-flow`                                                        | `editorial-html-page`                                                        |
| 定义            | `[skills/editorial-html-flow/SKILL.md](skills/editorial-html-flow/SKILL.md)` | `[skills/editorial-html-page/SKILL.md](skills/editorial-html-page/SKILL.md)` |
| 模板            | `templates/editorial-flow/`                                                  | `templates/editorial-page/`                                                  |
| 目录（设计语言 + 组件） | `[templates/editorial-flow/index.html](templates/editorial-flow/index.html)` | `[templates/editorial-page/index.html](templates/editorial-page/index.html)` |
| 设计 Token      | `templates/editorial-flow/design-system/`                                    | `templates/editorial-page/design-system/`                                    |
| 编辑器           | `templates/editorial-flow/editor/`（右键 seed-edit）                             | `assets/template.js` 内置右键菜单                                                  |
| 产出            | `Outputs/<slug>/index.html` 长文                                               | 先 `Outputs/<slug>/report.md`，再可选 `index.html` 分屏                             |


两套各自维护 token 和编辑器，不要交叉引用，也不要加「流式 / 分屏」切换。只拷 Skill 不够，必须带着对应 `templates/`，路径相对仓库根。

## 怎么用

把要走的那份 `SKILL.md` 给模型读到（仓库内读文件、附件、或整份粘贴），再说意图。越明确越不会走错套。

```
先读 skills/editorial-html-flow/SKILL.md，把这份大纲做成流式报告
先读 skills/editorial-html-page/SKILL.md，只组织章节树，先不要出 HTML
```

把要走的那份 `SKILL.md` 给模型读到（仓库内读文件、附件、或整份粘贴），再说意图。越明确越不会走错套。网页对话没有自动扫描，把 `SKILL.md` 贴进去即可。Cursor / Claude Code 还可以通过 `.cursor/skills`、`.claude/skills` 链到 `skills/`。

### 流式 `editorial-html-flow`

适合：规整、换皮、套组件、视觉规范、流式、独立版；粘贴大纲 / 笔记 / 想法；要一份可右键改字换图的长文，不要分页。


| 你给了什么        | Agent 会怎么做                                |
| ------------ | ----------------------------------------- |
| 已有长文 HTML    | **规整**：先交组件库（含 token 和视觉问题），确认后再换皮，最后挂编辑器 |
| 大纲 / 笔记 / 想法 | **生成**：先章节树，对照目录套父组件，写出报告，挂编辑器            |
| 明确要分页、一屏一问   | 停，改走分页 Skill                              |


可以说的例子：

- 「把这份笔记套成流式报告」
- 「规整 `Outputs/某项目/index.html`，先出组件库不要改 HTML」
- 「按目录缺什么再新增，不要另起皮肤」

报告从 `templates/editorial-flow/report.html` 拷壳，不要抄目录页。主题导入导出只在目录 `index.html`，不要做到报告上。

数字、口径、判断句以你给的材料为准；缺的留空或写「待填」，不要编。

### 分页 `editorial-html-page`

适合：分页、分屏、一屏一问、明确要 deck。不要用来做流式长文或独立版。

报告的一屏是听众的一个问句，不是一个组件。先组织再出页：

1. 读原文，写 `Outputs/<slug>/report.md`（章节树 + 每节点的问句、判断、形式、图链）
2. 你只要组织 → 交稿后停
3. 你要页（或说直接做）→ 按稿套 `templates/editorial-page/` 的壳，不按演示一组件一屏切

可以说的例子：

- 「按分页做一版，先只组织章节树」
- 「`report.md` 可以了，出分屏 HTML」
- 「一屏一问，不要流式」

没说只要组织还是要页时，Agent 应先问。主判断原文对不上、树还没梳清，也会停下来问。

## 自己看目录

本地起静态服务后打开对应 `index.html`：

```bash
python3 -m http.server 8766
```

- 流式：[http://127.0.0.1:8766/templates/editorial-flow/index.html](http://127.0.0.1:8766/templates/editorial-flow/index.html)
- 分页：[http://127.0.0.1:8766/templates/editorial-page/index.html](http://127.0.0.1:8766/templates/editorial-page/index.html)

目录页可以切换 / 导入 / 导出主题。改 token 只改各模板自己的 `design-system/`，改完目录需重跑：

```bash
python3 templates/editorial-flow/_build_catalog.py
python3 templates/editorial-page/_build_catalog.py
```

旧稿和旧设计系统画布在 `templates/draft/`，不要当现行模板用。