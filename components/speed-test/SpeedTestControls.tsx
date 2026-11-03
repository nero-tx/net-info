"use client";

import React from "react";
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Clock,
  Zap,
  Activity,
  Layers,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { SpeedTestPhase, SpeedTestResults } from "@/types/network";
import { formatLatency, formatSpeed } from "@/lib/utils/formatters";

interface SpeedTestControlsProps {
  phase: SpeedTestPhase;
  isRunning: boolean;
  downloadMbps: number;
  uploadMbps: number;
  idlePingMs: number;
  loadedPingMs: number;
  jitterMs: number;
  results: SpeedTestResults | null;
  error: string | null;
  unit?: "Mbps" | "MB/s";
  onStart: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const PHASES_LIST: Array<{ id: SpeedTestPhase; label: string }> = [
  { id: "initializing", label: "1. Init" },
  { id: "connectivity", label: "2. Connectivity" },
  { id: "latency", label: "3. Idle Ping" },
  { id: "download", label: "4. Download" },
  { id: "upload", label: "5. Upload" },
  { id: "loaded-latency", label: "6. Bufferbloat" },
  { id: "finalizing", label: "7. Finalize" },
];

export function SpeedTestControls({
  phase,
  isRunning,
  downloadMbps,
  uploadMbps,
  idlePingMs,
  loadedPingMs,
  jitterMs,
  results,
  error,
  unit = "Mbps",
  onStart,
  onCancel,
  onReset,
}: SpeedTestControlsProps) {
  const getPhaseIndex = (p: SpeedTestPhase) => {
    switch (p) {
      case "initializing":
        return 0;
      case "connectivity":
        return 1;
      case "latency":
        return 2;
      case "download":
        return 3;
      case "upload":
        return 4;
      case "loaded-latency":
        return 5;
      case "finalizing":
        return 6;
      case "finished":
        return 7;
      default:
        return -1;
    }
  };

  const currentPhaseIndex = getPhaseIndex(phase);

  const getBufferbloatColor = (grade?: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
      case "B":
        return "text-blue-400 bg-blue-950/60 border-blue-500/40";
      case "C":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      case "D":
      case "F":
        return "text-rose-400 bg-rose-950/60 border-rose-500/40";
      default:
        return "text-slate-400 bg-slate-900 border-slate-800";
    }
  };

  const downFormatted = formatSpeed(downloadMbps, unit);
  const upFormatted = formatSpeed(uploadMbps, unit);

  const formatMetricMs = (val: number | undefined | null) => {
    if (val === undefined || val === null || val <= 0 || !Number.isFinite(val)) return '—';
    if (val >= 100) return Math.round(val).toString();
    return (Math.round(val * 10) / 10).toFixed(1);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* 7-Step Horizontal Progress Pipeline */}
      <div className="w-full max-w-3xl overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center justify-between min-w-125 px-2">
          {PHASES_LIST.map((step, idx) => {
            const isCompleted = currentPhaseIndex > idx || phase === "finished";
            const isCurrent = currentPhaseIndex === idx;

            return (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 border ${
                      isCompleted
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/50"
                        : isCurrent
                          ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/50 animate-pulse"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium whitespace-nowrap transition-colors ${
                      isCurrent
                        ? "text-cyan-400 font-bold"
                        : isCompleted
                          ? "text-slate-300"
                          : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < PHASES_LIST.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      isCompleted ? "bg-emerald-500/60" : "bg-slate-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-linear-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transform active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {phase === "finished"
                ? "RETEST CONNECTION"
                : "START DIAGNOSTIC TEST"}
            </span>
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-950/50 transform active:scale-95 transition-all cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>CANCEL TEST</span>
          </button>
        )}

        {(phase === "finished" || error) && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            title="Reset metrics"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="w-full max-w-2xl p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 flex items-start gap-3 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-200">
              Measurement Notice:{" "}
            </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Key Telemetry Tiles Grid */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {/* Download */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-sm font-medium uppercase tracking-wider flex items-center gap-1 truncate">
              <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Download
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 min-w-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 truncate">
              {downFormatted.value}
            </span>
            <span className="text-xs text-slate-400 font-mono shrink-0">
              {downFormatted.unit}
            </span>
          </div>
        </div>

        {/* Upload */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-sm font-medium uppercase tracking-wider flex items-center gap-1 truncate">
              <Upload className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              Upload
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 min-w-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-violet-400 truncate">
              {upFormatted.value}
            </span>
            <span className="text-xs text-slate-400 font-mono shrink-0">
              {upFormatted.unit}
            </span>
          </div>
        </div>

        {/* Idle Ping */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1 truncate">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Idle Ping
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 min-w-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 truncate">
              {formatMetricMs(idlePingMs)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">ms</span>
          </div>
        </div>

        {/* Loaded Latency */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1 truncate">
              <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Loaded Ping
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 min-w-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400 truncate">
              {formatMetricMs(loadedPingMs)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">ms</span>
          </div>
        </div>

        {/* Jitter */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1 truncate">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Jitter
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 min-w-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 truncate">
              {formatMetricMs(jitterMs)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">ms</span>
          </div>
        </div>

        {/* Bufferbloat Grade */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1 truncate">
              <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              Bufferbloat
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 min-w-0 gap-1">
            <span
              className={`px-2 py-0.5 rounded-md font-mono font-black text-lg border shrink-0 ${getBufferbloatColor(
                results?.bufferbloatGrade,
              )}`}
            >
              {results?.bufferbloatGrade || "—"}
            </span>
            <span className="text-[10px] text-slate-400 text-right leading-tight truncate">
              {results
                ? loadedPingMs > idlePingMs
                  ? `+${Math.round(loadedPingMs - idlePingMs)}ms`
                  : "Minimal bloat"
                : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
