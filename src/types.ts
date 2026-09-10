export interface EMGChannel {
  id: number;
  name: string;
  muscle: string;
  anatomicalLocation: string;
  electrodePlacement: string;
  color: string;
  rawUv: number;
  rmsUv: number;
  peakUv: number;
  thresholdUv: number;
  isActive: boolean;
  gain: number;
  impedanceKohm: number;
  isMuted: boolean;
}

export interface BioSignalSample {
  timestamp: number;
  channels: number[]; // 6 channel raw values in µV
  rms: number[];      // 6 channel RMS values in µV
  micLevel?: number;  // normalized audio amplitude 0-1
}

export interface DecodedGesture {
  id: string;
  name: string;
  timestamp: number;
  confidence: number;
  primaryChannels: number[];
  description: string;
}

export interface NeuromuscularSymmetry {
  masseterSymmetry: number; // Ratio L / R (1.0 = perfect)
  masseterBalancePct: number; // 0 - 100%
  zygomaticusSymmetry: number; // Ratio L / R (1.0 = perfect)
  zygomaticusBalancePct: number; // 0 - 100%
  peakMasseterUv: number;
  mentalisRestUv: number;
  restingToneStatus: 'relaxed' | 'mild_tension' | 'hypertonic';
}

export interface AiClinicalReport {
  clinicalSummary: string;
  bruxismRisk: string;
  motorUnitSymmetry: {
    masseterScore: number;
    zygomaticScore: number;
    chinTone: string;
  };
  detectedEventsCount: number;
  silentSpeechPlausibility: string;
  recommendations: string[];
}

export type DisplayMode = 'raw' | 'rectified' | 'envelope' | 'all';
export type TimebaseSpeed = 'slow' | 'medium' | 'fast'; // 25mm/s, 50mm/s, 100mm/s
export type InputSource = 'optical_camera' | 'simulation' | 'bluetooth_ble';
