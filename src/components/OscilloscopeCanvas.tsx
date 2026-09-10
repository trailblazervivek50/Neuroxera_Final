import React, { useRef, useEffect, useState } from 'react';
import { EMGChannel, DisplayMode, TimebaseSpeed } from '../types';
import { Maximize2, Pause, Play, Sliders, Volume2, Eye } from 'lucide-react';

interface OscilloscopeCanvasProps {
  channels: EMGChannel[];
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  timebaseSpeed: TimebaseSpeed;
  setTimebaseSpeed: (speed: TimebaseSpeed) => void;
  uvScale: number;
  setUvScale: (scale: number) => void;
  historyBuffers: React.MutableRefObject<number[][]>; // [chIndex][timeIndex] raw
  rmsBuffers: React.MutableRefObject<number[][]>;     // [chIndex][timeIndex] rms
}

export const OscilloscopeCanvas: React.FC<OscilloscopeCanvasProps> = ({
  channels,
  displayMode,
  setDisplayMode,
  timebaseSpeed,
  setTimebaseSpeed,
  uvScale,
  setUvScale,
  historyBuffers,
  rmsBuffers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; chIndex: number; valUv: number } | null>(null);

  // Resize canvas according to container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * window.devicePixelRatio;
        canvasRef.current.height = rect.height * window.devicePixelRatio;
      }
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 60 FPS Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      // Clear with medical dark CRT phosphor tone
      ctx.fillStyle = '#060B13';
      ctx.fillRect(0, 0, width, height);

      const numChannels = 6;
      const rowHeight = height / numChannels;

      // Draw horizontal channel dividers & background grid
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = '#121F33';

      for (let i = 0; i < numChannels; i++) {
        const topY = i * rowHeight;
        const midY = topY + rowHeight / 2;

        // Subgrid lines (25µV increments)
        ctx.strokeStyle = '#0E1726';
        ctx.beginPath();
        ctx.moveTo(0, topY + rowHeight * 0.25);
        ctx.lineTo(width, topY + rowHeight * 0.25);
        ctx.moveTo(0, topY + rowHeight * 0.75);
        ctx.lineTo(width, topY + rowHeight * 0.75);
        ctx.stroke();

        // Baseline zero axis line
        ctx.strokeStyle = '#1E2E48';
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Channel separator border
        ctx.strokeStyle = '#17253D';
        ctx.beginPath();
        ctx.moveTo(0, topY + rowHeight);
        ctx.lineTo(width, topY + rowHeight);
        ctx.stroke();
      }

      // Vertical time grid lines (every 100px)
      ctx.strokeStyle = '#0F1A2C';
      for (let x = 0; x < width; x += 100 * dpr) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw waveforms for each channel
      const bufferLen = historyBuffers.current[0]?.length || 600;

      for (let c = 0; c < numChannels; c++) {
        const ch = channels[c];
        if (ch.isMuted) continue;

        const rawBuffer = historyBuffers.current[c] || [];
        const rmsBuffer = rmsBuffers.current[c] || [];
        const topY = c * rowHeight;
        const midY = topY + rowHeight / 2;
        const maxAmplitudePx = (rowHeight / 2) * 0.85;

        // Calculate Y scale factor
        const scaleFactor = maxAmplitudePx / uvScale;

        // Draw Trigger Threshold Dotted Line
        const threshY = midY - ch.thresholdUv * scaleFactor;
        ctx.strokeStyle = `${ch.color}40`;
        ctx.setLineDash([2 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(0, threshY);
        ctx.lineTo(width, threshY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Raw EMG Waveform
        if (displayMode === 'raw' || displayMode === 'all') {
          ctx.beginPath();
          ctx.strokeStyle = ch.color;
          ctx.lineWidth = 1.5 * dpr;
          ctx.shadowColor = ch.color;
          ctx.shadowBlur = 4 * dpr;

          for (let i = 0; i < bufferLen; i++) {
            const x = (i / (bufferLen - 1)) * width;
            const sample = rawBuffer[i] ?? 0;
            const y = midY - sample * ch.gain * scaleFactor;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Draw Rectified Waveform (|µV|)
        if (displayMode === 'rectified') {
          ctx.beginPath();
          ctx.strokeStyle = ch.color;
          ctx.lineWidth = 1.5 * dpr;
          ctx.fillStyle = `${ch.color}15`;

          ctx.moveTo(0, midY);
          for (let i = 0; i < bufferLen; i++) {
            const x = (i / (bufferLen - 1)) * width;
            const sample = Math.abs(rawBuffer[i] ?? 0);
            const y = midY - sample * ch.gain * scaleFactor;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, midY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Draw RMS Linear Envelope Waveform
        if (displayMode === 'envelope' || displayMode === 'all') {
          ctx.beginPath();
          ctx.strokeStyle = displayMode === 'all' ? '#FFFFFF' : ch.color;
          ctx.lineWidth = 2 * dpr;
          if (displayMode === 'all') {
            ctx.setLineDash([3 * dpr, 2 * dpr]);
          }

          for (let i = 0; i < bufferLen; i++) {
            const x = (i / (bufferLen - 1)) * width;
            const sample = rmsBuffer[i] ?? 0;
            const y = midY - sample * ch.gain * scaleFactor;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Channel Label Overlay
        ctx.fillStyle = ch.color;
        ctx.font = `600 ${11 * dpr}px 'JetBrains Mono', monospace`;
        ctx.fillText(`${ch.name.toUpperCase()} (${ch.muscle})`, 12 * dpr, topY + 18 * dpr);

        // Current RMS µV Readout
        const currentRms = ch.rmsUv.toFixed(1);
        const currentPeak = ch.peakUv.toFixed(0);
        ctx.fillStyle = '#94A3B8';
        ctx.font = `500 ${10 * dpr}px 'JetBrains Mono', monospace`;
        ctx.fillText(`RMS: ${currentRms} µV | PEAK: ${currentPeak} µV | GAIN: ${ch.gain}x`, 12 * dpr, topY + 32 * dpr);

        // Activity Warning if above threshold
        if (ch.rmsUv > ch.thresholdUv) {
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(width - 90 * dpr, topY + 8 * dpr, 80 * dpr, 18 * dpr);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${9 * dpr}px sans-serif`;
          ctx.fillText('ACTIVE BURST', width - 85 * dpr, topY + 20 * dpr);
        }
      }

      // Vertical sweep line
      const sweepX = width - 10 * dpr;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [channels, displayMode, uvScale]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Display Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px] mr-1">VIEW:</span>
          {(['raw', 'rectified', 'envelope', 'all'] as DisplayMode[]).map((mode) => (
            <button
              key={mode}
              id={`view-mode-${mode}-btn`}
              onClick={() => setDisplayMode(mode)}
              className={`px-2 py-1 rounded text-[11px] font-mono capitalize transition-colors ${
                displayMode === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'all' ? 'Overlay (Raw+RMS)' : mode}
            </button>
          ))}
        </div>

        {/* Amplitude µV Scale Selector */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[11px]">SCALE:</span>
          <select
            id="scale-selector"
            value={uvScale}
            onChange={(e) => setUvScale(Number(e.target.value))}
            className="bg-slate-800 text-cyan-300 border border-slate-700 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-500"
          >
            <option value={100}>±100 µV (High Res)</option>
            <option value={250}>±250 µV (Standard)</option>
            <option value={500}>±500 µV (Wide)</option>
            <option value={1000}>±1000 µV (Max)</option>
          </select>
        </div>

        {/* Timebase Speed Selector */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 text-[11px]">SWEEP:</span>
          {(['slow', 'medium', 'fast'] as TimebaseSpeed[]).map((speed) => (
            <button
              key={speed}
              id={`speed-${speed}-btn`}
              onClick={() => setTimebaseSpeed(speed)}
              className={`px-2 py-1 rounded text-[11px] font-mono capitalize transition-colors ${
                timebaseSpeed === speed
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed === 'slow' ? '25mm/s' : speed === 'medium' ? '50mm/s' : '100mm/s'}
            </button>
          ))}
        </div>

        {/* Legend / Info */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Masseters
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Mentalis
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Zygomaticus
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Risorius
          </span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[480px] bg-slate-950">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />

        {/* Bottom scale indicator */}
        <div className="absolute bottom-2 right-3 pointer-events-none bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
          <span>TIME: 500 ms/div</span> | <span>VOLT: {Math.round(uvScale / 2)} µV/div</span>
        </div>
      </div>
    </div>
  );
};
