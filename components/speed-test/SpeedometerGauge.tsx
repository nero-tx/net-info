"use client";

import React, { useId, useMemo } from "react";
import { SpeedTestPhase } from "@/types/network";

interface SpeedometerGaugeProps {
  currentSpeedMbps: number;
  phase: SpeedTestPhase;
  phaseLabel: string;
  progress: number;
  unit?: "Mbps" | "MB/s";
}

// Geometry (SVG viewBox 320x320)
const CX = 160;
const CY = 160;
const R = 130;
const STROKE = 14;

// Gauge sweeps 240° with the gap at the bottom. 0° = top, clockwise positive.
const START = -120;
const END = 120;
const SPAN = END - START;

const TICK_VALUES = [0, 25, 50, 100, 250, 500, 1000];

const PHASE_DOT: Record<string, string> = {
  download: "bg-cyan-400 animate-ping",
  upload: "bg-violet-400 animate-ping",
  latency: "bg-amber-400 animate-ping",
  finished: "bg-emerald-400",
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

const pointAt = (angle: number, r: number) => ({
  x: CX + r * Math.sin(toRad(angle)),
  y: CY - r * Math.cos(toRad(angle)),
});

const arcPath = (from: number, to: number) => {
  const s = pointAt(from, R);
  const e = pointAt(to, R);
  const largeArc = to - from > 180 ? 1 : 0;
  // sweep-flag 1 = clockwise on screen
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`;
};

const TRACK_PATH = arcPath(START, END);

// Square-root scale: 1–100 Mbps stays readable while 1 Gbps still fits.
const speedToAngle = (speed: number, max: number) => {
  if (speed <= 0) return START;
  const n = Math.min(Math.sqrt(speed / max), 1);
  return START + n * SPAN;
};

export function SpeedometerGauge({
  currentSpeedMbps,
  phase,
  phaseLabel,
  progress,
  unit = "Mbps",
}: SpeedometerGaugeProps) {
  const gradientId = `gauge-grad-${useId().replace(/:/g, "")}`;
  const glowId = `gauge-glow-${useId().replace(/:/g, "")}`;

  const maxScale = unit === "MB/s" ? 125 : 1000;
  const displaySpeed =
    unit === "MB/s" ? currentSpeedMbps / 8 : currentSpeedMbps;

  const needleAngle = speedToAngle(displaySpeed, maxScale);
  const showActiveArc = displaySpeed > 0 && needleAngle - START > 0.5;
  const activePath = useMemo(
    () => (showActiveArc ? arcPath(START, needleAngle) : ""),
    [showActiveArc, needleAngle],
  );

  const ticks = useMemo(
    () =>
      TICK_VALUES.map((value) => {
        const angle = speedToAngle(value, maxScale);
        const inner = pointAt(angle, R - 14);
        const outer = pointAt(angle, R - 24);
        const label = pointAt(angle, R - 38);
        return {
          value,
          inner,
          outer,
          label,
          text: value >= 1000 ? "1G" : String(value),
        };
      }),
    [maxScale],
  );

  const readout =
    displaySpeed >= 100
      ? Math.round(displaySpeed).toString()
      : displaySpeed > 0
        ? displaySpeed.toFixed(1)
        : "0.0";

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={maxScale}
          aria-valuenow={Math.round(displaySpeed)}
          aria-label={`Speed in ${unit}`}
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={CX - R}
              y1={CY - R}
              x2={CX + R}
              y2={CY + R}
            >
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="#1e293b"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Active speed arc */}
          {showActiveArc && (
            <path
              d={activePath}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          )}

          {/* Ticks and labels */}
          {ticks.map((t) => (
            <g key={t.value}>
              <line
                x1={t.inner.x}
                y1={t.inner.y}
                x2={t.outer.x}
                y2={t.outer.y}
                stroke="#475569"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <text
                x={t.label.x}
                y={t.label.y}
                fill="#94a3b8"
                fontSize={9}
                fontFamily="monospace"
                fontWeight={500}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {t.text}
              </text>
            </g>
          ))}

          {/* Needle: drawn pointing up, rotated around the hub */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transformBox: "view-box",
              transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <polygon
              points={`${CX - 3},${CY} ${CX},${CY - R + 10} ${CX + 3},${CY}`}
              fill="#38bdf8"
              filter={`url(#${glowId})`}
            />
          </g>

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

        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-50 pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {readout}
            </span>
            <span className="text-sm sm:text-base font-semibold text-cyan-400 font-mono">
              {unit}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${PHASE_DOT[phase] ?? "bg-slate-500"}`}
            />
            <span className="uppercase tracking-wider font-semibold text-xs">
              {phase === "idle" ? "Ready" : phase}
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
