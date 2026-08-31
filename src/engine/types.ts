export const SCENE_DURATION = 8;
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 960;

export type Stage = "intro" | "falling" | "morphing" | "bloom";

export interface PhysicsConfig {
  gravity: number;
  wind: number;
  centerAttraction: number;
  drag: number;
  morphDuration: number;
  particleCount: number;
  speed: number;
  wingBeatFrequency: number;
}

export interface GlyphParticle {
  id: number;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  alpha: number;
  stage: Stage;
  releaseAt: number;
  collapseAt: number;
  morphAt: number;
  morphThresholdY: number;
  morphProgress: number;
  seed: number;
  sourceLine: number;
  sourceColumn: number;
  active: boolean;
  flowerLinked: boolean;
}

export interface Butterfly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  alpha: number;
  birthTime: number;
  color: string;
  seed: number;
  targetFlowerId: number;
  targetX: number;
  targetY: number;
  orbitRadius: number;
  orbitHeight: number;
  flightPhase: number;
  wingPhase: number;
  flowerLinked: boolean;
}

export interface Flower {
  id: number;
  x: number;
  groundY: number;
  height: number;
  sway: number;
  color: string;
  triggerAt: number;
  stemProgress: number;
  leafProgress: number;
  petalProgress: number;
  activated: boolean;
}

export interface StemSeed {
  x: number;
  groundY: number;
  height: number;
  sway: number;
  leafSide: number;
  opacity: number;
  startAt: number;
}

export interface SceneSnapshot {
  time: number;
  stage: Stage;
  activeGlyphs: number;
  butterflies: number;
  flowers: number;
  complete: boolean;
}

export interface SceneViewport {
  width: number;
  height: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 1,
  wind: 0.24,
  centerAttraction: 0.58,
  drag: 0.988,
  morphDuration: 0.72,
  particleCount: 150,
  speed: 1,
  wingBeatFrequency: 2.8,
};
