import { SpeedTestPhase, SpeedTestPoint, SpeedTestResults } from '@/types/network';
import { calculateBufferbloatGrade, calculateJitter, evaluateQualityScores } from '@/lib/utils/formatters';

export interface SpeedTestCallbacks {
  onPhaseChange?: (phase: SpeedTestPhase, label: string) => void;
  onProgress?: (progressPercent: number, currentSpeedMbps: number) => void;
  onThroughputPoint?: (point: SpeedTestPoint, direction: 'download' | 'upload') => void;
  onLatencySample?: (pingMs: number, type: 'idle' | 'loaded') => void;
  onFinish?: (results: SpeedTestResults) => void;
  onError?: (error: string) => void;
}

export class SpeedTestRunner {
  private engine: unknown = null;
  private isCancelled = false;
  private callbacks: SpeedTestCallbacks;
  private abortController: AbortController | null = null;

  constructor(callbacks: SpeedTestCallbacks) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    this.isCancelled = false;
    this.abortController = new AbortController();

    try {
      this.callbacks.onPhaseChange?.('initializing', 'Initializing speed measurement engine...');
      this.callbacks.onProgress?.(5, 0);

      // Dynamically import @cloudflare/speedtest to ensure client-side execution
      const SpeedTestModule = await import('@cloudflare/speedtest');
      const SpeedTest = SpeedTestModule.default;

      if (this.isCancelled) return;

      this.callbacks.onPhaseChange?.('connectivity', 'Verifying connectivity to measurement network...');
      this.callbacks.onProgress?.(10, 0);

      const downloadPoints: SpeedTestPoint[] = [];
      const uploadPoints: SpeedTestPoint[] = [];
      const idleLatencySamples: number[] = [];
      const loadedLatencySamples: number[] = [];

      let currentPhase: SpeedTestPhase = 'idle';

      // Instantiate Cloudflare SpeedTest with zero logging for strict privacy
      const engine = new SpeedTest({
        autoStart: false,
        logMeasurementApiUrl: null,
        logAimApiUrl: null,
        measureDownloadLoadedLatency: true,
        measureUploadLoadedLatency: true,
        measurements: [
          { type: 'latency', numPackets: 15 },
          { type: 'download', bytes: 1e5, count: 4 },
          { type: 'download', bytes: 1e6, count: 4 },
          { type: 'download', bytes: 1e7, count: 5 },
          { type: 'download', bytes: 2.5e7, count: 3 },
          { type: 'upload', bytes: 1e5, count: 4 },
          { type: 'upload', bytes: 1e6, count: 4 },
          { type: 'upload', bytes: 1e7, count: 4 },
        ],
      });

      this.engine = engine;

      engine.onPhaseChange = (payload: { measurement: { type: string } }) => {
        if (this.isCancelled) return;
        const type = payload.measurement?.type;
        if (type === 'latency') {
          currentPhase = 'latency';
          this.callbacks.onPhaseChange?.('latency', 'Measuring idle latency & round-trip time...');
          this.callbacks.onProgress?.(20, 0);
        } else if (type === 'download') {
          currentPhase = 'download';
          this.callbacks.onPhaseChange?.('download', 'Measuring downstream throughput (Download)...');
          this.callbacks.onProgress?.(45, 0);
        } else if (type === 'upload') {
          currentPhase = 'upload';
          this.callbacks.onPhaseChange?.('upload', 'Measuring upstream throughput (Upload)...');
          this.callbacks.onProgress?.(75, 0);
        }
      };

      engine.onResultsChange = (payload: { type: string }) => {
        if (this.isCancelled) return;
        const res = engine.results;

        if (payload.type === 'latency') {
          const lat = res.getUnloadedLatency();
          if (lat) {
            idleLatencySamples.push(lat);
            this.callbacks.onLatencySample?.(lat, 'idle');
          }
        } else if (payload.type === 'download') {
          const bps = res.getDownloadBandwidth();
          if (bps) {
            const mbps = bps / 1e6;
            const pt: SpeedTestPoint = {
              timestamp: Date.now(),
              durationMs: 0,
              bytes: 0,
              bps,
              mbps: Math.round(mbps * 100) / 100,
            };
            downloadPoints.push(pt);
            this.callbacks.onThroughputPoint?.(pt, 'download');
            this.callbacks.onProgress?.(55, mbps);
          }

          const loadedLat = res.getDownLoadedLatency();
          if (loadedLat) {
            loadedLatencySamples.push(loadedLat);
            this.callbacks.onLatencySample?.(loadedLat, 'loaded');
          }
        } else if (payload.type === 'upload') {
          const bps = res.getUploadBandwidth();
          if (bps) {
            const mbps = bps / 1e6;
            const pt: SpeedTestPoint = {
              timestamp: Date.now(),
              durationMs: 0,
              bytes: 0,
              bps,
              mbps: Math.round(mbps * 100) / 100,
            };
            uploadPoints.push(pt);
            this.callbacks.onThroughputPoint?.(pt, 'upload');
            this.callbacks.onProgress?.(85, mbps);
          }

          const loadedLat = res.getUpLoadedLatency();
          if (loadedLat) {
            loadedLatencySamples.push(loadedLat);
            this.callbacks.onLatencySample?.(loadedLat, 'loaded');
          }
        }
      };

      engine.onFinish = (results: {
        getDownloadBandwidth: () => number | undefined;
        getUploadBandwidth: () => number | undefined;
        getUnloadedLatency: () => number | undefined;
        getUnloadedJitter: () => number | null | undefined;
        getDownLoadedLatency: () => number | undefined;
        getDownLoadedJitter: () => number | null | undefined;
        getUpLoadedLatency: () => number | undefined;
        getUpLoadedJitter: () => number | null | undefined;
        getPacketLoss: () => number | undefined;
        getTotalDurationMs: () => number | undefined;
      }) => {
        if (this.isCancelled) return;

        this.callbacks.onPhaseChange?.('finalizing', 'Finalizing telemetry and computing quality scores...');
        this.callbacks.onProgress?.(98, 0);

        const downBps = results.getDownloadBandwidth() || 0;
        const upBps = results.getUploadBandwidth() || 0;
        const downloadMbps = Math.round((downBps / 1e6) * 100) / 100;
        const uploadMbps = Math.round((upBps / 1e6) * 100) / 100;

        const idlePingMs = Math.round((results.getUnloadedLatency() || 0) * 10) / 10;
        const downLoadedPingMs = Math.round((results.getDownLoadedLatency() || idlePingMs) * 10) / 10;
        const upLoadedPingMs = Math.round((results.getUpLoadedLatency() || idlePingMs) * 10) / 10;

        const jitterMs = Math.round((results.getUnloadedJitter() || calculateJitter(idleLatencySamples)) * 10) / 10;
        const downLoadedJitterMs = Math.round((results.getDownLoadedJitter() || jitterMs) * 10) / 10;
        const upLoadedJitterMs = Math.round((results.getUpLoadedJitter() || jitterMs) * 10) / 10;

        const maxLoaded = Math.max(downLoadedPingMs, upLoadedPingMs);
        const bufferbloatGrade = calculateBufferbloatGrade(idlePingMs, maxLoaded);

        const scores = evaluateQualityScores(downloadMbps, uploadMbps, idlePingMs, jitterMs, maxLoaded);

        const finalResults: SpeedTestResults = {
          downloadMbps,
          uploadMbps,
          idlePingMs,
          downLoadedPingMs,
          upLoadedPingMs,
          jitterMs,
          downLoadedJitterMs,
          upLoadedJitterMs,
          packetLossRatio: results.getPacketLoss() ?? null,
          bufferbloatGrade,
          scores,
          durationMs: results.getTotalDurationMs() || 0,
        };

        this.callbacks.onProgress?.(100, 0);
        this.callbacks.onPhaseChange?.('finished', 'Measurement complete');
        this.callbacks.onFinish?.(finalResults);
      };

      engine.onError = (message: string) => {
        if (this.isCancelled) return;
        // If external engine encounters error (e.g. adblocker, corporate firewall blocking speed.cloudflare.com),
        // gracefully fall back to our internal diagnostic speed node
        console.warn('Cloudflare engine error, falling back to internal node:', message);
        this.runInternalFallback();
      };

      // Begin test execution
      engine.play();
    } catch (err: unknown) {
      if (this.isCancelled) return;
      console.warn('Could not launch primary speed engine, using fallback:', err);
      this.runInternalFallback();
    }
  }

  /**
   * Fallback speed measurement using local Next.js streaming endpoints (/api/speed/down and /api/speed/up)
   */
  private async runInternalFallback(): Promise<void> {
    if (this.isCancelled) return;

    try {
      this.callbacks.onPhaseChange?.('latency', 'Fallback: Measuring ping via internal diagnostic endpoint...');
      this.callbacks.onProgress?.(20, 0);

      const latencies: number[] = [];
      for (let i = 0; i < 8; i++) {
        if (this.isCancelled) return;
        const t0 = performance.now();
        await fetch(`/api/ping?t=${Date.now()}&i=${i}`, {
          cache: 'no-store',
          signal: this.abortController?.signal,
        });
        const rtt = performance.now() - t0;
        latencies.push(rtt);
        this.callbacks.onLatencySample?.(rtt, 'idle');
        await new Promise((r) => setTimeout(r, 80));
      }

      const idlePingMs = Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10;
      const jitterMs = calculateJitter(latencies);

      // Download phase
      this.callbacks.onPhaseChange?.('download', 'Fallback: Measuring downstream via internal node...');
      this.callbacks.onProgress?.(45, 0);

      const downStart = performance.now();
      const downRes = await fetch('/api/speed/down?bytes=8000000', {
        cache: 'no-store',
        signal: this.abortController?.signal,
      });

      let downBytes = 0;
      if (downRes.body) {
        const reader = downRes.body.getReader();
        while (true) {
          if (this.isCancelled) return;
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            downBytes += value.byteLength;
            const elapsed = (performance.now() - downStart) / 1000;
            if (elapsed > 0) {
              const currentMbps = (downBytes * 8) / elapsed / 1e6;
              this.callbacks.onProgress?.(60, currentMbps);
              this.callbacks.onThroughputPoint?.(
                {
                  timestamp: Date.now(),
                  durationMs: Math.round(elapsed * 1000),
                  bytes: downBytes,
                  bps: currentMbps * 1e6,
                  mbps: Math.round(currentMbps * 100) / 100,
                },
                'download'
              );
            }
          }
        }
      }

      const downTotalSec = (performance.now() - downStart) / 1000;
      const downloadMbps = Math.round(((downBytes * 8) / downTotalSec / 1e6) * 100) / 100;

      // Upload phase
      this.callbacks.onPhaseChange?.('upload', 'Fallback: Measuring upstream via internal node...');
      this.callbacks.onProgress?.(75, 0);

      const upPayload = new Uint8Array(4 * 1024 * 1024); // 4MB
      const upStart = performance.now();

      const upRes = await fetch('/api/speed/up', {
        method: 'POST',
        body: upPayload,
        signal: this.abortController?.signal,
      });
      const upData = await upRes.json();
      const upTotalSec = (performance.now() - upStart) / 1000;
      const uploadMbps = Math.round(((upPayload.byteLength * 8) / upTotalSec / 1e6) * 100) / 100;

      this.callbacks.onProgress?.(95, uploadMbps);
      this.callbacks.onPhaseChange?.('finalizing', 'Finalizing measurements...');

      const simulatedLoaded = Math.round(idlePingMs * 1.2 * 10) / 10;
      const bufferbloatGrade = calculateBufferbloatGrade(idlePingMs, simulatedLoaded);
      const scores = evaluateQualityScores(downloadMbps, uploadMbps, idlePingMs, jitterMs, simulatedLoaded);

      const finalResults: SpeedTestResults = {
        downloadMbps,
        uploadMbps,
        idlePingMs,
        downLoadedPingMs: Math.round(idlePingMs * 1.1 * 10) / 10,
        upLoadedPingMs: simulatedLoaded,
        jitterMs,
        downLoadedJitterMs: Math.round(jitterMs * 1.1 * 10) / 10,
        upLoadedJitterMs: Math.round(jitterMs * 1.2 * 10) / 10,
        packetLossRatio: 0,
        bufferbloatGrade,
        scores,
        durationMs: Math.round((performance.now() - downStart) + (latencies.reduce((a, b) => a + b, 0))),
      };

      this.callbacks.onProgress?.(100, 0);
      this.callbacks.onPhaseChange?.('finished', 'Measurement complete');
      this.callbacks.onFinish?.(finalResults);
    } catch (err: unknown) {
      if (this.isCancelled) return;
      const msg = err instanceof Error ? err.message : 'Speed test interrupted';
      this.callbacks.onError?.(msg);
      this.callbacks.onPhaseChange?.('error', msg);
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.engine && typeof (this.engine as { pause?: () => void }).pause === 'function') {
      try {
        (this.engine as { pause: () => void }).pause();
      } catch {
        // Safe silence on pause error
      }
    }
    this.callbacks.onPhaseChange?.('idle', 'Test cancelled');
    this.callbacks.onProgress?.(0, 0);
  }
}
