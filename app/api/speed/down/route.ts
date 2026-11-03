import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const bytesParam = request.nextUrl.searchParams.get('bytes');
  let targetBytes = bytesParam ? parseInt(bytesParam, 10) : 2 * 1024 * 1024; // 2MB default

  // Safety clamp: between 1KB and 50MB
  if (isNaN(targetBytes) || targetBytes < 1024) targetBytes = 1024;
  if (targetBytes > 50 * 1024 * 1024) targetBytes = 50 * 1024 * 1024;

  const chunkSize = 64 * 1024; // 64KB chunks
  let bytesRemaining = targetBytes;

  // Pre-generate a 64KB pseudo-random block to prevent gzip compression tricks
  const chunkBuffer = new Uint8Array(chunkSize);
  for (let i = 0; i < chunkSize; i++) {
    chunkBuffer[i] = (i * 37 + 13) & 0xff;
  }

  const stream = new ReadableStream({
    pull(controller) {
      if (bytesRemaining <= 0) {
        controller.close();
        return;
      }
      const toSend = Math.min(bytesRemaining, chunkSize);
      bytesRemaining -= toSend;
      controller.enqueue(chunkBuffer.subarray(0, toSend));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': targetBytes.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Content-Disposition': 'inline; filename="speed-probe.bin"',
    },
  });
}
