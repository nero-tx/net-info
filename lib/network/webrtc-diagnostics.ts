import { WebRtcCandidate } from '@/types/network';

export interface WebRtcDiagnosticResults {
  supported: boolean;
  candidates: WebRtcCandidate[];
  srflxDiscovered: boolean;
  publicMappedIp: string | null;
  publicMappedPort: number | null;
  stunLatencyMs: number;
  dataChannelSupported: boolean;
  dataChannelPacketsSent: number;
  dataChannelPacketsReceived: number;
  dataChannelLossPercent: number;
  dataChannelAvgRttMs: number;
  explanation: string;
}

export async function runWebRtcDiagnostics(): Promise<WebRtcDiagnosticResults> {
  if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
    return {
      supported: false,
      candidates: [],
      srflxDiscovered: false,
      publicMappedIp: null,
      publicMappedPort: null,
      stunLatencyMs: 0,
      dataChannelSupported: false,
      dataChannelPacketsSent: 0,
      dataChannelPacketsReceived: 0,
      dataChannelLossPercent: 0,
      dataChannelAvgRttMs: 0,
      explanation: 'WebRTC (RTCPeerConnection) is not supported in this browser environment.',
    };
  }

  const candidates: WebRtcCandidate[] = [];
  let publicMappedIp: string | null = null;
  let publicMappedPort: number | null = null;
  let stunLatencyMs = 0;

  const t0 = performance.now();

  try {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.google.com:19302' },
      ],
    });

    // Create a dummy data channel to trigger ICE candidate gathering
    pc.createDataChannel('diagnostics-probe');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 3500);

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        const cand = event.candidate;
        const type = (cand.type as 'host' | 'srflx' | 'relay') || 'unknown';
        const candidateEntry: WebRtcCandidate = {
          candidate: cand.candidate,
          type,
          protocol: (cand.protocol as 'udp' | 'tcp') || 'udp',
          address: cand.address || cand.relatedAddress || 'unknown',
          port: cand.port || 0,
          priority: cand.priority || 0,
        };
        candidates.push(candidateEntry);

        if (type === 'srflx' && cand.address) {
          publicMappedIp = cand.address;
          publicMappedPort = cand.port;
          if (stunLatencyMs === 0) {
            stunLatencyMs = Math.round((performance.now() - t0) * 10) / 10;
          }
        }
      };
    });

    pc.close();
  } catch (err) {
    console.warn('STUN candidate gathering warning:', err);
  }

  // Next, run DataChannel Loopback Packet Loss & RTT Probe
  let dataChannelPacketsSent = 0;
  let dataChannelPacketsReceived = 0;
  let dataChannelAvgRttMs = 0;

  try {
    const pc1 = new RTCPeerConnection();
    const pc2 = new RTCPeerConnection();

    const rtts: number[] = [];
    const totalPackets = 20;

    await new Promise<void>((resolve) => {
      const overallTimeout = setTimeout(() => resolve(), 3000);

      pc1.onicecandidate = (e) => e.candidate && pc2.addIceCandidate(e.candidate);
      pc2.onicecandidate = (e) => e.candidate && pc1.addIceCandidate(e.candidate);

      const dc1 = pc1.createDataChannel('loopback-ping', { ordered: true });

      pc2.ondatachannel = (event) => {
        const dc2 = event.channel;
        dc2.onmessage = (msg) => {
          // Echo message back to dc1
          if (dc2.readyState === 'open') {
            dc2.send(msg.data);
          }
        };
      };

      dc1.onopen = async () => {
        for (let seq = 0; seq < totalPackets; seq++) {
          const sendTime = performance.now();
          const payload = JSON.stringify({ seq, t: sendTime });
          dc1.send(payload);
          dataChannelPacketsSent++;
          await new Promise((r) => setTimeout(r, 20));
        }
      };

      dc1.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          const rtt = performance.now() - parsed.t;
          rtts.push(rtt);
          dataChannelPacketsReceived++;
          if (dataChannelPacketsReceived >= totalPackets) {
            clearTimeout(overallTimeout);
            resolve();
          }
        } catch {
          // Ignore parse errors
        }
      };

      // Connect loopback peer connections
      pc1.createOffer()
        .then((off) => {
          pc1.setLocalDescription(off);
          return pc2.setRemoteDescription(off);
        })
        .then(() => pc2.createAnswer())
        .then((ans) => {
          pc2.setLocalDescription(ans);
          return pc1.setRemoteDescription(ans);
        })
        .catch(() => resolve());
    });

    pc1.close();
    pc2.close();

    if (rtts.length > 0) {
      dataChannelAvgRttMs = Math.round((rtts.reduce((a, b) => a + b, 0) / rtts.length) * 100) / 100;
    }
  } catch (err) {
    console.warn('DataChannel loopback probe warning:', err);
  }

  const lostPackets = Math.max(0, dataChannelPacketsSent - dataChannelPacketsReceived);
  const dataChannelLossPercent = dataChannelPacketsSent > 0
    ? Math.round((lostPackets / dataChannelPacketsSent) * 100)
    : 0;

  return {
    supported: true,
    candidates,
    srflxDiscovered: !!publicMappedIp,
    publicMappedIp,
    publicMappedPort,
    stunLatencyMs,
    dataChannelSupported: typeof RTCDataChannel !== 'undefined',
    dataChannelPacketsSent,
    dataChannelPacketsReceived,
    dataChannelLossPercent,
    dataChannelAvgRttMs,
    explanation:
      'WebRTC operates over UDP/DTLS/SCTP. Browsers are prohibited by sandbox security from executing raw ICMP ping commands; UDP and DataChannel probing provides accurate visibility into NAT traversal, reflexive IP discovery, and socket responsiveness.',
  };
}
