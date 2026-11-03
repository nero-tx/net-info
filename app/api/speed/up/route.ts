import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  let bytesReceived = 0;

  if (request.body) {
    const reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytesReceived += value.byteLength;
      }
    }
  }

  const durationMs = performance.now() - startTime;
  const bps = durationMs > 0 ? (bytesReceived * 8 * 1000) / durationMs : 0;
  const mbps = Math.round((bps / 1e6) * 100) / 100;

  return NextResponse.json({
    status: 'ok',
    bytesReceived,
    durationMs: Math.round(durationMs * 10) / 10,
    mbps,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
