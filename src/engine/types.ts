export const SCENE_DURATION = 8;
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 960;

export type Stage = "intro" | "falling" | "morphing" | "bloom";
export type CollapseMode =
  | "local-collapse"
  | "column-collapse"
  | "center-collapse"
  | "wave-collapse";
export interface PhysicsConfig {
  gravity: number;
  wind: number;
  centerAttraction: number;
  drag: number;
  morphDuration: number;
  collapseDuration: number;
  collapseMode: CollapseMode;
  particleCount: number;
  speed: number;
  wingBeatFrequency: number;
  butterflyOrbitRadius: number;
  butterflyOrbitHeight: number;
  butterflyOrbitSpeed: number;
  butterflyOrbitTilt: number;
  butterflyOrbitWobble: number;
  butterflyOrbitDrift: number;
  butterflyFlowerAttraction: number;
  butterflyFlightSpeed: number;
  butterflyScale: number;
  pointerInteractionEnabled: boolean;
  flowerWindStrength: number;
  flowerPointerRadius: number;
  flowerPointerStrength: number;
  flowerPointerResponse: number;
  flowerPointerReturn: number;
  pointerFalloff: number;
  butterflyPointerRadius: number;
  butterflyPointerRepulsion: number;
  butterflyPointerReturn: number;
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
  morphAt: number;
  morphThresholdY: number;
  flutterPhase: number;
  turbulencePhase: number;
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
  baseScale: number;
  alpha: number;
  birthTime: number;
  color: string;
  seed: number;
  targetFlowerId: number;
  flowerX: number;
  flowerY: number;
  flowerOffsetX: number;
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
  windPhase: number;
  pointerOffset: number;
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

export interface ScenePointer {
  x: number;
  y: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 1,
  wind: 0.24,
  centerAttraction: 0.58,
  drag: 0.988,
  morphDuration: 1.05,
  collapseDuration: 1.4,
  collapseMode: "local-collapse",
  particleCount: 420,
  speed: 1,
  wingBeatFrequency: 2.8,
  butterflyOrbitRadius: 52,
  butterflyOrbitHeight: 34,
  butterflyOrbitSpeed: 1,
  butterflyOrbitTilt: 0,
  butterflyOrbitWobble: 0.18,
  butterflyOrbitDrift: 0.45,
  butterflyFlowerAttraction: 0.72,
  butterflyFlightSpeed: 1,
  butterflyScale: 1,
  pointerInteractionEnabled: true,
  flowerWindStrength: 0.28,
  flowerPointerRadius: 170,
  flowerPointerStrength: 0.55,
  flowerPointerResponse: 0.85,
  flowerPointerReturn: 0.65,
  pointerFalloff: 1.25,
  butterflyPointerRadius: 150,
  butterflyPointerRepulsion: 1,
  butterflyPointerReturn: 0.95,
};
