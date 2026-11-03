import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';

export async function GET(request: NextRequest) {
  const start = performance.now();
  const clientSendTime = request.nextUrl.searchParams.get('t');

  const now = Date.now();
  const processDuration = performance.now() - start;

  const response = NextResponse.json({
    status: 'ok',
    serverTimestamp: now,
    clientSendTime: clientSendTime ? parseInt(clientSendTime, 10) : undefined,
    processMs: Math.round(processDuration * 100) / 100,
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Timing-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Server-Timing', `process;dur=${processDuration.toFixed(2)}`);
  response.headers.set('X-Diagnostic-Engine', 'net-info-internal-v1');

  return response;
}
