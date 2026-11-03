'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Activity,
  Trash2,
  Clock,
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MonitoringSample } from '@/types/network';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LiveMonitoringPanelProps {
  isActive: boolean;
  isPaused: boolean;
  samples: MonitoringSample[];
  currentPingMs: number | null;
  currentJitterMs: number;
  connectionLogs: Array<{ timestamp: number; message: string; type: 'info' | 'warn' | 'error' }>;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClear: () => void;
}

export function LiveMonitoringPanel({
  isActive,
  isPaused,
  samples,
  currentPingMs,
  currentJitterMs,
  connectionLogs,
  onStart,
  onPause,
  onResume,
  onStop,
  onClear,
}: LiveMonitoringPanelProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = samples.map((s, idx) => ({
    time: `#${idx + 1}`,
    ping: s.pingMs,
    jitter: s.jitterMs,
  }));

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Continuous Live Connection Monitoring</span>
            </h3>
            {isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40 animate-pulse">
                {isPaused ? 'PAUSED' : 'STREAMING'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Low-overhead periodic beacon probing (2.5s) to assess latency drift and route stability
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isActive ? (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START MONITORING</span>
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          {samples.length > 0 && (
            <button
              onClick={onClear}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Clear Session Telemetry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Current RTT
          </span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">
            {currentPingMs !== null ? `${currentPingMs} ms` : '—'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Rolling Jitter
          </span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
            {currentJitterMs > 0 ? `${currentJitterMs} ms` : '—'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Samples Collected
          </span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            {samples.length} <span className="text-xs font-normal text-slate-500">/ 40 max</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            Memory Retention
          </span>
          <p className="text-sm font-semibold text-slate-300 mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Ephemeral Only</span>
          </p>
        </div>
      </div>

      {/* Live Chart Canvas */}
      <div className="w-full h-56 sm:h-64 mb-4">
        {samples.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs gap-2">
            <Activity className="w-5 h-5 text-slate-600" />
            <span>Click &apos;START MONITORING&apos; to begin live background connection tracking.</span>
          </div>
        ) : isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                }}
                formatter={(val: any) => [`${Number(val).toFixed(1)} ms`, 'Round-Trip Time']}
              />
              <Line
                type="monotone"
                dataKey="ping"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Live Event Log */}
      {connectionLogs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2">Monitoring Event Stream</p>
          <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {connectionLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                {log.type === 'warn' ? (
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                )}
                <span className={log.type === 'warn' ? 'text-amber-300' : 'text-slate-300'}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
