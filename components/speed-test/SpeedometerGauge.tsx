"use client";

import { useId, useMemo } from "react";
import { SpeedTestPhase } from "@/types/network";

interface SpeedometerGaugeProps {
  currentSpeedMbps: number;
  phase: SpeedTestPhase;
  phaseLabel: string;
  progress: number;
  unit?: "Mbps" | "MB/s";
}

// SVG geometry
const CX = 160;
const CY = 160;
const R = 130;
const STROKE = 14;

const START = -120;
const END = 120;
const SPAN = END - START;
const MAX_MBPS = 10_000;
const SCALE_STOPS: [mbps: number, fraction: number][] = [
  [0, 0],
  [200, 0.46],
  [1_000, 0.7],
  [MAX_MBPS, 1],
];

const speedToFraction = (mbps: number): number => {
  if (!Number.isFinite(mbps) || mbps <= 0) return 0;

  const v = Math.min(mbps, MAX_MBPS);

  for (let i = 1; i < SCALE_STOPS.length; i++) {
    const [x1, f1] = SCALE_STOPS[i];
    if (v <= x1) {
      const [x0, f0] = SCALE_STOPS[i - 1];
      return f0 + ((v - x0) / (x1 - x0)) * (f1 - f0);
    }
  }

  return 1;
};

const speedToAngle = (mbps: number) => START + speedToFraction(mbps) * SPAN;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const pointAt = (angle: number, radius: number) => ({
  x: CX + radius * Math.sin(toRad(angle)),
  y: CY - radius * Math.cos(toRad(angle)),
});

const arcPath = (from: number, to: number) => {
  const start = pointAt(from, R);
  const end = pointAt(to, R);
  const largeArc = to - from > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const TRACK_PATH = arcPath(START, END);
const NEEDLE_POINTS = `${CX - 3},${CY} ${CX},${CY - R + 15} ${CX + 3},${CY}`;

// geometry computed once at module load
const LABELED_TICKS_MBPS = [
  0, 25, 50, 100, 150, 200, 500, 1_000, 5_000, 10_000,
];

// Unlabeled tick marks that fill the gaps
const MINOR_TICKS_MBPS = [75, 125, 175, 300, 750, 2_000, 7_500];

const TICKS = [
  ...LABELED_TICKS_MBPS.map((value) => ({ value, major: true })),
  ...MINOR_TICKS_MBPS.map((value) => ({ value, major: false })),
].map(({ value, major }) => {
  const angle = speedToAngle(value);
  return {
    value,
    major,
    key: `${major ? "M" : "m"}-${value}`,
    inner: pointAt(angle, R - 14),
    outer: pointAt(angle, major ? R - 24 : R - 19),
    label: pointAt(angle, R - 36),
  };
});

const formatTickLabel = (mbps: number, isMB: boolean): string => {
  const v = isMB ? mbps / 8 : mbps;

  if (!isMB) {
    return v >= 1_000 ? `${v / 1_000}G` : String(v);
  }

  if (v >= 1_000) return `${Number((v / 1_000).toFixed(1))}k`;
  return String(Number(v.toFixed(v >= 10 ? 0 : 1)));
};

export function SpeedometerGauge({
  currentSpeedMbps,
  phase,
  phaseLabel,
  progress,
  unit = "Mbps",
}: SpeedometerGaugeProps) {
  const id = useId().replace(/:/g, "");
  const gradientId = `gauge-grad-${id}`;
  const glowId = `gauge-glow-${id}`;

  const isMB = unit === "MB/s";

  const safeMbps = Number.isFinite(currentSpeedMbps)
    ? Math.max(0, Math.min(currentSpeedMbps, MAX_MBPS))
    : 0;

  const displaySpeed = isMB ? safeMbps / 8 : safeMbps;

  const needleAngle = speedToAngle(safeMbps);
  const showActiveArc = needleAngle - START > 0.5;
  const activePath = useMemo(
    () => (showActiveArc ? arcPath(START, needleAngle) : ""),
    [showActiveArc, needleAngle],
  );

  const readout =
    displaySpeed >= 100
      ? Math.round(displaySpeed).toLocaleString("en-US")
      : displaySpeed.toFixed(1);

  const clampedProgress = Number.isFinite(progress)
    ? Math.min(Math.max(progress, 0), 100)
    : 0;

  const phaseText = phase === "idle" ? "Ready" : phase;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative w-72 h-72 sm:w-80 sm:h-80">
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          role="meter"
          aria-label="Network speed"
          aria-valuemin={0}
          aria-valuemax={isMB ? MAX_MBPS / 8 : MAX_MBPS}
          aria-valuenow={Math.round(displaySpeed)}
          aria-valuetext={`${readout} ${unit}`}
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={CX - R}
              y1={CY}
              x2={CX + R}
              y2={CY}
            >
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="33%" stopColor="#4ADE80" />
              <stop offset="66%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>

            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="#1e293b"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Active arc */}
          {showActiveArc && (
            <path
              d={activePath}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          )}

          {/* Ticks */}
          <g aria-hidden="true">
            {TICKS.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={tick.inner.x}
                  y1={tick.inner.y}
                  x2={tick.outer.x}
                  y2={tick.outer.y}
                  stroke={tick.major ? "#64748b" : "#334155"}
                  strokeWidth={tick.major ? 2 : 1}
                  strokeLinecap="round"
                />
                {tick.major && (
                  <text
                    x={tick.label.x}
                    y={tick.label.y}
                    fill="#94a3b8"
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight={500}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {formatTickLabel(tick.value, isMB)}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Needle — CSS transform so the transition actually animates */}
          <polygon
            points={NEEDLE_POINTS}
            fill="#38bdf8"
            filter={`url(#${glowId})`}
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className="motion-reduce:transition-none"
          />

          {/* Hub */}
          <circle
            cx={CX}
            cy={CY}
            r={10}
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth={3}
          />
          <circle cx={CX} cy={CY} r={4} fill="#38bdf8" />
        </svg>

        {/* Center readout, placed just below the hub */}
        <div className="pointer-events-none absolute inset-x-0 top-[70%] flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white tabular-nums">
              {readout}
            </span>
            <span className="text-sm sm:text-base font-semibold text-cyan-400 font-mono">
              {unit}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                phase === "download"
                  ? "bg-cyan-400 animate-ping"
                  : phase === "upload"
                    ? "bg-violet-400 animate-ping"
                    : phase === "latency"
                      ? "bg-amber-400 animate-ping"
                      : phase === "finished"
                        ? "bg-emerald-400"
                        : "bg-zinc-500"
              }`}
            />
            <span className="uppercase tracking-wider font-semibold text-xs">
              {phaseText}
            </span>
          </div>

          {clampedProgress > 0 && clampedProgress < 100 && (
            <div className="w-28 mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-cyan-400 to-violet-500 transition-[width] duration-300"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center font-medium mt-1 max-w-xs truncate">
        {phaseLabel}
      </p>
    </div>
  );
}
