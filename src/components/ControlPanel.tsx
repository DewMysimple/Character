import type { ReactNode } from "react";
import { STAGE_LABELS } from "../engine/scene";
import type {
  CollapseMode,
  PhysicsConfig,
  SceneSnapshot,
} from "../engine/types";

interface ControlPanelProps {
  config: PhysicsConfig;
  playing: boolean;
  snapshot: SceneSnapshot;
  onToggle: () => void;
  onReplay: () => void;
  onResetConfig: () => void;
  onSeek: (time: number) => void;
  onConfigChange: <Key extends keyof PhysicsConfig>(key: Key, value: PhysicsConfig[Key]) => void;
}

const formatValue = (value: number, digits = 2) => value.toFixed(digits);

export function ControlPanel({
  config,
  playing,
  snapshot,
  onToggle,
  onReplay,
  onResetConfig,
  onSeek,
  onConfigChange,
}: ControlPanelProps) {
  return (
    <aside className="control-panel" aria-label="动画控制台">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">OBJECT STUDY / 08 SEC</p>
          <h1>字符物理实验</h1>
        </div>
        <span className={`stage-mark ${playing ? "is-live" : ""}`} aria-label={playing ? "正在播放" : "已暂停"} />
      </div>

      <p className="panel-intro">
        让代码里的字符受力下落，经过一次轻微的替换，变成会飞的蝴蝶和逐渐开放的花。
      </p>

      <div className="timeline-block">
        <div className="timeline-labels">
          <span>{STAGE_LABELS[snapshot.stage]}</span>
          <span className="time-value">
            {formatValue(snapshot.time, 2)} / 8.00s
          </span>
        </div>
        <input
          className="timeline-range"
          type="range"
          min="0"
          max="8"
          step="0.01"
          value={snapshot.time}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="动画进度"
        />
      </div>

      <div className="transport-row">
        <button className="button button-primary" type="button" onClick={onToggle}>
          {playing ? "暂停" : "播放"}
        </button>
        <button className="button button-quiet" type="button" onClick={onReplay}>
          重播
        </button>
        <span className="keyboard-note">Space / R</span>
      </div>

      <div className="panel-divider" />

      <div className="stats-row" aria-live="polite">
        <div>
          <span>字符</span>
          <strong>{snapshot.activeGlyphs}</strong>
        </div>
        <div>
          <span>蝴蝶</span>
          <strong>{snapshot.butterflies}</strong>
        </div>
        <div>
          <span>花朵</span>
          <strong>{snapshot.flowers}</strong>
        </div>
      </div>

      <div className="parameter-heading">
        <span>实验参数</span>
        <div className="parameter-heading-actions">
          <span className="parameter-hint">实时生效</span>
          <button className="reset-button" type="button" onClick={onResetConfig}>
            恢复默认
          </button>
        </div>
      </div>

      <div className="parameter-sections">
        <ParameterSection title="文字坍塌" note="缺口传播与下落物理">
          <div className="parameters-grid">
            <CollapseModeControl
              value={config.collapseMode}
              onChange={(value) => onConfigChange("collapseMode", value)}
            />
            <Parameter
              label="播放速度"
              value={config.speed}
              min={0.25}
              max={1.75}
              step={0.05}
              display={`${formatValue(config.speed)}x`}
              onChange={(value) => onConfigChange("speed", value)}
            />
            <Parameter
              label="重力"
              value={config.gravity}
              min={0.35}
              max={1.8}
              step={0.05}
              display={formatValue(config.gravity)}
              onChange={(value) => onConfigChange("gravity", value)}
            />
            <Parameter
              label="风力"
              value={config.wind}
              min={-1.2}
              max={1.2}
              step={0.05}
              display={formatValue(config.wind)}
              onChange={(value) => onConfigChange("wind", value)}
            />
            <Parameter
              label="中心吸引"
              value={config.centerAttraction}
              min={0}
              max={1.6}
              step={0.05}
              display={formatValue(config.centerAttraction)}
              onChange={(value) => onConfigChange("centerAttraction", value)}
            />
            <Parameter
              label="坍塌时长"
              value={config.collapseDuration}
              min={0.7}
              max={2.4}
              step={0.05}
              display={`${formatValue(config.collapseDuration)}s`}
              onChange={(value) => onConfigChange("collapseDuration", value)}
            />
            <Parameter
              label="变形时长"
              value={config.morphDuration}
              min={0.45}
              max={1.8}
              step={0.05}
              display={`${formatValue(config.morphDuration)}s`}
              onChange={(value) => onConfigChange("morphDuration", value)}
            />
            <Parameter
              label="字符数量"
              value={config.particleCount}
              min={120}
              max={480}
              step={10}
              display={String(config.particleCount)}
              onChange={(value) => onConfigChange("particleCount", value)}
            />
          </div>
        </ParameterSection>

        <ParameterSection title="蝴蝶飞行" note="完成后仍可实时调整">
          <div className="parameters-grid">
            <FlowerOrbitModeControl />
            <Parameter
              label="扇翅频率"
              value={config.wingBeatFrequency}
              min={1.2}
              max={5.5}
              step={0.1}
              display={`${formatValue(config.wingBeatFrequency, 1)}Hz`}
              onChange={(value) => onConfigChange("wingBeatFrequency", value)}
            />
            <Parameter
              label="围绕半径"
              value={config.butterflyOrbitRadius}
              min={12}
              max={120}
              step={1}
              display={`${Math.round(config.butterflyOrbitRadius)}px`}
              onChange={(value) => onConfigChange("butterflyOrbitRadius", value)}
            />
            <Parameter
              label="环绕高度"
              value={config.butterflyOrbitHeight}
              min={8}
              max={96}
              step={1}
              display={`${Math.round(config.butterflyOrbitHeight)}px`}
              onChange={(value) => onConfigChange("butterflyOrbitHeight", value)}
            />
            <Parameter
              label="轨道速度"
              value={config.butterflyOrbitSpeed}
              min={0.2}
              max={2.4}
              step={0.05}
              display={`${formatValue(config.butterflyOrbitSpeed)}x`}
              onChange={(value) => onConfigChange("butterflyOrbitSpeed", value)}
            />
            <Parameter
              label="轨道倾角"
              value={config.butterflyOrbitTilt}
              min={-60}
              max={60}
              step={1}
              display={`${Math.round(config.butterflyOrbitTilt)}°`}
              onChange={(value) => onConfigChange("butterflyOrbitTilt", value)}
            />
            <Parameter
              label="轨道呼吸"
              value={config.butterflyOrbitWobble}
              min={0}
              max={0.8}
              step={0.01}
              display={`${Math.round(config.butterflyOrbitWobble * 100)}%`}
              onChange={(value) => onConfigChange("butterflyOrbitWobble", value)}
            />
            <Parameter
              label="轨道漂移"
              value={config.butterflyOrbitDrift}
              min={0}
              max={1.4}
              step={0.05}
              display={`${formatValue(config.butterflyOrbitDrift)}x`}
              onChange={(value) => onConfigChange("butterflyOrbitDrift", value)}
            />
            <Parameter
              label="花朵跟随"
              value={config.butterflyFlowerAttraction}
              min={0.15}
              max={1.8}
              step={0.05}
              display={formatValue(config.butterflyFlowerAttraction)}
              onChange={(value) => onConfigChange("butterflyFlowerAttraction", value)}
            />
            <Parameter
              label="飞行速度"
              value={config.butterflyFlightSpeed}
              min={0.35}
              max={1.8}
              step={0.05}
              display={`${formatValue(config.butterflyFlightSpeed)}x`}
              onChange={(value) => onConfigChange("butterflyFlightSpeed", value)}
            />
            <Parameter
              label="蝴蝶大小"
              value={config.butterflyScale}
              min={0.6}
              max={1.5}
              step={0.05}
              display={`${formatValue(config.butterflyScale)}x`}
              onChange={(value) => onConfigChange("butterflyScale", value)}
            />
          </div>
        </ParameterSection>

        <ParameterSection title="指针扰动" note="移入画布即可互动">
          <div className="parameters-grid">
            <PointerInteractionControl
              enabled={config.pointerInteractionEnabled}
              onChange={(value) => onConfigChange("pointerInteractionEnabled", value)}
            />
            <Parameter
              label="花朵自然风动"
              value={config.flowerWindStrength}
              min={0}
              max={1}
              step={0.01}
              display={`${Math.round(config.flowerWindStrength * 100)}%`}
              onChange={(value) => onConfigChange("flowerWindStrength", value)}
            />
            <Parameter
              label="花朵影响半径"
              value={config.flowerPointerRadius}
              min={80}
              max={300}
              step={1}
              display={`${Math.round(config.flowerPointerRadius)}px`}
              onChange={(value) => onConfigChange("flowerPointerRadius", value)}
            />
            <Parameter
              label="花朵扰动幅度"
              value={config.flowerPointerStrength}
              min={0}
              max={1.4}
              step={0.05}
              display={formatValue(config.flowerPointerStrength)}
              onChange={(value) => onConfigChange("flowerPointerStrength", value)}
            />
            <Parameter
              label="花朵响应速度"
              value={config.flowerPointerResponse}
              min={0.2}
              max={2}
              step={0.05}
              display={`${formatValue(config.flowerPointerResponse)}x`}
              onChange={(value) => onConfigChange("flowerPointerResponse", value)}
            />
            <Parameter
              label="花朵回归速度"
              value={config.flowerPointerReturn}
              min={0.2}
              max={2}
              step={0.05}
              display={`${formatValue(config.flowerPointerReturn)}x`}
              onChange={(value) => onConfigChange("flowerPointerReturn", value)}
            />
            <Parameter
              label="指针衰减"
              value={config.pointerFalloff}
              min={0.6}
              max={2.4}
              step={0.05}
              display={formatValue(config.pointerFalloff)}
              onChange={(value) => onConfigChange("pointerFalloff", value)}
            />
            <Parameter
              label="蝴蝶排斥半径"
              value={config.butterflyPointerRadius}
              min={50}
              max={260}
              step={1}
              display={`${Math.round(config.butterflyPointerRadius)}px`}
              onChange={(value) => onConfigChange("butterflyPointerRadius", value)}
            />
            <Parameter
              label="蝴蝶排斥强度"
              value={config.butterflyPointerRepulsion}
              min={0}
              max={2.4}
              step={0.05}
              display={formatValue(config.butterflyPointerRepulsion)}
              onChange={(value) => onConfigChange("butterflyPointerRepulsion", value)}
            />
            <Parameter
              label="蝴蝶回归速度"
              value={config.butterflyPointerReturn}
              min={0.2}
              max={2.4}
              step={0.05}
              display={`${formatValue(config.butterflyPointerReturn)}x`}
              onChange={(value) => onConfigChange("butterflyPointerReturn", value)}
            />
          </div>
        </ParameterSection>
      </div>

      <p className="motion-note">每只蝴蝶绑定一朵花，围绕花头形成独立轨道。指针靠近时花朵产生左右涟漪，蝴蝶会避开指针并在离开影响范围后回到花朵。</p>
    </aside>
  );
}

interface CollapseModeControlProps {
  value: CollapseMode;
  onChange: (value: CollapseMode) => void;
}

function CollapseModeControl({ value, onChange }: CollapseModeControlProps) {
  return (
    <label className="parameter-control parameter-control-wide">
      <span className="parameter-topline">
        <span>文字变化形式</span>
        <output>实时</output>
      </span>
      <select
        className="mode-select"
        value={value}
        onChange={(event) => onChange(event.target.value as CollapseMode)}
        aria-label="文字变化形式"
      >
        <option value="local-collapse">局部扩散</option>
        <option value="column-collapse">同列坍方</option>
        <option value="center-collapse">中心聚拢</option>
        <option value="wave-collapse">波纹塌落</option>
      </select>
    </label>
  );
}

function FlowerOrbitModeControl() {
  return (
    <div className="parameter-control parameter-control-wide mode-lock" aria-label="当前蝴蝶飞行模式">
      <span className="parameter-topline">
        <span>飞行模式</span>
        <output>固定</output>
      </span>
      <div className="mode-lock-value">
        <strong>围绕花朵飞行</strong>
        <span>每只蝴蝶跟随自己的花头</span>
      </div>
    </div>
  );
}

interface PointerInteractionControlProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function PointerInteractionControl({ enabled, onChange }: PointerInteractionControlProps) {
  return (
    <label className="parameter-control parameter-control-wide pointer-toggle">
      <span className="parameter-topline">
        <span>指针互动</span>
        <output>{enabled ? "开启" : "关闭"}</output>
      </span>
      <span className="toggle-control">
        <input
          className="toggle-input"
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-label="指针互动"
        />
        <span className="toggle-visual" aria-hidden="true">
          <span />
        </span>
      </span>
    </label>
  );
}

interface ParameterSectionProps {
  title: string;
  note: string;
  children: ReactNode;
}

function ParameterSection({ title, note, children }: ParameterSectionProps) {
  return (
    <section className="parameter-section">
      <div className="parameter-section-heading">
        <span>{title}</span>
        <span>{note}</span>
      </div>
      {children}
    </section>
  );
}

interface ParameterProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function Parameter({ label, value, min, max, step, display, onChange }: ParameterProps) {
  return (
    <label className="parameter-control">
      <span className="parameter-topline">
        <span>{label}</span>
        <output>{display}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  );
}
