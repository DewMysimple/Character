// Calibration-only entry: drives SceneEngine deterministically so frames can
// be captured headlessly and compared against the reference video stills.
// Not referenced by the app; safe to delete once calibration is settled.
import { SceneEngine } from "./engine/scene";
import {
  DEFAULT_PHYSICS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  PARTICLE_COUNT_DEFAULT,
  PARTICLE_COUNT_MAX,
  PARTICLE_COUNT_MIN,
} from "./engine/types";

const params = new URLSearchParams(location.search);
const times = (params.get("t") ?? "1.4,2.0,2.6,3.2,4.0,5.0")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value));
const columns = Number(params.get("cols") ?? 3);
const scale = Number(params.get("scale") ?? 1);

const overrides: Partial<typeof DEFAULT_PHYSICS> = {};
for (const [key, value] of params.entries()) {
  if (key === "t" || key === "cols" || key === "scale") continue;
  if (key in DEFAULT_PHYSICS) {
    const current = DEFAULT_PHYSICS[key as keyof typeof DEFAULT_PHYSICS];
    (overrides as Record<string, unknown>)[key] =
      typeof current === "number" ? Number(value) : value;
  }
}

if (params.get("check") === "1") {
  runChecks();
}

function runChecks() {
  const lines: string[] = [];
  const record = (name: string, pass: boolean, detail: string) =>
    lines.push(`${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`);

  // 1. Displacement stays one-way: no glyph may climb back above the row it
  //    broke away from, even though a catch beat can briefly lift it.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    let worstRise = 0;
    for (let time = 0.5; time <= 8; time += 0.25) {
      engine.reset();
      engine.seek(time);
      for (const glyph of engine.debugGlyphs()) {
        if (!glyph.active) continue;
        worstRise = Math.max(worstRise, glyph.releaseY - glyph.y);
      }
    }
    record("one-way displacement", worstRise <= 0.001, `max rise ${worstRise.toFixed(4)}px`);
  }

  // 2. Frame-rate independence: the same wall-clock run at 60Hz and 144Hz must
  //    land in the same place. Per-frame damping used to break this badly.
  {
    const slow = new SceneEngine({ ...DEFAULT_PHYSICS });
    const fast = new SceneEngine({ ...DEFAULT_PHYSICS });
    for (let step = 0; step < 60 * 4; step += 1) slow.advance(1 / 60);
    for (let step = 0; step < 144 * 4; step += 1) fast.advance(1 / 144);
    const slowGlyphs = slow.debugGlyphs();
    const fastGlyphs = fast.debugGlyphs();
    let worst = 0;
    slowGlyphs.forEach((glyph, index) => {
      const other = fastGlyphs[index];
      if (!glyph.active || !other.active) return;
      worst = Math.max(worst, Math.hypot(glyph.x - other.x, glyph.y - other.y));
    });
    record("60Hz vs 144Hz", worst < 6, `max drift ${worst.toFixed(3)}px after 4s`);
  }

  // 3. Seeking to t and playing to t must agree.
  {
    const played = new SceneEngine({ ...DEFAULT_PHYSICS });
    for (let step = 0; step < 60 * 3; step += 1) played.advance(1 / 60);
    const sought = new SceneEngine({ ...DEFAULT_PHYSICS });
    sought.seek(3);
    let worst = 0;
    played.debugGlyphs().forEach((glyph, index) => {
      const other = sought.debugGlyphs()[index];
      if (!glyph.active || !other.active) return;
      worst = Math.max(worst, Math.hypot(glyph.x - other.x, glyph.y - other.y));
    });
    record("seek vs play", worst < 6, `max drift ${worst.toFixed(3)}px at 3s`);
  }

  // 4. Replays must be reproducible.
  {
    const first = new SceneEngine({ ...DEFAULT_PHYSICS });
    first.seek(4);
    const second = new SceneEngine({ ...DEFAULT_PHYSICS });
    second.seek(4);
    let worst = 0;
    first.debugGlyphs().forEach((glyph, index) => {
      const other = second.debugGlyphs()[index];
      worst = Math.max(worst, Math.hypot(glyph.x - other.x, glyph.y - other.y));
    });
    record("replay determinism", worst === 0, `max drift ${worst}px`);
  }

  // 5. The 8 second garden must still finish, with the slower fall.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    engine.seek(8);
    const snapshot = engine.getSnapshot();
    const flowers = engine.debugFlowers();
    const bloomed = flowers.filter((flower) => flower.petalProgress >= 0.999).length;
    record(
      "8s garden",
      bloomed === flowers.length && snapshot.butterflies > 0,
      `${bloomed}/${flowers.length} flowers bloomed, ${snapshot.butterflies} butterflies`,
    );
  }

  // 6. Column mode must keep whole-column gaps: one release time per column.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS, collapseMode: "column-collapse" });
    const byColumn = new Map<number, Set<number>>();
    engine.debugGlyphs().forEach((glyph) => {
      if (!Number.isFinite(glyph.releaseAt)) return;
      const times = byColumn.get(glyph.sourceColumn) ?? new Set<number>();
      times.add(Math.round(glyph.releaseAt * 1e6));
      byColumn.set(glyph.sourceColumn, times);
    });
    const split = [...byColumn.values()].filter((times) => times.size > 1).length;
    record("column gap integrity", split === 0, `${split} columns with mixed release times`);
  }

  // 7. Neighbouring selected glyphs on each source line must not release in
  //    lockstep, or the collapse reads as rigid batches. Lower particle counts
  //    do not necessarily select consecutive source columns, so compare the
  //    actual selected neighbours instead of requiring column + 1.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    const byLine = new Map<number, Array<{ column: number; releaseAt: number }>>();
    engine.debugGlyphs().forEach((glyph) => {
      if (!Number.isFinite(glyph.releaseAt)) return;
      const glyphs = byLine.get(glyph.sourceLine) ?? [];
      glyphs.push({ column: glyph.sourceColumn, releaseAt: glyph.releaseAt });
      byLine.set(glyph.sourceLine, glyphs);
    });
    let pairs = 0;
    let identical = 0;
    byLine.forEach((glyphs) => {
      glyphs.sort((left, right) => left.column - right.column);
      for (let index = 1; index < glyphs.length; index += 1) {
        pairs += 1;
        if (Math.abs(glyphs[index].releaseAt - glyphs[index - 1].releaseAt) < 0.008) {
          identical += 1;
        }
      }
    });
    record(
      "neighbour de-batching",
      pairs > 0 && identical / pairs < 0.05,
      `${identical}/${pairs} selected neighbour pairs within 8ms`,
    );
  }

  // 8. Cost per frame with the plume at its densest and motion blur on.
  {
    const perfCanvas = document.createElement("canvas");
    perfCanvas.width = DESIGN_WIDTH;
    perfCanvas.height = DESIGN_HEIGHT;
    const perfContext = perfCanvas.getContext("2d");
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    engine.seek(3.2);
    engine.setViewport(DESIGN_WIDTH, DESIGN_HEIGHT);
    const frames = 120;
    const started = performance.now();
    for (let frame = 0; frame < frames; frame += 1) {
      engine.advance(1 / 60);
      if (perfContext) engine.render(perfContext);
    }
    const perFrame = (performance.now() - started) / frames;
    record(
      "frame cost",
      perFrame < 16.6,
      `${perFrame.toFixed(2)}ms/frame (advance + render, ${engine.getSnapshot().activeGlyphs} live glyphs)`,
    );
  }

  // 9. The configured lower/default/upper particle counts must all create the
  //    requested number of butterflies and finish the garden by 8 seconds.
  {
    const counts = [PARTICLE_COUNT_MIN, PARTICLE_COUNT_DEFAULT, PARTICLE_COUNT_MAX];
    const results = counts.map((particleCount) => {
      const engine = new SceneEngine({ ...DEFAULT_PHYSICS, particleCount });
      engine.seek(8);
      const flowers = engine.debugFlowers();
      return {
        particleCount,
        butterflies: engine.getSnapshot().butterflies,
        bloomed: flowers.filter((flower) => flower.petalProgress >= 0.999).length,
        flowers: flowers.length,
      };
    });
    const pass = results.every(
      ({ particleCount, butterflies, bloomed, flowers }) =>
        butterflies === particleCount && bloomed === flowers,
    );
    record(
      "particle-count bounds",
      pass,
      results
        .map(({ particleCount, butterflies, bloomed, flowers }) =>
          `${particleCount}: ${butterflies} butterflies, ${bloomed}/${flowers} flowers`,
        )
        .join("; "),
    );
  }

  // 10. The eight-second story clock may stop, but the living layer must keep
  //     moving and accepting pointer input after the garden is complete.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    engine.seek(8);
    const before = engine.debugButterflies().map(({ x, y }) => ({ x, y }));
    for (let frame = 0; frame < 60; frame += 1) engine.advance(1 / 60);
    const maxTravel = engine.debugButterflies().reduce((maximum, butterfly, index) => {
      const origin = before[index];
      return Math.max(maximum, Math.hypot(butterfly.x - origin.x, butterfly.y - origin.y));
    }, 0);

    const pointerEngine = new SceneEngine({ ...DEFAULT_PHYSICS });
    pointerEngine.seek(8);
    const targetFlower = pointerEngine.debugFlowers()[0];
    pointerEngine.setPointer({
      x: targetFlower.x + targetFlower.sway * 0.45 - 50,
      y: targetFlower.groundY - targetFlower.height,
    });
    for (let frame = 0; frame < 30; frame += 1) pointerEngine.advance(1 / 60);
    const maxPointerOffset = pointerEngine.debugFlowers().reduce(
      (maximum, flower) => Math.max(maximum, Math.abs(flower.pointerOffset)),
      0,
    );

    const pointerControl = new SceneEngine({ ...DEFAULT_PHYSICS });
    const butterflyPointerEngine = new SceneEngine({ ...DEFAULT_PHYSICS });
    pointerControl.seek(8);
    butterflyPointerEngine.seek(8);
    const pointerTarget = butterflyPointerEngine.debugButterflies()[0];
    butterflyPointerEngine.setPointer({ x: pointerTarget.x, y: pointerTarget.y });
    for (let frame = 0; frame < 30; frame += 1) {
      pointerControl.advance(1 / 60);
      butterflyPointerEngine.advance(1 / 60);
    }
    const maxPointerDeflection = butterflyPointerEngine.debugButterflies().reduce(
      (maximum, butterfly, index) => {
        const control = pointerControl.debugButterflies()[index];
        return Math.max(maximum, Math.hypot(butterfly.x - control.x, butterfly.y - control.y));
      },
      0,
    );

    record(
      "post-8s living motion",
      maxTravel > 1 &&
        maxPointerOffset > 0.1 &&
        maxPointerDeflection > 0.5 &&
        engine.getSnapshot().time === 8,
      `${maxTravel.toFixed(2)}px orbit travel, ${maxPointerOffset.toFixed(2)}px flower sway, ${maxPointerDeflection.toFixed(2)}px butterfly deflection, timeline ${engine.getSnapshot().time.toFixed(2)}s`,
    );
  }

  // 11. Ecological flight should spend most of its time near flowers while
  //     still producing staggered neighbour visits instead of fixed loops.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    engine.seek(8);
    let nearSamples = 0;
    let totalSamples = 0;
    let closePairs = 0;
    let sampledPairs = 0;
    let maxOccupancy = 0;
    let maxStep = 0;
    let previous = engine.debugButterflies().map(({ x, y }) => ({ x, y }));

    for (let frame = 0; frame < 60 * 12; frame += 1) {
      engine.advance(1 / 60);
      const butterflies = engine.debugButterflies();
      butterflies.forEach((butterfly, index) => {
        maxStep = Math.max(
          maxStep,
          Math.hypot(butterfly.x - previous[index].x, butterfly.y - previous[index].y),
        );
      });
      previous = butterflies.map(({ x, y }) => ({ x, y }));

      if (frame % 30 !== 29) continue;
      const occupancy = new Array(engine.debugFlowers().length).fill(0) as number[];
      butterflies.forEach((butterfly) => {
        occupancy[butterfly.targetFlowerId] += 1;
        const distance = Math.hypot(
          butterfly.x - butterfly.flowerX,
          butterfly.y - butterfly.flowerY,
        );
        if (distance <= 135) nearSamples += 1;
        totalSamples += 1;
      });
      maxOccupancy = Math.max(maxOccupancy, ...occupancy);
      for (let first = 0; first < butterflies.length; first += 1) {
        for (let second = first + 1; second < butterflies.length; second += 1) {
          if (
            Math.hypot(
              butterflies[first].x - butterflies[second].x,
              butterflies[first].y - butterflies[second].y,
            ) < 10
          ) {
            closePairs += 1;
          }
          sampledPairs += 1;
        }
      }
    }

    const butterflies = engine.debugButterflies();
    const switched = butterflies.filter(
      (butterfly) => butterfly.visitCount >= 2 || butterfly.targetFlowerId !== butterfly.homeFlowerId,
    ).length;
    const nearRatio = nearSamples / Math.max(1, totalSamples);
    const switchedRatio = switched / Math.max(1, butterflies.length);
    const overlapRatio = closePairs / Math.max(1, sampledPairs);
    record(
      "ecological flower visits",
      nearRatio >= 0.75 &&
        switchedRatio >= 0.3 &&
        maxOccupancy <= 10 &&
        overlapRatio < 0.05 &&
        maxStep < 7 &&
        engine.getSnapshot().time === 8,
      `${(nearRatio * 100).toFixed(1)}% near flowers, ${(switchedRatio * 100).toFixed(1)}% changed visits, max occupancy ${maxOccupancy}, ${(overlapRatio * 100).toFixed(2)}% overlaps, ${maxStep.toFixed(2)}px max step`,
    );
  }

  // 12. The fixed 60Hz agent layer must agree across display refresh rates,
  //     and pointer evasion must reacquire the same flower before resuming.
  {
    const slow = new SceneEngine({ ...DEFAULT_PHYSICS });
    const fast = new SceneEngine({ ...DEFAULT_PHYSICS });
    slow.seek(8);
    fast.seek(8);
    for (let frame = 0; frame < 60 * 8; frame += 1) slow.advance(1 / 60);
    for (let frame = 0; frame < 144 * 8; frame += 1) fast.advance(1 / 144);
    let maxDrift = 0;
    let stateMismatches = 0;
    slow.debugButterflies().forEach((butterfly, index) => {
      const other = fast.debugButterflies()[index];
      maxDrift = Math.max(maxDrift, Math.hypot(butterfly.x - other.x, butterfly.y - other.y));
      if (
        butterfly.flightMode !== other.flightMode ||
        butterfly.targetFlowerId !== other.targetFlowerId
      ) {
        stateMismatches += 1;
      }
    });

    const pointerEngine = new SceneEngine({ ...DEFAULT_PHYSICS });
    pointerEngine.seek(8);
    const target = pointerEngine.debugButterflies()[0];
    const targetFlowerId = target.targetFlowerId;
    pointerEngine.setPointer({ x: target.x, y: target.y });
    for (let frame = 0; frame < 30; frame += 1) pointerEngine.advance(1 / 60);
    pointerEngine.setPointer(null);
    for (let frame = 0; frame < 60 * 4; frame += 1) pointerEngine.advance(1 / 60);
    const recovered = pointerEngine.debugButterflies()[0];
    const returnDistance = Math.hypot(
      recovered.x - recovered.flowerX,
      recovered.y - recovered.flowerY,
    );
    const returned =
      recovered.targetFlowerId === targetFlowerId &&
      (recovered.flightMode === "approach" || recovered.flightMode === "orbit") &&
      returnDistance < 135;

    record(
      "agent determinism and pointer return",
      maxDrift < 2 && stateMismatches === 0 && returned,
      `${maxDrift.toFixed(3)}px 60/144 drift, ${stateMismatches} state mismatches, ${returnDistance.toFixed(1)}px pointer return (${recovered.flightMode})`,
    );
  }

  // 13. Every glyph must leave the hot simulation/render path by the end of
  //     the story, and rebuilding a DPR-aware card cache must preserve holes.
  {
    const canvas = document.createElement("canvas");
    canvas.width = DESIGN_WIDTH * 2;
    canvas.height = DESIGN_HEIGHT * 2;
    const context = canvas.getContext("2d");
    context?.setTransform(2, 0, 0, 2, 0, 0);
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    engine.setRenderScale(2);
    engine.seek(8);
    if (context) engine.render(context);
    const first = engine.debugPerformance();
    engine.setRenderScale(1.5);
    if (context) engine.render(context);
    const rebuilt = engine.debugPerformance();
    record(
      "glyph retirement and card cache",
      engine.getSnapshot().activeGlyphs === 0 &&
        first.liveGlyphs === 0 &&
        first.retiredGlyphs === PARTICLE_COUNT_DEFAULT &&
        first.sourceGlyphDraws === 0 &&
        rebuilt.cardCacheBuilds === first.cardCacheBuilds + 1,
      `${first.retiredGlyphs}/${PARTICLE_COUNT_DEFAULT} retired, ${first.liveGlyphs} live, ${first.sourceGlyphDraws} source glyph draws, ${rebuilt.cardCacheBuilds} cache builds`,
    );
  }

  // 14. The spatial grid must resolve exactly the same local forces as the
  //     former all-pairs loop while rejecting the overwhelming majority of
  //     distant pairs before the expensive distance calculation.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    engine.seek(8);
    const comparison = engine.debugSeparationComparison();
    record(
      "spatial separation parity",
      comparison.maxForceError < 1e-9 &&
        comparison.candidatePairs < comparison.brutePairs * 0.25,
      `${comparison.maxForceError.toExponential(2)} max force error, ${comparison.candidatePairs}/${comparison.brutePairs} candidate pairs`,
    );
  }

  // 15. Warm-cache DPR2 performance at the default and maximum supported
  //     counts. P95 catches recurring stalls without letting one unrelated
  //     browser scheduling spike fail the deterministic scene checks.
  {
    const benchmark = (particleCount: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = DESIGN_WIDTH * 2;
      canvas.height = DESIGN_HEIGHT * 2;
      const context = canvas.getContext("2d");
      if (!context) return Number.POSITIVE_INFINITY;
      context.setTransform(2, 0, 0, 2, 0, 0);
      const engine = new SceneEngine({ ...DEFAULT_PHYSICS, particleCount });
      engine.setViewport(DESIGN_WIDTH, DESIGN_HEIGHT);
      engine.setRenderScale(2);
      engine.seek(3.2);
      engine.render(context);
      const samples: number[] = [];
      for (let frame = 0; frame < 150; frame += 1) {
        const started = performance.now();
        engine.advance(1 / 60);
        engine.render(context);
        if (frame >= 10) samples.push(performance.now() - started);
      }
      samples.sort((left, right) => left - right);
      return samples[Math.floor((samples.length - 1) * 0.95)];
    };
    const defaultP95 = benchmark(PARTICLE_COUNT_DEFAULT);
    const maximumP95 = benchmark(PARTICLE_COUNT_MAX);
    record(
      "DPR2 performance budget",
      defaultP95 < 8.3 && maximumP95 < 16.6,
      `${defaultP95.toFixed(2)}ms default P95, ${maximumP95.toFixed(2)}ms maximum P95`,
    );
  }

  const pre = document.createElement("pre");
  pre.id = "checks";
  pre.textContent = lines.join("\n");
  document.body.appendChild(pre);
}

const rows = Math.ceil(times.length / columns);
const cellWidth = DESIGN_WIDTH * scale;
const cellHeight = DESIGN_HEIGHT * scale;

const canvas = document.createElement("canvas");
canvas.width = columns * cellWidth;
canvas.height = rows * cellHeight;
document.body.appendChild(canvas);

const context = canvas.getContext("2d");
if (context) {
  const engine = new SceneEngine({ ...DEFAULT_PHYSICS, ...overrides });
  times.forEach((time, index) => {
    engine.reset();
    engine.seek(time);
    engine.setViewport(DESIGN_WIDTH, DESIGN_HEIGHT);

    context.save();
    context.translate((index % columns) * cellWidth, Math.floor(index / columns) * cellHeight);
    context.beginPath();
    context.rect(0, 0, cellWidth, cellHeight);
    context.clip();
    context.scale(scale, scale);
    engine.render(context);
    context.restore();

    context.save();
    context.fillStyle = "rgba(40,38,34,0.75)";
    context.font = "600 16px system-ui, sans-serif";
    context.fillText(
      `${time.toFixed(2)}s`,
      (index % columns) * cellWidth + 12,
      Math.floor(index / columns) * cellHeight + 24,
    );
    context.restore();
  });
  document.title = "harness-ready";
}
