'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SpeedTestPhase, SpeedTestPoint, SpeedTestResults } from '@/types/network';
import { SpeedTestRunner } from '@/lib/network/speedtest-runner';

export function useSpeedTest() {
  const [phase, setPhase] = useState<SpeedTestPhase>('idle');
  const [phaseLabel, setPhaseLabel] = useState<string>('Ready to test');
  const [progress, setProgress] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);

  const [downloadMbps, setDownloadMbps] = useState<number>(0);
  const [uploadMbps, setUploadMbps] = useState<number>(0);
  const [idlePingMs, setIdlePingMs] = useState<number>(0);
  const [loadedPingMs, setLoadedPingMs] = useState<number>(0);
  const [jitterMs, setJitterMs] = useState<number>(0);

  const [throughputHistory, setThroughputHistory] = useState<Array<{ timestamp: number; mbps: number; direction: 'download' | 'upload' }>>([]);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ timestamp: number; pingMs: number; type: 'idle' | 'loaded' }>>([]);
  const [results, setResults] = useState<SpeedTestResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runnerRef = useRef<SpeedTestRunner | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker for background statistics
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker('/workers/stats-worker.js');
        workerRef.current = worker;
        return () => {
          worker.terminate();
        };
      } catch (e) {
        console.warn('Worker initialization note:', e);
      }
    }
  }, []);

  const startTest = useCallback(() => {
    if (phase !== 'idle' && phase !== 'finished' && phase !== 'error') {
      return;
    }

    setError(null);
    setProgress(0);
    setCurrentSpeed(0);
    setDownloadMbps(0);
    setUploadMbps(0);
    setIdlePingMs(0);
    setLoadedPingMs(0);
    setJitterMs(0);
    setThroughputHistory([]);
    setLatencyHistory([]);
    setResults(null);

    const runner = new SpeedTestRunner({
      onPhaseChange: (newPhase, label) => {
        setPhase(newPhase);
        setPhaseLabel(label);
      },
      onProgress: (pct, speed) => {
        setProgress(pct);
        if (speed > 0) {
          setCurrentSpeed(speed);
        }
      },
      onThroughputPoint: (point: SpeedTestPoint, direction: 'download' | 'upload') => {
        if (direction === 'download') {
          setDownloadMbps(point.mbps);
        } else {
          setUploadMbps(point.mbps);
        }
        setThroughputHistory((prev) => [
          ...prev,
          { timestamp: point.timestamp, mbps: point.mbps, direction },
        ]);
      },
      onLatencySample: (ping, type) => {
        if (type === 'idle') {
          setIdlePingMs(Math.round(ping * 10) / 10);
        } else {
          setLoadedPingMs(Math.round(ping * 10) / 10);
        }
        setLatencyHistory((prev) => [
          ...prev,
          { timestamp: Date.now(), pingMs: Math.round(ping * 10) / 10, type },
        ]);
      },
      onFinish: (finalResults: SpeedTestResults) => {
        setResults(finalResults);
        setDownloadMbps(finalResults.downloadMbps);
        setUploadMbps(finalResults.uploadMbps);
        setIdlePingMs(Math.round(finalResults.idlePingMs * 10) / 10);
        setLoadedPingMs(Math.round(Math.max(finalResults.downLoadedPingMs, finalResults.upLoadedPingMs) * 10) / 10);
        setJitterMs(Math.round(finalResults.jitterMs * 10) / 10);
        setCurrentSpeed(0);
        setPhase('finished');
        setPhaseLabel('Test Complete');
      },
      onError: (errMessage) => {
        setError(errMessage);
        setPhase('error');
        setPhaseLabel(`Error: ${errMessage}`);
      },
    });

    runnerRef.current = runner;
    runner.start();
  }, [phase]);

  const cancelTest = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.cancel();
      runnerRef.current = null;
    }
    setPhase('idle');
    setPhaseLabel('Test cancelled by user');
    setProgress(0);
    setCurrentSpeed(0);
  }, []);

  const resetTest = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.cancel();
      runnerRef.current = null;
    }
    setPhase('idle');
    setPhaseLabel('Ready to test');
    setProgress(0);
    setCurrentSpeed(0);
    setDownloadMbps(0);
    setUploadMbps(0);
    setIdlePingMs(0);
    setLoadedPingMs(0);
    setJitterMs(0);
    setThroughputHistory([]);
    setLatencyHistory([]);
    setResults(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (runnerRef.current) {
        runnerRef.current.cancel();
      }
    };
  }, []);

  return {
    phase,
    phaseLabel,
    progress,
    currentSpeed,
    downloadMbps,
    uploadMbps,
    idlePingMs,
    loadedPingMs,
    jitterMs,
    throughputHistory,
    latencyHistory,
    results,
    error,
    isRunning: phase !== 'idle' && phase !== 'finished' && phase !== 'error',
    startTest,
    cancelTest,
    resetTest,
  };
}
