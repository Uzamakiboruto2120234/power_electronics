/**
 * PowerLab - Physical Metrics & Analytical Telemetry Grid
 * Comprehensive real-time displays for state-space outputs, power quality,
 * harmonic distortion, commutation parameters, and semiconductor stresses.
 */

import React from 'react';
import { PowerMetrics } from '../types/powerTypes';
import { Activity, Gauge, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PhysicalMetricsGridProps {
  metrics: PowerMetrics;
}

export const PhysicalMetricsGrid: React.FC<PhysicalMetricsGridProps> = ({ metrics }) => {
  return (
    <div className="bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
      {/* Top Header / Mode Status */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Physical Telemetry & Analytical Metrics
          </span>
        </div>

        {/* Conduction Mode Status Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Boundary Mode:</span>
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
              metrics.conductionMode === 'CCM'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70'
                : metrics.conductionMode === 'DCM'
                ? 'bg-amber-950/70 text-amber-300 border-amber-600/70'
                : 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
            }`}
          >
            {metrics.conductionMode === 'CCM' && 'Continuous (CCM)'}
            {metrics.conductionMode === 'DCM' && 'Discontinuous (DCM)'}
            {metrics.conductionMode === 'COMMUTATION_FAILURE' && 'Commutation Failure!'}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid (3 Rows x 4 Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
        {/* Metric 1: V_dc & V_rms */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Output Voltage (DC / RMS)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-amber-300">{metrics.vDc.toFixed(1)} V</span>
            <span className="text-[11px] text-slate-400">RMS: {metrics.vRms.toFixed(1)} V</span>
          </div>
        </div>

        {/* Metric 2: I_dc & I_rms */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Load Current (DC / RMS)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-emerald-300">{metrics.iDc.toFixed(2)} A</span>
            <span className="text-[11px] text-slate-400">RMS: {metrics.iRms.toFixed(2)} A</span>
          </div>
        </div>

        {/* Metric 3: Active Power P & S */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Active / Apparent Power</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-sky-300">{metrics.pActive.toFixed(1)} W</span>
            <span className="text-[11px] text-slate-400">S: {metrics.sApparent.toFixed(0)} VA</span>
          </div>
        </div>

        {/* Metric 4: True Power Factor & DPF */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Power Factor (TPF / DPF)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-purple-300">{metrics.tpf.toFixed(3)}</span>
            <span className="text-[11px] text-slate-400">DPF: {metrics.dpf.toFixed(3)}</span>
          </div>
        </div>

        {/* Metric 5: Current THD */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Current THD (Grid is)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-sm font-bold ${metrics.thdCurrent > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics.thdCurrent.toFixed(1)} %
            </span>
            <span className="text-[11px] text-slate-400">HF: {metrics.hf.toFixed(3)}</span>
          </div>
        </div>

        {/* Metric 6: Commutation Overlap mu */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Commutation Overlap (μ)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-amber-300">{metrics.commutationOverlapMu.toFixed(1)}°</span>
            <span className="text-[11px] text-slate-400">ΔV: {metrics.commutationVoltageDrop.toFixed(1)} V</span>
          </div>
        </div>

        {/* Metric 7: Extinction Angle beta */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Extinction Angle (β)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-cyan-300">{metrics.extinctionAngleBeta.toFixed(1)}°</span>
            <span className="text-[11px] text-slate-400">Solved via NR</span>
          </div>
        </div>

        {/* Metric 8: Form Factor & Ripple Factor */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans">Ripple Factor (RF / FF)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-200">{metrics.rippleFactor.toFixed(1)} %</span>
            <span className="text-[11px] text-slate-400">FF: {metrics.formFactor.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Physics Health & Margin Strip */}
      <div className="pt-2 border-t border-slate-900 mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {metrics.turnOffMarginOk ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              Turn-Off Margin: tc = {metrics.circuitCommutationTimeTc.toFixed(0)} µs
              {metrics.turnOffMarginOk ? ' (Safe)' : ' (Violated: t_c < t_q!)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">|</span>
            <span>Semiconductor Loss: Pcond = {metrics.totalConductionLoss.toFixed(1)} W</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Core Bias Flux Φ_dc = {metrics.coreDcFluxPhiDc.toFixed(4)} Wb</span>
          {metrics.coreSaturationRisk ? (
            <span className="text-rose-400 font-bold">(Saturation Warning)</span>
          ) : (
            <span className="text-emerald-400 font-semibold">(Linear Core)</span>
          )}
        </div>
      </div>
    </div>
  );
};
