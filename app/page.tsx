"use client";

import { useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSpeedTest } from "@/hooks/useSpeedTest";
import { useLiveMonitoring } from "@/hooks/useLiveMonitoring";

import { Header } from "@/components/dashboard/Header";
import { PrivacyBanner } from "@/components/dashboard/PrivacyBanner";
import { ConnectionOverviewCard } from "@/components/dashboard/ConnectionOverviewCard";
import { SpeedometerGauge } from "@/components/speed-test/SpeedometerGauge";
import { SpeedTestControls } from "@/components/speed-test/SpeedTestControls";
import { ThroughputChart } from "@/components/charts/ThroughputChart";
import { LatencyChart } from "@/components/charts/LatencyChart";
import { QualityScores } from "@/components/charts/QualityScores";
import { DnsInspector } from "@/components/diagnostics/DnsInspector";
import { BrowserConnectionInfo } from "@/components/diagnostics/BrowserConnectionInfo";
import { ResourceTimingCard } from "@/components/diagnostics/ResourceTimingCard";
import { WebRtcDiagnosticsCard } from "@/components/diagnostics/WebRtcDiagnosticsCard";
import { LiveMonitoringPanel } from "@/components/monitoring/LiveMonitoringPanel";
import { SettingsModal } from "@/components/dashboard/SettingsModal";

import { Globe, Layers, Radio, Cpu, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";

type DiagnosticTab = "dns" | "browser" | "waterfall" | "webrtc";

export default function Home() {
  const {
    networkInfo,
    isOnline,
    isLoading: isNetworkLoading,
    refresh: refreshNetwork,
  } = useNetworkStatus();

  const {
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
    error: speedTestError,
    isRunning,
    startTest,
    cancelTest,
    resetTest,
  } = useSpeedTest();

  const [monitoringInterval, setMonitoringInterval] = useState(2500);

  const {
    isActive: isMonitoringActive,
    isPaused: isMonitoringPaused,
    samples: monitoringSamples,
    currentPingMs: monitoringCurrentPing,
    currentJitterMs: monitoringCurrentJitter,
    connectionLogs: monitoringLogs,
    startMonitoring,
    pauseMonitoring,
    resumeMonitoring,
    stopMonitoring,
    clearSession: clearMonitoringSession,
  } = useLiveMonitoring(monitoringInterval);

  // Settings
  const [unit, setUnit] = useState<"Mbps" | "MB/s">("Mbps");
  const [engine, setEngine] = useState<"cloudflare" | "internal">("cloudflare");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Diagnostics Tabs
  const [activeTab, setActiveTab] = useState<DiagnosticTab>("dns");

  const handleResetSession = () => {
    resetTest();
    clearMonitoringSession();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header
          isOnline={isOnline}
          phase={phase}
          phaseLabel={phaseLabel}
          isMonitoringActive={isMonitoringActive}
          onRefresh={refreshNetwork}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isLoading={isNetworkLoading}
        />

        <PrivacyBanner />

        {/* Main Dashboard Body */}
        <main className="container mt-5 mx-auto px-2 md:px-6 space-y-6">
          {/* Section 1: Main Connection Overview Card */}
          <section aria-label="Connection Overview">
            <ConnectionOverviewCard
              info={networkInfo}
              isLoading={isNetworkLoading}
              isOnline={isOnline}
            />
          </section>

          {/* Section 2: Speedometer & Diagnostic Speed Test */}
          <section
            aria-label="Speed Measurement"
            className="w-full rounded-2xl bg-linear-to-b from-slate-900/60 to-slate-950/60 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl shadow-black/20"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Column: Visual Speedometer Gauge */}
              <div className="w-full lg:w-5/12 flex justify-center py-2">
                <SpeedometerGauge
                  currentSpeedMbps={
                    currentSpeed > 0
                      ? currentSpeed
                      : phase === "finished"
                        ? downloadMbps
                        : 0
                  }
                  phase={phase}
                  phaseLabel={phaseLabel}
                  progress={progress}
                  unit={unit}
                />
              </div>

              {/* Right Column: Interactive Test Controls & Telemetry Tiles */}
              <div className="w-full lg:w-7/12 flex flex-col justify-center">
                <SpeedTestControls
                  phase={phase}
                  isRunning={isRunning}
                  downloadMbps={downloadMbps}
                  uploadMbps={uploadMbps}
                  idlePingMs={idlePingMs}
                  loadedPingMs={loadedPingMs}
                  jitterMs={jitterMs}
                  results={results}
                  error={speedTestError}
                  unit={unit}
                  onStart={startTest}
                  onCancel={cancelTest}
                  onReset={resetTest}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Network Analytics Charts */}
          <section
            aria-label="Network Telemetry Charts"
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            <ThroughputChart data={throughputHistory} unit={unit} />
            <LatencyChart data={latencyHistory} />
          </section>

          {/* Section 4: Application Quality Scores */}
          <section aria-label="Quality Scores">
            <QualityScores scores={results?.scores} />
          </section>

          {/* Section 5: Real-Time Live Monitoring */}
          <section aria-label="Continuous Live Monitoring">
            <LiveMonitoringPanel
              isActive={isMonitoringActive}
              isPaused={isMonitoringPaused}
              samples={monitoringSamples}
              currentPingMs={monitoringCurrentPing}
              currentJitterMs={monitoringCurrentJitter}
              connectionLogs={monitoringLogs}
              onStart={startMonitoring}
              onPause={pauseMonitoring}
              onResume={resumeMonitoring}
              onStop={stopMonitoring}
              onClear={clearMonitoringSession}
            />
          </section>

          {/* Section 6: Advanced Network Diagnostics Tabs */}
          <section
            aria-label="Advanced Diagnostics"
            className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Advanced Network Diagnostics</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Low-level protocol inspection, DNS recursive resolution, and
                  WebRTC telemetry
                </p>
              </div>

              {/* Tabs Navigation Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab("dns")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "dns"
                      ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>DNS Inspector</span>
                </button>

                <button
                  onClick={() => setActiveTab("browser")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "browser"
                      ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Browser API</span>
                </button>

                <button
                  onClick={() => setActiveTab("waterfall")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "waterfall"
                      ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>HTTP Waterfall</span>
                </button>

                <button
                  onClick={() => setActiveTab("webrtc")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "webrtc"
                      ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>WebRTC & UDP</span>
                </button>
              </div>
            </div>

            {/* Tab Panes */}
            <div>
              {activeTab === "dns" && <DnsInspector />}
              {activeTab === "browser" && (
                <BrowserConnectionInfo info={networkInfo} isOnline={isOnline} />
              )}
              {activeTab === "waterfall" && <ResourceTimingCard />}
              {activeTab === "webrtc" && <WebRtcDiagnosticsCard />}
            </div>
          </section>
        </main>
      </div>

      <Footer />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        unit={unit}
        onChangeUnit={setUnit}
        engine={engine}
        onChangeEngine={setEngine}
        monitoringInterval={monitoringInterval}
        onChangeMonitoringInterval={setMonitoringInterval}
        onResetSession={handleResetSession}
      />
    </div>
  );
}
