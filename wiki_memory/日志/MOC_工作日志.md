---
type: moc
status: active
kind: process
importance: high
updated: 2026-09-01
topic: work-log-index
source_logs: []
supersedes: null
---

# 工作日志 MOC

> 单一工作日志索引，按更新时间倒序。任务类型通过 `kind` 元数据区分。

| 时间 | 类型 | 目标 | 状态 | 主题 | 日志 |
| --- | --- | --- | --- | --- | --- |
| 2026-09-01 | architecture | 把字符坠落换成固定步长的薄片气动模型与无散度涡旋场，并加入伪 3D 翻面、景深与运动模糊；一并消除帧率依赖。 | archived | plate-aerodynamics-and-pseudo-3d-glyphs | [[日志/2026-09-01-薄片气动翻滚与伪3D渲染.md|2026-09-01｜薄片气动翻滚与伪 3D 渲染]] |
| 2026-09-01 | bug | 将同列坍方从多列批次释放改为整列保持、单列连续泄露，消除三俩成行的同步僵硬感。 | archived | column-collapse-debatching | [[日志/2026-09-01-同列坍方去批次化.md|2026-09-01｜同列坍方去批次化]] |
| 2026-09-01 | bug | 打散默认局部坍塌中相邻字符的批次同步，恢复逐字独立的释放与横向物理差异。 | archived | de-batched-independent-glyph-release | [[日志/2026-09-01-逐字符释放去批次化.md|2026-09-01｜逐字符释放去批次化]] |
| 2026-09-01 | fix | 对照参考视频延长坍塌传播，并让默认局部模式按单字符独立释放、单向重力下落和长帧子步更新。 | archived | reference-calibrated-independent-glyph-collapse | [[日志/2026-09-01-参考视频校准与逐字符坍塌物理.md|2026-09-01｜参考视频校准与逐字符坍塌物理]] |
| 2026-08-31 | bug | 让同列坍方以连续列缺口为单位向外泄露，整列文字整体掉落而非零件散落。 | archived | column-collapse-whole-column-gap | [[日志/2026-08-31-同列坍方整列缺口修复.md|2026-08-31｜同列坍方整列缺口修复]] |
| 2026-08-31 | bug | 修复指针扰动时花头与枝干分离，让整株花朵带动枝干左右移动且根部固定。 | archived | connected-flower-pointer-pose | [[日志/2026-08-31-整株花朵指针联动修复.md|2026-08-31｜整株花朵指针联动修复]] |
| 2026-08-31 | fix | 让指针只扰动花朵主体，并移除完成态没有花朵对应的孤立根。 | archived | flower-body-pointer-and-orphan-roots | [[日志/2026-08-31-花朵主体扰动与空根修复.md|2026-08-31｜花朵主体扰动与空根修复]] |
| 2026-08-31 | feature | 增加指针扰动：附近花朵左右涟漪，蝴蝶远离指针并在离开影响范围后回到各自花朵。 | archived | pointer-disturbance-and-flower-return | [[日志/2026-08-31-指针扰动与花朵回归互动.md|2026-08-31｜指针扰动与花朵回归互动]] |
| 2026-08-31 | feature | 收敛蝴蝶为围绕花朵飞行，并展开半径、速度、倾角、呼吸和跟随等轨道参数。 | archived | flower-orbit-only-parameters | [[日志/2026-08-31-只保留花朵轨道与环绕参数.md|2026-08-31｜只保留花朵轨道与环绕参数]] |
| 2026-08-31 | feature | 增加围绕各自花朵飞行的蝴蝶分布模式，让局部轨道和完成态实时响应保持独立。 | archived | butterfly-flower-orbit | [[日志/2026-08-31-围绕花朵飞行模式.md|2026-08-31｜围绕花朵飞行模式]] |
| 2026-08-31 | feature | 放大参数面板并增加蝴蝶分布实验台，让分布、飞行和大小等参数在完成态实时响应。 | archived | butterfly-distribution-workbench | [[日志/2026-08-31-放大参数面板与蝴蝶分布实验台.md|2026-08-31｜放大参数面板与蝴蝶分布实验台]] |
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
