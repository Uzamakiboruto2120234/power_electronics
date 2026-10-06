/**
 * PowerLab - High-Performance Multi-Channel Digital Oscilloscope & FFT Spectrum
 * HTML5 Canvas rendering for 60 FPS waveform visualization with calibrated graticules,
 * crosshair cursor telemetry, channel selectors, real-time FFT spectrum,
 * and Active Pair Conduction Timeline Bar matching RectifierLab.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  SimulationStep,
  HarmonicComponent,
  PowerMetrics,
} from '../types/powerTypes';
import { BarChart2, Compass } from 'lucide-react';

interface OscilloscopeViewProps {
  steps: SimulationStep[];
  currentStepIndex: number;
  harmonics: HarmonicComponent[];
  metrics: PowerMetrics;
  onScrubPhase: (phaseDeg: number) => void;
}

export const OscilloscopeView: React.FC<OscilloscopeViewProps> = ({
  steps,
  currentStepIndex,
  harmonics,
  metrics,
  onScrubPhase,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Channel visibility toggles
  const [showCh1, setShowCh1] = useState(true); // vs and vo
  const [showCh2, setShowCh2] = useState(true); // is and io
  const [showCh3, setShowCh3] = useState(true); // vT1, ig1
  const [showFft, setShowFft] = useState(true); // FFT spectrum

  // Scale multipliers
  const [vScale, setVScale] = useState(1.0);
  const [iScale, setIScale] = useState(1.0);

  // Crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const activeStep = hoverIndex !== null && steps[hoverIndex] ? steps[hoverIndex] : steps[currentStepIndex];

  // Map pair name to distinct background color
  const getPairColor = (name: string): string => {
    if (name === 'DFW') return '#b45309'; // Warm amber/orange for freewheeling
    if (name.includes('T1') || name.includes('D1')) return '#0f766e'; // Teal
    if (name.includes('T2') || name.includes('T3')) return '#0369a1'; // Blue
    if (name.includes('T4') || name.includes('T5')) return '#4338ca'; // Indigo
    if (name.includes('T6')) return '#7e22ce'; // Purple
    if (name === 'OFF') return '#1e293b'; // Dark slate
    return '#047857'; // Emerald
  };

  // Derive continuous conduction segments for the ACTIVE PAIR bar
  const activePairIntervals = useMemo(() => {
    if (!steps || steps.length === 0) return [];
    const intervals: { name: string; startDeg: number; endDeg: number; color: string }[] = [];
    let currentName = steps[0].activePairName || 'OFF';
    let startDeg = 0;

    for (let i = 1; i < steps.length; i++) {
      const stepName = steps[i].activePairName || 'OFF';
      if (stepName !== currentName) {
        intervals.push({
          name: currentName,
          startDeg,
          endDeg: steps[i].wtDeg,
          color: getPairColor(currentName),
        });
        currentName = stepName;
        startDeg = steps[i].wtDeg;
      }
    }
    intervals.push({
      name: currentName,
      startDeg,
      endDeg: 360,
      color: getPairColor(currentName),
    });
    return intervals;
  }, [steps]);

  // Draw oscilloscope waveforms
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Calculate layout: split into Waveform viewport (top/left) and FFT (bottom or right if enabled)
    const fftHeight = showFft ? Math.min(130, height * 0.28) : 0;
    const scopeHeight = height - fftHeight;

    // Draw Graticule (Division Grids)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const numCols = 12; // 30 deg per division
    for (let c = 0; c <= numCols; c++) {
      const x = (c * width) / numCols;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, scopeHeight);
      ctx.stroke();
    }

    const numRows = 8;
    for (let r = 0; r <= numRows; r++) {
      const y = (r * scopeHeight) / numRows;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Zero-Volt / Zero-Current center lines
    ctx.setLineDash([]);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;

    // Voltage ground line
    const yVoltGnd = scopeHeight * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, yVoltGnd);
    ctx.lineTo(width, yVoltGnd);
    ctx.stroke();

    // Auto-scale peak references
    const maxV = Math.max(10, ...steps.map((s) => Math.max(Math.abs(s.vs), Math.abs(s.vo), Math.abs(s.vt1)))) * 1.1;
    const maxI = Math.max(1, ...steps.map((s) => Math.max(Math.abs(s.io), Math.abs(s.is)))) * 1.2;

    const mapX = (i: number) => (i / (steps.length - 1)) * width;
    const mapYVolt = (v: number) => yVoltGnd - (v / maxV) * (scopeHeight * 0.4) * vScale;
    const mapYCurr = (i: number) => yVoltGnd - (i / maxI) * (scopeHeight * 0.4) * iScale;

    // -------------------------------------------------------------
    // CHANNEL 1: Source Voltage vs(wt) [Cyan] and Output Vo(wt) [Amber/Yellow]
    // -------------------------------------------------------------
    if (showCh1) {
      // vs(wt)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < steps.length; i++) {
        const x = mapX(i);
        const y = mapYVolt(steps[i].vs);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // vo(wt)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < steps.length; i++) {
        const x = mapX(i);
        const y = mapYVolt(steps[i].vo);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // CHANNEL 2: Load Current io(wt) [Emerald] and Source Current is(wt) [Sky Blue]
    // -------------------------------------------------------------
    if (showCh2) {
      // is(wt)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      for (let i = 0; i < steps.length; i++) {
        const x = mapX(i);
        const y = mapYCurr(steps[i].is);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // io(wt)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < steps.length; i++) {
        const x = mapX(i);
        const y = mapYCurr(steps[i].io);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // CHANNEL 3: Switch Voltage vT1 [Rose] & Gate Pulses ig1 [Purple]
    // -------------------------------------------------------------
    if (showCh3) {
      // vT1(wt)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < steps.length; i++) {
        const x = mapX(i);
        const y = mapYVolt(steps[i].vt1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ig1(wt) gate pulse on bottom
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const yGateBase = scopeHeight - 8;
      for (let i = 0; i < steps.length; i++) {
        const x = mapX(i);
        const y = steps[i].ig1 > 0 ? yGateBase - 20 : yGateBase;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Overlap Interval Indicator shaded zones
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].isOverlapping) {
        const x = mapX(i);
        ctx.fillRect(x, 0, width / steps.length + 1, scopeHeight);
      }
    }

    // Current Time/Phase Cursor (Yellow glowing line)
    const currentX = mapX(currentStepIndex);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, scopeHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hover Crosshair
    if (hoverIndex !== null && mousePos) {
      const hx = mapX(hoverIndex);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, scopeHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(width, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // -------------------------------------------------------------
    // CHANNEL 4: Real-Time FFT Harmonic Bar Graph (Bottom Pane)
    // -------------------------------------------------------------
    if (showFft && harmonics.length > 0) {
      const fftTop = scopeHeight + 20;
      const fftAvailableH = fftHeight - 35;

      // Divider line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scopeHeight);
      ctx.lineTo(width, scopeHeight);
      ctx.stroke();

      // FFT Header
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`DFT HARMONIC SPECTRUM (Source Current Is) | Fundamental 50Hz | THD = ${metrics.thdCurrent.toFixed(1)}%`, 14, scopeHeight + 14);

      const maxMag = Math.max(1e-4, ...harmonics.map((h) => h.magnitude));
      const barCount = Math.min(25, harmonics.length);
      const barWidth = Math.max(6, (width - 40) / barCount - 6);

      for (let k = 0; k < barCount; k++) {
        const h = harmonics[k];
        const barH = (h.magnitude / maxMag) * fftAvailableH;
        const bx = 20 + k * (barWidth + 6);
        const by = fftTop + fftAvailableH - barH;

        const gradient = ctx.createLinearGradient(0, by, 0, fftTop + fftAvailableH);
        if (h.order === 1) {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#0284c7');
        } else if ([3, 5, 7].includes(h.order)) {
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(1, '#b45309');
        } else {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#6b21a8');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(bx, by, barWidth, barH);

        // Harmonic order label
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`h${h.order}`, bx + barWidth / 2, fftTop + fftAvailableH + 12);
      }
      ctx.textAlign = 'left';
    }
  }, [
    steps,
    currentStepIndex,
    harmonics,
    metrics,
    showCh1,
    showCh2,
    showCh3,
    showFft,
    vScale,
    iScale,
    hoverIndex,
    mousePos,
  ]);

  // Handle Scrubbing & Crosshair via Canvas mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.floor(ratio * (steps.length - 1));

    setHoverIndex(idx);
    setMousePos({ x, y });

    if (e.buttons === 1) {
      const step = steps[idx];
      if (step) onScrubPhase(step.wtDeg);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setMousePos(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.floor(ratio * (steps.length - 1));
    const step = steps[idx];
    if (step) onScrubPhase(step.wtDeg);
  };

  const curWtDeg = steps[currentStepIndex]?.wtDeg || 0;

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950/95 rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between shadow-2xl backdrop-blur-md">
      {/* Top Channel Controls & Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 z-10">
        {/* Channel Toggle Buttons */}
        <div className="flex items-center gap-2">
          {/* CH1 */}
          <button
            onClick={() => setShowCh1(!showCh1)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
              showCh1
                ? 'bg-amber-950/80 border border-amber-600/70 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>CH1: v_o / v_s</span>
          </button>

          {/* CH2 */}
          <button
            onClick={() => setShowCh2(!showCh2)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
              showCh2
                ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300'
                : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>CH2: i_o / i_s</span>
          </button>

          {/* CH3 */}
          <button
            onClick={() => setShowCh3(!showCh3)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
              showCh3
                ? 'bg-rose-950/80 border border-rose-600/70 text-rose-300'
                : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>CH3: v_T1 / i_g</span>
          </button>

          {/* FFT Spectrum */}
          <button
            onClick={() => setShowFft(!showFft)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
              showFft
                ? 'bg-purple-950/80 border border-purple-600/70 text-purple-300'
                : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>FFT Spectrum</span>
          </button>
        </div>

        {/* Zoom & Scales */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5">
            <span>V-Gain:</span>
            <button
              onClick={() => setVScale((s) => Math.max(0.25, s * 0.8))}
              className="hover:text-white px-1"
            >
              -
            </button>
            <span className="text-amber-300">{vScale.toFixed(1)}x</span>
            <button
              onClick={() => setVScale((s) => Math.min(4.0, s * 1.25))}
              className="hover:text-white px-1"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5">
            <span>I-Gain:</span>
            <button
              onClick={() => setIScale((s) => Math.max(0.25, s * 0.8))}
              className="hover:text-white px-1"
            >
              -
            </button>
            <span className="text-emerald-300">{iScale.toFixed(1)}x</span>
            <button
              onClick={() => setIScale((s) => Math.min(4.0, s * 1.25))}
              className="hover:text-white px-1"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 w-full min-h-[260px]">
        <canvas
          ref={canvasRef}
          width={920}
          height={440}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="w-full h-full rounded-lg border border-slate-800/80 cursor-crosshair"
        />

        {/* Floating Readout HUD on Hover / Cursor */}
        {activeStep && (
          <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 font-mono text-xs shadow-xl backdrop-blur-md pointer-events-none space-y-1">
            <div className="text-slate-400 border-b border-slate-800 pb-1 flex justify-between gap-4">
              <span>wt: {activeStep.wtDeg.toFixed(1)}°</span>
              <span>Pair: <strong className="text-amber-300">{activeStep.activePairName}</strong></span>
            </div>
            {showCh1 && (
              <div className="flex justify-between gap-4">
                <span className="text-cyan-400">v_s: {activeStep.vs.toFixed(1)} V</span>
                <span className="text-amber-400 font-semibold">v_o: {activeStep.vo.toFixed(1)} V</span>
              </div>
            )}
            {showCh2 && (
              <div className="flex justify-between gap-4">
                <span className="text-sky-300">i_s: {activeStep.is.toFixed(2)} A</span>
                <span className="text-emerald-400 font-semibold">i_o: {activeStep.io.toFixed(2)} A</span>
              </div>
            )}
            {showCh3 && (
              <div className="flex justify-between gap-4">
                <span className="text-rose-400">v_T1: {activeStep.vt1.toFixed(1)} V</span>
                <span className="text-purple-300">Gate: {activeStep.ig1 > 0 ? 'HIGH' : 'LOW'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= ACTIVE PAIR CONDUCTION TIMELINE BAR ================= */}
      <div className="mt-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 font-mono text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 shrink-0">
          ACTIVE PAIR
        </span>
        <div className="relative flex-1 h-6 rounded bg-slate-950 border border-slate-800/80 overflow-hidden flex">
          {activePairIntervals.map((interval, idx) => (
            <div
              key={idx}
              style={{
                width: `${((interval.endDeg - interval.startDeg) / 360) * 100}%`,
                backgroundColor: interval.color,
              }}
              className="h-full flex items-center justify-center text-[10px] font-bold text-white/95 border-r border-slate-900/50 truncate px-1 select-none"
              title={`${interval.name}: ${interval.startDeg.toFixed(1)}° to ${interval.endDeg.toFixed(1)}°`}
            >
              {interval.name}
            </div>
          ))}

          {/* Yellow Phase Cursor Line matching current angle wt */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-md shadow-yellow-400 z-10 pointer-events-none"
            style={{ left: `${(curWtDeg / 360) * 100}%` }}
          />
        </div>
      </div>

      {/* Angle wt Scrubber Slider */}
      <div className="flex items-center justify-between gap-3 mt-2 px-1 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Angle wt:</span>
          </span>
          <input
            type="range"
            min="0"
            max="360"
            step="0.5"
            value={Math.round(curWtDeg)}
            onChange={(e) => onScrubPhase(Number(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
        <span className="text-cyan-300 font-bold w-14 text-right">
          {curWtDeg.toFixed(1)}°
        </span>
      </div>
    </div>
  );
};
