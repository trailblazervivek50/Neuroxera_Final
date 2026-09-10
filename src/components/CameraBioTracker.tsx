import React, { useRef, useEffect, useState } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { OpticalFaceEMGTracker } from '../utils/signalProcessor';

interface CameraBioTrackerProps {
  onUvEstimated: (estimatedUv: number[]) => void;
  onMicLevelChange?: (level: number) => void;
  hasCameraPermission: boolean;
  onRequestCamera: () => void;
}

export const CameraBioTracker: React.FC<CameraBioTrackerProps> = ({
  onUvEstimated,
  onMicLevelChange,
  hasCameraPermission,
  onRequestCamera,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [activeRois, setActiveRois] = useState<number[]>([8, 8, 9, 6, 6, 8]);

  const trackerRef = useRef<OpticalFaceEMGTracker>(new OpticalFaceEMGTracker());

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      onRequestCamera();
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setPermissionError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Click "Allow" in your browser address bar to enable optical tracking.'
          : 'Unable to access camera. Please verify device connection.'
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start Microphone Stream for acoustic / subvocal tracking
  const toggleMicrophone = async () => {
    if (isMicActive) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsMicActive(false);
      setMicLevel(0);
      onMicLevelChange?.(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setIsMicActive(true);
    } catch (err: any) {
      console.warn('Microphone access denied:', err);
    }
  };

  // Process video frames at 30-60 FPS for optical sEMG
  useEffect(() => {
    let animId: number;

    const processFrame = () => {
      if (isCameraActive && videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const estimated = trackerRef.current.processVideoFrame(canvasRef.current, videoRef.current);
        setActiveRois(estimated);
        onUvEstimated(estimated);
      }

      // Check mic level if active
      if (isMicActive && analyserRef.current) {
        const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.min(1.0, Math.sqrt(sum / buffer.length) * 3);
        setMicLevel(rms);
        onMicLevelChange?.(rms);
      }

      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [isCameraActive, isMicActive, onUvEstimated, onMicLevelChange]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 font-['Chakra_Petch'] tracking-wide">
            OPTICAL BIO-TRACKER & SENSING
          </h2>
          <p className="text-[11px] text-slate-400">
            Facial Computer Vision & Acoustic Biofeedback
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mic Toggle Button */}
          <button
            id="mic-toggle-btn"
            onClick={toggleMicrophone}
            title={isMicActive ? 'Mute Microphone' : 'Enable Acoustic Subvocalization Mic'}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 font-mono ${
              isMicActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{isMicActive ? `${Math.round(micLevel * 100)}%` : 'MIC'}</span>
          </button>

          {/* Camera Access Toggle Button */}
          <button
            id="camera-permission-btn"
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCameraActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isCameraActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? 'Stop Camera' : 'Access Camera'}</span>
          </button>
        </div>
      </div>

      {/* Video Viewport / ROI Overlay Container */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Hidden video element used as frame source */}
        <video ref={videoRef} playsInline muted className="hidden" />

        {/* Mirrored Canvas where video & ROI bounding boxes are drawn */}
        {isCameraActive ? (
          <>
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover" />

            {/* Anatomical ROI Bounding Boxes Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {OpticalFaceEMGTracker.ROIS.map((roi, idx) => {
                const uvVal = activeRois[idx] || 8;
                const isFiring = uvVal > 50;

                return (
                  <div
                    key={roi.id}
                    className={`absolute rounded transition-all flex flex-col justify-between p-1 text-[9px] font-mono border ${
                      isFiring
                        ? 'border-cyan-400 bg-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        : 'border-slate-600/60 bg-slate-950/20'
                    }`}
                    style={{
                      left: `${roi.x * 100}%`,
                      top: `${roi.y * 100}%`,
                      width: `${roi.w * 100}%`,
                      height: `${roi.h * 100}%`,
                    }}
                  >
                    <span className="text-cyan-300 font-bold drop-shadow">
                      {roi.label}
                    </span>
                    <span className={`text-[8px] font-mono ${isFiring ? 'text-white font-bold' : 'text-slate-300'}`}>
                      {uvVal.toFixed(0)} µV
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Camera Active Badge */}
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-cyan-800/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>OPTICAL EMG ACTIVE</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">
                Grant Camera Permission for Optical sEMG
              </h3>
              <p className="text-[11px] text-slate-400 max-w-[280px] mt-1">
                Real-time optical flow tracks facial movement across all 6 channels: smile for cheeks, clench for jaw, and move chin!
              </p>
            </div>
            <button
              id="grant-camera-btn"
              onClick={startCamera}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
              <span>Allow Camera Access</span>
            </button>
          </div>
        )}
      </div>

      {/* Permission error warning if denied */}
      {permissionError && (
        <div className="bg-rose-950/60 border border-rose-800/80 rounded-lg p-2.5 text-xs text-rose-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="text-[11px]">{permissionError}</span>
        </div>
      )}

      {/* Interactive Facial Guidance Tips */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Movement Correlation Guide:</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono">
          <div>• <strong className="text-cyan-300">Clench Jaw:</strong> Fires Ch 1 & 2</div>
          <div>• <strong className="text-emerald-300">Smile:</strong> Fires Ch 4 & 5</div>
          <div>• <strong className="text-rose-300">Pout Chin:</strong> Fires Ch 3</div>
          <div>• <strong className="text-amber-300">Retract Lips:</strong> Fires Ch 6</div>
        </div>
      </div>
    </div>
  );
};
