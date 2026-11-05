"use client";

import { useEffect, useId, useState } from "react";
import {
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  X,
} from "lucide-react";

interface DetailPanel {
  title: string;
  body: string;
  icon: typeof CheckCircle2;
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
    iconClass: "text-sky-400",
    body: "By network architecture, web servers receive your public IP in the IP packet header to return responses. We strip sensitive query headers and never persist client IP addresses.",
  },
  {
    title: "Third-Party Intelligence",
    icon: CheckCircle2,
    iconClass: "text-violet-400",
    body: "Autonomous System (ASN) and geographic city estimation are resolved on-demand using public registries without user tracking cookies or persistent identifiers.",
  },
];

const STORAGE_KEY = "privacy-banner-state";

const PANEL_CLASS =
  "p-3.5 rounded-xl bg-zinc-900/70 border border-amber-500/10 space-y-2 transition-colors hover:border-amber-500/25";

export function PrivacyBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const detailsId = useId();

  // Restore the saved state after hydration.
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        setIsExpanded(parsed.isExpanded ?? false);
        setIsDismissed(parsed.isDismissed ?? false);
      }
    } catch {}

    setIsHydrated(true);
  }, []);

  // Persist state whenever it changes.
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ isExpanded, isDismissed }),
      );
    } catch {}
  }, [isExpanded, isDismissed, isHydrated]);

  if (!isHydrated || isDismissed) return null;

  return (
    <div className="w-full border-b border-amber-500/15 bg-linear-to-r from-zinc-950 via-[#17120d] to-zinc-950 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 grid place-items-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              <span className="font-semibold text-amber-100">
                Your privacy matters.
              </span>{" "}
              No network data or test results are stored. All measurements run
              in real time on your device. Our servers are used only to perform
              necessary network checks and calculations to improve measurement
              accuracy. Your results are not saved.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <Lock className="size-3" aria-hidden="true" />
              Zero-Retention
            </span>

            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
            >
              {isExpanded ? "Hide Details" : "Architecture Details"}

              {isExpanded ? (
                <ChevronUp className="size-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss privacy banner"
              className="text-zinc-500 hover:text-zinc-200 transition-colors text-lg leading-none size-6 grid place-items-center rounded-full"
              title="Dismiss privacy banner"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div
            id={detailsId}
            className="mt-4 pt-4 border-t border-amber-500/10 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn"
          >
            {DETAIL_PANELS.map(({ title, body, icon: Icon, iconClass }) => (
              <div key={title} className={PANEL_CLASS}>
                <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                  <Icon className={`size-4 ${iconClass}`} aria-hidden="true" />
                  <span className="text-xs">{title}</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
