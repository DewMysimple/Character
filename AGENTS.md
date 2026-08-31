# Character 工程 Agent 记忆与交付协议

本文件是本仓库的 Agent 入口。工作前先读取 `wiki_memory/AGENTS.md`，再按其中规定的顺序读取当前状态、相关决策和知识页。

## 工程事实

- 这是一个 React + Vite + TypeScript 的单页 Canvas 数字艺术实验。
- 核心视觉是代码字符掉落、蝴蝶替换和花朵生长，原始参考视频只用于观察，不参与构建。
- 运行入口是 `src/main.tsx`，页面控制层是 `src/App.tsx`，场景引擎是 `src/engine/scene.ts`。

## 修改与交付约定

每次对代码、配置或项目文档作出修改后，都必须完成以下闭环：

1. 运行与改动相关的检查，至少确认 `npm run build` 通过。
2. 查看 `git diff` 和 `git status`，确认没有把 `node_modules`、`dist`、原始 MP4 或分析帧加入版本库。
3. 更新本次任务对应的 `wiki_memory/日志/` 日志；如果影响未来工作，按记忆协议更新长期页面。
4. 创建清晰的 Git 提交。
5. 推送当前分支到 `origin`，推送失败时必须明确报告，不得把“已提交”表述为“已同步远程”。

提交应保持单一意图，提交信息建议使用 `feat:`, `fix:`, `ui:`, `docs:`, `chore:` 或 `test:` 前缀。不要覆盖或清理用户无关的现有改动。

## 记忆同步

- 原始代码、配置和用户提供的参考资料是事实来源，记忆文件只记录结论、关系和相对路径。
- 实质任务完成后新增一篇追加式日志，并更新 `wiki_memory/日志/MOC_工作日志.md`。
- 当前有效事实放入 `wiki_memory/当前状态/`，架构和技术取舍放入 `wiki_memory/决策/`，稳定操作放入 `wiki_memory/知识/`。
- 不在没有用户确认的情况下覆盖既有 active 决策或删除历史日志。

## 常用命令

- `npm install`
- `npm run dev`
- `npm run build`
- `git status`
- `git log --oneline -5`
- `git push origin main`

