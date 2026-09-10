import React, { useState } from 'react';
import { EMGChannel, NeuromuscularSymmetry } from '../types';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AnatomicalFaceMapProps {
  channels: EMGChannel[];
  symmetry: NeuromuscularSymmetry;
  onSelectChannel?: (channelId: number) => void;
}

export const AnatomicalFaceMap: React.FC<AnatomicalFaceMapProps> = ({
  channels,
  symmetry,
  onSelectChannel,
}) => {
  const [selectedElectrode, setSelectedElectrode] = useState<number | null>(null);

  // Helper to get normalized 0-1 activation glow for a channel
  const getGlowIntensity = (channelId: number) => {
    const ch = channels.find((c) => c.id === channelId);
    if (!ch) return 0.2;
    return Math.min(1.0, Math.max(0.15, ch.rmsUv / 180));
  };

  const getRms = (channelId: number) => {
    return channels.find((c) => c.id === channelId)?.rmsUv.toFixed(1) || '0.0';
  };

  const selectedCh = channels.find((c) => c.id === selectedElectrode);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 font-['Chakra_Petch'] tracking-wide">
            ANATOMICAL ELECTRODE MATRIX
          </h2>
          <p className="text-[11px] text-slate-400">
            Facial Musculature & Sensor Placement Map
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>REAL-TIME BIOPOTENTIAL</span>
        </div>
      </div>

      {/* SVG Face & Muscle Layout */}
      <div className="relative w-full aspect-[4/3.8] bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 400 440"
          className="w-full h-full max-w-[360px] select-none"
        >
          <defs>
            {/* Radial glows for active muscle bursts */}
            <radialGradient id="glowMasseterL" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity={getGlowIntensity(1) * 0.9} />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowMasseterR" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={getGlowIntensity(2) * 0.9} />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowMentalis" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity={getGlowIntensity(3) * 0.9} />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowZygomaticL" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34D399" stopOpacity={getGlowIntensity(4) * 0.9} />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowZygomaticR" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity={getGlowIntensity(5) * 0.9} />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowRisorius" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={getGlowIntensity(6) * 0.9} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Craniofacial Outline */}
          <path
            d="M 200 40 C 100 40 90 140 90 220 C 90 300 130 380 200 410 C 270 380 310 300 310 220 C 310 140 300 40 200 40 Z"
            fill="#09111D"
            stroke="#1E293B"
            strokeWidth="2"
          />

          {/* Eye landmarks (faint guides) */}
          <ellipse cx="150" cy="180" rx="20" ry="10" fill="none" stroke="#1E293B" strokeWidth="1.5" />
          <ellipse cx="250" cy="180" rx="20" ry="10" fill="none" stroke="#1E293B" strokeWidth="1.5" />

          {/* Nose bridge & base */}
          <path d="M 200 170 L 195 240 L 205 240" fill="none" stroke="#1E293B" strokeWidth="1.5" />

          {/* Mouth contour */}
          <path d="M 165 295 Q 200 305 235 295 Q 200 315 165 295" fill="#0D1929" stroke="#334155" strokeWidth="1.5" />

          {/* MUSCLE FIBER PATHWAYS & GLOW HEATMAPS */}

          {/* Channel 1: Left Masseter Muscle (Viewer Left) */}
          <ellipse cx="120" cy="305" rx="35" ry="45" fill="url(#glowMasseterL)" />
          <path
            d="M 110 270 Q 115 315 130 350"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeDasharray="4 3"
            opacity={0.4 + getGlowIntensity(1) * 0.6}
          />

          {/* Channel 2: Right Masseter Muscle (Viewer Right) */}
          <ellipse cx="280" cy="305" rx="35" ry="45" fill="url(#glowMasseterR)" />
          <path
            d="M 290 270 Q 285 315 270 350"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="3"
            strokeDasharray="4 3"
            opacity={0.4 + getGlowIntensity(2) * 0.6}
          />

          {/* Channel 4: Left Zygomaticus Major (Viewer Left) */}
          <ellipse cx="145" cy="245" rx="30" ry="30" fill="url(#glowZygomaticL)" />
          <path
            d="M 125 215 Q 145 250 170 290"
            fill="none"
            stroke="#34D399"
            strokeWidth="3.5"
            opacity={0.4 + getGlowIntensity(4) * 0.6}
          />

          {/* Channel 5: Right Zygomaticus Major (Viewer Right) */}
          <ellipse cx="255" cy="245" rx="30" ry="30" fill="url(#glowZygomaticR)" />
          <path
            d="M 275 215 Q 255 250 230 290"
            fill="none"
            stroke="#10B981"
            strokeWidth="3.5"
            opacity={0.4 + getGlowIntensity(5) * 0.6}
          />

          {/* Channel 6: Risorius & Depressors (Around mouth corners) */}
          <ellipse cx="200" cy="305" rx="45" ry="25" fill="url(#glowRisorius)" />
          <path
            d="M 155 295 L 170 295 M 230 295 L 245 295"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            opacity={0.4 + getGlowIntensity(6) * 0.6}
          />

          {/* Channel 3: Center Chin (Mentalis) */}
          <ellipse cx="200" cy="365" rx="30" ry="28" fill="url(#glowMentalis)" />
          <circle
            cx="200"
            cy="365"
            r="16"
            fill="none"
            stroke="#F43F5E"
            strokeWidth="2"
            strokeDasharray="3 3"
            opacity={0.4 + getGlowIntensity(3) * 0.6}
          />

          {/* ELECTRODE SITES (Clickable Target Nodes) */}

          {/* Electrode 1: Left Masseter */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setSelectedElectrode(1);
              onSelectChannel?.(1);
            }}
          >
            <circle cx="120" cy="315" r={selectedElectrode === 1 ? 14 : 10} fill="#38BDF8" className="transition-all" />
            <circle cx="120" cy="315" r={16} fill="none" stroke="#38BDF8" strokeWidth="2" opacity="0.6" />
            <text x="120" y="319" textAnchor="middle" fill="#04121F" fontSize="10" fontWeight="bold">
              1
            </text>
            <text x="80" y="320" fill="#38BDF8" fontSize="11" fontWeight="600" textAnchor="end">
              Ch 1
            </text>
          </g>

          {/* Electrode 2: Right Masseter */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setSelectedElectrode(2);
              onSelectChannel?.(2);
            }}
          >
            <circle cx="280" cy="315" r={selectedElectrode === 2 ? 14 : 10} fill="#60A5FA" className="transition-all" />
            <circle cx="280" cy="315" r={16} fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.6" />
            <text x="280" y="319" textAnchor="middle" fill="#04121F" fontSize="10" fontWeight="bold">
              2
            </text>
            <text x="320" y="320" fill="#60A5FA" fontSize="11" fontWeight="600" textAnchor="start">
              Ch 2
            </text>
          </g>

          {/* Electrode 3: Mentalis (Center Chin) */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setSelectedElectrode(3);
              onSelectChannel?.(3);
            }}
          >
            <circle cx="200" cy="365" r={selectedElectrode === 3 ? 14 : 10} fill="#F43F5E" className="transition-all" />
            <circle cx="200" cy="365" r={16} fill="none" stroke="#F43F5E" strokeWidth="2" opacity="0.6" />
            <text x="200" y="369" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
              3
            </text>
            <text x="200" y="398" fill="#F43F5E" fontSize="11" fontWeight="600" textAnchor="middle">
              Ch 3: Chin
            </text>
          </g>

          {/* Electrode 4: Left Zygomaticus */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setSelectedElectrode(4);
              onSelectChannel?.(4);
            }}
          >
            <circle cx="140" cy="245" r={selectedElectrode === 4 ? 14 : 10} fill="#34D399" className="transition-all" />
            <circle cx="140" cy="245" r={16} fill="none" stroke="#34D399" strokeWidth="2" opacity="0.6" />
            <text x="140" y="249" textAnchor="middle" fill="#04121F" fontSize="10" fontWeight="bold">
              4
            </text>
            <text x="95" y="240" fill="#34D399" fontSize="11" fontWeight="600" textAnchor="end">
              Ch 4: Cheek
            </text>
          </g>

          {/* Electrode 5: Right Zygomaticus */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setSelectedElectrode(5);
              onSelectChannel?.(5);
            }}
          >
            <circle cx="260" cy="245" r={selectedElectrode === 5 ? 14 : 10} fill="#10B981" className="transition-all" />
            <circle cx="260" cy="245" r={16} fill="none" stroke="#10B981" strokeWidth="2" opacity="0.6" />
            <text x="260" y="249" textAnchor="middle" fill="#04121F" fontSize="10" fontWeight="bold">
              5
            </text>
            <text x="305" y="240" fill="#10B981" fontSize="11" fontWeight="600" textAnchor="start">
              Ch 5: Cheek
            </text>
          </g>

          {/* Electrode 6: Corner of Mouth */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setSelectedElectrode(6);
              onSelectChannel?.(6);
            }}
          >
            <circle cx="165" cy="300" r={selectedElectrode === 6 ? 13 : 9} fill="#F59E0B" className="transition-all" />
            <circle cx="235" cy="300" r={selectedElectrode === 6 ? 13 : 9} fill="#F59E0B" className="transition-all" />
            <text x="200" y="325" fill="#F59E0B" fontSize="10" fontWeight="600" textAnchor="middle">
              Ch 6: Mouth Corner
            </text>
          </g>
        </svg>

        {/* Live Overlay Badges on Top of Face */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
            <span className="text-cyan-400">CH 1:</span> {getRms(1)} µV
          </div>
          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
            <span className="text-emerald-400">CH 4:</span> {getRms(4)} µV
          </div>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none text-right">
          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
            <span className="text-blue-400">CH 2:</span> {getRms(2)} µV
          </div>
          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
            <span className="text-teal-400">CH 5:</span> {getRms(5)} µV
          </div>
        </div>
      </div>

      {/* Selected Electrode Details Card */}
      {selectedCh ? (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedCh.color }}
              />
              <span className="font-semibold text-slate-200">
                {selectedCh.name}: {selectedCh.muscle}
              </span>
            </div>
            <span className="font-mono text-cyan-300 font-bold">
              {selectedCh.rmsUv.toFixed(1)} µV RMS
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            <strong className="text-slate-300">Placement:</strong> {selectedCh.electrodePlacement}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-0.5">
            <span>Impedance: {selectedCh.impedanceKohm} kΩ</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Skin Contact Good
            </span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 py-2 bg-slate-950/40 rounded-lg border border-slate-800/60">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any electrode node on the face to inspect anatomy & impedance</span>
        </div>
      )}
    </div>
  );
};
