# Neurovox — Facial sEMG Neuromuscular Monitor

A real-time 6-channel surface electromyography (sEMG) biosignal oscilloscope, facial musculature tracking system, and neuromuscular gesture decoder.

![Neurovox Banner](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80)

## Overview

**Neurovox** simulates and visualizes real-time surface electromyographic biopotentials across 6 key craniofacial motor unit channels. It provides real-time signal processing, continuous optical and acoustic tracking, bilateral symmetry analytics (masseters and zygomaticus), mandibular resting tone diagnostics (bruxism risk detection), and neuromuscular gesture classification for silent speech articulation.

## Key Features

- **6-Channel Craniofacial sEMG Telemetry**:
  - **Ch 1: Left Masseter** (Jaw mastication & clenching)
  - **Ch 2: Right Masseter** (Bilateral balance)
  - **Ch 3: Center Chin / Mentalis** (Lower lip elevation, subvocal phonation)
  - **Ch 4: Left Zygomaticus Major** (Smile / oral commissure elevation)
  - **Ch 5: Right Zygomaticus Major** (Smile symmetry)
  - **Ch 6: Corner of Mouth / Risorius** (Lateral mouth retraction, silent speech phonemes)
- **High-Refresh Canvas Oscilloscope**:
  - 60 FPS real-time waveform rendering
  - 4 View Modes: **Raw Bipolar**, **Rectified**, **RMS Linear Envelope**, and **Overlay Grid**
  - Sweep speed adjustment (25, 50, 100 mm/s) and vertical amplitude scale (±100 µV to ±1000 µV)
  - 50/60 Hz notch filtering and low-frequency baseline drift suppression
- **Optical & Acoustic Bio-Tracker**:
  - In-browser computer vision with region-of-interest (ROI) motion tracking
  - Webcam movement correlation (smile, clench, chin pout) drives real-time microvolt estimations
  - Microphone bio-monitoring to distinguish voiced vs. silent speech
- **Anatomical Musculature & Electrode Matrix**:
  - Interactive cranial schematic with real-time heatmaps
  - Impedance contact monitoring (< 5 kΩ) and anatomical placement guidelines
- **Neuromuscular Decoding Engine**:
  - Classifies smiles, jaw clenches, smirks, chewing rhythms, and silent speech confirmations
  - Real-time bilateral symmetry indices & hypertonic resting tone warnings
- **Diagnostic Export & AI Analysis**:
  - One-click physiological exercise simulation triggers
  - CSV telemetry recording and export
  - AI Neuromuscular Biomechanical Clinical Synthesis via Google Gemini

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, HTML5 Canvas
- **Backend / API**: Node.js, Express, tsx / esbuild
- **AI Engine**: `@google/genai` (Gemini API)
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/trailblazervivek50/Neurovox-app.git
cd Neurovox-app

# Install dependencies
npm install

# Setup environment variables (optional for AI report)
cp .env.example .env
# Add your GEMINI_API_KEY if desired:
# GEMINI_API_KEY=your_gemini_api_key

# Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
npm start
```

## License

MIT License
