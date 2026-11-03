'use client';

import React, { useState } from 'react';
import { Radio, Play, ShieldAlert, CheckCircle2, Activity, Info, Network } from 'lucide-react';
import { runWebRtcDiagnostics, WebRtcDiagnosticResults } from '@/lib/network/webrtc-diagnostics';

export function WebRtcDiagnosticsCard() {
  const [results, setResults] = useState<WebRtcDiagnosticResults | null>(null);
  const [loading, setLoading] = useState(false);

  const executeWebRtcTest = async () => {
    setLoading(true);
    try {
      const data = await runWebRtcDiagnostics();
      setResults(data);
    } catch (err) {
      console.warn('WebRTC diagnostic execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>WebRTC UDP & Packet Transmission Diagnostics</span>
          </h3>
          <p className="text-xs text-slate-400">
            NAT discovery via STUN (RFC 5389) and SCTP/UDP DataChannel packet delivery testing
          </p>
        </div>

        <button
          onClick={executeWebRtcTest}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          {loading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{results ? 'Re-Probe WebRTC' : 'Run WebRTC Probe'}</span>
        </button>
      </div>

      {/* Transparency Note regarding Packet Loss */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-slate-200">Browser Packet Loss Transparency:</strong> Web browsers operate in a sandboxed security environment and cannot dispatch raw ICMP echo packets (traditional ping). Packet delivery and loss rates are evaluated using WebRTC UDP DataChannels or sequential HTTP probe bursts. HTTP connection aborts are not classified as true physical packet loss.
        </p>
      </div>

      {!results ? (
        <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <Network className="w-5 h-5 text-slate-600" />
          <span>Click &apos;Run WebRTC Probe&apos; to discover ICE candidates and test UDP transmission.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">STUN NAT Traversal</span>
              <p className="text-sm font-bold font-mono text-white mt-1">
                {results.srflxDiscovered ? 'Discovered (srflx)' : 'Host Candidates Only'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">STUN Binding Latency</span>
              <p className="text-sm font-bold font-mono text-cyan-400 mt-1">
                {results.stunLatencyMs > 0 ? `${results.stunLatencyMs} ms` : '—'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">DataChannel Packets Sent</span>
              <p className="text-sm font-bold font-mono text-white mt-1">
                {results.dataChannelPacketsSent} pkts
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">DataChannel Dropped Rate</span>
              <p className={`text-sm font-bold font-mono mt-1 ${results.dataChannelLossPercent === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {results.dataChannelLossPercent}% loss
              </p>
            </div>
          </div>

          {/* Public Mapped Address */}
          {results.publicMappedIp && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Public STUN-Reflexive Socket:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {results.publicMappedIp}:{results.publicMappedPort}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">RFC 5389</span>
            </div>
          )}

          {/* ICE Candidates Table */}
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Discovered ICE Candidates ({results.candidates.length})</p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 sticky top-0 text-[11px]">
                  <tr>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Protocol</th>
                    <th className="p-2.5">Address</th>
                    <th className="p-2.5">Port</th>
                    <th className="p-2.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {results.candidates.map((cand, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            cand.type === 'srflx'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : cand.type === 'host'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cand.type}
                        </span>
                      </td>
                      <td className="p-2.5 uppercase">{cand.protocol}</td>
                      <td className="p-2.5 truncate max-w-[150px]">{cand.address}</td>
                      <td className="p-2.5">{cand.port}</td>
                      <td className="p-2.5 text-slate-500">{cand.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
