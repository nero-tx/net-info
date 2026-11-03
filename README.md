# 🌐 Net Info

> **A professional, privacy-first, real-time network intelligence and diagnostic platform.**  
> Inspect, monitor, and diagnose internet connections with high-precision telemetry, bufferbloat grading, DNS analysis, and WebRTC diagnostics — without accounts, cookies, or data retention.

---

## 📋 Table of Contents

- [Overview & Philosophy](#-overview--philosophy)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [How It Works (Under the Hood)](#-how-it-works-under-the-hood)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Production Deployment](#-production-deployment)
- [Privacy & Security Commitment](#-privacy--security-commitment)
- [License](#-license)

---

## 🛡️ Overview & Philosophy

**Network Intelligence** is not just another basic speed test widget. It is an engineering-grade diagnostics workbench designed for everyday users, network engineers, remote workers, and gamers who need accurate, transparent, and actionable insights into their connectivity.

### Core Principles

1. **Client-Side First Architecture**: Telemetry and latency calculations run directly inside the browser using modern Web APIs (`PerformanceObserver`, W3C `NetworkInformation`, `RTCPeerConnection`, and Web Workers).
2. **Zero Storage & Strict Privacy**: No user accounts, no tracking cookies, and **no database**. Measurement payloads and test results exist solely in browser volatile memory and are cleared when the session closes.
3. **No Fabricated Data**: If an API or metric is unsupported by the browser or blocked by an adblocker, the UI clearly displays *"Unsupported"* or provides a graceful fallback rather than inventing synthetic numbers.
4. **Transparent Measurement Boundaries**: Explains technical constraints openly — such as why web browsers cannot execute raw ICMP pings due to sandbox security, and how UDP/WebRTC DataChannel or high-frequency HTTP probes are utilized instead.

> 🔒 **Privacy Guarantee**  
> *"Your privacy matters. No network data or test results are stored. All measurements run in real time on your device. Our servers are used only to perform necessary network checks and calculations to improve measurement accuracy. Your results are not saved."*

---

## ✨ Key Features

### 1. Connection Overview Hero Card
- **Real-Time Link State**: Connected vs. Disconnected monitoring with automated online/offline window listeners.
- **Public IP & Routing**: Auto-detects public IPv4 and IPv6 addresses with a one-click clipboard copy tool.
- **Carrier & ISP Intelligence**: Identifies Internet Service Provider (ISP), Autonomous System Number (ASN), and BGP routing organization.
- **Geographic Location**: City, region, country flag, geographic coordinates, and local timezone.
- **Interface & Tier Detection**: Detects Wi-Fi, Cellular, Ethernet, or Bluetooth links alongside estimated downlink and RTT via the W3C Network Information API.

### 2. Interactive Speed Test & Speedometer
- **Custom Animated SVG Gauge**: 240-degree radial speedometer with smooth gradient transitions (Cyan `#06B6D4` → Electric Blue `#3B82F6` → Violet `#8B5CF6`) and glowing needle.
- **7-Stage Interactive Pipeline**:
  1. `Initializing Engine` → 2. `Checking Connectivity` → 3. `Measuring Idle Ping` → 4. `Measuring Download Speed` → 5. `Measuring Upload Speed` → 6. `Measuring Loaded Latency (Bufferbloat)` → 7. `Finalizing Quality Scores`.
- **Bufferbloat Rating**: Grades connection responsiveness under traffic saturation from **A+** (minimal latency increase) to **F** (>120ms latency increase).
- **Control & Cancellation**: Instant abort support via standard `AbortController` and engine pause handlers.
- **Dual-Engine Architecture**: Powered primarily by `@cloudflare/speedtest` with seamless automatic fallback to internal streaming endpoints (`/api/speed/down` and `/api/speed/up`).

### 3. Real-Time Telemetry & Visualizations (Recharts)
- **Throughput Dynamics (AreaChart)**: Real-time dual-area chart charting downstream and upstream transfer bandwidth curves.
- **Latency & Bufferbloat Dynamics (LineChart)**: Tracks round-trip time (RTT) samples, comparing unloaded idle latency against loaded traffic latency.
- **Application Quality Index**: Heuristic readiness ratings (Great, Good, Average, Poor, Bad) for:
  - 🌐 **General Web Browsing** (asset delivery, responsive DNS, DOM interactive)
  - 📺 **Video Streaming** (4K Ultra HD & 1080p 60fps media buffer tolerance)
  - 👥 **Video Conferencing / RTC** (Zoom, Teams, WebRTC bidirectional audio/video stability)
  - 🎮 **Online Competitive Gaming** (tick-rate synchronization, low jitter, bufferbloat immunity)

### 4. Continuous Live Monitoring Mode
- **Background Beacon Probing**: Lightweight periodic probes (1.5s, 2.5s, or 5.0s interval) to monitor latency drift over time.
- **Rolling In-Memory Window**: Keeps the last 40 samples in memory without saving to disk.
- **Dynamic Jitter Tracking**: Continuously computes statistical RFC 3550 jitter.
- **Event Log Stream**: Real-time event log tracking connection interruptions, recoveries, and timing anomalies.

### 5. Advanced Network Diagnostics Suite
- **DNS Resolution Inspector**: Queries domain records (`A`, `AAAA`, `MX`, `TXT`, `NS`, `CNAME`) via Node.js native `node:dns/promises` and displays resolution latency in milliseconds alongside server resolver addresses (`dns.getServers()`).
- **Browser & Environment Telemetry**: Inspects browser transport security (HTTPS/TLS), CPU logical cores (`hardwareConcurrency`), device memory estimates, and Data Saver mode (`saveData`).
- **HTTP Resource Timing Waterfall**: Microsecond breakdown via W3C `PerformanceResourceTiming` detailing DNS lookup, TCP handshake, TLS encryption, Time To First Byte (TTFB), and Content Download.
- **WebRTC & UDP Delivery Diagnostics**: Discovers ICE candidates (`host`, `srflx`, `relay`) via RFC 5389 STUN servers, detects public NAT reflexive mappings, and runs a loopback DataChannel packet burst test.

### 6. Web Worker Multithreading
- Offloads statistical calculations (P50 median, P90, P95, P99 percentiles, variance, and timeseries smoothing) to a background Web Worker (`public/workers/stats-worker.js`), ensuring zero main-thread UI stutter during intensive testing.

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER CLIENT                                  │
├──────────────────────┬───────────────────────────────┬──────────────────────┤
│ Next.js App Router   │ Speed Test Engine             │ Live Monitoring      │
│ - Responsive UI      │ - @cloudflare/speedtest       │ - In-memory buffer   │
│ - Recharts Analytics │ - Loaded Latency Bufferbloat  │ - Rolling RTT graph  │
│ - Speedometer SVG    │ - Fallback Streaming Node     │ - RFC 3550 Jitter    │
├──────────────────────┴───────────────────────────────┴──────────────────────┤
│ Web Worker (public/workers/stats-worker.js)                                  │
│ - Off-thread percentiles (P50, P90, P99), variance, stability index         │
├─────────────────────────────────────────────────────────────────────────────┤
│ WebRTC Diagnostics Engine                                                   │
│ - ICE Candidate discovery (host, srflx STUN, relay)                         │
│ - Loopback DataChannel ping & UDP packet drop estimation                    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS / Route Handlers
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                     NEXT.JS SERVER ROUTE HANDLERS                           │
├───────────────────┬───────────────────┬─────────────────┬───────────────────┤
│ /api/network-info │ /api/dns          │ /api/ping       │ /api/speed/down   │
│ - Public IP       │ - node:dns        │ - High-res RTT  │ - Chunked stream  │
│ - Geo & ASN       │ - A, AAAA, MX, NS │ - Server timing │ /api/speed/up     │
│ - IPv4 / IPv6     │ - Server resolvers│ - HTTP protocol │ - Payload sink    │
└───────────────────┴───────────────────┴─────────────────┴───────────────────┘
```

### Technologies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) + React 19 | Server rendering, streaming, and modern client orchestration |
| **Language** | TypeScript (Strict Mode) | Full compile-time type safety across frontend and API routes |
| **Styling** | Tailwind CSS v4 | Dark-theme aesthetics, micro-interactions, responsive design |
| **Charts** | Recharts 3 | Real-time Area and Line charts with smooth responsive containers |
| **Icons** | Lucide React | Clean, modern iconography |
| **Network Client** | `@cloudflare/speedtest` | Primary client-side bandwidth and loaded-latency engine |
| **Multithreading** | Web Workers API | Background statistics calculations |
| **Backend Core** | Node.js `node:dns`, `undici`, `node:perf_hooks` | Server-side DNS resolution, controlled HTTP diagnostics, and timing |

---

## 🔬 How It Works (Under the Hood)

### 1. Speed & Throughput Measurement
The application requests progressively sized binary chunks from edge nodes (100KB, 1MB, 10MB, 25MB) using the browser `fetch` API. Throughout each transfer:
- Bytes received are tracked against elapsed high-resolution timestamps (`performance.now()`).
- Data points are smoothed using a moving average window to filter out brief local socket hiccups.
- Final throughput represents the 90th percentile of transfer speeds, excluding initial TCP slow-start ramps.

### 2. Bufferbloat & Loaded Latency
Bufferbloat occurs when network equipment excessively buffers packets during active downloads or uploads, causing latency to spike:
$$\Delta\text{Latency} = \text{Loaded Ping} - \text{Idle Ping}$$
- **A+**: $\Delta < 5\text{ ms}$ (virtually no degradation)
- **A**: $\Delta < 15\text{ ms}$
- **B**: $\Delta < 30\text{ ms}$
- **C**: $\Delta < 60\text{ ms}$
- **D**: $\Delta < 120\text{ ms}$
- **F**: $\Delta \ge 120\text{ ms}$ (severe congestion; games lag, audio stutters)

### 3. RFC 3550 Statistical Jitter
Jitter is the variance in packet arrival time. It is calculated per RFC 3550 standard:
$$J_{i} = J_{i-1} + \frac{|D(i-1, i)| - J_{i-1}}{16}$$
Where $D(i-1, i)$ is the absolute difference in round-trip times between consecutive packets.

### 4. WebRTC UDP Testing
Browsers restrict arbitrary ICMP socket creation for security reasons. To diagnose UDP communication:
1. An `RTCPeerConnection` is initialized with public STUN servers (`stun:stun.cloudflare.com:3478` and `stun:stun.google.com:19302`).
2. Candidate gathering discovers local host endpoints and server-reflexive (`srflx`) endpoints, revealing whether NAT traversal succeeds.
3. A local loopback DataChannel sends a rapid burst of 20 numbered packets over SCTP/UDP to benchmark UDP round-trip latency and dropped packets.

---

## 🔌 API Reference

All route handlers are located in `app/api/` and include security protections and `Cache-Control: no-store` headers.

### `GET /api/network-info`
Detects the client's public IP from reverse-proxy headers (`cf-connecting-ip`, `x-real-ip`, `x-forwarded-for`), resolves ASN, ISP, geographic location, and identifies IPv4 vs. IPv6.
- **Response**:
  ```json
  {
    "ip": "203.0.113.195",
    "ipVersion": "IPv4",
    "isp": "Example Fiber Broadband",
    "asn": "AS13335",
    "asnOrg": "Cloudflare, Inc.",
    "city": "London",
    "region": "England",
    "country": "United Kingdom",
    "countryCode": "GB",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "timezone": "Europe/London",
    "serverNode": "Node-edge-01",
    "isPrivateOrLocal": false
  }
  ```

### `POST /api/dns`
Resolves DNS records on the server using Node.js native `node:dns/promises`.
- **Request Body**:
  ```json
  { "domain": "cloudflare.com", "type": "A" }
  ```
- **Response**:
  ```json
  {
    "domain": "cloudflare.com",
    "type": "A",
    "records": [{ "address": "104.16.132.229", "ttl": 120 }],
    "resolutionTimeMs": 14.2,
    "dnsServers": ["127.0.0.53"]
  }
  ```

### `GET /api/ping`
Ultra-lightweight endpoint returning server timestamps and `Server-Timing` headers for client RTT calibration.
- **Response**:
  ```json
  {
    "status": "ok",
    "serverTimestamp": 1793743850473,
    "processMs": 0.28
  }
  ```

### `GET /api/speed/down?bytes={count}`
Generates a chunked stream of incompressible pseudo-random bytes (between 1KB and 50MB) for testing downstream throughput.

### `POST /api/speed/up`
Accepts arbitrary binary data payloads, measures ingestion throughput without writing to disk, and returns the measured Mbps rate.

### `POST /api/http-diag`
Inspects external HTTP headers and TLS reachability using `undici` with SSRF loopback protections.
- **Request Body**:
  ```json
  { "url": "https://example.com" }
  ```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher (Node 20+ recommended).
- **Package Manager**: `npm`, `pnpm`, or `yarn`.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/net-info.git
   cd net-info
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🚢 Production Deployment

### Building for Production

Create an optimized standalone build:
```bash
npm run build
npm run start -p 3000
```

### Docker Deployment

You can containerize the application with the following multi-stage `Dockerfile`:

```dockerfile
# Step 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Step 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Step 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Reverse Proxy & CDN Configuration (Nginx / Cloudflare)

When deploying behind a reverse proxy (e.g. Cloudflare, AWS ALB, Nginx), ensure client IP headers are forwarded:

```nginx
# Nginx Configuration Snippet
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 🔒 Privacy & Security Commitment

- **No Diagnostic Storage**: Diagnostic payloads and measurements are never logged, persisted, or stored in databases.
- **Safe Route Handlers**: Diagnostic endpoints strictly prohibit Server-Side Request Forgery (SSRF) against internal RFC 1918 networks (`127.0.0.1`, `10.x`, `192.168.x`, etc.).
- **Client-Side Control**: Users can clear all in-memory telemetry with a single click from the settings menu or by refreshing the page.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
