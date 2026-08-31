import { useEffect, useRef } from "react";
import { SceneEngine } from "../engine/scene";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  type PhysicsConfig,
  type SceneSnapshot,
} from "../engine/types";

interface SeekRequest {
  token: number;
  time: number;
}

interface AnimationCanvasProps {
  config: PhysicsConfig;
  playing: boolean;
  replayToken: number;
  seekRequest: SeekRequest | null;
  onSnapshot: (snapshot: SceneSnapshot) => void;
}

const fitStage = (width: number, height: number) => {
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  return {
    scale,
    offsetX: (width - DESIGN_WIDTH * scale) / 2,
    offsetY: (height - DESIGN_HEIGHT * scale) / 2,
  };
};

export function AnimationCanvas({
  config,
  playing,
  replayToken,
  seekRequest,
  onSnapshot,
}: AnimationCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const configRef = useRef(config);
  const playingRef = useRef(playing);
  const lastReplayTokenRef = useRef(replayToken);
  const lastSeekTokenRef = useRef(seekRequest?.token ?? 0);

  useEffect(() => {
    configRef.current = config;
    engineRef.current?.setConfig(config);
  }, [config]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!engineRef.current || replayToken === lastReplayTokenRef.current) return;
    lastReplayTokenRef.current = replayToken;
    engineRef.current.reset();
    onSnapshot(engineRef.current.getSnapshot());
  }, [onSnapshot, replayToken]);

  useEffect(() => {
    if (!engineRef.current || !seekRequest || seekRequest.token === lastSeekTokenRef.current) return;
    lastSeekTokenRef.current = seekRequest.token;
    engineRef.current.seek(seekRequest.time);
    playingRef.current = false;
    onSnapshot(engineRef.current.getSnapshot());
  }, [onSnapshot, seekRequest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const engine = new SceneEngine(configRef.current);
    engineRef.current = engine;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let viewportWidth = 0;
    let viewportHeight = 0;

    const resize = () => {
      const bounds = wrapper.getBoundingClientRect();
      viewportWidth = Math.max(1, bounds.width);
      viewportHeight = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(viewportWidth * dpr);
      canvas.height = Math.round(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      engine.setViewport(viewportWidth, viewportHeight);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    resize();

    let frameId = 0;
    let lastFrame = performance.now();

    const draw = (now: number) => {
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      if (playingRef.current) engine.advance(delta);

      const viewport = fitStage(viewportWidth, viewportHeight);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      context.save();
      context.translate(viewport.offsetX, viewport.offsetY);
      context.scale(viewport.scale, viewport.scale);
      engine.setViewport(DESIGN_WIDTH, DESIGN_HEIGHT);
      engine.render(context);
      context.restore();

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);

    const snapshotTimer = window.setInterval(() => {
      onSnapshot(engine.getSnapshot());
    }, 80);
    onSnapshot(engine.getSnapshot());

    return () => {
      cancelAnimationFrame(frameId);
      window.clearInterval(snapshotTimer);
      observer.disconnect();
      engineRef.current = null;
    };
  }, [onSnapshot]);

  return (
    <div ref={wrapperRef} className="canvas-wrapper" aria-label="字符到蝴蝶再到花朵的动画舞台">
      <canvas ref={canvasRef} />
    </div>
  );
}
