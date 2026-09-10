import React from 'react';
import { DecodedGesture, NeuromuscularSymmetry } from '../types';
import { Activity, Brain, Clock, ShieldAlert, CheckCircle } from 'lucide-react';

interface GestureDecoderCardProps {
  currentGesture: DecodedGesture | null;
  gestureHistory: DecodedGesture[];
  symmetry: NeuromuscularSymmetry;
}

export const GestureDecoderCard: React.FC<GestureDecoderCardProps> = ({
  currentGesture,
  gestureHistory,
  symmetry,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 font-['Chakra_Petch'] tracking-wide">
            NEUROMUSCULAR CLASSIFIER & SYMMETRY
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-Time Motor Unit Gesture Decoding
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
          <Brain className="w-3.5 h-3.5" />
          <span>DECODER ENGINE</span>
        </div>
      </div>

      {/* Active Detected Gesture Banner */}
      <div
        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
          currentGesture
            ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
            : 'bg-slate-950/60 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              currentGesture
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
              Active State
            </span>
            <h3 className="text-xs font-bold text-slate-100">
              {currentGesture ? currentGesture.name : 'Resting Baseline Tone'}
            </h3>
            {currentGesture && (
              <p className="text-[10px] text-cyan-400 mt-0.5">
                {currentGesture.description}
              </p>
            )}
          </div>
        </div>

        {currentGesture && (
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">CONFIDENCE</span>
            <span className="text-xs font-bold text-cyan-300">
              {Math.round(currentGesture.confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Bilateral Symmetry Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Masseter (Jaw) Symmetry */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Masseter Jaw Balance</span>
            <span className="font-mono text-cyan-400 font-bold text-[11px]">
              {symmetry.masseterBalancePct}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-cyan-400 h-full transition-all"
              style={{ width: `${symmetry.masseterBalancePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>Ratio L/R: {symmetry.masseterSymmetry}</span>
            <span className={Math.abs(1 - symmetry.masseterSymmetry) < 0.15 ? 'text-emerald-400' : 'text-amber-400'}>
              {Math.abs(1 - symmetry.masseterSymmetry) < 0.15 ? 'Symmetrical' : 'Asymmetric'}
            </span>
          </div>
        </div>

        {/* Zygomaticus (Cheek) Symmetry */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Zygomatic Smile Balance</span>
            <span className="font-mono text-emerald-400 font-bold text-[11px]">
              {symmetry.zygomaticusBalancePct}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-400 h-full transition-all"
              style={{ width: `${symmetry.zygomaticusBalancePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>Ratio L/R: {symmetry.zygomaticusSymmetry}</span>
            <span className={Math.abs(1 - symmetry.zygomaticusSymmetry) < 0.15 ? 'text-emerald-400' : 'text-amber-400'}>
              {Math.abs(1 - symmetry.zygomaticusSymmetry) < 0.15 ? 'Symmetrical' : 'Asymmetric'}
            </span>
          </div>
        </div>
      </div>

      {/* Resting Tone / Bruxism Monitor */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {symmetry.restingToneStatus === 'hypertonic' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">MANDIBULAR RESTING TONE</span>
            <span
              className={`font-semibold capitalize ${
                symmetry.restingToneStatus === 'hypertonic'
                  ? 'text-rose-400 font-bold'
                  : symmetry.restingToneStatus === 'mild_tension'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {symmetry.restingToneStatus === 'hypertonic'
                ? 'Hypertonic (Bruxism Risk)'
                : symmetry.restingToneStatus === 'mild_tension'
                ? 'Mild Involuntary Tension'
                : 'Relaxed (< 15 µV Baseline)'}
            </span>
          </div>
        </div>

        <div className="text-right font-mono text-[10px] text-slate-400">
          <span>Peak Masseter: {symmetry.peakMasseterUv.toFixed(0)} µV</span>
        </div>
      </div>

      {/* Decoded Gesture History Feed */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> EVENT STREAM
          </span>
          <span>{gestureHistory.length} EVENTS RECORDED</span>
        </div>

        <div className="bg-slate-950 rounded-lg border border-slate-800/80 p-2 max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
          {gestureHistory.length === 0 ? (
            <div className="text-[11px] text-slate-400 text-center py-4">
              Perform a facial movement or use gesture triggers below to record neuromuscular events.
            </div>
          ) : (
            gestureHistory.slice(0, 8).map((gesture, idx) => (
              <div
                key={`${gesture.id}-${gesture.timestamp}-${idx}`}
                className="flex items-center justify-between text-[10px] font-mono bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{gesture.name}</span>
                  <span className="text-slate-400">
                    [Ch: {gesture.primaryChannels.join(', ')}]
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>{new Date(gesture.timestamp).toLocaleTimeString()}</span>
                  <span className="text-emerald-400">{Math.round(gesture.confidence * 100)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
