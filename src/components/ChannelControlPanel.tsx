import React from 'react';
import { EMGChannel } from '../types';
import { Volume2, VolumeX, Sliders, CheckCircle2 } from 'lucide-react';

interface ChannelControlPanelProps {
  channels: EMGChannel[];
  onUpdateChannel: (channelId: number, updates: Partial<EMGChannel>) => void;
  onManualTriggerUv?: (channelId: number, uv: number) => void;
}

export const ChannelControlPanel: React.FC<ChannelControlPanelProps> = ({
  channels,
  onUpdateChannel,
  onManualTriggerUv,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 font-['Chakra_Petch'] tracking-wide">
            CHANNEL CALIBRATION & IMPEDANCE
          </h2>
          <p className="text-[11px] text-slate-400">
            Gain, Trigger Threshold & Sensor Quality
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          6 CHANNELS ACTIVE
        </div>
      </div>

      {/* Grid of 6 Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {channels.map((ch) => {
          const isFiring = ch.rmsUv > ch.thresholdUv;
          const vuPercent = Math.min(100, (ch.rmsUv / 250) * 100);

          return (
            <div
              key={ch.id}
              className={`bg-slate-950 border rounded-lg p-3 transition-all flex flex-col justify-between gap-2.5 ${
                ch.isMuted
                  ? 'opacity-50 border-slate-800/60'
                  : isFiring
                  ? 'border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Channel Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: ch.color }}
                  />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">
                      {ch.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {ch.muscle}
                    </p>
                  </div>
                </div>

                {/* Mute Button */}
                <button
                  id={`mute-ch-${ch.id}-btn`}
                  onClick={() => onUpdateChannel(ch.id, { isMuted: !ch.isMuted })}
                  title={ch.isMuted ? 'Unmute Channel' : 'Mute Channel'}
                  className={`p-1 rounded transition-colors ${
                    ch.isMuted
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {ch.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Live RMS & Peak Readout */}
              <div className="flex items-baseline justify-between font-mono bg-slate-900/60 px-2 py-1 rounded border border-slate-800/50">
                <span className="text-[10px] text-slate-400">RMS POTENTIAL:</span>
                <span className={`text-xs font-bold ${isFiring ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {ch.rmsUv.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">µV</span>
                </span>
              </div>

              {/* Horizontal LED VU Meter Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    vuPercent > 70
                      ? 'bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500'
                      : vuPercent > 35
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${vuPercent}%` }}
                />
              </div>

              {/* Controls: Gain & Trigger Threshold */}
              <div className="space-y-1.5 pt-1 text-[10px] font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>GAIN: {ch.gain.toFixed(1)}x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={ch.gain}
                    onChange={(e) => onUpdateChannel(ch.id, { gain: parseFloat(e.target.value) })}
                    className="w-20 accent-cyan-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>THRESH: {ch.thresholdUv} µV</span>
                  <input
                    type="range"
                    min="20"
                    max="180"
                    step="5"
                    value={ch.thresholdUv}
                    onChange={(e) => onUpdateChannel(ch.id, { thresholdUv: parseInt(e.target.value) })}
                    className="w-20 accent-cyan-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Impedance Footer */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
                <span>Z: {ch.impedanceKohm} kΩ</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> &lt;5kΩ Good
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
