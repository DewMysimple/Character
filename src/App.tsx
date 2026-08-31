import { useCallback, useEffect, useState } from "react";
import { AnimationCanvas } from "./components/AnimationCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { DEFAULT_PHYSICS, SCENE_DURATION, type PhysicsConfig, type SceneSnapshot } from "./engine/types";

const INITIAL_SNAPSHOT: SceneSnapshot = {
  time: 0,
  stage: "intro",
  activeGlyphs: 0,
  butterflies: 0,
  flowers: 0,
  complete: false,
};

export default function App() {
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS);
  const [playing, setPlaying] = useState(true);
  const [snapshot, setSnapshot] = useState<SceneSnapshot>(INITIAL_SNAPSHOT);
  const [replayToken, setReplayToken] = useState(0);
  const [seekRequest, setSeekRequest] = useState<{ token: number; time: number } | null>(null);

  const handleSnapshot = useCallback((nextSnapshot: SceneSnapshot) => {
    setSnapshot(nextSnapshot);
  }, []);

  const handleToggle = () => {
    setPlaying((current) => !current);
  };

  const handleReplay = () => {
    setReplayToken((token) => token + 1);
    setSnapshot(INITIAL_SNAPSHOT);
    setPlaying(true);
  };

  const handleResetConfig = () => {
    setConfig({ ...DEFAULT_PHYSICS });
  };

  const handleSeek = (time: number) => {
    const nextTime = Math.min(SCENE_DURATION, Math.max(0, time));
    setSeekRequest((request) => ({ token: (request?.token ?? 0) + 1, time: nextTime }));
    setPlaying(false);
  };

  const handleConfigChange = <Key extends keyof PhysicsConfig>(
    key: Key,
    value: PhysicsConfig[Key],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        handleToggle();
      }
      if (event.key.toLowerCase() === "r") handleReplay();
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  });

  return (
    <main className="app-shell">
      <AnimationCanvas
        config={config}
        playing={playing}
        replayToken={replayToken}
        seekRequest={seekRequest}
        onSnapshot={handleSnapshot}
      />

      <div className="scene-caption" aria-hidden="true">
        <span>文字对象变化</span>
        <span className="caption-line" />
        <span>从代码到花朵</span>
      </div>

      <ControlPanel
        config={config}
        playing={playing}
        snapshot={snapshot}
        onToggle={handleToggle}
        onReplay={handleReplay}
        onResetConfig={handleResetConfig}
        onSeek={handleSeek}
        onConfigChange={handleConfigChange}
      />
    </main>
  );
}
