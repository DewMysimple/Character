import {
  DEFAULT_PHYSICS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  SCENE_DURATION,
  type Butterfly,
  type CollapseMode,
  type Flower,
  type GlyphParticle,
  type PhysicsConfig,
  type SceneSnapshot,
  type ScenePointer,
  type Stage,
} from "./types";

const CODE_LINES = [
  "const snapshot = this.undoHistory.pop();",
  "if (!snapshot) return false;",
  "this.redoHistoryStack.push(this.captureSnapshot());",
  "this.applySnapshotToBuffer(snapshot);",
  "this.emit('history:undo', snapshot);",
  "renderVisibleRows(firstRow, rowCount);",
  "return this.textLinesByRow.slice(firstRow, firstRow + rowCount);",
  "// only the scrolled rows are tokenized; the rest stay plain text.",
  "// ReactiveDocumentStore keeps a small bus for each edit.",
  "const update = this.buffer.renderVisibleRows();",
  "if (update.changed) this.requestPaint();",
  "return update;",
];

const CODE_POSITIONS = CODE_LINES.flatMap((line, lineIndex) =>
  [...line].map((char, sourceColumn) => ({ char, sourceLine: lineIndex, sourceColumn })),
);

const PARTICLE_POSITIONS = CODE_POSITIONS.filter(({ char }) => char.trim().length > 0);

const CODE_PALETTE = [
  "#6f91c4",
  "#bf6f5f",
  "#8e9d6a",
  "#aa8a6c",
  "#7b7771",
  "#c58a62",
];

const FLOWER_PALETTE = ["#bf8d8b", "#9aa89b", "#a8a0b8", "#c8a77f"];
const COLLAPSE_CENTER_X = DESIGN_WIDTH / 2;
const COLLAPSE_CENTER_Y = 304;
const FLOWER_ZONE_MIN_Y = 650;
const FLOWER_ZONE_MAX_Y = 776;
const BUTTERFLY_ZONE_TOP = 322;
const BUTTERFLY_ZONE_BOTTOM = 682;
const CODE_START_X = 104;
const CODE_START_Y = 104;
const CODE_CHAR_STEP = 6.35;
const CODE_LINE_STEP = 17;
const MAX_CODE_COLUMN = Math.max(...CODE_LINES.map((line) => line.length - 1));
const COLLAPSE_FOCUS_COLUMN = Math.round(MAX_CODE_COLUMN / 2);
const COLLAPSE_FOCUS_LINE = 5;

export const STAGE_LABELS: Record<Stage, string> = {
  intro: "场景准备",
  falling: "字符掉落",
  morphing: "蝴蝶生成",
  bloom: "花朵生长",
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const easeOutCubic = (value: number) => {
  const t = clamp(value, 0, 1);
  return 1 - (1 - t) ** 3;
};

export const easeInOut = (value: number) => {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2;
};

const fract = (value: number) => value - Math.floor(value);

export const seededRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return fract(value);
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const drawCodeCard = (
  context: CanvasRenderingContext2D,
  time: number,
  glyphs: GlyphParticle[],
) => {
  const cardX = 54;
  const cardY = 62;
  const cardWidth = 612;
  const cardHeight = 250;
  const cardBottom = cardY + cardHeight;

  context.save();
  context.shadowColor = "rgba(69, 61, 52, 0.13)";
  context.shadowBlur = 16;
  context.shadowOffsetY = 8;
  context.fillStyle = "rgba(255, 254, 249, 0.98)";
  roundedRect(context, cardX, cardY, cardWidth, cardHeight, 10);
  context.fill();
  context.restore();

  context.save();
  context.fillStyle = "rgba(255, 254, 249, 0.98)";
  context.beginPath();
  context.moveTo(344, cardBottom - 1);
  context.lineTo(360, cardBottom + 13);
  context.lineTo(376, cardBottom - 1);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(105, 96, 85, 0.18)";
  context.beginPath();
  context.arc(cardX + 18, cardY + 18, 3, 0, Math.PI * 2);
  context.arc(cardX + 29, cardY + 18, 3, 0, Math.PI * 2);
  context.arc(cardX + 40, cardY + 18, 3, 0, Math.PI * 2);
  context.fill();

  context.font = "10px 'SFMono-Regular', Consolas, monospace";
  context.textBaseline = "middle";
  const missingGlyphs = new Set(
    glyphs
      .filter((glyph) => glyph.active)
      .map((glyph) => `${glyph.sourceLine}:${glyph.sourceColumn}`),
  );
  CODE_LINES.forEach((line, lineIndex) => {
    const y = cardY + 42 + lineIndex * CODE_LINE_STEP;
    context.fillStyle = "rgba(128, 120, 109, 0.56)";
    context.textAlign = "right";
    context.fillText(String(lineIndex + 31), cardX + 34, y);

    context.textAlign = "left";
    const reveal = clamp((time - 0.2) / 0.9, 0, 1);
    const visibleLength = Math.ceil(line.length * reveal);
    [...line.slice(0, visibleLength)].forEach((character, characterIndex) => {
      if (missingGlyphs.has(`${lineIndex}:${characterIndex}`)) return;
      const color = CODE_PALETTE[(lineIndex * 7 + characterIndex) % CODE_PALETTE.length];
      context.fillStyle = character === " " ? "rgba(70, 68, 63, 0.52)" : color;
      context.fillText(character, cardX + 50 + characterIndex * CODE_CHAR_STEP, y);
    });
  });
  context.restore();
};

const drawTitle = (context: CanvasRenderingContext2D, time: number) => {
  const titleProgress = easeOutCubic(clamp((time - 0.65) / 0.85, 0, 1));
  context.save();
  context.globalAlpha = 0.17 * titleProgress;
  context.fillStyle = "#6c6961";
  context.font = "600 44px 'STSong', 'Noto Serif SC', 'Songti SC', serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("也能妙笔生花", DESIGN_WIDTH / 2, 435);
  context.restore();
};

const getFlowerWindOffset = (flower: Flower, motionTime: number, windStrength: number) => {
  const naturalAmplitude = 2.5 + Math.abs(flower.sway) * 0.12;
  return (
    Math.sin(motionTime * 0.68 + flower.windPhase) * naturalAmplitude * (0.35 + windStrength)
  );
};

const getFlowerStemSway = (flower: Flower, motionTime: number, windStrength: number) =>
  flower.sway + getFlowerWindOffset(flower, motionTime, windStrength);

const getQuadraticPoint = (
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  progress: number,
) => {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * startX + 2 * inverse * progress * controlX + progress * progress * endX,
    y: inverse * inverse * startY + 2 * inverse * progress * controlY + progress * progress * endY,
  };
};

const getFlowerPose = (
  flower: Flower,
  motionTime: number,
  windStrength: number,
  stemProgress = 1,
  includePointerOffset = true,
) => {
  const progress = clamp(stemProgress, 0, 1);
  const stemSway = getFlowerStemSway(flower, motionTime, windStrength);
  const bodyWind = getFlowerWindOffset(flower, motionTime, windStrength) * 0.35;
  const interactiveShift = includePointerOffset ? flower.pointerOffset : 0;
  const bodyShift = bodyWind + interactiveShift;
  const rootX = flower.x;
  const rootY = flower.groundY;
  const tipX = rootX + (stemSway * 0.45 + bodyShift) * progress;
  const tipY = rootY - flower.height * progress;

  return {
    rootX,
    rootY,
    controlX: rootX + (stemSway + bodyShift * 0.62) * progress,
    controlY: rootY - flower.height * 0.45 * progress,
    tipX,
    tipY,
  };
};

const getFlowerHeadPosition = (
  flower: Flower,
  motionTime: number,
  windStrength: number,
) => {
  const { tipX, tipY } = getFlowerPose(flower, motionTime, windStrength);
  return {
    x: tipX,
    y: tipY,
  };
};

const drawFlower = (
  context: CanvasRenderingContext2D,
  flower: Flower,
  motionTime: number,
  windStrength: number,
) => {
  if (!flower.activated || flower.stemProgress <= 0) return;

  const stemProgress = easeOutCubic(flower.stemProgress);
  const leafProgress = easeOutCubic(flower.leafProgress);
  const petalProgress = easeOutCubic(flower.petalProgress);
  const pose = getFlowerPose(flower, motionTime, windStrength, stemProgress);

  context.save();
  context.globalAlpha = 0.74 * stemProgress;
  context.strokeStyle = "rgba(111, 123, 107, 0.74)";
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(pose.rootX, pose.rootY);
  context.quadraticCurveTo(pose.controlX, pose.controlY, pose.tipX, pose.tipY);
  context.stroke();

  if (leafProgress > 0) {
    const upperLeaf = getQuadraticPoint(
      pose.rootX,
      pose.rootY,
      pose.controlX,
      pose.controlY,
      pose.tipX,
      pose.tipY,
      0.46,
    );
    const lowerLeaf = getQuadraticPoint(
      pose.rootX,
      pose.rootY,
      pose.controlX,
      pose.controlY,
      pose.tipX,
      pose.tipY,
      0.68,
    );
    context.fillStyle = "rgba(144, 157, 142, 0.58)";
    context.beginPath();
    context.ellipse(
      upperLeaf.x - 8,
      upperLeaf.y - 4 * leafProgress,
      12 * leafProgress,
      4.8 * leafProgress,
      -0.36,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.beginPath();
    context.ellipse(
      lowerLeaf.x + 8,
      lowerLeaf.y - 4 * leafProgress,
      11 * leafProgress,
      4.4 * leafProgress,
      0.36,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  if (petalProgress <= 0) {
    context.restore();
    return;
  }

  const petalCount = 5;
  const petalLength = 12 * petalProgress;
  for (let index = 0; index < petalCount; index += 1) {
    const angle = (Math.PI * 2 * index) / petalCount - Math.PI / 2;
    context.save();
    context.translate(pose.tipX, pose.tipY);
    context.rotate(angle);
    context.globalAlpha = 0.74 * petalProgress;
    context.fillStyle = flower.color;
    context.strokeStyle = "rgba(104, 99, 92, 0.35)";
    context.lineWidth = 0.65;
    context.beginPath();
    context.ellipse(0, -petalLength * 0.7, 4.5 * petalProgress, petalLength, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }
  context.fillStyle = "rgba(164, 133, 96, 0.78)";
  context.beginPath();
  context.arc(pose.tipX, pose.tipY, 2.1 * petalProgress, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

export const drawButterfly = (
  context: CanvasRenderingContext2D,
  butterfly: Butterfly,
) => {
  context.save();
  context.translate(butterfly.x, butterfly.y);
  context.rotate(butterfly.rotation);
  context.scale(butterfly.scale, butterfly.scale);
  context.globalAlpha = butterfly.alpha;
  context.strokeStyle = butterfly.color;
  context.fillStyle = "rgba(252, 249, 238, 0.2)";
  context.lineWidth = 1.05;

  const wingBeat = Math.sin(butterfly.wingPhase) * 0.12;
  const leftWing = 1 + wingBeat;
  const rightWing = 1 - wingBeat;

  context.beginPath();
  context.moveTo(-1, 0);
  context.bezierCurveTo(-12 * leftWing, -14, -22 * leftWing, -6, -15 * leftWing, 2);
  context.bezierCurveTo(-10 * leftWing, 8, -4, 7, -1, 2);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(1, 0);
  context.bezierCurveTo(12 * rightWing, -14, 22 * rightWing, -6, 15 * rightWing, 2);
  context.bezierCurveTo(10 * rightWing, 8, 4, 7, 1, 2);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(0, -5);
  context.lineTo(0, 7);
  context.stroke();
  context.beginPath();
  context.moveTo(0, -4);
  context.quadraticCurveTo(-4, -10, -6, -9);
  context.moveTo(0, -4);
  context.quadraticCurveTo(4, -10, 6, -9);
  context.stroke();
  context.restore();
};

export class SceneEngine {
  private config: PhysicsConfig;
  private time = 0;
  private motionTime = 0;
  private seed: number;
  private glyphs: GlyphParticle[] = [];
  private butterflies: Butterfly[] = [];
  private flowers: Flower[] = [];
  private viewport = { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
  private backgroundCanvas: HTMLCanvasElement | null = null;
  private pointer: ScenePointer | null = null;

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS, seed = 47) {
    this.config = { ...config };
    this.seed = seed;
    this.reset(seed);
  }

  setViewport(width: number, height: number) {
    if (width === this.viewport.width && height === this.viewport.height) return;
    this.viewport = { width, height };
    this.backgroundCanvas = null;
  }

  setPointer(pointer: ScenePointer | null) {
    this.pointer = pointer;
  }

  setConfig(nextConfig: PhysicsConfig) {
    const particleCountChanged = nextConfig.particleCount !== this.config.particleCount;
    const collapseChanged =
      nextConfig.collapseMode !== this.config.collapseMode ||
      nextConfig.collapseDuration !== this.config.collapseDuration;
    this.config = { ...nextConfig };
    if (particleCountChanged || collapseChanged) {
      const currentTime = this.time;
      this.reset(this.seed);
      this.seek(currentTime);
    }
  }

  reset(seed = this.seed) {
    this.seed = seed;
    this.time = 0;
    this.motionTime = 0;
    this.glyphs = [];
    this.butterflies = [];
    this.flowers = [];
    this.backgroundCanvas = null;
    this.buildFlowers();
    this.buildGlyphs();
  }

  seek(targetTime: number) {
    const target = clamp(targetTime, 0, SCENE_DURATION);
    if (target === 0) {
      this.reset(this.seed);
      return;
    }

    this.reset(this.seed);
    let remaining = target;
    while (remaining > 0) {
      const step = Math.min(1 / 60, remaining);
      this.step(step);
      remaining -= step;
    }
  }

  advance(realDelta: number) {
    const delta = clamp(realDelta, 0, 0.05) * this.config.speed;
    if (delta <= 0) return;
    this.step(delta);
  }

  getSnapshot(): SceneSnapshot {
    return {
      time: this.time,
      stage: this.getStage(),
      activeGlyphs: this.glyphs.filter((glyph) => glyph.active && glyph.alpha > 0.04).length,
      butterflies: this.butterflies.filter((butterfly) => butterfly.alpha > 0.04).length,
      flowers: this.flowers.filter((flower) => flower.activated && flower.petalProgress > 0.1).length,
      complete: this.time >= SCENE_DURATION,
    };
  }

  render(context: CanvasRenderingContext2D) {
    const width = this.viewport.width;
    const height = this.viewport.height;
    context.clearRect(0, 0, width, height);

    if (!this.backgroundCanvas) this.buildBackground();
    if (this.backgroundCanvas) context.drawImage(this.backgroundCanvas, 0, 0, width, height);
    drawCodeCard(context, this.time, this.glyphs);
    drawTitle(context, this.time);
    this.flowers.forEach((flower) =>
      drawFlower(context, flower, this.motionTime, this.config.flowerWindStrength),
    );
    this.renderGlyphs(context);
    this.butterflies.forEach((butterfly) => drawButterfly(context, butterfly));
  }

  private step(delta: number) {
    this.motionTime += delta;
    this.time = clamp(this.time + delta, 0, SCENE_DURATION);

    this.glyphs.forEach((glyph) => {
      if (!glyph.active && this.time >= glyph.releaseAt) {
        glyph.active = true;
        glyph.x = CODE_START_X + glyph.sourceColumn * CODE_CHAR_STEP;
        glyph.y = CODE_START_Y + glyph.sourceLine * CODE_LINE_STEP;
        glyph.vx = (seededRandom(glyph.seed + 23) - 0.5) * 0.35;
        glyph.vy = seededRandom(glyph.seed + 24) * 0.3;
      }
      if (!glyph.active) return;

      const glyphAge = Math.max(0, this.time - glyph.releaseAt);
      const flutter = Math.sin(glyphAge * 18 + glyph.flutterPhase) * 0.23;

      const centerDrift =
        this.config.collapseMode === "center-collapse"
          ? (COLLAPSE_CENTER_X - glyph.x) * this.config.centerAttraction * 0.00045
          : 0;
      const turbulence = Math.sin(glyphAge * 9 + glyph.turbulencePhase) * 0.02;
      const dropAcceleration = this.config.gravity * (0.18 + clamp(glyphAge / 1.6, 0, 1) * 0.045);
      glyph.vx +=
        (this.config.wind * 0.002 + centerDrift + flutter * 0.014 + turbulence) * delta * 60;
      glyph.vy +=
        (dropAcceleration + Math.cos(glyphAge * 7 + glyph.flutterPhase) * 0.022) * delta * 60;
      glyph.vy = Math.max(0, glyph.vy);
      glyph.vx *= this.config.drag;
      glyph.vy *= this.config.drag;
      const glyphSpeed = Math.hypot(glyph.vx, glyph.vy);
      if (glyphSpeed > 18) {
        glyph.vx = (glyph.vx / glyphSpeed) * 18;
        glyph.vy = (glyph.vy / glyphSpeed) * 18;
      }
      glyph.x += glyph.vx * delta * 60;
      glyph.y += glyph.vy * delta * 60;
      glyph.rotation += glyph.rotationSpeed * delta * 60;

      const enoughDropTime = glyphAge >= 1.05;
      const reachedFlowerZone = glyph.y >= glyph.morphThresholdY;
      const safeFallback = this.time >= glyph.morphAt && glyph.y >= FLOWER_ZONE_MIN_Y - 70;
      if (glyph.stage !== "morphing" && enoughDropTime && (reachedFlowerZone || safeFallback)) {
        glyph.stage = "morphing";
        glyph.morphAt = this.time;
        glyph.morphProgress = 0;
        this.spawnButterfly(glyph);
      }

      if (glyph.stage === "morphing") {
        glyph.morphProgress = clamp(
          (this.time - glyph.morphAt) / this.config.morphDuration,
          0,
          1,
        );
        glyph.alpha = 1 - easeInOut(glyph.morphProgress);
      } else {
        glyph.stage = "falling";
        glyph.alpha = 0.96;
      }
    });

    this.updateFlowerPointer(delta);

    const orbitSpeed = clamp(this.config.butterflyOrbitSpeed, 0.2, 2.4);
    const tilt = (this.config.butterflyOrbitTilt * Math.PI) / 180;
    const tiltCos = Math.cos(tilt);
    const tiltSin = Math.sin(tilt);
    const pointer = this.config.pointerInteractionEnabled ? this.pointer : null;
    const pointerRadius = Math.max(1, this.config.butterflyPointerRadius);
    const pointerFalloff = Math.max(0.1, this.config.pointerFalloff);

    this.butterflies.forEach((butterfly) => {
      const age = Math.max(0, this.motionTime - butterfly.birthTime);
      butterfly.flightPhase += delta * 0.85 * orbitSpeed;
      butterfly.wingPhase += delta * this.config.wingBeatFrequency * Math.PI * 2;
      this.updateButterflyFlightTarget(butterfly);
      butterfly.scale = butterfly.baseScale * this.config.butterflyScale;
      const orbitCenterX = butterfly.targetX;
      const orbitCenterY = butterfly.targetY;
      const orbitRadius = this.config.butterflyOrbitRadius * butterfly.orbitRadius;
      const orbitHeight = this.config.butterflyOrbitHeight * butterfly.orbitHeight;
      const orbitWobble =
        1 + Math.sin(age * 0.72 + butterfly.seed * 0.31) * this.config.butterflyOrbitWobble;
      const orbitPhase = age * 1.16 * orbitSpeed + butterfly.flightPhase;
      const verticalPhase = age * 1.37 * orbitSpeed + butterfly.flightPhase * 0.77;
      const localX = Math.sin(orbitPhase) * orbitRadius * orbitWobble;
      const localY = Math.cos(verticalPhase) * orbitHeight * orbitWobble;
      const tiltedX = localX * tiltCos - localY * tiltSin;
      const tiltedY = localX * tiltSin + localY * tiltCos;
      const wideDriftX =
        Math.sin(age * 0.42 + butterfly.seed) * 12 * this.config.butterflyOrbitDrift;
      const wideDriftY =
        Math.cos(age * 0.36 + butterfly.seed * 0.7) * 10 * this.config.butterflyOrbitDrift;
      const orbitX =
        orbitCenterX +
        wideDriftX +
        tiltedX;
      const orbitY =
        orbitCenterY +
        wideDriftY +
        tiltedY;
      const distanceX = orbitX - butterfly.x;
      const distanceY = orbitY - butterfly.y;
      let pointerInfluence = 0;
      let pointerDirectionX = 0;
      let pointerDirectionY = 0;
      if (pointer) {
        const pointerDistanceX = butterfly.x - pointer.x;
        const pointerDistanceY = butterfly.y - pointer.y;
        const pointerDistance = Math.hypot(pointerDistanceX, pointerDistanceY);
        if (pointerDistance < pointerRadius) {
          pointerInfluence = (1 - pointerDistance / pointerRadius) ** pointerFalloff;
          if (pointerDistance > 0.001) {
            pointerDirectionX = pointerDistanceX / pointerDistance;
            pointerDirectionY = pointerDistanceY / pointerDistance;
          } else {
            const fallbackAngle = butterfly.seed * 0.37;
            pointerDirectionX = Math.cos(fallbackAngle);
            pointerDirectionY = Math.sin(fallbackAngle);
          }
        }
      }
      const drift = Math.cos(age * 2.7 + butterfly.seed) * 0.018;
      const steering =
        0.00022 +
        this.config.butterflyFlowerAttraction * 0.0012 +
        this.config.centerAttraction * 0.00004 +
        this.config.butterflyPointerReturn * (1 - pointerInfluence) * 0.00082;
      butterfly.vx +=
        (distanceX * steering + drift + this.config.wind * 0.0012) * delta * 60;
      butterfly.vy +=
        (distanceY * steering + Math.sin(age * 2.2 + butterfly.seed) * 0.014) * delta * 60;
      if (pointerInfluence > 0) {
        const repulsion = this.config.butterflyPointerRepulsion * pointerInfluence * 0.064;
        butterfly.vx += pointerDirectionX * repulsion * delta * 60;
        butterfly.vy += pointerDirectionY * repulsion * delta * 60;
      }
      butterfly.vx *= 0.982;
      butterfly.vy *= 0.982;
      const flightSpeed = Math.hypot(butterfly.vx, butterfly.vy);
      const maxFlightSpeed = 6.4 * this.config.butterflyFlightSpeed;
      if (flightSpeed > maxFlightSpeed) {
        butterfly.vx = (butterfly.vx / flightSpeed) * maxFlightSpeed;
        butterfly.vy = (butterfly.vy / flightSpeed) * maxFlightSpeed;
      }
      butterfly.x += butterfly.vx * delta * 60;
      butterfly.y += butterfly.vy * delta * 60;
      const safeX = clamp(butterfly.x, 22, DESIGN_WIDTH - 22);
      const safeY = clamp(butterfly.y, BUTTERFLY_ZONE_TOP - 86, DESIGN_HEIGHT - 92);
      if (safeX !== butterfly.x) butterfly.vx = 0;
      if (safeY !== butterfly.y) butterfly.vy = 0;
      butterfly.x = safeX;
      butterfly.y = safeY;
      butterfly.rotation += butterfly.rotationSpeed * delta * 60 + butterfly.vx * 0.0006;
      butterfly.alpha = 0.9 * easeOutCubic(clamp(age / 0.34, 0, 1));

      const flowerDistance = Math.hypot(
        butterfly.flowerX - butterfly.x,
        butterfly.flowerY - butterfly.y,
      );
      if (!butterfly.flowerLinked && (flowerDistance < 112 || age > 1.65)) {
        butterfly.flowerLinked = true;
        this.activateFlower(
          butterfly.targetFlowerId,
          this.time + 0.1 + seededRandom(butterfly.seed) * 0.15,
        );
      }
    });

    this.flowers.forEach((flower) => {
      if (!flower.activated || this.time < flower.triggerAt) return;
      const age = this.time - flower.triggerAt;
      flower.stemProgress = clamp(age / 1.6, 0, 1);
      flower.leafProgress = clamp((age - 0.42) / 1.35, 0, 1);
      flower.petalProgress = clamp((age - 0.92) / 1.08, 0, 1);
    });
  }

  private getStage(): Stage {
    if (this.time < 1.4) return "intro";
    if (this.time < 3.35) return "falling";
    if (this.time < 5.2) return "morphing";
    return "bloom";
  }

  private buildGlyphs() {
    const count = Math.round(this.config.particleCount);
    for (let index = 0; index < count; index += 1) {
      const seed = this.seed + index * 17.31;
      const source = PARTICLE_POSITIONS[
        Math.min(PARTICLE_POSITIONS.length - 1, Math.floor((index * PARTICLE_POSITIONS.length) / count))
      ];
      const collapseOrder = this.getCollapseOrder(source, this.config.collapseMode);
      const releaseJitter =
        this.config.collapseMode === "column-collapse"
          ? seededRandom(this.seed + source.sourceColumn * 7.13) * 0.045
          : seededRandom(seed) * 0.08;
      const releaseAt =
        (this.config.collapseMode === "local-collapse" ? 1.24 : 1.18) +
        collapseOrder * (this.config.collapseMode === "local-collapse" ? 2.25 : 1.5) +
        releaseJitter;
      this.glyphs.push({
        id: index,
        char: source.char,
        x: DESIGN_WIDTH / 2,
        y: 314,
        vx: (seededRandom(seed + 1) - 0.5) * 0.9,
        vy: 0.4 + seededRandom(seed + 2) * 0.9,
        rotation: (seededRandom(seed + 4) - 0.5) * 0.6,
        rotationSpeed: (seededRandom(seed + 5) - 0.5) * 0.04,
        color: CODE_PALETTE[index % CODE_PALETTE.length],
        alpha: 0,
        stage: "intro",
        releaseAt,
        morphAt:
          releaseAt +
          1.85 +
          seededRandom(seed + 7) * 0.38,
        morphThresholdY:
          FLOWER_ZONE_MIN_Y + seededRandom(seed + 8) * (FLOWER_ZONE_MAX_Y - FLOWER_ZONE_MIN_Y),
        flutterPhase: seededRandom(seed + 23) * Math.PI * 2,
        turbulencePhase: seededRandom(seed + 24) * Math.PI * 2,
        morphProgress: 0,
        seed,
        sourceLine: source.sourceLine,
        sourceColumn: source.sourceColumn,
        active: false,
        flowerLinked: false,
      });
    }
  }

  private getCollapseOrder(
    source: { sourceLine: number; sourceColumn: number },
    mode: CollapseMode,
  ) {
    const centeredColumnDistance =
      Math.abs(source.sourceColumn - MAX_CODE_COLUMN / 2) / Math.max(1, MAX_CODE_COLUMN / 2);
    const rowProgress = source.sourceLine / Math.max(1, CODE_LINES.length - 1);

    if (mode === "local-collapse") {
      const columnDistance = Math.abs(source.sourceColumn - COLLAPSE_FOCUS_COLUMN);
      const rowDistance = Math.abs(source.sourceLine - COLLAPSE_FOCUS_LINE) * 2.65;
      const localDistance = Math.hypot(columnDistance, rowDistance);
      const maxDistance = Math.max(
        Math.hypot(COLLAPSE_FOCUS_COLUMN, COLLAPSE_FOCUS_LINE * 2.65),
        Math.hypot(MAX_CODE_COLUMN - COLLAPSE_FOCUS_COLUMN, (CODE_LINES.length - 1 - COLLAPSE_FOCUS_LINE) * 2.65),
      );
      return clamp((localDistance - 1.2) / Math.max(1, maxDistance - 1.2), 0, 1);
    }
    if (mode === "column-collapse") return clamp(centeredColumnDistance, 0, 1);
    if (mode === "wave-collapse") {
      return clamp(centeredColumnDistance * 0.68 + rowProgress * 0.32, 0, 1);
    }

    const sourceX = CODE_START_X + source.sourceColumn * CODE_CHAR_STEP;
    const sourceY = CODE_START_Y + source.sourceLine * CODE_LINE_STEP;
    return clamp(
      Math.hypot(sourceX - COLLAPSE_CENTER_X, sourceY - COLLAPSE_CENTER_Y) / 300,
      0,
      1,
    );
  }

  private updateButterflyFlightTarget(butterfly: Butterfly) {
    const flower = this.flowers[butterfly.targetFlowerId];
    if (flower) {
      const headPosition = getFlowerHeadPosition(
        flower,
        this.motionTime,
        this.config.flowerWindStrength,
      );
      butterfly.flowerX = headPosition.x + butterfly.flowerOffsetX;
      butterfly.flowerY = headPosition.y;
    }
    butterfly.targetX = clamp(butterfly.flowerX, 34, DESIGN_WIDTH - 34);
    butterfly.targetY = clamp(butterfly.flowerY, BUTTERFLY_ZONE_TOP - 18, DESIGN_HEIGHT - 112);
  }

  private updateFlowerPointer(delta: number) {
    const pointer = this.config.pointerInteractionEnabled ? this.pointer : null;
    const pointerRadius = Math.max(1, this.config.flowerPointerRadius);
    const pointerFalloff = Math.max(0.1, this.config.pointerFalloff);

    this.flowers.forEach((flower) => {
      const naturalPose = getFlowerPose(
        flower,
        this.motionTime,
        this.config.flowerWindStrength,
        1,
        false,
      );
      let targetOffset = 0;

      if (pointer) {
        const distanceX = naturalPose.tipX - pointer.x;
        const distanceY = naturalPose.tipY - pointer.y;
        const distance = Math.hypot(distanceX, distanceY);
        if (distance < pointerRadius) {
          const influence = (1 - distance / pointerRadius) ** pointerFalloff;
          const direction = distance > 0.001 ? distanceX / distance : 0;
          targetOffset = direction * 48 * this.config.flowerPointerStrength * influence;
        }
      }

      const responseRate =
        targetOffset === 0
          ? this.config.flowerPointerReturn
          : this.config.flowerPointerResponse;
      const smoothing = 1 - Math.exp(-Math.max(0.01, responseRate) * delta * 4);
      flower.pointerOffset += (targetOffset - flower.pointerOffset) * smoothing;
    });
  }

  private buildFlowers() {
    this.flowers = [];
    for (let index = 0; index < 36; index += 1) {
      const seed = this.seed + index * 37.4;
      this.flowers.push({
        id: index,
        x: 18 + seededRandom(seed) * 684,
        groundY: 918 + seededRandom(seed + 1) * 22,
        height: 108 + seededRandom(seed + 2) * 260,
        sway: (seededRandom(seed + 3) - 0.5) * 48,
        color: FLOWER_PALETTE[index % FLOWER_PALETTE.length],
        triggerAt: Number.POSITIVE_INFINITY,
        stemProgress: 0,
        leafProgress: 0,
        petalProgress: 0,
        activated: false,
        windPhase: seededRandom(seed + 10) * Math.PI * 2,
        pointerOffset: 0,
      });
    }
  }

  private spawnButterfly(glyph: GlyphParticle) {
    const id = this.butterflies.length;
    const targetFlowerId = id % this.flowers.length;
    const targetFlower = this.flowers[targetFlowerId];
    const flowerOffsetX = (seededRandom(glyph.seed + 13) - 0.5) * 24;
    const flowerX =
      targetFlower.x + targetFlower.sway * 0.45 + flowerOffsetX;
    const flowerY = targetFlower.groundY - targetFlower.height;
    const baseScale = 0.43 + seededRandom(glyph.seed + 12) * 0.36;
    const butterfly: Butterfly = {
      id,
      x: glyph.x,
      y: glyph.y,
      vx: glyph.vx * 0.45 + (seededRandom(glyph.seed + 9) - 0.5) * 1.2,
      vy: glyph.vy * 0.08 + seededRandom(glyph.seed + 10) * 0.18,
      rotation: glyph.rotation,
      rotationSpeed: (seededRandom(glyph.seed + 11) - 0.5) * 0.032,
      scale: baseScale * this.config.butterflyScale,
      baseScale,
      alpha: 0,
      birthTime: this.motionTime,
      color: glyph.color,
      seed: glyph.seed,
      targetFlowerId,
      flowerX,
      flowerY,
      flowerOffsetX,
      targetX: DESIGN_WIDTH / 2,
      targetY: (BUTTERFLY_ZONE_TOP + BUTTERFLY_ZONE_BOTTOM) / 2,
      orbitRadius: 0.78 + seededRandom(glyph.seed + 15) * 0.44,
      orbitHeight: 0.78 + seededRandom(glyph.seed + 16) * 0.44,
      flightPhase: seededRandom(glyph.seed + 17) * Math.PI * 2,
      wingPhase: seededRandom(glyph.seed + 18) * Math.PI * 2,
      flowerLinked: false,
    };
    this.updateButterflyFlightTarget(butterfly);
    this.butterflies.push(butterfly);
  }

  private activateFlower(flowerId: number, earliestTriggerAt: number) {
    const flower = this.flowers[flowerId];
    if (!flower || flower.activated) return;

    const flowerRatio = flower.id / Math.max(1, this.flowers.length - 1);
    const scheduledTriggerAt = 3.2 + flowerRatio * 2.6;
    const latestSafeTriggerAt = SCENE_DURATION - 2.08;
    flower.activated = true;
    flower.triggerAt = Math.min(
      latestSafeTriggerAt,
      Math.max(earliestTriggerAt, scheduledTriggerAt),
    );
  }

  private renderGlyphs(context: CanvasRenderingContext2D) {
    context.save();
    context.font = "12px 'SFMono-Regular', Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    this.glyphs.forEach((glyph) => {
      if (!glyph.active || glyph.alpha <= 0.015) return;
      context.save();
      context.translate(glyph.x, glyph.y);
      context.rotate(glyph.rotation);
      context.globalAlpha = glyph.alpha;
      context.fillStyle = glyph.color;
      context.fillText(glyph.char, 0, 0);
      context.restore();
    });
    context.restore();
  }

  private drawTexture(context: CanvasRenderingContext2D, width: number, height: number) {
    context.save();
    context.globalAlpha = 0.09;
    context.fillStyle = "#817969";
    for (let index = 0; index < 260; index += 1) {
      const x = seededRandom(this.seed + index * 2.1) * width;
      const y = seededRandom(this.seed + index * 3.8) * height;
      const radius = 0.25 + seededRandom(this.seed + index * 5.4) * 0.65;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  private buildBackground() {
    const background = document.createElement("canvas");
    background.width = Math.ceil(this.viewport.width);
    background.height = Math.ceil(this.viewport.height);
    const context = background.getContext("2d");
    if (!context) return;

    const paperGradient = context.createLinearGradient(0, 0, 0, this.viewport.height);
    paperGradient.addColorStop(0, "#f4f0e7");
    paperGradient.addColorStop(1, "#ebe7dc");
    context.fillStyle = paperGradient;
    context.fillRect(0, 0, this.viewport.width, this.viewport.height);
    this.drawTexture(context, this.viewport.width, this.viewport.height);
    this.backgroundCanvas = background;
  }
}
