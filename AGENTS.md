<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Net Info — Project Agent Guide

## Project Purpose

**Net Info** is a **privacy-first, real-time network intelligence & diagnostics platform**. Users open the site and get instant, in-browser diagnostics of their internet connection — speed, latency, DNS, WebRTC, HTTP timing, and live monitoring — without accounts, without storage, and without sending any measurement data to a third party.

> **Core Rule — Zero Storage.**
> No databases, no server-side session state, no measurement logging of any kind.
> All test results live exclusively in React state (browser memory) and are discarded on page unload.
> Never introduce any form of persistence for user measurements.

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.4.5 — **read `node_modules/next/dist/docs/` before writing route/layout code** |
| Language | TypeScript | Strict mode (`"strict": true` in tsconfig) |
| Styling | Tailwind CSS v4 | `@import "tailwindcss"` syntax — NOT `@tailwind base/components/utilities` |
| Charts | Recharts | v3 |
| Speed Engine | `@cloudflare/speedtest` | Client-side only, telemetry disabled: `logMeasurementApiUrl: null, logAimApiUrl: null` |
| Icons | lucide-react | — |
| Server HTTP | undici | Used in `/api/http-diag` for SSRF-safe external HEAD probes |

---

## Directory Layout

```
net-info/
├── app/
│   ├── layout.tsx              # Root layout, metadata, icons
│   ├── page.tsx                # Main dashboard orchestration
│   ├── globals.css             # Tailwind v4 import, dark theme tokens, animations
│   ├── icon.svg                # App tab icon (registered via metadata.icons)
│   └── api/
│       ├── network-info/route.ts   # Public IP, ISP, ASN, geo (via ipwho.is)
│       ├── dns/route.ts            # DNS record lookup (Node dns/promises)
│       ├── ping/route.ts           # RTT calibration beacon (Timing-Allow-Origin: *)
│       ├── http-diag/route.ts      # External HTTP HEAD probe (SSRF protected)
│       └── speed/
│           ├── down/route.ts       # Chunked streaming download probe
│           └── up/route.ts         # Upload ingestion sink
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx              # "Net Info" brand, status badges, Rescan, Settings
│   │   ├── PrivacyBanner.tsx       # Required verbatim privacy notice
│   │   ├── ConnectionOverviewCard.tsx
│   │   └── SettingsModal.tsx
│   ├── speed-test/
│   │   ├── SpeedometerGauge.tsx    # SVG 240° radial gauge
│   │   └── SpeedTestControls.tsx   # 7-step pipeline UI, metric tiles
│   ├── charts/
│   │   ├── ThroughputChart.tsx     # Recharts AreaChart (download + upload)
│   │   ├── LatencyChart.tsx        # Recharts LineChart (idle vs loaded latency)
│   │   └── QualityScores.tsx       # 4 application quality cards
│   ├── diagnostics/
│   │   ├── DnsInspector.tsx
│   │   ├── BrowserConnectionInfo.tsx   # W3C NetworkInformation API grid
│   │   ├── ResourceTimingCard.tsx      # HTTP waterfall (PerformanceResourceTiming)
│   │   └── WebRtcDiagnosticsCard.tsx
│   └── monitoring/
│       └── LiveMonitoringPanel.tsx     # Rolling RTT monitor + event log
├── hooks/
│   ├── useNetworkStatus.ts     # Online/offline, NetworkInformation, /api/network-info
│   ├── useSpeedTest.ts         # Full speed test state machine
│   └── useLiveMonitoring.ts    # Rolling 40-sample beacon monitoring
├── lib/
│   ├── network/
│   │   ├── speedtest-runner.ts     # @cloudflare/speedtest wrapper + internal fallback
│   │   └── webrtc-diagnostics.ts   # STUN ICE + DataChannel burst test
│   └── utils/
│       └── formatters.ts           # formatSpeed, formatLatency, formatMetricMs, grades
├── types/
│   └── network.ts              # All shared TypeScript interfaces
└── public/
    ├── favicon.svg
    └── workers/
        └── stats-worker.js     # Web Worker — P50/P90/P99, jitter
```

---

## Conventions & Rules

### Client Components
Every component that uses React hooks, browser APIs, or event listeners **must** have `'use client'` as its very first line.

### Route Handlers (Next.js 16 App Router)
Export named async functions matching HTTP methods. Always return `NextResponse.json(...)` or `new Response(...)`.

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ ok: true })
}
```

### Tailwind CSS v4
- Import: `@import "tailwindcss"` (top of `globals.css`) — no `@tailwind` directives.
- Gradients: `bg-linear-to-r` **not** `bg-gradient-to-r`.
- Custom properties: define with `@theme { --color-X: ... }`.

### Number Formatting
Use `formatMetricMs()` from `lib/utils/formatters.ts` for all latency values displayed in tiles:
- `val >= 100` → `Math.round(val).toString()`
- `val < 100` → `(Math.round(val * 10) / 10).toFixed(1)`
- Invalid / 0 → `'—'`

All tile containers that show numbers need `min-w-0 overflow-hidden` with number spans using `truncate shrink-0`.

### Speed Engine
`@cloudflare/speedtest` is loaded via dynamic `import()` **client-side only** (never in a server route). Always initialize with telemetry disabled:

```typescript
const engine = new SpeedTestEngine({
  logMeasurementApiUrl: null,
  logAimApiUrl: null,
  // ...
})
```

### HTTP Resource Timing
`/api/ping/route.ts` **must** include both:
```
Timing-Allow-Origin: *
Access-Control-Allow-Origin: *
```
Without `Timing-Allow-Origin: *`, the browser sanitizes all `PerformanceResourceTiming` timestamps to 0. Additionally, the client **must** `await response.text()` (not just `await fetch()`) to trigger `responseEnd` and commit the entry to the Performance Timeline.

### SSRF Protection
`/api/http-diag` blocks all RFC 1918 and loopback ranges (10.x, 172.16-31.x, 192.168.x, 127.x). Never remove or weaken these checks.

### Privacy Banner
The verbatim privacy notice below is required and **must not be modified**:

> *"Your privacy matters. No network data or test results are stored. All measurements run in real time on your device. Our servers are used only to perform necessary network checks and calculations to improve measurement accuracy. Your results are not saved."*

---

## Build & Dev Commands

```bash
# Development (Turbopack)
npm run dev        # starts on http://localhost:3000

# Production build (must pass with 0 TypeScript errors before any PR)
npm run build

# Type-check only
npx tsc --noEmit
```

Always run `npm run build` after any non-trivial change to verify zero TypeScript errors.

---

## Measurement Architecture

```
Browser
  ├── @cloudflare/speedtest (primary engine)
  │     └── Cloudflare edge servers (zero telemetry, results stay in-browser)
  └── Internal fallback (if Cloudflare engine unavailable)
        ├── /api/speed/down  — chunked streaming download probe
        ├── /api/speed/up    — upload ingestion sink
        └── /api/ping        — RTT beacon (Timing-Allow-Origin: *)

Network Info
  └── /api/network-info → ipwho.is (2.5s timeout, graceful fallback for private IPs)

DNS Inspector
  └── /api/dns → Node dns/promises (A, AAAA, MX, TXT, NS, CNAME)

HTTP Diagnostics
  └── /api/http-diag → undici HEAD probe (SSRF-safe, blocks RFC 1918)

WebRTC Diagnostics
  └── lib/network/webrtc-diagnostics.ts (STUN ICE + DataChannel burst, all client-side)
```

---

## Color & Brand Tokens

| Token | Value | Usage |
|---|---|---|
| Background | `#060913` | Page background (`bg-[#060913]`) |
| Cyan | `#06b6d4` (`cyan-400`) | Download, primary accent |
| Blue | `#3b82f6` (`blue-500`) | Mid gradient |
| Violet | `#8b5cf6` (`violet-500`) | Upload, secondary accent |
| "Info" gradient | `from-cyan-400 via-blue-500 to-violet-500` | Brand word "Info" in header |

The header brand reads **"Net"** (white) + **"Info"** (cyan→blue→violet gradient).

---

## Known Agent Pitfalls

1. **Do NOT use `@tailwind` directives** — Tailwind v4 breaks with them.
2. **Do NOT use `bg-gradient-to-r`** — use `bg-linear-to-r` in Tailwind v4.
3. **Do NOT add any database, file write, or external logging** that persists measurement data.
4. **Do NOT load `@cloudflare/speedtest` in a server route** — it is browser-only.
5. **Always read `node_modules/next/dist/docs/`** before writing App Router code — this Next.js version has breaking changes from common training data.
6. **Do NOT remove `Timing-Allow-Origin: *`** from `/api/ping` — the HTTP waterfall breaks without it.
7. **Always run `npm run build`** to confirm 0 TypeScript errors after non-trivial changes.
