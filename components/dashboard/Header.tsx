'use client';

import React from 'react';
import { Activity, RefreshCw, Settings, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { SpeedTestPhase } from '@/types/network';

interface HeaderProps {
  isOnline: boolean;
  phase: SpeedTestPhase;
  phaseLabel: string;
  isMonitoringActive: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  isLoading: boolean;
}

export function Header({
  isOnline,
  phase,
  phaseLabel,
  isMonitoringActive,
  onRefresh,
  onOpenSettings,
  isLoading,
}: HeaderProps) {
  const getPhaseColor = () => {
    switch (phase) {
      case 'download':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      case 'upload':
        return 'text-violet-400 bg-violet-950/60 border-violet-500/40';
      case 'latency':
      case 'loaded-latency':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'finished':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'error':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      default:
        return 'text-slate-300 bg-slate-900/60 border-slate-700/50';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-2 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 via-blue-600 to-violet-600 p-px shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Net</span>
                <span className="bg-linear-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Info
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PRO DIAGNOSTICS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-time connection telemetry & speed analysis
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline status */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/30"
                : "bg-rose-950/50 text-rose-300 border-rose-500/30"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? "bg-emerald-500" : "bg-rose-500"
                }`}
              ></span>
            </span>
            <span className="flex items-center gap-1">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </span>
          </div>

          {/* Test phase status pill */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${getPhaseColor()}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span className="truncate max-w-50">{phaseLabel}</span>
          </div>

          {/* Live Monitoring Badge */}
          {isMonitoringActive && (
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Live Monitoring</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2 sm:pl-3">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Rescan Network"
              aria-label="Rescan Network"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`}
              />
            </button>
            <button
              onClick={onOpenSettings}
              title="Settings & Preferences"
              aria-label="Settings & Preferences"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
