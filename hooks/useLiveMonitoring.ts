'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MonitoringSample } from '@/types/network';
import { calculateJitter } from '@/lib/utils/formatters';

export function useLiveMonitoring(intervalMs = 2500) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [samples, setSamples] = useState<MonitoringSample[]>([]);
  const [currentPingMs, setCurrentPingMs] = useState<number | null>(null);
  const [currentJitterMs, setCurrentJitterMs] = useState<number>(0);
  const [connectionLogs, setConnectionLogs] = useState<Array<{ timestamp: number; message: string; type: 'info' | 'warn' | 'error' }>>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const samplesRef = useRef<MonitoringSample[]>([]);
  const isPausedRef = useRef<boolean>(false);

  isPausedRef.current = isPaused;

  const performProbe = useCallback(async () => {
    if (isPausedRef.current) return;

    const t0 = performance.now();
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      const res = await fetch(`/api/ping?t=${Date.now()}`, {
        cache: 'no-store',
      });

      const rtt = Math.round((performance.now() - t0) * 10) / 10;
      const isOnline = res.ok;

      // Calculate rolling jitter from last 15 samples
      const recentPings = [...samplesRef.current.slice(-15).map((s) => s.pingMs), rtt];
      const jitter = calculateJitter(recentPings);

      const newSample: MonitoringSample = {
        id,
        timestamp: Date.now(),
        pingMs: rtt,
        jitterMs: jitter,
        isOnline,
      };

      // Keep last 40 samples in memory
      const updated = [...samplesRef.current.slice(-39), newSample];
      samplesRef.current = updated;
      setSamples(updated);
      setCurrentPingMs(rtt);
      setCurrentJitterMs(jitter);
    } catch {
      const failedSample: MonitoringSample = {
        id,
        timestamp: Date.now(),
        pingMs: 0,
        jitterMs: 0,
        isOnline: false,
      };
      const updated = [...samplesRef.current.slice(-39), failedSample];
      samplesRef.current = updated;
      setSamples(updated);
      setCurrentPingMs(null);

      setConnectionLogs((prev) => [
        ...prev.slice(-19),
        {
          timestamp: Date.now(),
          message: 'Beacon request failed: server unreachable or network drop',
          type: 'warn',
        },
      ]);
    }
  }, []);

  const startMonitoring = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setConnectionLogs((prev) => [
      ...prev,
      { timestamp: Date.now(), message: 'Live monitoring session started (2.5s beacon interval)', type: 'info' },
    ]);
    performProbe();
  }, [performProbe]);

  const pauseMonitoring = useCallback(() => {
    setIsPaused(true);
    setConnectionLogs((prev) => [
      ...prev,
      { timestamp: Date.now(), message: 'Monitoring paused', type: 'info' },
    ]);
  }, []);

  const resumeMonitoring = useCallback(() => {
    setIsPaused(false);
    setConnectionLogs((prev) => [
      ...prev,
      { timestamp: Date.now(), message: 'Monitoring resumed', type: 'info' },
    ]);
    performProbe();
  }, [performProbe]);

  const stopMonitoring = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setConnectionLogs((prev) => [
      ...prev,
      { timestamp: Date.now(), message: 'Monitoring stopped', type: 'info' },
    ]);
  }, []);

  const clearSession = useCallback(() => {
    samplesRef.current = [];
    setSamples([]);
    setCurrentPingMs(null);
    setCurrentJitterMs(0);
    setConnectionLogs([]);
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        performProbe();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused, intervalMs, performProbe]);

  return {
    isActive,
    isPaused,
    samples,
    currentPingMs,
    currentJitterMs,
    connectionLogs,
    startMonitoring,
    pauseMonitoring,
    resumeMonitoring,
    stopMonitoring,
    clearSession,
  };
}
