import React from 'react';
import { PRESET_GESTURES } from '../data/channels';
import { Play, RotateCcw, Zap } from 'lucide-react';

interface ExerciseTriggerBarProps {
  onTriggerPreset: (preset: (typeof PRESET_GESTURES)[0]) => void;
  onResetBaseline: () => void;
  activePresetName: string | null;
}

export const ExerciseTriggerBar: React.FC<ExerciseTriggerBarProps> = ({
  onTriggerPreset,
  onResetBaseline,
  activePresetName,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 font-['Chakra_Petch'] tracking-wide">
            NEUROMUSCULAR SIMULATION TRIGGERS
          </h2>
          <p className="text-[11px] text-slate-400">
            One-Click Physiological Bursts & Silent Speech Patterns
          </p>
        </div>

        <button
          id="reset-baseline-btn"
          onClick={onResetBaseline}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Resting Baseline</span>
        </button>
      </div>

      {/* Grid of Preset Gesture Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESET_GESTURES.map((preset) => {
          const isActive = activePresetName === preset.name;

          return (
            <button
              key={preset.name}
              id={`preset-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-btn`}
              onClick={() => onTriggerPreset(preset)}
              className={`p-2.5 rounded-lg border text-left flex flex-col justify-between gap-1 transition-all ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[0.98]'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono text-cyan-400 font-medium">
                  {preset.category}
                </span>
                <Play className={`w-3 h-3 ${isActive ? 'text-cyan-300 fill-cyan-300' : 'text-slate-400'}`} />
              </div>
              <span className="text-xs font-semibold text-slate-100 block">
                {preset.name}
              </span>
              <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight">
                {preset.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
