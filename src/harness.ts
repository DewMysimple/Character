// Calibration-only entry: drives SceneEngine deterministically so frames can
// be captured headlessly and compared against the reference video stills.
// Not referenced by the app; safe to delete once calibration is settled.
import { SceneEngine } from "./engine/scene";
import { DEFAULT_PHYSICS, DESIGN_HEIGHT, DESIGN_WIDTH } from "./engine/types";

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

  // 7. Neighbouring glyphs must not release in lockstep, or the collapse reads
  //    as rigid three-character batches.
  {
    const engine = new SceneEngine({ ...DEFAULT_PHYSICS });
    const byKey = new Map<string, number>();
    engine.debugGlyphs().forEach((glyph) => {
      if (!Number.isFinite(glyph.releaseAt)) return;
      byKey.set(`${glyph.sourceLine}:${glyph.sourceColumn}`, glyph.releaseAt);
    });
    let pairs = 0;
    let identical = 0;
    byKey.forEach((releaseAt, key) => {
      const [line, column] = key.split(":").map(Number);
      const right = byKey.get(`${line}:${column + 1}`);
      if (right === undefined) return;
      pairs += 1;
      if (Math.abs(right - releaseAt) < 0.008) identical += 1;
    });
    record(
      "neighbour de-batching",
      identical / Math.max(1, pairs) < 0.05,
      `${identical}/${pairs} adjacent pairs within 8ms`,
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
