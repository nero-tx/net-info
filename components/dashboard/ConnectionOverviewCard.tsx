'use client';

import React, { useState } from 'react';
import { NetworkInfo } from '@/types/network';
import {
  Globe,
  Server,
  Wifi,
  Smartphone,
  Network,
  Copy,
  Check,
  MapPin,
  Building2,
  ShieldAlert,
  HelpCircle,
  Radio,
  Gauge,
} from 'lucide-react';

interface ConnectionOverviewCardProps {
  info: NetworkInfo | null;
  isLoading: boolean;
  isOnline: boolean;
}

export function ConnectionOverviewCard({ info, isLoading, isOnline }: ConnectionOverviewCardProps) {
  const [copied, setCopied] = useState(false);

  const copyIp = () => {
    if (info?.ip) {
      navigator.clipboard.writeText(info.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConnectionTypeIcon = (type?: string) => {
    switch (type) {
      case 'wifi':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'cellular':
        return <Smartphone className="w-4 h-4 text-violet-400" />;
      case 'ethernet':
        return <Network className="w-4 h-4 text-emerald-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatConnectionType = (type?: string) => {
    if (!type || type === 'unknown') return 'Unknown / Browser Protected';
    if (type === 'wifi') return 'Wi-Fi 802.11';
    if (type === 'cellular') return 'Cellular Mobile Link';
    if (type === 'ethernet') return 'Ethernet (Wired LAN)';
    return type.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 backdrop-blur-xl animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/60 pb-6">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-slate-800 rounded"></div>
            <div className="h-8 w-64 bg-slate-800 rounded"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-slate-800 rounded-lg"></div>
            <div className="h-10 w-24 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-slate-800 rounded"></div>
              <div className="h-5 w-28 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const effectiveTypeLabel = info?.effectiveType ? info.effectiveType.toUpperCase() : 'Not reported';
  const downlinkLabel = info?.downlinkEstimatedMbps !== undefined ? `${info.downlinkEstimatedMbps} Mbps` : 'Unavailable';
  const rttLabel = info?.rttEstimatedMs !== undefined ? `${info.rttEstimatedMs} ms` : 'Unavailable';

  return (
    <div className="w-full rounded-2xl bg-linear-to-b from-slate-900/70 to-slate-950/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl shadow-black/20 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner: Status + Primary IP */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {isOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </span>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {info?.ipVersion || 'IPv4'}
            </span>

            {info?.isPrivateOrLocal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-3 h-3" />
                LAN / Loopback
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {info?.ip || '127.0.0.1'}
            </h2>
            <button
              onClick={copyIp}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="Copy IP Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Public Routing Point & Network Interface</span>
          </p>
        </div>

        {/* Quick Connection Specs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800/60">
              {getConnectionTypeIcon(info?.connectionType)}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Interface</p>
              <p className="text-xs font-semibold text-slate-200">
                {formatConnectionType(info?.connectionType)}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800/60">
              <Gauge className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Network Tier</p>
              <p className="text-xs font-semibold text-slate-200">
                {effectiveTypeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Detail Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* ISP */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Internet Service Provider</span>
          </div>
          <p className="text-sm font-semibold text-white truncate" title={info?.isp}>
            {info?.isp || 'Unavailable'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{info?.asnOrg || 'Carrier'}</p>
        </div>

        {/* ASN */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Network className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous System</span>
          </div>
          <p className="text-sm font-semibold text-white font-mono">{info?.asn || 'Unavailable'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">BGP Routing Realm</p>
        </div>

        {/* Location */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-violet-400" />
            <span>Approximate Location</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">
            {info?.city && info?.country
              ? `${info.city}, ${info.country}`
              : info?.country || 'Unavailable'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {info?.latitude && info?.longitude
              ? `${info.latitude.toFixed(2)}°, ${info.longitude.toFixed(2)}°`
              : info?.timezone || 'Timezone synced'}
          </p>
        </div>

        {/* Diagnostic Server Node */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Diagnostic Server</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">
            {info?.serverNode || 'Local Diagnostic Host'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Edge Diagnostics Active</span>
          </p>
        </div>
      </div>

      {/* Browser Network Information API telemetry row */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            API Downlink Estimate: <strong className="text-slate-200">{downlinkLabel}</strong>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>
            Estimated API RTT: <strong className="text-slate-200">{rttLabel}</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Source: <span className="text-slate-300">Client Network Information API & GeoIP Registry</span>
        </div>
      </div>
    </div>
  );
}
