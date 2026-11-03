'use client';

import { useState, useEffect, useCallback } from 'react';
import { NetworkInfo } from '@/types/network';

interface ExtendedNetworkInformation extends EventTarget {
  type?: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'wimax' | 'other' | 'none' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworkInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/network-info', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Failed to load network information (${res.status})`);
      }

      const data: NetworkInfo = await res.json();

      // Enrich with client browser Network Information API if supported
      if (typeof navigator !== 'undefined') {
        const nav = navigator as Navigator & {
          connection?: ExtendedNetworkInformation;
          mozConnection?: ExtendedNetworkInformation;
          webkitConnection?: ExtendedNetworkInformation;
        };
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

        if (conn) {
          data.connectionType = conn.type || 'unknown';
          data.effectiveType = conn.effectiveType;
          data.downlinkEstimatedMbps = conn.downlink;
          data.rttEstimatedMs = conn.rtt;
          data.saveData = conn.saveData;
        }
      }

      setNetworkInfo(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network detection failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      fetchNetworkInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for changes in NetworkInformation API
    const nav = navigator as Navigator & {
      connection?: ExtendedNetworkInformation;
      mozConnection?: ExtendedNetworkInformation;
      webkitConnection?: ExtendedNetworkInformation;
    };
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const handleConnectionChange = () => {
      if (conn) {
        setNetworkInfo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connectionType: conn.type || prev.connectionType || 'unknown',
            effectiveType: conn.effectiveType || prev.effectiveType,
            downlinkEstimatedMbps: conn.downlink ?? prev.downlinkEstimatedMbps,
            rttEstimatedMs: conn.rtt ?? prev.rttEstimatedMs,
            saveData: conn.saveData ?? prev.saveData,
          };
        });
      }
    };

    if (conn && conn.addEventListener) {
      conn.addEventListener('change', handleConnectionChange);
    }

    fetchNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [fetchNetworkInfo]);

  return {
    networkInfo,
    isOnline,
    isLoading,
    error,
    refresh: fetchNetworkInfo,
  };
}
