'use client';

import React from 'react';
import { X, Settings, Sliders, ShieldCheck, Trash2, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: 'Mbps' | 'MB/s';
  onChangeUnit: (unit: 'Mbps' | 'MB/s') => void;
  engine: 'cloudflare' | 'internal';
  onChangeEngine: (engine: 'cloudflare' | 'internal') => void;
  monitoringInterval: number;
  onChangeMonitoringInterval: (interval: number) => void;
  onResetSession: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  unit,
  onChangeUnit,
  engine,
  onChangeEngine,
  monitoringInterval,
  onChangeMonitoringInterval,
  onResetSession,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Diagnostics & Measurement Settings</h3>
            <p className="text-xs text-slate-400">Configure units, measurement engines, and intervals</p>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          {/* Unit Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Bandwidth Display Unit
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeUnit('Mbps')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold font-mono flex items-center justify-between cursor-pointer transition-all ${
                  unit === 'Mbps'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>Mbps (Megabits/sec)</span>
                {unit === 'Mbps' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => onChangeUnit('MB/s')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold font-mono flex items-center justify-between cursor-pointer transition-all ${
                  unit === 'MB/s'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>MB/s (Megabytes/sec)</span>
                {unit === 'MB/s' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Measurement Engine */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Primary Speed Engine
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onChangeEngine('cloudflare')}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  engine === 'cloudflare'
                    ? 'bg-cyan-500/10 border-cyan-500 text-slate-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-xs text-white">Cloudflare Edge Engine</span>
                  {engine === 'cloudflare' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Global Anycast edge servers with zero telemetry logging for maximum accuracy
                </p>
              </button>

              <button
                type="button"
                onClick={() => onChangeEngine('internal')}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  engine === 'internal'
                    ? 'bg-cyan-500/10 border-cyan-500 text-slate-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-xs text-white">Internal Diagnostic Node</span>
                  {engine === 'internal' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Direct Next.js streaming endpoints (/api/speed/*) for intranet or fallback testing
                </p>
              </button>
            </div>
          </div>

          {/* Monitoring Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Live Monitoring Beacon Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Fast (1.5s)', ms: 1500 },
                { label: 'Normal (2.5s)', ms: 2500 },
                { label: 'Eco (5.0s)', ms: 5000 },
              ].map((opt) => (
                <button
                  key={opt.ms}
                  type="button"
                  onClick={() => onChangeMonitoringInterval(opt.ms)}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    monitoringInterval === opt.ms
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Session State */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>In-Memory Storage Only</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onResetSession();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-medium cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Session Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
