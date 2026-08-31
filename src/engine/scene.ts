import {
  DEFAULT_PHYSICS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  SCENE_DURATION,
  type Butterfly,
  type Flower,
  type GlyphParticle,
  type PhysicsConfig,
  type SceneSnapshot,
  type Stage,
  type StemSeed,
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

const CODE_PALETTE = [
  "#6f91c4",
  "#bf6f5f",
  "#8e9d6a",
  "#aa8a6c",
  "#7b7771",
  "#c58a62",
];

const FLOWER_PALETTE = ["#bf8d8b", "#9aa89b", "#a8a0b8", "#c8a77f"];

const GLYPH_SOURCE =
  "const snapshot = this.undoHistory.pop(); if (!snapshot) return false; this.redoHistoryStack.push(this.captureSnapshot()); this.applySnapshotToBuffer(snapshot); this.emit('history:undo', snapshot); renderVisibleRows(firstRow, rowCount); return this.textLinesByRow.slice(firstRow, firstRow + rowCount); // ReactiveDocumentStore keeps a small bus for each edit. ";

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

const drawCodeCard = (context: CanvasRenderingContext2D, time: number) => {
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
  CODE_LINES.forEach((line, lineIndex) => {
    const y = cardY + 42 + lineIndex * 17;
    context.fillStyle = "rgba(128, 120, 109, 0.56)";
    context.textAlign = "right";
    context.fillText(String(lineIndex + 31), cardX + 34, y);

    context.textAlign = "left";
    const reveal = clamp((time - 0.2) / 0.9, 0, 1);
    const visibleLength = Math.ceil(line.length * reveal);
    [...line.slice(0, visibleLength)].forEach((character, characterIndex) => {
      const color = CODE_PALETTE[(lineIndex * 7 + characterIndex) % CODE_PALETTE.length];
      context.fillStyle = character === " " ? "rgba(70, 68, 63, 0.52)" : color;
      context.fillText(character, cardX + 50 + characterIndex * 6.35, y);
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

const drawStem = (
  context: CanvasRenderingContext2D,
  stem: StemSeed,
  time: number,
) => {
  const progress = easeOutCubic(clamp((time - stem.startAt) / 1.35, 0, 1));
  if (progress <= 0) return;

  const groundY = stem.groundY;
  const topY = groundY - stem.height * progress;
  const curve = stem.sway * Math.sin(progress * Math.PI * 0.8);

  context.save();
  context.globalAlpha = stem.opacity;
  context.strokeStyle = "#777e72";
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(stem.x, groundY);
  context.quadraticCurveTo(stem.x + curve, groundY - stem.height * 0.48, stem.x + curve * 0.45, topY);
  context.stroke();

  const leafProgress = clamp((progress - 0.35) / 0.65, 0, 1);
  if (leafProgress > 0) {
    const leafY = groundY - stem.height * 0.45;
    const leafX = stem.x + curve * 0.55;
    context.fillStyle = "rgba(144, 157, 142, 0.56)";
    context.beginPath();
    context.ellipse(
      leafX - stem.leafSide * 7,
      leafY - 6 * leafProgress,
      10 * leafProgress,
      4.2 * leafProgress,
      stem.leafSide * -0.35,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.beginPath();
    context.ellipse(
      leafX + stem.leafSide * 7,
      leafY - 39 * leafProgress,
      9 * leafProgress,
      3.8 * leafProgress,
      stem.leafSide * 0.35,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
};

const drawFlower = (context: CanvasRenderingContext2D, flower: Flower) => {
  if (!flower.activated || flower.petalProgress <= 0) return;

  const progress = easeOutCubic(flower.petalProgress);
  const tipX = flower.x + flower.sway * Math.sin(progress * Math.PI);
  const tipY = flower.groundY - flower.height * easeOutCubic(flower.stemProgress);

  context.save();
  context.globalAlpha = 0.74 * progress;
  context.strokeStyle = "rgba(111, 123, 107, 0.74)";
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(flower.x, flower.groundY);
  context.quadraticCurveTo(
    flower.x + flower.sway,
    flower.groundY - flower.height * 0.45,
    tipX,
    tipY,
  );
  context.stroke();

  const petalCount = 5;
  const petalLength = 12 * progress;
  for (let index = 0; index < petalCount; index += 1) {
    const angle = (Math.PI * 2 * index) / petalCount - Math.PI / 2;
    context.save();
    context.translate(tipX, tipY);
    context.rotate(angle);
    context.fillStyle = flower.color;
    context.strokeStyle = "rgba(104, 99, 92, 0.35)";
    context.lineWidth = 0.65;
    context.beginPath();
    context.ellipse(0, -petalLength * 0.7, 4.5 * progress, petalLength, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }
  context.fillStyle = "rgba(164, 133, 96, 0.78)";
  context.beginPath();
  context.arc(tipX, tipY, 2.1 * progress, 0, Math.PI * 2);
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

  const wingBeat = Math.sin(butterfly.birthTime * 18 + butterfly.seed) * 0.12;
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
  private seed: number;
  private glyphs: GlyphParticle[] = [];
  private butterflies: Butterfly[] = [];
  private flowers: Flower[] = [];
  private stems: StemSeed[] = [];
  private viewport = { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS, seed = 47) {
    this.config = { ...config };
    this.seed = seed;
    this.reset(seed);
  }

  setViewport(width: number, height: number) {
    this.viewport = { width, height };
  }

  setConfig(nextConfig: PhysicsConfig) {
    const particleCountChanged = nextConfig.particleCount !== this.config.particleCount;
    this.config = { ...nextConfig };
    if (particleCountChanged) {
      const currentTime = this.time;
      this.reset(this.seed);
      this.seek(currentTime);
    }
  }

  reset(seed = this.seed) {
    this.seed = seed;
    this.time = 0;
    this.glyphs = [];
    this.butterflies = [];
    this.flowers = [];
    this.buildStems();
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
    if (this.time >= SCENE_DURATION) return;
    const delta = clamp(realDelta, 0, 0.05) * this.config.speed;
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

    const paperGradient = context.createLinearGradient(0, 0, 0, height);
    paperGradient.addColorStop(0, "#f4f0e7");
    paperGradient.addColorStop(1, "#ebe7dc");
    context.fillStyle = paperGradient;
    context.fillRect(0, 0, width, height);

    this.drawTexture(context, width, height);
    drawCodeCard(context, this.time);
    drawTitle(context, this.time);
    this.stems.forEach((stem) => drawStem(context, stem, this.time));
    this.flowers.forEach((flower) => drawFlower(context, flower));
    this.renderGlyphs(context);
    this.butterflies.forEach((butterfly) => drawButterfly(context, butterfly));
  }

  private step(delta: number) {
    const previousTime = this.time;
    this.time = clamp(this.time + delta, 0, SCENE_DURATION);

    this.glyphs.forEach((glyph) => {
      if (!glyph.active && this.time >= glyph.releaseAt) {
        glyph.active = true;
        glyph.x = DESIGN_WIDTH / 2 + (seededRandom(glyph.seed) - 0.5) * 92;
        glyph.y = 314 + seededRandom(glyph.seed + 3) * 14;
      }
      if (!glyph.active) return;

      const phaseTime = Math.max(0, this.time - glyph.releaseAt);
      const flutter = (seededRandom(glyph.seed + Math.floor(this.time * 18)) - 0.5) * 0.23;
      const attraction = (DESIGN_WIDTH / 2 - glyph.x) * this.config.centerAttraction * 0.0026;
      glyph.vx += (this.config.wind * 0.002 + attraction + flutter * 0.006) * delta * 60;
      glyph.vy += this.config.gravity * 0.09 * delta * 60;
      glyph.vx *= this.config.drag;
      glyph.vy *= this.config.drag;
      glyph.x += glyph.vx * delta * 60;
      glyph.y += glyph.vy * delta * 60;
      glyph.rotation += glyph.rotationSpeed * delta * 60;

      if (this.time >= glyph.morphAt) {
        glyph.stage = "morphing";
        glyph.morphProgress = clamp(
          (this.time - glyph.morphAt) / this.config.morphDuration,
          0,
          1,
        );
        glyph.alpha = 1 - easeInOut(glyph.morphProgress);
        if (previousTime < glyph.morphAt) this.spawnButterfly(glyph);
      } else {
        glyph.stage = "falling";
        glyph.alpha = 0.92;
      }
    });

    this.butterflies.forEach((butterfly) => {
      const age = Math.max(0, this.time - butterfly.birthTime);
      const flutter = Math.sin(age * 8 + butterfly.seed) * 0.005;
      const drift = Math.cos(age * 2.7 + butterfly.seed) * 0.014;
      butterfly.vx += drift * delta * 60;
      butterfly.vy += flutter * delta * 60 - 0.004 * delta * 60;
      butterfly.vx *= 0.997;
      butterfly.vy *= 0.996;
      butterfly.x += butterfly.vx * delta * 60;
      butterfly.y += butterfly.vy * delta * 60;
      butterfly.rotation += butterfly.rotationSpeed * delta * 60;
      butterfly.alpha = clamp(0.9 - Math.max(0, age - 2.1) * 0.16, 0, 0.9);

      if (!butterfly.flowerLinked && (butterfly.y > 790 || age > 0.74)) {
        butterfly.flowerLinked = true;
        this.activateNextFlower(this.time + 0.24 + seededRandom(butterfly.seed) * 0.36);
      }
    });

    this.flowers.forEach((flower) => {
      if (!flower.activated || this.time < flower.triggerAt) return;
      const age = this.time - flower.triggerAt;
      flower.stemProgress = clamp(age / 0.85, 0, 1);
      flower.leafProgress = clamp((age - 0.22) / 0.56, 0, 1);
      flower.petalProgress = clamp((age - 0.55) / 0.5, 0, 1);
    });
  }

  private getStage(): Stage {
    if (this.time < 1.4) return "intro";
    if (this.time < 2.8) return "falling";
    if (this.time < 3.8) return "morphing";
    return "bloom";
  }

  private buildGlyphs() {
    const count = Math.round(this.config.particleCount);
    for (let index = 0; index < count; index += 1) {
      const seed = this.seed + index * 17.31;
      const character = GLYPH_SOURCE[index % GLYPH_SOURCE.length];
      const releaseAt = 1.32 + (index / Math.max(1, count - 1)) * 1.18 + seededRandom(seed) * 0.08;
      this.glyphs.push({
        id: index,
        char: character,
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
        morphAt: releaseAt + 1.02 + seededRandom(seed + 6) * 0.28,
        morphProgress: 0,
        seed,
        active: false,
        flowerLinked: false,
      });
    }
  }

  private buildStems() {
    this.stems = [];
    for (let index = 0; index < 23; index += 1) {
      const seed = this.seed + index * 29.7;
      this.stems.push({
        x: 16 + seededRandom(seed) * 688,
        groundY: 918 + seededRandom(seed + 2) * 22,
        height: 116 + seededRandom(seed + 4) * 220,
        sway: (seededRandom(seed + 5) - 0.5) * 48,
        leafSide: seededRandom(seed + 7) > 0.5 ? 1 : -1,
        opacity: 0.26 + seededRandom(seed + 8) * 0.24,
        startAt: 0.3 + seededRandom(seed + 9) * 0.32,
      });
    }
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
      });
    }
  }

  private spawnButterfly(glyph: GlyphParticle) {
    const id = this.butterflies.length;
    this.butterflies.push({
      id,
      x: glyph.x,
      y: glyph.y,
      vx: glyph.vx * 0.45 + (seededRandom(glyph.seed + 9) - 0.5) * 1.2,
      vy: glyph.vy * 0.08 - 0.18 - seededRandom(glyph.seed + 10) * 0.15,
      rotation: glyph.rotation,
      rotationSpeed: (seededRandom(glyph.seed + 11) - 0.5) * 0.032,
      scale: 0.43 + seededRandom(glyph.seed + 12) * 0.36,
      alpha: 0,
      birthTime: this.time,
      color: glyph.color,
      seed: glyph.seed,
      flowerLinked: false,
    });
  }

  private activateNextFlower(triggerAt: number) {
    const nextFlower = this.flowers.find((flower) => !flower.activated);
    if (!nextFlower) return;
    nextFlower.activated = true;
    nextFlower.triggerAt = triggerAt;
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
}
