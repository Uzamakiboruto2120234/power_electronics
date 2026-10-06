/**
 * PowerLab - Parametric Controls
 * Real-time sliders, presets, and physical semiconductor / load / grid parameters.
 */

import React, { useState } from 'react';
import {
  TopologyId,
  GridParams,
  SemiconductorParams,
  LoadParams,
  ConverterControls,
} from '../types/powerTypes';
import { Sliders, Cpu, Activity, Zap, Shield, RotateCcw } from 'lucide-react';

interface ParametricControlsProps {
  topology: TopologyId;
  grid: GridParams;
  semi: SemiconductorParams;
  load: LoadParams;
  controls: ConverterControls;
  onChangeGrid: (g: Partial<GridParams>) => void;
  onChangeSemi: (s: Partial<SemiconductorParams>) => void;
  onChangeLoad: (l: Partial<LoadParams>) => void;
  onChangeControls: (c: Partial<ConverterControls>) => void;
  onResetDefaults: () => void;
}

export const ParametricControls: React.FC<ParametricControlsProps> = ({
  topology,
  grid,
  semi,
  load,
  controls,
  onChangeGrid,
  onChangeSemi,
  onChangeLoad,
  onChangeControls,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'control' | 'grid' | 'load' | 'device'>('control');

  const alphaPresets = [0, 30, 45, 60, 90, 120, 150];

  return (
    <div className="bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('control')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'control'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Firing & PWM</span>
          </button>

          <button
            onClick={() => setActiveTab('load')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'load'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Load Dynamics</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'grid'
                ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Source Grid & Ls</span>
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'device'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Semiconductors</span>
          </button>
        </div>

        <button
          onClick={onResetDefaults}
          title="Reset Parameters to Nominal Defaults"
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-[170px]">
        {/* ---------------- TAB 1: FIRING & PWM ---------------- */}
        {activeTab === 'control' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300 font-medium">Gate Trigger Angle (α):</span>
                <span className="text-amber-400 font-bold text-sm">{controls.firingAngleAlpha}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={controls.firingAngleAlpha}
                onChange={(e) => onChangeControls({ firingAngleAlpha: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              {/* Angle Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 font-mono mr-1">Presets:</span>
                {alphaPresets.map((deg) => (
                  <button
                    key={deg}
                    onClick={() => onChangeControls({ firingAngleAlpha: deg })}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                      controls.firingAngleAlpha === deg
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Special Controls for AFE and Dual Converter */}
            {topology === 'PWM_AFE_BOOST' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Modulation Index (m_a):</span>
                    <span className="text-sky-400 font-bold">{controls.pwmModulationIndex.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.15"
                    step="0.05"
                    value={controls.pwmModulationIndex}
                    onChange={(e) => onChangeControls({ pwmModulationIndex: Number(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Carrier Freq (f_sw):</span>
                    <span className="text-sky-400 font-bold">{controls.pwmCarrierFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="250"
                    value={controls.pwmCarrierFreq}
                    onChange={(e) => onChangeControls({ pwmCarrierFreq: Number(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {topology === 'DUAL_CONVERTER_4Q' && (
              <div className="flex items-center gap-4 pt-2 border-t border-slate-900 text-xs font-mono">
                <span className="text-slate-300">Mode:</span>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="dualMode"
                    checked={controls.dualConverterMode === 'non_circulating'}
                    onChange={() => onChangeControls({ dualConverterMode: 'non_circulating' })}
                    className="accent-amber-500"
                  />
                  <span>Non-Circulating Current</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="dualMode"
                    checked={controls.dualConverterMode === 'circulating'}
                    onChange={() => onChangeControls({ dualConverterMode: 'circulating' })}
                    className="accent-amber-500"
                  />
                  <span>Circulating Current (Reactor Lc)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 2: LOAD DYNAMICS ---------------- */}
        {activeTab === 'load' && (
          <div className="space-y-3">
            {/* Load Type Selector */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-900 text-xs font-mono">
              <span className="text-slate-400">Load Type:</span>
              {(['R', 'RL', 'RLE', 'RC', 'RLC'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onChangeLoad({ type: t })}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    load.type === t
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Resistance R */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Load Resistance (R):</span>
                  <span className="text-emerald-400 font-bold">{load.r} Ω</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={load.r}
                  onChange={(e) => onChangeLoad({ r: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Inductance L */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Load Inductance (L):</span>
                  <span className="text-sky-400 font-bold">{(load.l * 1000).toFixed(0)} mH</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.2"
                  step="0.005"
                  value={load.l}
                  onChange={(e) => onChangeLoad({ l: Number(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Back-EMF E */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Back-EMF (E / Battery):</span>
                  <span className="text-pink-400 font-bold">{load.e} V</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="150"
                  step="5"
                  value={load.e}
                  onChange={(e) => onChangeLoad({ e: Number(e.target.value) })}
                  className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Filter Capacitor C */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Filter Capacitor (C):</span>
                  <span className="text-purple-400 font-bold">{(load.c * 1e6).toFixed(0)} µF</span>
                </div>
                <input
                  type="range"
                  min="0.00001"
                  max="0.002"
                  step="0.00005"
                  value={load.c}
                  onChange={(e) => onChangeLoad({ c: Number(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB 3: SOURCE GRID & LS ---------------- */}
        {activeTab === 'grid' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* RMS Voltage */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Source Voltage (V_rms):</span>
                  <span className="text-sky-400 font-bold">{grid.vRms} V</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="480"
                  step="12"
                  value={grid.vRms}
                  onChange={(e) => onChangeGrid({ vRms: Number(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Frequency */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Grid Frequency (f):</span>
                  <span className="text-sky-400 font-bold">{grid.frequency} Hz</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {[50, 60, 400].map((f) => (
                    <button
                      key={f}
                      onClick={() => onChangeGrid({ frequency: f })}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                        grid.frequency === f
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300'
                      }`}
                    >
                      {f} Hz
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Inductance Ls */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Source Line Inductance (Ls):</span>
                  <span className="text-amber-400 font-bold">{(grid.sourceInductanceLs * 1000).toFixed(2)} mH</span>
                </div>
                <input
                  type="range"
                  min="0.000"
                  max="0.010"
                  step="0.0002"
                  value={grid.sourceInductanceLs}
                  onChange={(e) => onChangeGrid({ sourceInductanceLs: Number(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Source Resistance Rs */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Source Resistance (Rs):</span>
                  <span className="text-amber-400 font-bold">{grid.sourceResistanceRs.toFixed(2)} Ω</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1.0"
                  step="0.02"
                  value={grid.sourceResistanceRs}
                  onChange={(e) => onChangeGrid({ sourceResistanceRs: Number(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB 4: SEMICONDUCTORS ---------------- */}
        {activeTab === 'device' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Threshold Vf0 */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Forward Drop (V_F0):</span>
                  <span className="text-purple-400 font-bold">{semi.vf0.toFixed(2)} V</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={semi.vf0}
                  onChange={(e) => onChangeSemi({ vf0: Number(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Dynamic Resistance rd */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">On-state Resistance (r_d):</span>
                  <span className="text-purple-400 font-bold">{(semi.rd * 1000).toFixed(1)} mΩ</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.080"
                  step="0.002"
                  value={semi.rd}
                  onChange={(e) => onChangeSemi({ rd: Number(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Turn-off Time tq */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Turn-Off Time (t_q):</span>
                  <span className="text-purple-400 font-bold">{(semi.turnOffTimeTq * 1e6).toFixed(0)} µs</span>
                </div>
                <input
                  type="range"
                  min="0.00001"
                  max="0.0002"
                  step="0.00001"
                  value={semi.turnOffTimeTq}
                  onChange={(e) => onChangeSemi({ turnOffTimeTq: Number(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Reverse Recovery Qrr */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Recovery Charge (Q_rr):</span>
                  <span className="text-purple-400 font-bold">{(semi.qrr * 1e6).toFixed(0)} µC</span>
                </div>
                <input
                  type="range"
                  min="0.000005"
                  max="0.0002"
                  step="0.00001"
                  value={semi.qrr}
                  onChange={(e) => onChangeSemi({ qrr: Number(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* RC Snubber Toggle */}
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={semi.enableSnubber}
                  onChange={(e) => onChangeSemi({ enableSnubber: e.target.checked })}
                  className="rounded accent-purple-500"
                />
                <span className="font-medium text-slate-200">Enable RC Snubber Network (dv/dt Protection)</span>
              </label>

              {semi.enableSnubber && (
                <div className="flex items-center gap-3 text-slate-400">
                  <span>Rs = {semi.snubberRs} Ω</span>
                  <span>Cs = {(semi.snubberCs * 1e9).toFixed(0)} nF</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
