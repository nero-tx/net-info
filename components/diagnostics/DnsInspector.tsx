'use client';

import React, { useState } from 'react';
import { Search, Globe, Server, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { DnsRecordResult } from '@/types/network';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'] as const;

export function DnsInspector() {
  const [domain, setDomain] = useState('cloudflare.com');
  const [recordType, setRecordType] = useState<'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME'>('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsRecordResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = ['cloudflare.com', 'google.com', 'wikipedia.org', 'github.com'];

  const executeLookup = async (lookupDomain = domain, lookupType = recordType) => {
    if (!lookupDomain.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: lookupDomain.trim(), type: lookupType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `DNS query failed with status ${res.status}`);
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'DNS resolution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>DNS Resolution Diagnostic Center</span>
          </h3>
          <p className="text-xs text-slate-400">
            Query domain records and measure recursive resolver latency via native Node.js DNS
          </p>
        </div>

        {result?.dnsServers && result.dnsServers.length > 0 && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resolver: {result.dnsServers[0]}</span>
          </div>
        )}
      </div>

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeLookup()}
            placeholder="Enter hostname (e.g. cloudflare.com)..."
            className="w-full h-10 px-3.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-white placeholder-slate-500 font-mono focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Record Type Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {RECORD_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setRecordType(type);
                executeLookup(domain, type);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                recordType === type
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          onClick={() => executeLookup()}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Resolve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
        <span className="text-[11px] text-slate-500">Presets:</span>
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setDomain(preset);
              executeLookup(preset, recordType);
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Results View */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-sm font-semibold text-white">{result.domain}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {result.type}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{result.resolutionTimeMs} ms</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Resolved Records</p>
            {Array.isArray(result.records) && result.records.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.records.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-between"
                  >
                    <span className="truncate">
                      {typeof rec === 'object' && rec.address
                        ? `${rec.address} (TTL: ${rec.ttl || 'N/A'})`
                        : typeof rec === 'object' && rec.exchange
                        ? `${rec.exchange} [priority: ${rec.priority}]`
                        : Array.isArray(rec)
                        ? rec.join(' ')
                        : String(rec)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No records returned for this query type.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
