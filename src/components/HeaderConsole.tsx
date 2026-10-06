/**
 * PowerLab / RectifierLab - Studio Header & Central Playback Console
 * Topology selection, high-precision clock engine, speed controls,
 * and analysis modals matching RectifierLab.
 */

import React from 'react';
import { TopologyId } from '../types/powerTypes';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Download,
  FileCode,
  BookOpen,
  Compass,
  Zap,
} from 'lucide-react';

interface HeaderConsoleProps {
  topology: TopologyId;
  onSelectTopology: (t: TopologyId) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onRestart: () => void;
  animSpeed: number;
  onChangeSpeed: (s: number) => void;
  onOpenDerivations: () => void;
  onOpenParkVector: () => void;
  onOpenSpiceNetlist: () => void;
  onExportCsv: () => void;
  onResetAll: () => void;
}

export const HeaderConsole: React.FC<HeaderConsoleProps> = ({
  topology,
  onSelectTopology,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onRestart,
  animSpeed,
  onChangeSpeed,
  onOpenDerivations,
  onOpenParkVector,
  onOpenSpiceNetlist,
  onExportCsv,
  onResetAll,
}) => {
  const speedOptions = [0.1, 0.2, 0.5, 1.0, 2.0];

  return (
    <div className="w-full flex flex-col">
      {/* ================= TOP STUDIO HEADER ================= */}
      <header className="w-full bg-slate-950/95 border-b border-slate-800/80 px-4 py-2.5 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Studio Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
            <Zap className="w-5 h-5 fill-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-100 tracking-tight font-sans">
                PowerLab
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                Power Electronics Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Interactive Single-Phase & Three-Phase Diode/Thyristor Bridge Converter Simulation
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={onOpenDerivations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/60 text-amber-300 hover:bg-amber-950/70 transition font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Waveform Analysis & Derivations</span>
          </button>

          <button
            onClick={onOpenParkVector}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Park d-q</span>
          </button>

          <button
            onClick={onOpenSpiceNetlist}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">SPICE Deck</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">CSV Data</span>
          </button>

          <button
            onClick={onResetAll}
            title="Reset All Parameters"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= CENTRAL PLAYBACK CONSOLE BAR ================= */}
      <div className="w-full bg-slate-950 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Main Run Real-Time button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Real-Time</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Real-Time</span>
              </>
            )}
          </button>

          {/* Step Backward */}
          <button
            onClick={onStepBackward}
            title="Step Backward (wt - 5°)"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            title="Step Forward (wt + 5°)"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            title="Restart Cycle (wt = 0°)"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Slider & Segmented Options */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Speed:</span>
          </span>

          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={animSpeed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="w-24 md:w-36 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <span className="text-cyan-300 font-bold min-w-[36px]">
            {animSpeed.toFixed(1)}x
          </span>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  Math.abs(animSpeed - s) < 0.05
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
