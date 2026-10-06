/**
 * PowerLab - Studio Header & Playback Console
 * Topology selection, time-step animation clock, phase scrubber, view modal launchers, and export tools.
 */

import React from 'react';
import { TopologyId } from '../types/powerTypes';
import {
  Play,
  Pause,
  SkipForward,
  Download,
  FileCode,
  BookOpen,
  Compass,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HeaderConsoleProps {
  topology: TopologyId;
  onSelectTopology: (t: TopologyId) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  animSpeed: number;
  onChangeSpeed: (s: number) => void;
  scrubberPhaseDeg: number;
  onScrubPhase: (deg: number) => void;
  onOpenDerivations: () => void;
  onOpenParkVector: () => void;
  onOpenSpiceNetlist: () => void;
  onExportCsv: () => void;
}

export const HeaderConsole: React.FC<HeaderConsoleProps> = ({
  topology,
  onSelectTopology,
  isPlaying,
  onTogglePlay,
  onStepForward,
  animSpeed,
  onChangeSpeed,
  scrubberPhaseDeg,
  onScrubPhase,
  onOpenDerivations,
  onOpenParkVector,
  onOpenSpiceNetlist,
  onExportCsv,
}) => {
  const topologies: { id: TopologyId; label: string; group: '1-Phase' | '3-Phase' | 'Advanced' }[] = [
    { id: '1P_HALF_WAVE', label: '1Φ Half-Wave Rectifier', group: '1-Phase' },
    { id: '1P_CENTER_TAP', label: '1Φ Center-Tapped Transformer', group: '1-Phase' },
    { id: '1P_FULL_BRIDGE_DIODE', label: '1Φ Full-Bridge Diode Rectifier', group: '1-Phase' },
    { id: '1P_FULL_BRIDGE_SCR', label: '1Φ Fully-Controlled SCR Bridge', group: '1-Phase' },
    { id: '1P_SEMI_CONVERTER_SYM', label: '1Φ Symmetrical Semi-Converter', group: '1-Phase' },
    { id: '1P_SEMI_CONVERTER_ASYM', label: '1Φ Asymmetrical Semi-Converter', group: '1-Phase' },
    { id: '3P_STAR_3PULSE', label: '3Φ 3-Pulse Star Converter', group: '3-Phase' },
    { id: '3P_FULL_BRIDGE_6PULSE', label: '3Φ 6-Pulse Full-Bridge Bridge', group: '3-Phase' },
    { id: '3P_SEMI_CONVERTER', label: '3Φ Semi-Converter (Half-Controlled)', group: '3-Phase' },
    { id: '3P_12PULSE_DUAL', label: '3Φ 12-Pulse Dual Bridge (Y-Δ Shift)', group: '3-Phase' },
    { id: 'DUAL_CONVERTER_4Q', label: '4-Quadrant Dual Converter', group: 'Advanced' },
    { id: 'PWM_AFE_BOOST', label: 'PWM Active Front End (AFE Boost)', group: 'Advanced' },
  ];

  return (
    <header className="w-full bg-slate-950/95 border-b border-slate-800/80 px-4 py-3 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Topology Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight flex items-center gap-2">
              <span>PowerLab</span>
              <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                STATE-SPACE v2.4
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-none">
              Rigorous Semiconductor Physics & Converter Engine
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

        {/* Topology Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 hidden md:block">Topology:</label>
          <select
            value={topology}
            onChange={(e) => onSelectTopology(e.target.value as TopologyId)}
            className="bg-slate-900 border border-slate-700/80 text-slate-100 text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-inner"
          >
            <optgroup label="Single-Phase (1Φ)">
              {topologies
                .filter((t) => t.group === '1-Phase')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Three-Phase (3Φ)">
              {topologies
                .filter((t) => t.group === '3-Phase')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Advanced & Bidirectional">
              {topologies
                .filter((t) => t.group === 'Advanced')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Playback Clock & Phase Scrubber */}
      <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-inner">
        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-md transition-colors ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Run Real-Time Clock'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={onStepForward}
            className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Step Forward (wt + 5°)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 ml-1">
            <span>Speed:</span>
            {[0.25, 0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                  animSpeed === s
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Phase Scrubber Slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">wt:</span>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={Math.round(scrubberPhaseDeg)}
            onChange={(e) => onScrubPhase(Number(e.target.value))}
            className="w-28 md:w-40 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-amber-300 font-bold w-12 text-right">
            {scrubberPhaseDeg.toFixed(0)}°
          </span>
        </div>
      </div>

      {/* View Modals & Export Options */}
      <div className="flex items-center gap-2">
        {/* Park Vector Modal */}
        <button
          onClick={onOpenParkVector}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono transition"
          title="Park d-q and Clarke Space Vector Trajectory"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Park d-q</span>
        </button>

        {/* LaTeX Derivations Modal */}
        <button
          onClick={onOpenDerivations}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono transition"
          title="Analytical LaTeX Physical Derivations & Transcendental Proofs"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Equations & Proofs</span>
        </button>

        {/* SPICE Netlist (.cir) Modal */}
        <button
          onClick={onOpenSpiceNetlist}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono transition"
          title="Inspect & Export SPICE .cir Simulation Deck"
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">SPICE Netlist</span>
        </button>

        {/* CSV Export */}
        <button
          onClick={onExportCsv}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-mono font-medium transition"
          title="Export CSV raw time-series vector data"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">CSV Data</span>
        </button>
      </div>
    </header>
  );
};
