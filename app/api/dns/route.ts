import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { performance } from 'node:perf_hooks';

const ALLOWED_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'PTR'] as const;
type DnsType = (typeof ALLOWED_TYPES)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawDomain = (body.domain || '').trim().toLowerCase();
    const rawType = (body.type || 'A').toUpperCase() as DnsType;

    if (!rawDomain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // Sanitize domain name (alphanumeric, dots, hyphens, up to 253 chars)
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    // Allow single labels like 'localhost' if testing locally
    if (rawDomain !== 'localhost' && !domainRegex.test(rawDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain name format' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(rawType)) {
      return NextResponse.json(
        { error: `Unsupported record type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const dnsServers = dns.getServers();
    const startTime = performance.now();
    let records: unknown = [];

    switch (rawType) {
      case 'A':
        records = await dns.resolve4(rawDomain, { ttl: true });
        break;
      case 'AAAA':
        records = await dns.resolve6(rawDomain, { ttl: true });
        break;
      case 'MX':
        records = await dns.resolveMx(rawDomain);
        break;
      case 'TXT':
        records = await dns.resolveTxt(rawDomain);
        break;
      case 'NS':
        records = await dns.resolveNs(rawDomain);
        break;
      case 'CNAME':
        records = await dns.resolveCname(rawDomain);
        break;
      case 'PTR':
        records = await dns.resolvePtr(rawDomain);
        break;
    }

    const resolutionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

    return NextResponse.json({
      domain: rawDomain,
      type: rawType,
      records,
      resolutionTimeMs,
      dnsServers,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'DNS resolution failed';
    const code = (err as { code?: string })?.code || 'ERROR';

    return NextResponse.json(
      {
        error: `${code}: ${errorMsg}`,
        dnsServers: dns.getServers(),
      },
      { status: 422 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    dnsServers: dns.getServers(),
    supportedTypes: ALLOWED_TYPES,
  });
}
