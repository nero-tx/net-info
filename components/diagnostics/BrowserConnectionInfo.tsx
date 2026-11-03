'use client';

import React, { useState, useEffect } from 'react';
import { NetworkInfo } from '@/types/network';
import { ShieldCheck, Cpu, Wifi, Smartphone, Gauge, Database, Check, X } from 'lucide-react';

interface BrowserConnectionInfoProps {
  info: NetworkInfo | null;
  isOnline: boolean;
}

export function BrowserConnectionInfo({ info, isOnline }: BrowserConnectionInfoProps) {
  const [hasNetworkApi, setHasNetworkApi] = useState(false);
  const [isHttps, setIsHttps] = useState(false);
  const [deviceMemory, setDeviceMemory] = useState<number | null>(null);
  const [hardwareConcurrency, setHardwareConcurrency] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHttps(window.location.protocol === 'https:');
      const nav = navigator as any;
      setHasNetworkApi(!!(nav.connection || nav.mozConnection || nav.webkitConnection));
      if ('deviceMemory' in nav) {
        setDeviceMemory(nav.deviceMemory);
      }
      if ('hardwareConcurrency' in nav) {
        setHardwareConcurrency(nav.hardwareConcurrency);
      }
    }
  }, []);

  const items = [
    {
      label: 'Transport Security',
      value: isHttps ? 'HTTPS / TLS Encrypted' : 'HTTP / Unencrypted (Local Dev)',
      icon: <ShieldCheck className={`w-4 h-4 ${isHttps ? 'text-emerald-400' : 'text-amber-400'}`} />,
      status: isHttps,
    },
    {
      label: 'Network Information API',
      value: hasNetworkApi ? 'Supported & Active' : 'Not Supported (Safari/Firefox sandbox)',
      icon: <Wifi className={`w-4 h-4 ${hasNetworkApi ? 'text-cyan-400' : 'text-slate-500'}`} />,
      status: hasNetworkApi,
    },
    {
      label: 'Effective Link Type',
      value: info?.effectiveType ? `${info.effectiveType.toUpperCase()} profile` : 'Not Reported',
      icon: <Gauge className="w-4 h-4 text-violet-400" />,
      status: !!info?.effectiveType,
    },
    {
      label: 'Estimated Downlink Bandwidth',
      value: info?.downlinkEstimatedMbps !== undefined ? `${info.downlinkEstimatedMbps} Mbps` : 'Unavailable',
      icon: <Smartphone className="w-4 h-4 text-blue-400" />,
      status: info?.downlinkEstimatedMbps !== undefined,
    },
    {
      label: 'Estimated Base RTT',
      value: info?.rttEstimatedMs !== undefined ? `${info.rttEstimatedMs} ms` : 'Unavailable',
      icon: <Gauge className="w-4 h-4 text-emerald-400" />,
      status: info?.rttEstimatedMs !== undefined,
    },
    {
      label: 'Data Saver (saveData)',
      value: info?.saveData ? 'Enabled (Bandwidth Optimized)' : 'Disabled (Standard Mode)',
      icon: <Database className="w-4 h-4 text-amber-400" />,
      status: true,
    },
    {
      label: 'CPU Concurrency',
      value: hardwareConcurrency ? `${hardwareConcurrency} Logical Cores` : 'Browser Restricted',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      status: !!hardwareConcurrency,
    },
    {
      label: 'Device Memory Estimate',
      value: deviceMemory ? `~${deviceMemory} GB RAM` : 'Not Exposed by Browser',
      icon: <Cpu className="w-4 h-4 text-violet-400" />,
      status: !!deviceMemory,
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Client Browser & Connection Environment</span>
          </h3>
          <p className="text-xs text-slate-400">
            Hardware, browser capabilities, and W3C Network Information API inspection
          </p>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
          W3C API Specs
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1.5 font-medium">{item.icon} {item.label}</span>
              {item.status ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
            </div>
            <p className="text-xs font-semibold text-white mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
