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

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS);
  const [playing, setPlaying] = useState(true);
  const [snapshot, setSnapshot] = useState<SceneSnapshot>(INITIAL_SNAPSHOT);
  const [replayToken, setReplayToken] = useState(0);
  const [seekRequest, setSeekRequest] = useState<{ token: number; time: number } | null>(null);

  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);

  const handleSnapshot = useCallback((nextSnapshot: SceneSnapshot) => {
    setSnapshot(nextSnapshot);
    if (nextSnapshot.complete) setPlaying(false);
  }, []);

  const handleToggle = () => {
    if (snapshot.complete) {
      handleReplay();
      return;
    }
    setPlaying((current) => !current);
  };

  const handleReplay = () => {
    setReplayToken((token) => token + 1);
    setSnapshot(INITIAL_SNAPSHOT);
    setPlaying(!reducedMotion);
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
        reducedMotion={reducedMotion}
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
        reducedMotion={reducedMotion}
        onToggle={handleToggle}
        onReplay={handleReplay}
        onSeek={handleSeek}
        onConfigChange={handleConfigChange}
      />
    </main>
  );
}
