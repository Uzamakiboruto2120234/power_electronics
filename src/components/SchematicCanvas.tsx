/**
 * PowerLab - Dynamic Vector Schematic Canvas
 * Real-time active conduction path overlays, switch forward drops / reverse blocking stresses,
 * animated electron current loops, and overlap commutation indicators.
 */

import React, { useMemo, useState } from 'react';
import {
  TopologyId,
  SimulationStep,
  PowerMetrics,
  GridParams,
  SemiconductorParams,
  LoadParams,
} from '../types/powerTypes';
import { Zap, AlertTriangle, Shield, Gauge, Info } from 'lucide-react';

interface SchematicCanvasProps {
  topology: TopologyId;
  currentStep: SimulationStep;
  metrics: PowerMetrics;
  grid: GridParams;
  semi: SemiconductorParams;
  load: LoadParams;
}

export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  topology,
  currentStep,
  metrics,
  grid,
  semi,
  load,
}) => {
  const [selectedSwitch, setSelectedSwitch] = useState<string | null>(null);

  // Speed of current loop animation mapped to current amplitude
  const animSpeedSec = useMemo(() => {
    const i = Math.max(0.1, currentStep.io);
    return Math.max(0.3, Math.min(2.0, 1.5 / i));
  }, [currentStep.io]);

  // Lookup switch state by id
  const getSwitch = (id: string) => {
    return (
      currentStep.switchStates.find((s) => s.id === id) || {
        id,
        name: id,
        isConducting: false,
        forwardCurrent: 0,
        voltageStress: 0,
        inReverseRecovery: false,
        snubberCurrent: 0,
        gatePulseActive: false,
      }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>wt = {currentStep.wtDeg.toFixed(1)}°</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">{currentStep.io.toFixed(2)} A</span>
          </div>

          {currentStep.isOverlapping && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-600/80 text-xs text-amber-300 font-mono animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Overlap Commutation μ ({metrics.commutationOverlapMu.toFixed(1)}°)</span>
            </div>
          )}

          {metrics.coreSaturationRisk && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-700 text-xs text-rose-300 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>DC Core Saturation Risk (Φdc={metrics.coreDcFluxPhiDc.toFixed(3)} Wb)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Conducting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span>Reverse Blocking</span>
          </div>
          {semi.enableSnubber && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800/60 text-blue-300">
              <Shield className="w-3 h-3 text-blue-400" />
              <span>Snubber Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main SVG Schematic Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <svg
          viewBox="0 0 920 480"
          className="w-full h-full max-h-[460px] select-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="schematicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>

            {/* Glowing filters for active conduction paths */}
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Arrow markers */}
            <marker id="arrowGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Grid Background */}
          <rect width="920" height="480" fill="url(#schematicGrid)" rx="10" />

          {/* Render Schematic by Topology */}
          {topology.startsWith('3P') || topology === 'DUAL_CONVERTER_4Q' ? (
            <ThreePhaseBridgeSchematic
              topology={topology}
              currentStep={currentStep}
              getSwitch={getSwitch}
              animSpeedSec={animSpeedSec}
              grid={grid}
              semi={semi}
              load={load}
              onSelectSwitch={setSelectedSwitch}
            />
          ) : topology === '1P_HALF_WAVE' ? (
            <SinglePhaseHalfWaveSchematic
              currentStep={currentStep}
              getSwitch={getSwitch}
              animSpeedSec={animSpeedSec}
              grid={grid}
              semi={semi}
              load={load}
              onSelectSwitch={setSelectedSwitch}
            />
          ) : (
            <SinglePhaseBridgeSchematic
              topology={topology}
              currentStep={currentStep}
              getSwitch={getSwitch}
              animSpeedSec={animSpeedSec}
              grid={grid}
              semi={semi}
              load={load}
              onSelectSwitch={setSelectedSwitch}
            />
          )}
        </svg>

        {/* Floating Switch Inspection Tooltip Modal */}
        {selectedSwitch && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700/80 p-3 rounded-lg shadow-2xl backdrop-blur-md max-w-xs z-30 font-mono text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Switch Telemetry: {selectedSwitch}</span>
              </div>
              <button
                onClick={() => setSelectedSwitch(null)}
                className="text-slate-400 hover:text-white px-1 rounded"
              >
                ✕
              </button>
            </div>
            {(() => {
              const sw = getSwitch(selectedSwitch);
              return (
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={sw.isConducting ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {sw.isConducting ? 'ON (Conducting)' : 'OFF (Blocking)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current i_T:</span>
                    <span className="text-emerald-300 font-semibold">{sw.forwardCurrent.toFixed(2)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voltage v_T:</span>
                    <span className={sw.isConducting ? 'text-emerald-400' : 'text-amber-300'}>
                      {sw.isConducting ? `+${(semi.vf0 + sw.forwardCurrent * semi.rd).toFixed(2)} V` : `${sw.voltageStress.toFixed(1)} V`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conduction Loss:</span>
                    <span className="text-slate-200">
                      {(sw.forwardCurrent * (semi.vf0 + sw.forwardCurrent * semi.rd)).toFixed(2)} W
                    </span>
                  </div>
                  {semi.enableSnubber && (
                    <div className="flex justify-between text-blue-300">
                      <span>Snubber Leakage:</span>
                      <span>{sw.snubberCurrent.toFixed(2)} mA</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer Info / Conduction Loop Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Click any semiconductor switch to inspect instantaneous state-space variables & losses.</span>
        </div>
        <div className="flex items-center gap-3">
          <span>R={load.r}Ω</span>
          <span>L={(load.l * 1000).toFixed(1)}mH</span>
          <span>E={load.e}V</span>
          <span>Ls={(grid.sourceInductanceLs * 1000).toFixed(2)}mH</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================================
// SINGLE-PHASE FULL-BRIDGE / SEMI-CONVERTER SCHEMATIC
// =========================================================================================
interface SubSchematicProps {
  topology: TopologyId;
  currentStep: SimulationStep;
  getSwitch: (id: string) => any;
  animSpeedSec: number;
  grid: GridParams;
  semi: SemiconductorParams;
  load: LoadParams;
  onSelectSwitch: (id: string) => void;
}

const SinglePhaseBridgeSchematic: React.FC<SubSchematicProps> = ({
  topology,
  currentStep,
  getSwitch,
  animSpeedSec,
  grid,
  semi,
  load,
  onSelectSwitch,
}) => {
  const isScrBridge = topology === '1P_FULL_BRIDGE_SCR' || topology === '1P_CENTER_TAP';
  const isSemi = topology === '1P_SEMI_CONVERTER_SYM' || topology === '1P_SEMI_CONVERTER_ASYM';

  const t1 = getSwitch('T1');
  const t2 = getSwitch('T2');
  const t3 = getSwitch(isSemi ? 'D1' : isScrBridge ? 'T3' : 'D3');
  const t4 = getSwitch(isSemi ? 'D2' : isScrBridge ? 'T4' : 'D4');

  const t1Conducting = t1.isConducting;
  const t2Conducting = t2.isConducting;
  const t3Conducting = t3.isConducting;
  const t4Conducting = t4.isConducting;

  return (
    <g>
      {/* AC Voltage Source */}
      <g transform="translate(140, 240)">
        <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
        {/* Sine glyph */}
        <path
          d="M -16 0 Q -8 -18 0 0 T 16 0"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="0" y="48" fill="#94a3b8" fontSize="12" textAnchor="middle" fontFamily="monospace">
          v_s: {currentStep.vs.toFixed(1)}V
        </text>
        <text x="0" y="-40" fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">
          AC GRID ({grid.vRms}V RMS)
        </text>
      </g>

      {/* Source Line Inductance (Ls) */}
      <g transform="translate(210, 160)">
        <path
          d="M 0 0 C 8 -10 16 -10 24 0 C 32 -10 40 -10 48 0 C 56 -10 64 -10 72 0"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <text x="36" y="-14" fill="#cbd5e1" fontSize="11" textAnchor="middle" fontFamily="monospace">
          Ls: {(grid.sourceInductanceLs * 1000).toFixed(1)}mH
        </text>
      </g>

      {/* Connections from AC source to Bridge */}
      {/* Line L connection */}
      <path
        d="M 140 208 L 140 160 L 210 160 M 282 160 L 380 160 L 380 200"
        fill="none"
        stroke={t1Conducting || t4Conducting ? '#10b981' : '#334155'}
        strokeWidth={t1Conducting || t4Conducting ? 3 : 1.5}
        filter={t1Conducting || t4Conducting ? 'url(#glowGreen)' : undefined}
      />

      {/* Line N connection */}
      <path
        d="M 140 272 L 140 320 L 460 320 L 460 280"
        fill="none"
        stroke={t2Conducting || t3Conducting ? '#10b981' : '#334155'}
        strokeWidth={t2Conducting || t3Conducting ? 3 : 1.5}
        filter={t2Conducting || t3Conducting ? 'url(#glowGreen)' : undefined}
      />

      {/* ANIMATED ELECTRON PARTICLES along active path */}
      {currentStep.io > 0.05 && (
        <path
          d="M 140 160 L 380 160 L 380 240 L 420 100 L 660 100 L 660 380 L 420 380 L 460 240 L 140 320"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          className="animate-current-flow"
          style={{ animationDuration: `${animSpeedSec}s` }}
          opacity={0.7}
        />
      )}

      {/* Bridge Top Rail (+) & Bottom Rail (-) */}
      <path
        d="M 380 100 L 660 100"
        fill="none"
        stroke={t1Conducting || t3Conducting ? '#10b981' : '#475569'}
        strokeWidth={t1Conducting || t3Conducting ? 3 : 2}
        filter={t1Conducting || t3Conducting ? 'url(#glowGreen)' : undefined}
      />
      <text x="640" y="88" fill="#10b981" fontSize="13" fontWeight="bold">
        + DC Bus (v_o = {currentStep.vo.toFixed(1)}V)
      </text>

      <path
        d="M 380 380 L 660 380"
        fill="none"
        stroke={t2Conducting || t4Conducting ? '#10b981' : '#475569'}
        strokeWidth={t2Conducting || t4Conducting ? 3 : 2}
        filter={t2Conducting || t4Conducting ? 'url(#glowGreen)' : undefined}
      />
      <text x="640" y="405" fill="#64748b" fontSize="13" fontWeight="bold">
        - DC Bus (GND)
      </text>

      {/* Bridge Legs (4 Switches) */}
      {/* Switch 1 (T1) - Top Left */}
      <ThyristorComponent
        x={380}
        y={150}
        name={isScrBridge || isSemi ? 'T1' : 'D1'}
        isThyristor={isScrBridge || isSemi}
        switchState={t1}
        onClick={() => onSelectSwitch('T1')}
      />

      {/* Switch 4 (T4) - Bottom Left */}
      <ThyristorComponent
        x={380}
        y={330}
        name={isScrBridge ? 'T4' : 'D4'}
        isThyristor={isScrBridge}
        switchState={t4}
        onClick={() => onSelectSwitch(isScrBridge ? 'T4' : 'D4')}
      />

      {/* Switch 3 (T3 / D1) - Top Right */}
      <ThyristorComponent
        x={460}
        y={150}
        name={isScrBridge ? 'T3' : isSemi ? 'D1' : 'D3'}
        isThyristor={isScrBridge}
        switchState={t3}
        onClick={() => onSelectSwitch(isScrBridge ? 'T3' : isSemi ? 'D1' : 'D3')}
      />

      {/* Switch 2 (T2 / D2) - Bottom Right */}
      <ThyristorComponent
        x={460}
        y={330}
        name={isScrBridge ? 'T2' : isSemi ? 'D2' : 'D2'}
        isThyristor={isScrBridge}
        switchState={t2}
        onClick={() => onSelectSwitch(isScrBridge ? 'T2' : 'D2')}
      />

      {/* Connecting Wires for Bridge Legs */}
      <path d="M 380 100 L 380 120 M 380 180 L 380 300 M 380 360 L 380 380" stroke="#475569" strokeWidth="2" />
      <path d="M 460 100 L 460 120 M 460 180 L 460 300 M 460 360 L 460 380" stroke="#475569" strokeWidth="2" />

      {/* Optional Freewheeling Diode (DFW) for Asymmetrical Semi-Converter */}
      {topology === '1P_SEMI_CONVERTER_ASYM' && (
        <g transform="translate(540, 240)">
          <path d="M 0 -140 L 0 -30 M 0 30 L 0 140" stroke="#475569" strokeWidth="2" />
          <ThyristorComponent
            x={0}
            y={0}
            name="DFW"
            isThyristor={false}
            switchState={getSwitch('DFW')}
            onClick={() => onSelectSwitch('DFW')}
          />
          <text x="24" y="0" fill="#94a3b8" fontSize="11" fontFamily="monospace">
            Freewheeling
          </text>
        </g>
      )}

      {/* LOAD IMPEDANCE SECTION (Right Side) */}
      <g transform="translate(660, 240)">
        {/* Wire from top rail to load */}
        <path d="M 0 -140 L 0 -90" stroke="#10b981" strokeWidth="2.5" />

        {/* Resistor R */}
        <g transform="translate(0, -70)">
          <path
            d="M 0 -20 L 0 -15 L -8 -10 L 8 -5 L -8 0 L 8 5 L -8 10 L 8 15 L 0 20"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
          <text x="20" y="5" fill="#fcd34d" fontSize="12" fontFamily="monospace">
            R = {load.r} Ω
          </text>
        </g>

        {/* Inductor L */}
        <g transform="translate(0, 0)">
          <path
            d="M 0 -30 L 0 -20 C 14 -20 14 -5 0 -5 C 14 -5 14 10 0 10 C 14 10 14 25 0 25 L 0 35"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          <text x="20" y="5" fill="#7dd3fc" fontSize="12" fontFamily="monospace">
            L = {(load.l * 1000).toFixed(1)} mH
          </text>
        </g>

        {/* Back-EMF Battery / DC Machine E */}
        <g transform="translate(0, 80)">
          <line x1="-16" y1="-10" x2="16" y2="-10" stroke="#ec4899" strokeWidth="3" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#ec4899" strokeWidth="2" />
          <line x1="-16" y1="10" x2="16" y2="10" stroke="#ec4899" strokeWidth="3" />
          <line x1="-8" y1="20" x2="8" y2="20" stroke="#ec4899" strokeWidth="2" />
          <text x="20" y="8" fill="#f472b6" fontSize="12" fontFamily="monospace">
            Back-EMF E = {load.e} V
          </text>
        </g>

        {/* Wire from bottom load to bottom rail */}
        <path d="M 0 110 L 0 140" stroke="#475569" strokeWidth="2.5" />
      </g>

      {/* Filter Capacitor C (if RC / RLC) */}
      {(load.type === 'RC' || load.type === 'RLC') && (
        <g transform="translate(580, 240)">
          <path d="M 0 -140 L 0 -15 M 0 15 L 0 140" stroke="#475569" strokeWidth="2" />
          <line x1="-14" y1="-12" x2="14" y2="-12" stroke="#a855f7" strokeWidth="3" />
          <line x1="-14" y1="12" x2="14" y2="12" stroke="#a855f7" strokeWidth="3" />
          <text x="-20" y="5" fill="#c084fc" fontSize="11" textAnchor="end" fontFamily="monospace">
            C = {(load.c * 1e6).toFixed(0)} µF
          </text>
        </g>
      )}
    </g>
  );
};

// =========================================================================================
// THREE-PHASE BRIDGE SCHEMATIC (3-Pulse, 6-Pulse, Semi, 12-Pulse, Dual, AFE)
// =========================================================================================
const ThreePhaseBridgeSchematic: React.FC<SubSchematicProps> = ({
  topology,
  currentStep,
  getSwitch,
  animSpeedSec,
  grid,
  semi,
  load,
  onSelectSwitch,
}) => {
  const isAFE = topology === 'PWM_AFE_BOOST';
  const is3PulseStar = topology === '3P_STAR_3PULSE';
  const isSemi = topology === '3P_SEMI_CONVERTER';

  return (
    <g>
      {/* 3-Phase AC Source (Star configuration) */}
      <g transform="translate(100, 240)">
        <circle cx="0" cy="0" r="40" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="0" y="-48" fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">
          3Φ GRID ({grid.vRms}V)
        </text>

        {/* 3 lines radiating from neutral */}
        <line x1="0" y1="0" x2="-20" y2="-25" stroke="#ef4444" strokeWidth="2" />
        <line x1="0" y1="0" x2="25" y2="0" stroke="#eab308" strokeWidth="2" />
        <line x1="0" y1="0" x2="-20" y2="25" stroke="#3b82f6" strokeWidth="2" />

        <text x="-26" y="-28" fill="#ef4444" fontSize="10" fontWeight="bold">A</text>
        <text x="32" y="4" fill="#eab308" fontSize="10" fontWeight="bold">B</text>
        <text x="-26" y="32" fill="#3b82f6" fontSize="10" fontWeight="bold">C</text>

        {is3PulseStar && (
          <text x="0" y="5" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">N</text>
        )}
      </g>

      {/* Source Inductors Ls A, B, C */}
      <g transform="translate(180, 160)">
        <path d="M 0 0 C 6 -8 12 -8 18 0 C 24 -8 30 -8 36 0" fill="none" stroke="#ef4444" strokeWidth="2" />
        <text x="18" y="-10" fill="#ef4444" fontSize="10" textAnchor="middle">Ls,a</text>
      </g>
      <g transform="translate(180, 240)">
        <path d="M 0 0 C 6 -8 12 -8 18 0 C 24 -8 30 -8 36 0" fill="none" stroke="#eab308" strokeWidth="2" />
        <text x="18" y="-10" fill="#eab308" fontSize="10" textAnchor="middle">Ls,b</text>
      </g>
      <g transform="translate(180, 320)">
        <path d="M 0 0 C 6 -8 12 -8 18 0 C 24 -8 30 -8 36 0" fill="none" stroke="#3b82f6" strokeWidth="2" />
        <text x="18" y="-10" fill="#3b82f6" fontSize="10" textAnchor="middle">Ls,c</text>
      </g>

      {/* Grid Connection Lines to Bridge */}
      <path d="M 140 220 L 180 160 M 216 160 L 320 160 L 320 220" stroke="#ef4444" strokeWidth="2" fill="none" />
      <path d="M 140 240 L 180 240 M 216 240 L 420 240" stroke="#eab308" strokeWidth="2" fill="none" />
      <path d="M 140 260 L 180 320 M 216 320 L 520 320 L 520 260" stroke="#3b82f6" strokeWidth="2" fill="none" />

      {/* For 3-Pulse Star: Neutral return line */}
      {is3PulseStar && (
        <path d="M 100 240 L 100 400 L 680 400" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
      )}

      {/* Top and Bottom DC rails */}
      <path d="M 320 80 L 680 80" stroke="#10b981" strokeWidth="2.5" fill="none" filter="url(#glowGreen)" />
      <text x="680" y="70" fill="#10b981" fontSize="13" fontWeight="bold">
        + V_dc ({currentStep.vo.toFixed(1)}V)
      </text>

      {!is3PulseStar && (
        <>
          <path d="M 320 400 L 680 400" stroke="#475569" strokeWidth="2.5" fill="none" />
          <text x="680" y="420" fill="#64748b" fontSize="13" fontWeight="bold">
            - Return Bus
          </text>
        </>
      )}

      {is3PulseStar && (
        <text x="680" y="420" fill="#94a3b8" fontSize="13" fontWeight="bold">
          Neutral Return (Star N)
        </text>
      )}

      {/* Bridge Leg 1 (A): T1 (top) */}
      <ThyristorComponent
        x={320}
        y={140}
        name={isAFE ? 'S1' : 'T1'}
        isThyristor={!isAFE}
        switchState={getSwitch(isAFE ? 'S1_IGBT' : 'T1')}
        onClick={() => onSelectSwitch(isAFE ? 'S1_IGBT' : 'T1')}
      />
      <path d="M 320 80 L 320 110 M 320 170 L 320 240" stroke="#475569" strokeWidth="2" />

      {!is3PulseStar && (
        <>
          <ThyristorComponent
            x={320}
            y={340}
            name={isAFE ? 'S4' : isSemi ? 'D4' : 'T4'}
            isThyristor={!isAFE && !isSemi}
            switchState={getSwitch(isAFE ? 'S4_IGBT' : isSemi ? 'D4' : 'T4')}
            onClick={() => onSelectSwitch(isAFE ? 'S4_IGBT' : isSemi ? 'D4' : 'T4')}
          />
          <path d="M 320 240 L 320 310 M 320 370 L 320 400" stroke="#475569" strokeWidth="2" />
        </>
      )}

      {/* Bridge Leg 2 (B): T3 / T2 */}
      <ThyristorComponent
        x={420}
        y={140}
        name={isAFE ? 'S3' : is3PulseStar ? 'T2' : 'T3'}
        isThyristor={!isAFE}
        switchState={getSwitch(isAFE ? 'S3_IGBT' : is3PulseStar ? 'T2' : 'T3')}
        onClick={() => onSelectSwitch(isAFE ? 'S3_IGBT' : is3PulseStar ? 'T2' : 'T3')}
      />
      <path d="M 420 80 L 420 110 M 420 170 L 420 240" stroke="#475569" strokeWidth="2" />

      {!is3PulseStar && (
        <>
          <ThyristorComponent
            x={420}
            y={340}
            name={isAFE ? 'S6' : isSemi ? 'D6' : 'T6'}
            isThyristor={!isAFE && !isSemi}
            switchState={getSwitch(isAFE ? 'S6_IGBT' : isSemi ? 'D6' : 'T6')}
            onClick={() => onSelectSwitch(isAFE ? 'S6_IGBT' : isSemi ? 'D6' : 'T6')}
          />
          <path d="M 420 240 L 420 310 M 420 370 L 420 400" stroke="#475569" strokeWidth="2" />
        </>
      )}

      {/* Bridge Leg 3 (C): T5 / T3 */}
      <ThyristorComponent
        x={520}
        y={140}
        name={isAFE ? 'S5' : is3PulseStar ? 'T3' : 'T5'}
        isThyristor={!isAFE}
        switchState={getSwitch(isAFE ? 'S5_IGBT' : is3PulseStar ? 'T3' : 'T5')}
        onClick={() => onSelectSwitch(isAFE ? 'S5_IGBT' : is3PulseStar ? 'T3' : 'T5')}
      />
      <path d="M 520 80 L 520 110 M 520 170 L 520 240" stroke="#475569" strokeWidth="2" />

      {!is3PulseStar && (
        <>
          <ThyristorComponent
            x={520}
            y={340}
            name={isAFE ? 'S2' : isSemi ? 'D2' : 'T2'}
            isThyristor={!isAFE && !isSemi}
            switchState={getSwitch(isAFE ? 'S2_IGBT' : isSemi ? 'D2' : 'T2')}
            onClick={() => onSelectSwitch(isAFE ? 'S2_IGBT' : isSemi ? 'D2' : 'T2')}
          />
          <path d="M 520 240 L 520 310 M 520 370 L 520 400" stroke="#475569" strokeWidth="2" />
        </>
      )}

      {/* Load Block */}
      <g transform="translate(700, 240)">
        <path d="M 0 -160 L 0 -100" stroke="#10b981" strokeWidth="2" />
        {/* Resistor */}
        <g transform="translate(0, -80)">
          <path d="M 0 -20 L 0 -15 L -8 -10 L 8 -5 L -8 0 L 8 5 L -8 10 L 8 15 L 0 20" stroke="#f59e0b" strokeWidth="2" fill="none" />
          <text x="16" y="5" fill="#fcd34d" fontSize="11" fontFamily="monospace">R={load.r}Ω</text>
        </g>
        {/* Inductor */}
        <g transform="translate(0, -10)">
          <path d="M 0 -25 C 12 -25 12 -10 0 -10 C 12 -10 12 5 0 5 C 12 5 12 20 0 20" stroke="#38bdf8" strokeWidth="2" fill="none" />
          <text x="16" y="5" fill="#7dd3fc" fontSize="11" fontFamily="monospace">L={(load.l * 1000).toFixed(0)}mH</text>
        </g>
        {/* DC EMF */}
        <g transform="translate(0, 60)">
          <line x1="-14" y1="-8" x2="14" y2="-8" stroke="#ec4899" strokeWidth="2.5" />
          <line x1="-8" y1="2" x2="8" y2="2" stroke="#ec4899" strokeWidth="2" />
          <text x="16" y="0" fill="#f472b6" fontSize="11" fontFamily="monospace">E={load.e}V</text>
        </g>
        <path d="M 0 90 L 0 160" stroke="#475569" strokeWidth="2" />
      </g>
    </g>
  );
};

// =========================================================================================
// SINGLE-PHASE HALF-WAVE SCHEMATIC
// =========================================================================================
const SinglePhaseHalfWaveSchematic: React.FC<Omit<SubSchematicProps, 'topology'>> = ({
  currentStep,
  getSwitch,
  grid,
  load,
  onSelectSwitch,
}) => {
  const t1 = getSwitch('T1');

  return (
    <g>
      {/* Source */}
      <g transform="translate(180, 240)">
        <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
        <path d="M -16 0 Q -8 -18 0 0 T 16 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        <text x="0" y="48" fill="#94a3b8" fontSize="12" textAnchor="middle" fontFamily="monospace">
          {currentStep.vs.toFixed(1)}V
        </text>
      </g>

      {/* Transformer Core Magnetics & Warning */}
      <g transform="translate(320, 240)">
        <rect x="-30" y="-80" width="60" height="160" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <line x1="-4" y1="-70" x2="-4" y2="70" stroke="#64748b" strokeWidth="3" />
        <line x1="4" y1="-70" x2="4" y2="70" stroke="#64748b" strokeWidth="3" />
        <text x="0" y="100" fill="#f87171" fontSize="10" textAnchor="middle" fontWeight="bold">
          DC Flux Bias: High Saturation Risk
        </text>
      </g>

      {/* Thyristor T1 */}
      <ThyristorComponent
        x={480}
        y={160}
        name="T1"
        isThyristor={true}
        switchState={t1}
        onClick={() => onSelectSwitch('T1')}
      />

      {/* Rails & Connections */}
      <path
        d="M 180 208 L 180 160 L 290 160 M 350 160 L 450 160 M 510 160 L 680 160 L 680 200"
        stroke={t1.isConducting ? '#10b981' : '#475569'}
        strokeWidth={t1.isConducting ? 3 : 2}
        fill="none"
        filter={t1.isConducting ? 'url(#glowGreen)' : undefined}
      />
      <path
        d="M 180 272 L 180 320 L 680 320 L 680 280"
        stroke="#475569"
        strokeWidth="2"
        fill="none"
      />

      {/* Load R-L */}
      <g transform="translate(680, 240)">
        <g transform="translate(0, -30)">
          <path d="M 0 -15 L -6 -10 L 6 -5 L -6 0 L 6 5 L 0 15" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
          <text x="16" y="2" fill="#fcd34d" fontSize="11" fontFamily="monospace">R={load.r}Ω</text>
        </g>
        <g transform="translate(0, 30)">
          <path d="M 0 -15 C 10 -15 10 -5 0 -5 C 10 -5 10 5 0 5 L 0 15" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
          <text x="16" y="2" fill="#7dd3fc" fontSize="11" fontFamily="monospace">L={(load.l * 1000).toFixed(0)}mH</text>
        </g>
      </g>
    </g>
  );
};

// =========================================================================================
// THYRISTOR / DIODE VECTOR COMPONENT
// =========================================================================================
interface ThyristorProps {
  x: number;
  y: number;
  name: string;
  isThyristor: boolean;
  switchState: {
    isConducting: boolean;
    forwardCurrent: number;
    voltageStress: number;
    inReverseRecovery: boolean;
    gatePulseActive?: boolean;
  };
  onClick: () => void;
}

const ThyristorComponent: React.FC<ThyristorProps> = ({
  x,
  y,
  name,
  isThyristor,
  switchState,
  onClick,
}) => {
  const { isConducting, forwardCurrent, voltageStress, inReverseRecovery, gatePulseActive } = switchState;

  const color = isConducting ? '#10b981' : inReverseRecovery ? '#f59e0b' : '#64748b';
  const glow = isConducting ? 'url(#glowGreen)' : inReverseRecovery ? 'url(#glowAmber)' : undefined;

  return (
    <g transform={`translate(${x}, ${y})`} className="cursor-pointer group" onClick={onClick}>
      {/* Hitbox */}
      <rect x="-28" y="-30" width="56" height="60" fill="transparent" />

      {/* Background glow circle */}
      {isConducting && (
        <circle cx="0" cy="0" r="26" fill="#10b981" fillOpacity="0.12" className="animate-pulse" />
      )}

      {/* Diode Triangle */}
      <path
        d="M -16 -12 L 16 -12 L 0 12 Z"
        fill={isConducting ? '#10b981' : '#1e293b'}
        stroke={color}
        strokeWidth="2.5"
        filter={glow}
      />

      {/* Cathode Bar */}
      <line x1="-16" y1="12" x2="16" y2="12" stroke={color} strokeWidth="3" />

      {/* Thyristor Gate Terminal */}
      {isThyristor && (
        <g>
          <path
            d="M 6 12 L 18 22"
            fill="none"
            stroke={gatePulseActive ? '#38bdf8' : '#64748b'}
            strokeWidth="2"
          />
          {/* Gate Pulse Indicator */}
          {gatePulseActive && (
            <circle cx="18" cy="22" r="4" fill="#38bdf8" className="animate-ping" />
          )}
        </g>
      )}

      {/* Label Badge */}
      <text
        x="-22"
        y="-4"
        fill={isConducting ? '#34d399' : '#cbd5e1'}
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="end"
      >
        {name}
      </text>

      {/* Instantaneous forward drop or reverse stress badge */}
      <g transform="translate(24, -4)">
        {isConducting ? (
          <text fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="semibold">
            +{forwardCurrent.toFixed(1)}A
          </text>
        ) : (
          <text fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {voltageStress > 10 ? `-${voltageStress.toFixed(0)}V` : '0V'}
          </text>
        )}
      </g>
    </g>
  );
};
