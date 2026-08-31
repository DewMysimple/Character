---
type: moc
status: active
kind: process
importance: high
updated: 2026-08-31
topic: work-log-index
source_logs: []
supersedes: null
---

# 工作日志 MOC

> 单一工作日志索引，按更新时间倒序。任务类型通过 `kind` 元数据区分。

| 时间 | 类型 | 目标 | 状态 | 主题 | 日志 |
| --- | --- | --- | --- | --- | --- |
| 2026-08-31 | maintenance | 为 Character React + Vite 工程建立 Git 版本管理、工程记忆和 GitHub 远程同步约定。 | archived | initialize-git-and-engineering-memory | [[日志/2026-08-31-初始化工程与远程仓库.md|2026-08-31｜初始化工程与远程仓库]] |
| 2026-08-31 | feature | 让代码字符从原位缺失并掉落，蝴蝶飞到花丛，花园在 8 秒完成且蝴蝶继续飞行。 | archived | fix-glyph-fall-butterfly-flight-eight-second-garden | [[日志/2026-08-31-修复文字掉落蝴蝶飞行与8秒花园.md|2026-08-31｜修复文字掉落、蝴蝶飞行与 8 秒花园]] |

## 使用方式

- 由 `python 工具/memory_lint.py index` 生成或刷新。
- 查询时先阅读当前状态，再按关键词定位日志。
- 历史日志是审计记录，不应直接覆盖当前状态。

## 入口

- [[README|工程 Agent 记忆系统]]
- [[AGENTS|记忆维护协议]]
- [[当前状态/项目概览|当前项目概览]]
- [[当前状态/系统架构|当前系统架构]]
