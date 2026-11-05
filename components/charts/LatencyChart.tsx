'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Clock } from 'lucide-react';

interface LatencyPoint {
  timestamp: number;
  pingMs: number;
  type: 'idle' | 'loaded';
}

interface LatencyChartProps {
  data: LatencyPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-64 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-center">
        <span className="text-xs text-slate-500">Initializing chart canvas...</span>
      </div>
    );
  }

  const chartData = data.map((pt, idx) => ({
    sample: `#${idx + 1}`,
    idlePing: pt.type === 'idle' ? pt.pingMs : null,
    loadedPing: pt.type === 'loaded' ? pt.pingMs : null,
    ping: pt.pingMs,
  }));

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Latency & Bufferbloat Dynamics</span>
            <span className="text-xs font-normal text-slate-400">(ms)</span>
          </h3>
          <p className="text-xs text-slate-400">Idle vs traffic-loaded round-trip transmission latency</p>
        </div>

        <div className="flex items-center gap-3 text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Idle Ping</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>Loaded Ping</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 sm:h-80">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <span>No latency samples recorded yet. Start a test to measure round-trip times.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="sample"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit=" ms"
              />

              {/* Reference line for gaming threshold (50ms) */}
              <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" label={{ value: '50ms Target', fill: '#64748b', fontSize: 10, position: 'right' }} />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                formatter={(value: any, name: any) => [
                  `${Number(value).toFixed(1)} ms`,
                  name === 'idlePing' ? 'Idle Latency' : 'Loaded Latency',
                ]}
              />

              <Line
                type="monotone"
                dataKey="idlePing"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
                connectNulls
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="loadedPing"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ fill: '#38bdf8', r: 3 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
