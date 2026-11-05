'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, Upload } from 'lucide-react';

interface ThroughputPoint {
  timestamp: number;
  mbps: number;
  direction: 'download' | 'upload';
}

interface ThroughputChartProps {
  data: ThroughputPoint[];
  unit?: 'Mbps' | 'MB/s';
}

export function ThroughputChart({ data, unit = 'Mbps' }: ThroughputChartProps) {
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

  // Format data points for dual area series
  const startTime = data.length > 0 ? data[0].timestamp : Date.now();
  const chartData = data.map((pt, idx) => {
    const elapsedSec = ((pt.timestamp - startTime) / 1000).toFixed(1);
    const convertedMbps = unit === 'MB/s' ? pt.mbps / 8 : pt.mbps;
    return {
      index: idx + 1,
      time: `${elapsedSec}s`,
      download: pt.direction === 'download' ? convertedMbps : null,
      upload: pt.direction === 'upload' ? convertedMbps : null,
      rawMbps: pt.mbps,
    };
  });

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Throughput Dynamics</span>
            <span className="text-xs font-normal text-slate-400">({unit} over time)</span>
          </h3>
          <p className="text-xs text-slate-400">Real-time downstream & upstream transmission rates</p>
        </div>

        <div className="flex items-center gap-3 text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
            <span>Download</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-400"></span>
            <span>Upload</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 sm:h-80">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm gap-2">
            <div className="flex gap-2">
              <Download className="w-4 h-4 text-slate-600" />
              <Upload className="w-4 h-4 text-slate-600" />
            </div>
            <span>No throughput data recorded yet. Start a test to visualize live bandwidth.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="time"
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
                unit={` ${unit}`}
              />

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
                  `${Number(value).toFixed(1)} ${unit}`,
                  name === 'download' ? 'Download Speed' : 'Upload Speed',
                ]}
              />

              <Area
                type="monotone"
                dataKey="download"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#downloadGradient)"
                connectNulls
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="upload"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#uploadGradient)"
                connectNulls
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
