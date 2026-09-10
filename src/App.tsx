import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EMGChannel, DisplayMode, TimebaseSpeed, InputSource, DecodedGesture, NeuromuscularSymmetry } from './types';
import { INITIAL_CHANNELS, PRESET_GESTURES } from './data/channels';
import { EMGSignalGenerator, computeNeuromuscularSymmetry, decodeNeuromuscularGestures } from './utils/signalProcessor';
import { Header } from './components/Header';
import { OscilloscopeCanvas } from './components/OscilloscopeCanvas';
import { AnatomicalFaceMap } from './components/AnatomicalFaceMap';
import { CameraBioTracker } from './components/CameraBioTracker';
import { ChannelControlPanel } from './components/ChannelControlPanel';
import { GestureDecoderCard } from './components/GestureDecoderCard';
import { ExerciseTriggerBar } from './components/ExerciseTriggerBar';
import { AiAnalysisModal } from './components/AiAnalysisModal';

export default function App() {
  const [channels, setChannels] = useState<EMGChannel[]>(INITIAL_CHANNELS);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('raw');
  const [timebaseSpeed, setTimebaseSpeed] = useState<TimebaseSpeed>('medium');
  const [uvScale, setUvScale] = useState<number>(250);
  const [inputSource, setInputSource] = useState<InputSource>('optical_camera');
  const [notchFilter, setNotchFilter] = useState<boolean>(true);
  const [highPassFilter, setHighPassFilter] = useState<boolean>(true);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordedDataRef = useRef<{ timestamp: number; channels: number[]; mic: number }[]>([]);

  // Camera & Mic Permissions
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);

  // Active Simulation Gesture
  const [activePresetName, setActivePresetName] = useState<string | null>(null);

  // Neuromuscular Classification State
  const [currentGesture, setCurrentGesture] = useState<DecodedGesture | null>(null);
  const [gestureHistory, setGestureHistory] = useState<DecodedGesture[]>([]);
  const lastGestureTimeRef = useRef<number>(0);

  // Symmetry State
  const [symmetry, setSymmetry] = useState<NeuromuscularSymmetry>({
    masseterSymmetry: 1.0,
    masseterBalancePct: 98,
    zygomaticusSymmetry: 1.0,
    zygomaticusBalancePct: 96,
    peakMasseterUv: 12,
    mentalisRestUv: 9.2,
    restingToneStatus: 'relaxed',
  });

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Signal Generator & Waveform History Buffers (600 points per channel)
  const generatorRef = useRef<EMGSignalGenerator>(new EMGSignalGenerator());
  const historyBuffers = useRef<number[][]>([
    new Array(600).fill(0),
    new Array(600).fill(0),
    new Array(600).fill(0),
    new Array(600).fill(0),
    new Array(600).fill(0),
    new Array(600).fill(0),
  ]);
  const rmsBuffers = useRef<number[][]>([
    new Array(600).fill(8),
    new Array(600).fill(8),
    new Array(600).fill(9),
    new Array(600).fill(6),
    new Array(600).fill(6),
    new Array(600).fill(8),
  ]);

  // Handle Camera optical estimation callback
  const handleOpticalUvEstimated = useCallback((estimatedUv: number[]) => {
    if (inputSource === 'optical_camera') {
      for (let i = 0; i < 6; i++) {
        generatorRef.current.setChannelTarget(i, estimatedUv[i] || 8);
      }
    }
  }, [inputSource]);

  // Handle Preset Trigger
  const handleTriggerPreset = useCallback((preset: (typeof PRESET_GESTURES)[0]) => {
    setActivePresetName(preset.name);

    preset.channels.forEach((pch) => {
      const chIdx = pch.id - 1;
      generatorRef.current.setChannelTarget(chIdx, pch.targetUv);
    });

    // Automatically return to resting baseline after duration
    setTimeout(() => {
      preset.channels.forEach((pch) => {
        const chIdx = pch.id - 1;
        generatorRef.current.setChannelTarget(chIdx, 8);
      });
      setActivePresetName(null);
    }, preset.durationMs);
  }, []);

  const handleResetBaseline = useCallback(() => {
    setActivePresetName(null);
    for (let i = 0; i < 6; i++) {
      generatorRef.current.setChannelTarget(i, 8);
    }
  }, []);

  // Update specific channel setting (gain, threshold, mute)
  const handleUpdateChannel = useCallback((channelId: number, updates: Partial<EMGChannel>) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, ...updates } : c))
    );
  }, []);

  // Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Toggle Recording
  const handleToggleRecording = useCallback(() => {
    if (!isRecording) {
      recordedDataRef.current = [];
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  }, [isRecording]);

  // Export Recorded CSV
  const handleExportCsv = useCallback(() => {
    const data = recordedDataRef.current;
    if (data.length === 0) {
      // Create a snapshot export if no continuous recording was running
      const now = Date.now();
      const headers = 'timestamp_ms,ch1_masseter_left_uv,ch2_masseter_right_uv,ch3_mentalis_uv,ch4_zygomaticus_left_uv,ch5_zygomaticus_right_uv,ch6_depressor_risorius_uv,mic_level\n';
      const row = `${now},${channels[0].rmsUv.toFixed(1)},${channels[1].rmsUv.toFixed(1)},${channels[2].rmsUv.toFixed(1)},${channels[3].rmsUv.toFixed(1)},${channels[4].rmsUv.toFixed(1)},${channels[5].rmsUv.toFixed(1)},${micLevel.toFixed(2)}\n`;
      const blob = new Blob([headers + row], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facial_semg_telemetry_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = 'timestamp_ms,ch1_masseter_left_uv,ch2_masseter_right_uv,ch3_mentalis_uv,ch4_zygomaticus_left_uv,ch5_zygomaticus_right_uv,ch6_depressor_risorius_uv,mic_level\n';
    const rows = data.map((d) => `${d.timestamp},${d.channels.map((c) => c.toFixed(2)).join(',')},${d.mic.toFixed(3)}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facial_semg_session_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [channels, micLevel]);

  // High-Frequency Real-Time Telemetry Simulation & Signal Loop (60 FPS)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastUiUpdateTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      // Generate next physiological sample
      const { rawValues, rmsValues } = generatorRef.current.generateNextSample(
        dt,
        notchFilter,
        highPassFilter
      );

      // Shift buffers
      for (let c = 0; c < 6; c++) {
        historyBuffers.current[c].shift();
        historyBuffers.current[c].push(rawValues[c]);

        rmsBuffers.current[c].shift();
        rmsBuffers.current[c].push(rmsValues[c]);
      }

      // Record sample if active
      if (isRecording) {
        recordedDataRef.current.push({
          timestamp: Date.now(),
          channels: [...rawValues],
          mic: micLevel,
        });
      }

      // Throttle React State updates to 25-30fps for silky smooth canvas rendering
      if (time - lastUiUpdateTime > 40) {
        lastUiUpdateTime = time;

        // Update channel live meters
        setChannels((prev) =>
          prev.map((ch, idx) => {
            const rms = rmsValues[idx] || 8;
            const raw = rawValues[idx] || 0;
            return {
              ...ch,
              rawUv: raw,
              rmsUv: rms,
              peakUv: Math.max(ch.peakUv * 0.94, rms),
              isActive: rms > ch.thresholdUv,
            };
          })
        );

        // Compute symmetry
        const symm = computeNeuromuscularSymmetry(rmsValues);
        setSymmetry(symm);

        // Run gesture classifier
        const gesture = decodeNeuromuscularGestures(rmsValues, lastGestureTimeRef.current);
        if (gesture) {
          lastGestureTimeRef.current = gesture.timestamp;
          setCurrentGesture(gesture);
          setGestureHistory((prev) => [gesture, ...prev.slice(0, 24)]);
        } else {
          // Clear active gesture badge after 1.2s
          if (Date.now() - lastGestureTimeRef.current > 1200) {
            setCurrentGesture(null);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [notchFilter, highPassFilter, isRecording, micLevel]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased selection:bg-cyan-500 selection:text-white">
      {/* App Header */}
      <Header
        inputSource={inputSource}
        setInputSource={setInputSource}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        onToggleRecording={handleToggleRecording}
        onExportCsv={handleExportCsv}
        onOpenAiReport={() => setIsAiModalOpen(true)}
        hasCameraPermission={hasCameraPermission}
        onRequestCamera={() => setHasCameraPermission(true)}
        notchFilter={notchFilter}
        setNotchFilter={setNotchFilter}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-4">
        {/* Top Grid: Oscilloscope + Right Diagnostics Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main 6-Channel Oscilloscope View (8 cols on large screens) */}
          <div className="lg:col-span-8 flex flex-col min-h-[500px]">
            <OscilloscopeCanvas
              channels={channels}
              displayMode={displayMode}
              setDisplayMode={setDisplayMode}
              timebaseSpeed={timebaseSpeed}
              setTimebaseSpeed={setTimebaseSpeed}
              uvScale={uvScale}
              setUvScale={setUvScale}
              historyBuffers={historyBuffers}
              rmsBuffers={rmsBuffers}
            />
          </div>

          {/* Right Column: Anatomical Face Map & Optical Bio-Tracker (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Camera / Optical Bio-tracker if selected, else Anatomical Map */}
            {inputSource === 'optical_camera' ? (
              <CameraBioTracker
                onUvEstimated={handleOpticalUvEstimated}
                onMicLevelChange={setMicLevel}
                hasCameraPermission={hasCameraPermission}
                onRequestCamera={() => setHasCameraPermission(true)}
              />
            ) : null}

            {/* Anatomical Face Map */}
            <AnatomicalFaceMap
              channels={channels}
              symmetry={symmetry}
            />

            {/* Neuromuscular Decoder & Symmetry Card */}
            <GestureDecoderCard
              currentGesture={currentGesture}
              gestureHistory={gestureHistory}
              symmetry={symmetry}
            />
          </div>
        </div>

        {/* Channel Calibration & Controls Panel */}
        <ChannelControlPanel
          channels={channels}
          onUpdateChannel={handleUpdateChannel}
        />

        {/* Exercise & Preset Gesture Triggers */}
        <ExerciseTriggerBar
          onTriggerPreset={handleTriggerPreset}
          onResetBaseline={handleResetBaseline}
          activePresetName={activePresetName}
        />
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Facial sEMG Telemetry Suite • 6-Channel Neuromuscular Acquisition System
          </div>
          <div className="text-slate-400">
            Ch 1 & 2: Masseters | Ch 3: Mentalis | Ch 4 & 5: Zygomaticus | Ch 6: Risorius
          </div>
        </div>
      </footer>

      {/* AI Clinical Diagnostic Modal */}
      <AiAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        channels={channels}
        symmetry={symmetry}
        gestureHistory={gestureHistory}
      />
    </div>
  );
}
