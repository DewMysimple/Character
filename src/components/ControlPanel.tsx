import type { ReactNode } from "react";
import { STAGE_LABELS } from "../engine/scene";
import type {
  ButterflyDistribution,
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
            <ButterflyDistributionControl
              value={config.butterflyDistribution}
              onChange={(value) => onConfigChange("butterflyDistribution", value)}
            />
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
              label="横向分布"
              value={config.butterflyHorizontalSpread}
              min={0.35}
              max={1.2}
              step={0.01}
              display={`${Math.round(config.butterflyHorizontalSpread * 100)}%`}
              onChange={(value) => onConfigChange("butterflyHorizontalSpread", value)}
            />
            <Parameter
              label="纵向高度"
              value={config.butterflyVerticalSpread}
              min={0.35}
              max={1.15}
              step={0.01}
              display={`${Math.round(config.butterflyVerticalSpread * 100)}%`}
              onChange={(value) => onConfigChange("butterflyVerticalSpread", value)}
            />
            <Parameter
              label="漫游幅度"
              value={config.butterflyRoam}
              min={0.15}
              max={1.7}
              step={0.05}
              display={`${formatValue(config.butterflyRoam)}x`}
              onChange={(value) => onConfigChange("butterflyRoam", value)}
            />
            <Parameter
              label="聚集度"
              value={config.butterflyCohesion}
              min={0}
              max={1.2}
              step={0.05}
              display={formatValue(config.butterflyCohesion)}
              onChange={(value) => onConfigChange("butterflyCohesion", value)}
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
      </div>

      <p className="motion-note">默认蝴蝶均匀分布在花丛上方，也可以实验左右展开、中心扩散和全场漂游。</p>
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

interface ButterflyDistributionControlProps {
  value: ButterflyDistribution;
  onChange: (value: ButterflyDistribution) => void;
}

function ButterflyDistributionControl({ value, onChange }: ButterflyDistributionControlProps) {
  return (
    <label className="parameter-control parameter-control-wide">
      <span className="parameter-topline">
        <span>分布模式</span>
        <output>实时</output>
      </span>
      <select
        className="mode-select"
        value={value}
        onChange={(event) => onChange(event.target.value as ButterflyDistribution)}
        aria-label="蝴蝶分布模式"
      >
        <option value="canopy">花丛上方均匀</option>
        <option value="sides">左右两翼展开</option>
        <option value="center">中心向外扩散</option>
        <option value="full-field">全场宽幅漂游</option>
      </select>
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
