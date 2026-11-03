/**
 * Net Info Web Worker for off-main-thread statistical computations
 */

self.onmessage = function (event) {
  const { id, type, payload } = event.data;

  if (type === 'CALCULATE_STATS') {
    const samples = payload.samples || [];
    if (!samples.length) {
      self.postMessage({ id, type: 'STATS_RESULT', result: null });
      return;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;

    const getPercentile = (p) => {
      const idx = (p / 100) * (n - 1);
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const weight = idx - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const sum = samples.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // RFC 3550 Jitter calculation
    let jitter = 0;
    for (let i = 1; i < samples.length; i++) {
      const diff = Math.abs(samples[i] - samples[i - 1]);
      jitter += (diff - jitter) / 16;
    }

    // Stability Index (0-100%): 100% means ultra-stable, lower means high variance
    const cv = mean > 0 ? stdDev / mean : 0;
    const stabilityIndex = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));

    self.postMessage({
      id,
      type: 'STATS_RESULT',
      result: {
        count: n,
        min: sorted[0],
        max: sorted[n - 1],
        mean: Math.round(mean * 10) / 10,
        median: Math.round(getPercentile(50) * 10) / 10,
        p90: Math.round(getPercentile(90) * 10) / 10,
        p95: Math.round(getPercentile(95) * 10) / 10,
        p99: Math.round(getPercentile(99) * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        jitter: Math.round(jitter * 10) / 10,
        stabilityIndex,
      },
    });
  } else if (type === 'SMOOTH_SERIES') {
    const rawData = payload.data || [];
    const windowSize = payload.windowSize || 3;
    const smoothed = rawData.map((pt, i, arr) => {
      const start = Math.max(0, i - windowSize + 1);
      const subset = arr.slice(start, i + 1);
      const avg = subset.reduce((acc, item) => acc + item.value, 0) / subset.length;
      return {
        ...pt,
        smoothedValue: Math.round(avg * 100) / 100,
      };
    });

    self.postMessage({ id, type: 'SMOOTH_RESULT', result: smoothed });
  }
};
