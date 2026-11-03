export type SpeedTestPhase =
  | 'idle'
  | 'initializing'
  | 'connectivity'
  | 'latency'
  | 'download'
  | 'upload'
  | 'loaded-latency'
  | 'finalizing'
  | 'finished'
  | 'error';

export interface NetworkInfo {
  ip: string;
  ipVersion: 'IPv4' | 'IPv6';
  isp: string;
  asn: string;
  asnOrg: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'wimax' | 'other' | 'none' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlinkEstimatedMbps?: number;
  rttEstimatedMs?: number;
  saveData?: boolean;
  serverNode?: string;
  serverLocation?: string;
  isPrivateOrLocal?: boolean;
}

export interface SpeedTestPoint {
  timestamp: number;
  durationMs: number;
  bytes: number;
  bps: number;
  mbps: number;
  pingMs?: number;
}

export interface LatencySample {
  timestamp: number;
  pingMs: number;
  type: 'idle' | 'download-loaded' | 'upload-loaded';
}

export interface ExperienceScore {
  points: number;
  classificationName: 'bad' | 'poor' | 'average' | 'good' | 'great';
  classificationIdx: number;
  ratingDescription: string;
}

export interface AIMQualityScores {
  browsing: ExperienceScore;
  streaming: ExperienceScore;
  rtc: ExperienceScore;
  gaming: ExperienceScore;
}

export interface SpeedTestResults {
  downloadMbps: number;
  uploadMbps: number;
  idlePingMs: number;
  downLoadedPingMs: number;
  upLoadedPingMs: number;
  jitterMs: number;
  downLoadedJitterMs: number;
  upLoadedJitterMs: number;
  packetLossRatio: number | null;
  bufferbloatGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  scores?: AIMQualityScores;
  durationMs: number;
}

export interface MonitoringSample {
  id: string;
  timestamp: number;
  pingMs: number;
  jitterMs: number;
  isOnline: boolean;
  serverTiming?: number;
}

export interface DnsRecordResult {
  domain: string;
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME' | 'PTR';
  records: string[] | Array<{ exchange: string; priority: number }>;
  resolutionTimeMs: number;
  dnsServers: string[];
  ttl?: number;
  error?: string;
}

export interface WebRtcCandidate {
  candidate: string;
  type: 'host' | 'srflx' | 'relay' | 'unknown';
  protocol: 'udp' | 'tcp';
  address: string;
  port: number;
  priority: number;
}

export interface ResourceTimingBreakdown {
  name: string;
  durationMs: number;
  dnsLookupMs: number;
  tcpConnectMs: number;
  tlsHandshakeMs: number;
  ttfbMs: number;
  contentDownloadMs: number;
  transferSizeBytes: number;
  decodedBodySizeBytes: number;
}
