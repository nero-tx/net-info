'use client';

import React from 'react';
import { AIMQualityScores, ExperienceScore } from '@/types/network';
import { Globe, Video, Users, Gamepad2, Info } from 'lucide-react';

interface QualityScoresProps {
  scores?: AIMQualityScores;
}

export function QualityScores({ scores }: QualityScoresProps) {
  const getClassificationBadge = (classification: ExperienceScore['classificationName']) => {
    switch (classification) {
      case 'great':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'good':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      case 'average':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'poor':
      case 'bad':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getScoreColor = (pts: number) => {
    if (pts >= 85) return 'text-emerald-400';
    if (pts >= 70) return 'text-cyan-400';
    if (pts >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const categories = [
    {
      key: 'browsing',
      title: 'General Browsing',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      desc: 'Web page retrieval, static assets & responsive navigation',
      score: scores?.browsing,
    },
    {
      key: 'streaming',
      title: 'Video Streaming',
      icon: <Video className="w-4 h-4 text-violet-400" />,
      desc: '4K Ultra HD & 1080p 60fps continuous media buffering',
      score: scores?.streaming,
    },
    {
      key: 'rtc',
      title: 'Video Conferencing',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      desc: 'Zoom, Teams & WebRTC bidirectional audio/video calls',
      score: scores?.rtc,
    },
    {
      key: 'gaming',
      title: 'Online Gaming',
      icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
      desc: 'Competitive multiplayer, tick-rate sync & jitter sensitivity',
      score: scores?.gaming,
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Application Quality Index</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-world performance estimates based on bandwidth, RTT latency, jitter, and bufferbloat
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Heuristic evaluation, not an official industry certification</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const score = cat.score;
          const points = score?.points ?? 0;
          const classification = score?.classificationName || 'average';

          return (
            <div
              key={cat.key}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {cat.icon}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      score ? getClassificationBadge(classification) : 'text-slate-500 bg-slate-900 border-slate-800'
                    }`}
                  >
                    {score ? classification : 'UNTESTED'}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mt-3">{cat.title}</h4>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{cat.desc}</p>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400">Performance Index</span>
                  <span className={`text-lg font-extrabold font-mono ${score ? getScoreColor(points) : 'text-slate-600'}`}>
                    {score ? `${points}/100` : '—'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      points >= 85
                        ? 'bg-emerald-400'
                        : points >= 70
                        ? 'bg-cyan-400'
                        : points >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: score ? `${points}%` : '0%' }}
                  ></div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                  {score?.ratingDescription || 'Run a speed test to calculate experience index.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
