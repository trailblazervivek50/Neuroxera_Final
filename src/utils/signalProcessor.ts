import { DecodedGesture, NeuromuscularSymmetry } from '../types';

export class EMGSignalGenerator {
  private phase = [0, 0, 0, 0, 0, 0];
  private currentUvTargets = [8, 8, 9, 6, 6, 8];
  private currentEnvelope = [8, 8, 9, 6, 6, 8];

  // Set external target microvolts (from camera or manual trigger)
  setChannelTarget(channelIndex: number, targetUv: number) {
    if (channelIndex >= 0 && channelIndex < 6) {
      this.currentUvTargets[channelIndex] = Math.max(5, targetUv);
    }
  }

  // Smoothly step towards target and generate realistic physiological biphasic burst sample
  generateNextSample(dtSec: number, notchFilter: boolean = true, highPassFilter: boolean = true) {
    const rawValues: number[] = [];
    const rmsValues: number[] = [];

    for (let i = 0; i < 6; i++) {
      const target = this.currentUvTargets[i];
      // Envelope smoothing (rise and decay response of motor units)
      const smoothingFactor = target > this.currentEnvelope[i] ? 0.25 : 0.08;
      this.currentEnvelope[i] += (target - this.currentEnvelope[i]) * smoothingFactor;

      const envelope = this.currentEnvelope[i];

      // Physiological EMG consists of firing motor unit action potentials (MUAPs)
      // Dominant frequency band: 50Hz - 150Hz with harmonics up to 350Hz
      this.phase[i] += dtSec * (85 + (i * 12) + (Math.random() - 0.5) * 20);

      const f1 = Math.sin(this.phase[i] * 2 * Math.PI);
      const f2 = Math.sin(this.phase[i] * 4.2 * Math.PI) * 0.45;
      const f3 = Math.sin(this.phase[i] * 6.8 * Math.PI) * 0.25;
      const f4 = Math.sin(this.phase[i] * 9.1 * Math.PI) * 0.15;

      // Realistic stochastic recruitment noise (Gaussian-like)
      const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 4;

      // Powerline hum if notch filter disabled (50Hz / 60Hz ambient interference)
      const hum = notchFilter ? 0 : Math.sin(this.phase[i] * 60 * 2 * Math.PI) * 18;

      // Motion artifact low freq drift if high-pass disabled
      const drift = highPassFilter ? 0 : Math.sin(this.phase[i] * 1.5 * 2 * Math.PI) * 22;

      // Modulation by envelope: active contraction expands amplitude & variance
      const muapBurst = (f1 + f2 + f3 + f4) * (envelope * 0.85) + noise * (1 + envelope * 0.06);

      const raw = muapBurst + hum + drift;

      rawValues.push(raw);
      rmsValues.push(envelope);
    }

    return { rawValues, rmsValues };
  }
}

// Optical Face Motion Tracker (Camera-based sEMG estimator)
export class OpticalFaceEMGTracker {
  private prevFrameData: Uint8ClampedArray | null = null;
  private width: number = 0;
  private height: number = 0;

  // 6 Anatomical facial ROIs defined in normalized coordinates [x, y, width, height]
  // Face centered in mirrored camera view
  public static readonly ROIS = [
    { id: 1, name: 'Left Masseter', x: 0.20, y: 0.58, w: 0.18, h: 0.24, label: 'Ch 1: Left Jaw' },
    { id: 2, name: 'Right Masseter', x: 0.62, y: 0.58, w: 0.18, h: 0.24, label: 'Ch 2: Right Jaw' },
    { id: 3, name: 'Mentalis', x: 0.42, y: 0.76, w: 0.16, h: 0.16, label: 'Ch 3: Chin' },
    { id: 4, name: 'Left Zygomaticus', x: 0.24, y: 0.42, w: 0.18, h: 0.18, label: 'Ch 4: Left Cheek' },
    { id: 5, name: 'Right Zygomaticus', x: 0.58, y: 0.42, w: 0.18, h: 0.18, label: 'Ch 5: Right Cheek' },
    { id: 6, name: 'Depressor/Risorius', x: 0.35, y: 0.64, w: 0.30, h: 0.14, label: 'Ch 6: Mouth Corners' },
  ];

  processVideoFrame(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): number[] {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return [8, 8, 9, 6, 6, 8];
    }

    if (this.width !== canvas.width || this.height !== canvas.height) {
      this.width = canvas.width;
      this.height = canvas.height;
      this.prevFrameData = null;
    }

    // Draw current video frame (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -this.width, 0, this.width, this.height);
    ctx.restore();

    const frame = ctx.getImageData(0, 0, this.width, this.height);
    const data = frame.data;

    const estimatedUv = [8, 8, 9, 6, 6, 8];

    if (this.prevFrameData && this.prevFrameData.length === data.length) {
      // Calculate motion energy for each ROI
      for (let r = 0; r < OpticalFaceEMGTracker.ROIS.length; r++) {
        const roi = OpticalFaceEMGTracker.ROIS[r];
        const startX = Math.floor(roi.x * this.width);
        const startY = Math.floor(roi.y * this.height);
        const w = Math.floor(roi.w * this.width);
        const h = Math.floor(roi.h * this.height);

        let motionSum = 0;
        let pixelCount = 0;
        const step = 4; // Sample every 4th pixel for high 60fps performance

        for (let y = startY; y < startY + h; y += step) {
          for (let x = startX; x < startX + w; x += step) {
            const idx = (y * this.width + x) * 4;
            // Grayscale diff
            const currLuma = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
            const prevLuma = (this.prevFrameData[idx] * 0.299 + this.prevFrameData[idx + 1] * 0.587 + this.prevFrameData[idx + 2] * 0.114);
            const diff = Math.abs(currLuma - prevLuma);
            if (diff > 8) {
              motionSum += diff;
            }
            pixelCount++;
          }
        }

        const avgMotion = pixelCount > 0 ? motionSum / pixelCount : 0;
        // Non-linear mapping from optical movement to microvolts (8µV baseline to 320µV peak)
        const uvResponse = 8 + Math.min(320, Math.pow(avgMotion, 1.4) * 8.5);
        estimatedUv[r] = uvResponse;
      }
    }

    // Save previous frame
    if (!this.prevFrameData) {
      this.prevFrameData = new Uint8ClampedArray(data.length);
    }
    this.prevFrameData.set(data);

    return estimatedUv;
  }
}

// Neuromuscular Symmetry & Biomechanical Health Analyzer
export function computeNeuromuscularSymmetry(rmsValues: number[]): NeuromuscularSymmetry {
  const ch1 = rmsValues[0] || 8; // Left Masseter
  const ch2 = rmsValues[1] || 8; // Right Masseter
  const ch3 = rmsValues[2] || 9; // Mentalis
  const ch4 = rmsValues[3] || 6; // Left Zygomaticus
  const ch5 = rmsValues[4] || 6; // Right Zygomaticus

  // Masseter symmetry
  const masseterSum = ch1 + ch2;
  const masseterRatio = ch2 > 0 ? ch1 / ch2 : 1.0;
  const masseterBalance = masseterSum > 0 ? Math.round((Math.min(ch1, ch2) / Math.max(ch1, ch2)) * 100) : 100;

  // Zygomaticus symmetry
  const zygomaticSum = ch4 + ch5;
  const zygomaticRatio = ch5 > 0 ? ch4 / ch5 : 1.0;
  const zygomaticBalance = zygomaticSum > 0 ? Math.round((Math.min(ch4, ch5) / Math.max(ch4, ch5)) * 100) : 100;

  let restingToneStatus: 'relaxed' | 'mild_tension' | 'hypertonic' = 'relaxed';
  if (ch1 > 50 || ch2 > 50) {
    restingToneStatus = 'hypertonic';
  } else if (ch1 > 25 || ch2 > 25 || ch3 > 30) {
    restingToneStatus = 'mild_tension';
  }

  return {
    masseterSymmetry: Number(masseterRatio.toFixed(2)),
    masseterBalancePct: masseterBalance,
    zygomaticusSymmetry: Number(zygomaticRatio.toFixed(2)),
    zygomaticusBalancePct: zygomaticBalance,
    peakMasseterUv: Math.max(ch1, ch2),
    mentalisRestUv: ch3,
    restingToneStatus,
  };
}

// Real-Time Gesture & Neuromuscular Pattern Classifier
export function decodeNeuromuscularGestures(
  rms: number[],
  lastGestureTimestamp: number
): DecodedGesture | null {
  const now = Date.now();
  if (now - lastGestureTimestamp < 900) {
    return null; // Debounce gesture triggers
  }

  const [ch1, ch2, ch3, ch4, ch5, ch6] = rms;

  // 1. Bilateral Jaw Clench
  if (ch1 > 110 && ch2 > 105 && Math.abs(ch1 - ch2) < 90) {
    return {
      id: 'jaw_clench',
      name: 'Bilateral Jaw Clench',
      timestamp: now,
      confidence: 0.94,
      primaryChannels: [1, 2],
      description: 'Synchronous high-amplitude bilateral masseter contraction.',
    };
  }

  // 2. Symmetrical Smile
  if (ch4 > 85 && ch5 > 80 && Math.abs(ch4 - ch5) < 65) {
    return {
      id: 'smile_symm',
      name: 'Symmetrical Smile',
      timestamp: now,
      confidence: 0.92,
      primaryChannels: [4, 5, 6],
      description: 'Bilateral zygomaticus major activation with risorius pull.',
    };
  }

  // 3. Left Asymmetric Smirk
  if (ch4 > 95 && ch5 < 45) {
    return {
      id: 'smirk_left',
      name: 'Asymmetric Left Smirk',
      timestamp: now,
      confidence: 0.88,
      primaryChannels: [4, 6],
      description: 'Dominant left zygomaticus activation with low right recruitment.',
    };
  }

  // 4. Right Asymmetric Smirk
  if (ch5 > 95 && ch4 < 45) {
    return {
      id: 'smirk_right',
      name: 'Asymmetric Right Smirk',
      timestamp: now,
      confidence: 0.88,
      primaryChannels: [5, 6],
      description: 'Dominant right zygomaticus activation with low left recruitment.',
    };
  }

  // 5. Chin Pout / Mentalis Dimpling
  if (ch3 > 115 && ch1 < 60 && ch2 < 60) {
    return {
      id: 'chin_pout',
      name: 'Chin Pout / Mentalis Contraction',
      timestamp: now,
      confidence: 0.91,
      primaryChannels: [3],
      description: 'Isolated mentalis dome elevation and dimpling without jaw clenching.',
    };
  }

  // 6. Corner Mouth Retraction / Grimace
  if (ch6 > 110 && (ch4 > 60 || ch3 > 60)) {
    return {
      id: 'mouth_retraction',
      name: 'Mouth Retraction / Grimace',
      timestamp: now,
      confidence: 0.86,
      primaryChannels: [6, 4],
      description: 'Depressor anguli oris and risorius muscle bundle retraction.',
    };
  }

  // 7. Silent Speech Candidate (Mentalis + Jaw minor coordinated spike)
  if (ch3 > 70 && ch1 > 50 && ch1 < 100 && ch4 < 50 && ch5 < 50) {
    return {
      id: 'silent_speech',
      name: 'Subvocal Articulation ("YES / NO")',
      timestamp: now,
      confidence: 0.82,
      primaryChannels: [3, 1],
      description: 'Coordinated low-force mandibular and mentalis subvocalization.',
    };
  }

  return null;
}
