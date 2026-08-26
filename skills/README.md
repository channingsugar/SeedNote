# Skills

HTML 工作说明，给任意 Agent 用。正文是各目录里的 `SKILL.md`。

路径一律相对仓库根。流式 / 分页还要带上对应 `templates/`。只挂编辑器走 `editorial-html-universal/`，不依赖那两套模板。

| Skill | 何时用 | 依赖 |
|---|---|---|
| [`editorial-html-flow`](editorial-html-flow/SKILL.md) | 流式长文、规整、独立版、大纲套组件 | `templates/editorial-flow/` |
| [`editorial-html-page`](editorial-html-page/SKILL.md) | 分页 / 分屏 / 一屏一问 | `templates/editorial-page/` |
| [`editorial-html-universal`](editorial-html-universal/SKILL.md) | 任意已有 HTML → 右键可编辑，不换皮 | `editorial-html-universal/` |

## 在任意对话里用

1. 把本仓库放到工作区，或至少带上对应 `templates/` 与这份 `skills/`。
2. 把要走的那份 `SKILL.md` 发给模型（粘贴、附件、或让它读文件）。
3. 用用户的原话触发：流式走 flow，分页走 page。没说分页就走 flow。

例：

```
先读 skills/editorial-html-flow/SKILL.md，按它把下面大纲做成流式报告。
```

ChatGPT / Claude 网页：把 `SKILL.md` 贴进对话，并说明模板在 `templates/editorial-flow/`（或 page）相对仓库根。

## 在会自动读仓库说明的工具里

仓库根 `README.md` 开头就是 Agent 须知，会指向这两份 Skill。Cursor 另有 `.cursor/skills` → `skills/`；Claude Code 另有 `.claude/skills` → `skills/`。没有自动扫描的工具，按上一节显式让模型读 `SKILL.md`。
