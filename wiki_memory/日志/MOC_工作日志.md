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
| 2026-08-31 | feature | 让蝴蝶在花丛上方分散飞行，完成态实时响应参数，并增加参数恢复默认。 | archived | butterfly-spread-and-parameter-reset | [[日志/2026-08-31-蝴蝶分散飞行与参数重置.md|2026-08-31｜蝴蝶分散飞行与参数重置]] |
| 2026-08-31 | feature | 让坍塌从一个局部点开始逐步影响周围，消除回弹，并解决高字符量下的明显卡顿。 | archived | local-collapse-propagation-and-performance | [[日志/2026-08-31-局部坍塌传播与性能优化.md|2026-08-31｜局部坍塌传播与性能优化]] |
| 2026-08-31 | maintenance | 为 Character React + Vite 工程建立 Git 版本管理、工程记忆和 GitHub 远程同步约定。 | archived | initialize-git-and-engineering-memory | [[日志/2026-08-31-初始化工程与远程仓库.md|2026-08-31｜初始化工程与远程仓库]] |
| 2026-08-31 | feature | 让代码字符从原位缺失并掉落，蝴蝶飞到花丛，花园在 8 秒完成且蝴蝶继续飞行。 | archived | fix-glyph-fall-butterfly-flight-eight-second-garden | [[日志/2026-08-31-修复文字掉落蝴蝶飞行与8秒花园.md|2026-08-31｜修复文字掉落、蝴蝶飞行与 8 秒花园]] |
| 2026-08-31 | feature | 降低并开放蝴蝶扇翅频率，增强文字从中心坍塌到花丛下落的实时物理过程，并延迟到花丛高度才生成蝴蝶。 | archived | center-collapse-and-flower-zone-morph | [[日志/2026-08-31-中心坍塌与花丛变形.md|2026-08-31｜中心坍塌与花丛变形]] |

## 使用方式

- 由 `python 工具/memory_lint.py index` 生成或刷新。
- 查询时先阅读当前状态，再按关键词定位日志。
- 历史日志是审计记录，不应直接覆盖当前状态。

## 入口

- [[README|工程 Agent 记忆系统]]
- [[AGENTS|记忆维护协议]]
- [[当前状态/项目概览|当前项目概览]]
- [[当前状态/系统架构|当前系统架构]]
