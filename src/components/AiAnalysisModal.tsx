import React, { useState } from 'react';
import { AiClinicalReport, EMGChannel, NeuromuscularSymmetry, DecodedGesture } from '../types';
import { Sparkles, X, Activity, CheckCircle, ShieldAlert, FileText, Copy, Check, RefreshCw } from 'lucide-react';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: EMGChannel[];
  symmetry: NeuromuscularSymmetry;
  gestureHistory: DecodedGesture[];
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  channels,
  symmetry,
  gestureHistory,
}) => {
  const [report, setReport] = useState<AiClinicalReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateReport = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        sessionStats: channels.map((c) => ({
          channel: c.id,
          name: c.name,
          muscle: c.muscle,
          rmsUv: c.rmsUv,
          peakUv: c.peakUv,
          gain: c.gain,
          impedanceKohm: c.impedanceKohm,
        })),
        detectedGestures: gestureHistory.slice(0, 10),
        symmetryData: symmetry,
        recordingSummary: {
          timestamp: Date.now(),
          channelsAnalyzed: 6,
        },
      };

      const res = await fetch('/api/analyze-emg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        throw new Error(data.error || 'Unable to generate analysis');
      }
    } catch (err: any) {
      console.error('AI Report error:', err);
      setErrorMessage(err.message || 'Error communicating with AI analysis engine.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger initial report if not generated
  if (!report && !isLoading && !errorMessage) {
    generateReport();
  }

  const copyToClipboard = () => {
    if (!report) return;
    const text = `FACIAL sEMG CLINICAL TELEMETRY REPORT
-----------------------------------------
Clinical Summary: ${report.clinicalSummary}
Bruxism / TMJ Risk: ${report.bruxismRisk}
Masseter Symmetry Score: ${report.motorUnitSymmetry.masseterScore}/100
Zygomaticus Symmetry Score: ${report.motorUnitSymmetry.zygomaticScore}/100
Mandibular Resting Tone: ${report.motorUnitSymmetry.chinTone}
Silent Speech Assessment: ${report.silentSpeechPlausibility}

Recommendations:
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-['Chakra_Petch']">
                AI NEUROMUSCULAR BIOMECHANICAL REPORT
              </h3>
              <p className="text-[11px] text-slate-400">
                Powered by Gemini Clinical Reasoning
              </p>
            </div>
          </div>

          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-300">
                Synthesizing 6-channel sEMG motor unit potentials & symmetry ratios...
              </p>
              <span className="text-[11px] text-slate-400 font-mono">
                Analyzing Masseter, Mentalis, Zygomaticus & Risorius waveforms
              </span>
            </div>
          ) : errorMessage ? (
            <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-300 space-y-2">
              <p className="font-semibold">Diagnostic Synthesis Failed</p>
              <p className="text-[11px] text-rose-400">{errorMessage}</p>
              <button
                onClick={generateReport}
                className="mt-2 px-3 py-1.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-medium flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Analysis
              </button>
            </div>
          ) : report ? (
            <>
              {/* Executive Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Clinical Impression
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {report.clinicalSummary}
                </p>
              </div>

              {/* Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">MASSETER SYMMETRY</span>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {report.motorUnitSymmetry.masseterScore}/100
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">Bilateral mastication balance</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">ZYGOMATIC SYMMETRY</span>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                    {report.motorUnitSymmetry.zygomaticScore}/100
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">Smile recruitment symmetry</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">BRUXISM / TMJ RISK</span>
                  <div
                    className={`text-sm font-bold font-mono mt-1 ${
                      report.bruxismRisk.toLowerCase().includes('elevated')
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {report.bruxismRisk}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{report.motorUnitSymmetry.chinTone}</span>
                </div>
              </div>

              {/* Silent Speech Feasibility */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Silent Speech Interface (SSI) Decodability
                </span>
                <p className="text-xs text-slate-300">
                  {report.silentSpeechPlausibility}
                </p>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Clinical & Rehabilitation Guidance
                </span>
                <div className="space-y-1.5">
                  {report.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex items-start gap-2 text-xs text-slate-300"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={generateReport}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Analysis</span>
          </button>

          <div className="flex items-center gap-2">
            {report && (
              <button
                id="copy-report-btn"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Report'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
