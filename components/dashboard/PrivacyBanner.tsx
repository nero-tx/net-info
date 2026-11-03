"use client";

import { useId, useState } from "react";
import {
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";

interface DetailPanel {
  title: string;
  body: string;
  icon: LucideIcon;
  iconClass: string;
}

const DETAIL_PANELS: DetailPanel[] = [
  {
    title: "Zero Server Logging",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    body: "Measurement payloads, throughput rates, and diagnostic tests are kept strictly in browser memory. Diagnostic route handlers do not write logs, records, or sessions to disk or databases.",
  },
  {
    title: "Connection Metadata Transparency",
    icon: Info,
    iconClass: "text-cyan-400",
    body: "By network architecture, web servers receive your public IP in the IP packet header to return responses. We strip sensitive query headers and never persist client IP addresses.",
  },
  {
    title: "Third-Party Intelligence",
    icon: CheckCircle2,
    iconClass: "text-violet-400",
    body: "Autonomous System (ASN) and geographic city estimation are resolved on-demand using public registries without user tracking cookies or persistent identifiers.",
  },
];

const PANEL_CLASS =
  "p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 space-y-1";

export function PrivacyBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();

  return (
    <div className="w-full bg-slate-900/40 border-b border-slate-800/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">
                Your privacy matters.
              </span>{" "}
              No network data or test results are stored. All measurements run
              in real time on your device. Our servers are used only to perform
              necessary network checks and calculations to improve measurement
              accuracy. Your results are not saved.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              <Lock className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              <span>Zero-Retention</span>
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline cursor-pointer"
            >
              <span>
                {isExpanded ? "Hide Details" : "Architecture Details"}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div
            id={detailsId}
            className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn"
          >
            {DETAIL_PANELS.map(({ title, body, icon: Icon, iconClass }) => (
              <div key={title} className={PANEL_CLASS}>
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <Icon
                    className={`w-3.5 h-3.5 ${iconClass}`}
                    aria-hidden="true"
                  />
                  <span>{title}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
