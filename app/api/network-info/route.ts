import { NextRequest, NextResponse } from 'next/server';
import os from 'node:os';

interface GeoApiResponse {
  ip?: string;
  success?: boolean;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: { id?: string } | string;
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
  };
  isp?: string;
  org?: string;
  as?: string;
}

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
    return true;
  }
  // IPv4 Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
  if (/^10\./.test(ip) || /^192\.168\./.test(ip) || /^169\.254\./.test(ip)) {
    return true;
  }
  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172 && parseInt(match172[1], 10) >= 16 && parseInt(match172[1], 10) <= 31) {
    return true;
  }
  // IPv6 Unique Local Address fc00::/7 or Link Local fe80::/10
  if (/^(fc|fd|fe80)/i.test(ip)) {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  // Extract client IP from reverse proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const clientIpHeader = request.headers.get('x-client-ip');

  let clientIp = cfConnectingIp || realIp || clientIpHeader;
  if (!clientIp && forwardedFor) {
    clientIp = forwardedFor.split(',')[0].trim();
  }
  if (!clientIp) {
    clientIp = '127.0.0.1';
  }

  // Strip IPv6-mapped IPv4 prefix
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  const isV6 = clientIp.includes(':');
  const ipVersion = isV6 ? 'IPv6' : 'IPv4';
  const isPrivate = isPrivateIp(clientIp);

  const serverHostname = os.hostname();
  const serverNode = `Node-${serverHostname.substring(0, 8)}`;
  const serverLocation = 'Local Diagnostic Host';

  // Default network info
  let info = {
    ip: clientIp,
    ipVersion,
    isp: isPrivate ? 'Local Area Network / Loopback' : 'Internet Service Provider',
    asn: isPrivate ? 'AS0 (Local/Private)' : 'Unknown ASN',
    asnOrg: isPrivate ? 'Private Network' : 'Network Operator',
    city: isPrivate ? 'Local Subnet' : 'Unknown City',
    region: isPrivate ? 'Internal' : 'Unknown Region',
    country: isPrivate ? 'Local Network' : 'Global',
    countryCode: isPrivate ? 'LAN' : 'UN',
    latitude: null as number | null,
    longitude: null as number | null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    serverNode,
    serverLocation,
    isPrivateOrLocal: isPrivate,
  };

  // If public IP, query IP intelligence with strict 2.5s timeout
  if (!isPrivate) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://ipwho.is/${encodeURIComponent(clientIp)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: GeoApiResponse = await res.json();
        if (data && data.success !== false) {
          const tz = typeof data.timezone === 'object' ? data.timezone?.id : data.timezone;
          info = {
            ...info,
            city: data.city || info.city,
            region: data.region || info.region,
            country: data.country || info.country,
            countryCode: data.country_code || info.countryCode,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            timezone: tz || info.timezone,
            isp: data.connection?.isp || data.isp || info.isp,
            asn: data.connection?.asn ? `AS${data.connection.asn}` : (data.as || info.asn),
            asnOrg: data.connection?.org || data.org || info.asnOrg,
          };
        }
      }
    } catch {
      // Graceful degradation when external IP intelligence is unavailable or offline
    }
  }

  return NextResponse.json(info, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
