import React from 'react';
import { Activity, Camera, Cpu, Sparkles, Download, CircleDot, Bluetooth, AlertCircle } from 'lucide-react';
import { InputSource } from '../types';

interface HeaderProps {
  inputSource: InputSource;
  setInputSource: (source: InputSource) => void;
  isRecording: boolean;
  recordingSeconds: number;
  onToggleRecording: () => void;
  onExportCsv: () => void;
  onOpenAiReport: () => void;
  hasCameraPermission: boolean;
  onRequestCamera: () => void;
  notchFilter: boolean;
  setNotchFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  inputSource,
  setInputSource,
  isRecording,
  recordingSeconds,
  onToggleRecording,
  onExportCsv,
  onOpenAiReport,
  hasCameraPermission,
  onRequestCamera,
  notchFilter,
  setNotchFilter,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-wide text-slate-100 font-['Chakra_Petch']">
                  FACIAL sEMG TELEMETRY
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  6-CH MATRIX
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Neuromuscular Bio-Oscilloscope & Gesture Decoder
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800/80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>500 Hz SAMPLING</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setNotchFilter((prev) => !prev)}
              title="Toggle 50/60Hz notch filter"
              className={`px-1.5 py-0.5 rounded transition-colors ${
                notchFilter
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              NOTCH {notchFilter ? '50/60Hz ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Input Source Selector & Permissions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              id="source-camera-btn"
              onClick={() => {
                setInputSource('optical_camera');
                if (!hasCameraPermission) {
                  onRequestCamera();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                inputSource === 'optical_camera'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Optical sEMG</span>
              {inputSource === 'optical_camera' && !hasCameraPermission && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              id="source-sim-btn"
              onClick={() => setInputSource('simulation')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                inputSource === 'simulation'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Physiological Simulation</span>
            </button>

            <button
              id="source-ble-btn"
              onClick={() => setInputSource('bluetooth_ble')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                inputSource === 'bluetooth_ble'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>BLE Device</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Recording & Gemini Report */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Record button */}
          <button
            id="record-toggle-btn"
            onClick={onToggleRecording}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border ${
              isRecording
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <CircleDot className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-400 fill-rose-400' : 'text-slate-400'}`} />
            <span>{isRecording ? `REC ${formatTime(recordingSeconds)}` : 'Record Session'}</span>
          </button>

          {/* Export CSV button */}
          <button
            id="export-csv-btn"
            onClick={onExportCsv}
            title="Download sEMG Channel Data (CSV)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* AI Clinical Diagnostic button */}
          <button
            id="ai-analysis-btn"
            onClick={onOpenAiReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>AI Diagnostic</span>
          </button>
        </div>
      </div>
    </header>
  );
};
