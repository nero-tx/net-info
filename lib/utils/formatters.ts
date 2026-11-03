import { AIMQualityScores, ExperienceScore } from '@/types/network';

/**
 * Format raw bytes into human-readable unit string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format Mbps into specified user preference ('Mbps' vs 'MB/s')
 */
export function formatSpeed(mbps: number, unit: 'Mbps' | 'MB/s' = 'Mbps'): { value: string; unit: string } {
  if (!Number.isFinite(mbps) || mbps < 0) {
    return { value: '0.0', unit };
  }
  if (unit === 'MB/s') {
    const val = mbps / 8;
    return {
      value: val >= 100 ? val.toFixed(0) : val.toFixed(1),
      unit: 'MB/s',
    };
  }
  return {
    value: mbps >= 100 ? mbps.toFixed(0) : mbps.toFixed(1),
    unit: 'Mbps',
  };
}

/**
 * Format latency milliseconds
 */
export function formatLatency(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || !Number.isFinite(ms)) {
    return '—';
  }
  if (ms < 1) {
    return '<1 ms';
  }
  return `${Math.round(ms)} ms`;
}

/**
 * Bufferbloat Grade according to latency increase under load:
 * delta = loadedLatency - idleLatency
 * A+: < 5ms increase
 * A:  < 15ms increase
 * B:  < 30ms increase
 * C:  < 60ms increase
 * D:  < 120ms increase
 * F:  >= 120ms increase
 */
export function calculateBufferbloatGrade(idleMs: number, loadedMs: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (!idleMs || !loadedMs || loadedMs < idleMs) return 'A+';
  const delta = loadedMs - idleMs;
  if (delta < 5) return 'A+';
  if (delta < 15) return 'A';
  if (delta < 30) return 'B';
  if (delta < 60) return 'C';
  if (delta < 120) return 'D';
  return 'F';
}

/**
 * Compute RFC 3550 statistical jitter from sequence of latency samples
 */
export function calculateJitter(samples: number[]): number {
  if (samples.length < 2) return 0;
  let jitter = 0;
  for (let i = 1; i < samples.length; i++) {
    const diff = Math.abs(samples[i] - samples[i - 1]);
    jitter += (diff - jitter) / 16;
  }
  return Math.round(jitter * 10) / 10;
}

/**
 * Generate transparent quality ratings based on measured bandwidth, latency, jitter, and bufferbloat.
 */
export function evaluateQualityScores(
  downloadMbps: number,
  uploadMbps: number,
  idlePingMs: number,
  jitterMs: number,
  loadedPingMs?: number
): AIMQualityScores {
  const bloatIncrease = loadedPingMs && idlePingMs ? Math.max(0, loadedPingMs - idlePingMs) : 0;

  // 1. Browsing: Needs modest bandwidth (>5 Mbps), responsive DNS & idle ping (<80ms)
  let browsingScore = 100;
  if (downloadMbps < 2) browsingScore -= 40;
  else if (downloadMbps < 5) browsingScore -= 20;
  else if (downloadMbps < 15) browsingScore -= 5;

  if (idlePingMs > 150) browsingScore -= 35;
  else if (idlePingMs > 80) browsingScore -= 20;
  else if (idlePingMs > 40) browsingScore -= 5;

  // 2. Video Streaming: High download (>25 Mbps for 4K, >8 Mbps for 1080p), moderate latency tolerance
  let streamingScore = 100;
  if (downloadMbps < 3) streamingScore -= 60;
  else if (downloadMbps < 8) streamingScore -= 35;
  else if (downloadMbps < 25) streamingScore -= 15;
  else if (downloadMbps < 50) streamingScore -= 5;

  if (jitterMs > 50) streamingScore -= 25;
  else if (jitterMs > 25) streamingScore -= 10;

  // 3. Video Conferencing (RTC): Needs symmetric upload (>3 Mbps), low ping (<50ms), very low jitter (<15ms)
  let rtcScore = 100;
  if (uploadMbps < 1) rtcScore -= 50;
  else if (uploadMbps < 3) rtcScore -= 25;
  else if (uploadMbps < 10) rtcScore -= 10;

  if (idlePingMs > 120) rtcScore -= 40;
  else if (idlePingMs > 60) rtcScore -= 20;
  else if (idlePingMs > 30) rtcScore -= 5;

  if (jitterMs > 30) rtcScore -= 30;
  else if (jitterMs > 15) rtcScore -= 15;

  if (bloatIncrease > 100) rtcScore -= 25;
  else if (bloatIncrease > 50) rtcScore -= 10;

  // 4. Online Gaming: Ultra-sensitive to latency (<30ms) & jitter (<5ms), packet drops, and bufferbloat
  let gamingScore = 100;
  if (idlePingMs > 100) gamingScore -= 60;
  else if (idlePingMs > 50) gamingScore -= 35;
  else if (idlePingMs > 25) gamingScore -= 15;
  else if (idlePingMs > 15) gamingScore -= 5;

  if (jitterMs > 20) gamingScore -= 40;
  else if (jitterMs > 10) gamingScore -= 25;
  else if (jitterMs > 5) gamingScore -= 10;

  if (bloatIncrease > 80) gamingScore -= 35;
  else if (bloatIncrease > 30) gamingScore -= 15;

  const toExperience = (pts: number, goodDesc: string, badDesc: string): ExperienceScore => {
    const clamped = Math.max(10, Math.min(100, Math.round(pts)));
    if (clamped >= 85) return { points: clamped, classificationName: 'great', classificationIdx: 4, ratingDescription: goodDesc };
    if (clamped >= 70) return { points: clamped, classificationName: 'good', classificationIdx: 3, ratingDescription: 'Solid performance with minor fluctuations' };
    if (clamped >= 50) return { points: clamped, classificationName: 'average', classificationIdx: 2, ratingDescription: 'Acceptable for standard resolution and light tasks' };
    if (clamped >= 30) return { points: clamped, classificationName: 'poor', classificationIdx: 1, ratingDescription: badDesc };
    return { points: clamped, classificationName: 'bad', classificationIdx: 0, ratingDescription: 'Connection inadequate or experiencing severe packet delays' };
  };

  return {
    browsing: toExperience(browsingScore, 'Instant page loads and responsive navigation', 'Noticeable delay when opening sites'),
    streaming: toExperience(streamingScore, 'Seamless 4K Ultra HD & 60fps video playback', 'Frequent buffering, limited to 720p or lower'),
    rtc: toExperience(rtcScore, 'Crisp audio and smooth HD video calls without freeze', 'Choppy audio and delayed video frames'),
    gaming: toExperience(gamingScore, 'Minimal input lag and competitive real-time response', 'High latency and packet delays causing rubber-banding'),
  };
}
