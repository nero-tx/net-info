import { NextRequest, NextResponse } from 'next/server';
import { request as undiciRequest } from 'undici';
import { performance } from 'node:perf_hooks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUrl = (body.url || '').trim();

    if (!targetUrl) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    // Safety validation: only allow http:// or https://, and avoid internal SSRF to private IP space
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP and HTTPS protocols are supported' }, { status: 400 });
    }

    // Disallow private IP hostnames for SSRF protection
    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return NextResponse.json(
        { error: 'Diagnostics against private or loopback addresses are restricted' },
        { status: 403 }
      );
    }

    const start = performance.now();
    const response = await undiciRequest(targetUrl, {
      method: 'HEAD',
      headersTimeout: 4000,
      bodyTimeout: 4000,
      headers: {
        'User-Agent': 'NetworkIntelligenceDiagnostics/1.0',
      },
    });

    const elapsedMs = Math.round((performance.now() - start) * 10) / 10;
    const headerRecord: Record<string, string> = {};
    for (const [k, v] of Object.entries(response.headers)) {
      if (typeof v === 'string') {
        headerRecord[k] = v;
      } else if (Array.isArray(v)) {
        headerRecord[k] = v.join(', ');
      }
    }

    return NextResponse.json({
      targetUrl,
      statusCode: response.statusCode,
      roundTripTimeMs: elapsedMs,
      headers: headerRecord,
      https: parsedUrl.protocol === 'https:',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'HTTP diagnostic request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
