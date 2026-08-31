# 字符物理实验

这是一个 React + Vite + TypeScript 的 Canvas 数字艺术实验，用程序化线稿复刻参考视频的视觉逻辑：

代码字符从原始代码位置缺失并受重力掉落，经过艺术指导式的状态替换成为蝴蝶；蝴蝶飞向花丛并持续盘旋，花园在 8 秒内完成生长。

## 启动

在 Windows PowerShell 中执行：

```powershell
cd "C:\Users\Administrator\Desktop\Character"
npm install
npm run dev
```

然后打开 Vite 输出的本地地址，默认是 `http://localhost:5173`。

## 结构

- `src/engine/types.ts`：粒子、蝴蝶、花朵和控制参数类型。
- `src/engine/scene.ts`：固定随机种子的场景引擎、物理更新和 Canvas 绘制。
- `src/components/AnimationCanvas.tsx`：高 DPI Canvas、ResizeObserver 和 requestAnimationFrame 生命周期。
- `src/components/ControlPanel.tsx`：播放、时间轴和物理参数控制。
- `src/App.tsx`：React 状态与动画引擎之间的控制层。

## 设计说明

这个工程不使用原始视频作为背景，也不依赖原作者源码。字符、蝴蝶和花朵是三个独立对象，转换通过状态机和透明度交叉淡化完成。字符从代码卡片中的对应位置消失并掉落，蝴蝶拥有明确的花朵目标点，抵达后会在花丛附近持续飞行。重力、风力、中心吸引和阻尼负责提供物理感，花朵的茎、叶片和花瓣则按事件逐步生长。

花园生长时间轴为 8 秒，8 秒之后花朵保持完成状态，蝴蝶运动不停止。每次重播使用同一个随机种子，所以调整参数时可以稳定比较差异。
