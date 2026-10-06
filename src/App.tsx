/**
 * PowerLab - Rigorous Power Electronics & Semiconductor Physics Laboratory
 * Principal Application Component integrating State-Space Solver Kernel,
 * Dynamic Vector Schematic, Multi-Channel Oscilloscope, Parametric Controls, and Telemetry.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TopologyId,
  GridParams,
  SemiconductorParams,
  LoadParams,
  ConverterControls,
} from './types/powerTypes';
import { simulateConverter } from './engine/physicsEngine';
import { HeaderConsole } from './components/HeaderConsole';
import { SchematicCanvas } from './components/SchematicCanvas';
import { OscilloscopeView } from './components/OscilloscopeView';
import { ParametricControls } from './components/ParametricControls';
import { PhysicalMetricsGrid } from './components/PhysicalMetricsGrid';
import { LatexDerivationsModal } from './components/LatexDerivationsModal';
import { ParkVectorModal } from './components/ParkVectorModal';
import { SpiceNetlistModal } from './components/SpiceNetlistModal';

export default function App() {
  // Top-Level Topology Selection (Matching RectifierLab initial state)
  const [topology, setTopology] = useState<TopologyId>('1P_HALF_WAVE');

  // Physical Parameters State
  const [grid, setGrid] = useState<GridParams>({
    vRms: 230,
    frequency: 50,
    sourceInductanceLs: 0.0015, // 1.5 mH
    sourceResistanceRs: 0.05,
  });

  const [semi, setSemi] = useState<SemiconductorParams>({
    vf0: 1.0,
    rd: 0.015,
    trr: 2e-6,
    qrr: 25e-6,
    latchingCurrentIl: 0.15,
    holdingCurrentIh: 0.08,
    turnOffTimeTq: 40e-6,
    enableSnubber: true,
    snubberRs: 47,
    snubberCs: 100e-9,
  });

  const [load, setLoad] = useState<LoadParams>({
    type: 'RL',
    r: 15,
    l: 0.035, // 35 mH
    e: 15, // 15V Back-EMF
    c: 220e-6,
  });

  const [controls, setControls] = useState<ConverterControls>({
    firingAngleAlpha: 30, // 30 deg as in RectifierLab screenshot
    pwmModulationIndex: 0.85,
    pwmCarrierFreq: 1500,
    dualConverterMode: 'non_circulating',
    quadrantTarget: 1,
    enableFwd: true, // Freewheeling Diode Connected
  });

  // Playback & Clock State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animSpeed, setAnimSpeed] = useState<number>(0.1); // 0.1x nominal speed matching RectifierLab
  const [phaseDeg, setPhaseDeg] = useState<number>(0);

  // Modals
  const [showDerivations, setShowDerivations] = useState<boolean>(false);
  const [showParkVector, setShowParkVector] = useState<boolean>(false);
  const [showSpiceNetlist, setShowSpiceNetlist] = useState<boolean>(false);

  // Run Physics Engine Simulation Kernel
  const simulationResult = useMemo(() => {
    return simulateConverter(topology, grid, semi, load, controls);
  }, [topology, grid, semi, load, controls]);

  // Current Step index in the 1080-point cycle
  const currentStepIndex = useMemo(() => {
    const totalSteps = simulationResult.steps.length;
    if (totalSteps === 0) return 0;
    const normDeg = ((phaseDeg % 360) + 360) % 360;
    const idx = Math.floor((normDeg / 360) * totalSteps);
    return Math.max(0, Math.min(totalSteps - 1, idx));
  }, [phaseDeg, simulationResult.steps.length]);

  const currentStep = simulationResult.steps[currentStepIndex] || simulationResult.steps[0];

  // Animation Loop (requestAnimationFrame)
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animFrameId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        const dDeg = grid.frequency * 360 * deltaSec * animSpeed;
        setPhaseDeg((prev) => (prev + dDeg) % 360);
      }
      lastTimeRef.current = now;
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, animSpeed, grid.frequency]);

  // Playback handlers
  const handleTogglePlay = () => setIsPlaying((p) => !p);
  const handleStepForward = () => setPhaseDeg((prev) => (prev + 5) % 360);
  const handleStepBackward = () => setPhaseDeg((prev) => (prev - 5 + 360) % 360);
  const handleRestart = () => setPhaseDeg(0);
  const handleScrubPhase = useCallback((deg: number) => {
    setIsPlaying(false);
    setPhaseDeg(((deg % 360) + 360) % 360);
  }, []);

  const handleToggleFwd = () => {
    setControls((prev) => ({ ...prev, enableFwd: !prev.enableFwd }));
  };

  // Reset defaults handler
  const handleResetDefaults = () => {
    setGrid({
      vRms: 230,
      frequency: 50,
      sourceInductanceLs: 0.0015,
      sourceResistanceRs: 0.05,
    });
    setSemi({
      vf0: 1.0,
      rd: 0.015,
      trr: 2e-6,
      qrr: 25e-6,
      latchingCurrentIl: 0.15,
      holdingCurrentIh: 0.08,
      turnOffTimeTq: 40e-6,
      enableSnubber: true,
      snubberRs: 47,
      snubberCs: 100e-9,
    });
    setLoad({
      type: 'RL',
      r: 15,
      l: 0.035,
      e: 15,
      c: 220e-6,
    });
    setControls({
      firingAngleAlpha: 30,
      pwmModulationIndex: 0.85,
      pwmCarrierFreq: 1500,
      dualConverterMode: 'non_circulating',
      quadrantTarget: 1,
      enableFwd: true,
    });
    setPhaseDeg(0);
  };

  // CSV Vector Export
  const handleExportCsv = () => {
    const headers = [
      'phase_deg',
      'time_ms',
      'vs_V',
      'vo_V',
      'is_A',
      'io_A',
      'vt1_V',
      'ig1_A',
      'active_pair',
      'overlap_commutation',
    ];
    const rows = simulationResult.steps.map((s) => [
      s.wtDeg.toFixed(2),
      (s.time * 1000).toFixed(4),
      s.vs.toFixed(2),
      s.vo.toFixed(2),
      s.is.toFixed(3),
      s.io.toFixed(3),
      s.vt1.toFixed(2),
      s.ig1,
      s.activePairName,
      s.isOverlapping ? 1 : 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `powerlab_${topology.toLowerCase()}_waveforms.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. STUDIO HEADER & PLAYBACK CONSOLE */}
      <HeaderConsole
        topology={topology}
        onSelectTopology={setTopology}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onRestart={handleRestart}
        animSpeed={animSpeed}
        onChangeSpeed={setAnimSpeed}
        onOpenDerivations={() => setShowDerivations(true)}
        onOpenParkVector={() => setShowParkVector(true)}
        onOpenSpiceNetlist={() => setShowSpiceNetlist(true)}
        onExportCsv={handleExportCsv}
        onResetAll={handleResetDefaults}
      />

      {/* MAIN SCIENTIFIC LABORATORY WORKSPACE */}
      <main className="flex-1 p-3 md:p-4 space-y-4 max-w-[1720px] mx-auto w-full">
        {/* UPPER ROW: Complete Vector Schematic & Multi-Channel Oscilloscope with Active Pair Bar */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Quadrant 1: Dynamic Vector Schematic Canvas */}
          <div className="flex flex-col">
            <SchematicCanvas
              topology={topology}
              currentStep={currentStep}
              metrics={simulationResult.metrics}
              grid={grid}
              semi={semi}
              load={load}
              controls={controls}
              onToggleFwd={handleToggleFwd}
            />
          </div>

          {/* Quadrant 2: Multi-Channel Digital Oscilloscope with Active Pair Bar */}
          <div className="flex flex-col">
            <OscilloscopeView
              steps={simulationResult.steps}
              currentStepIndex={currentStepIndex}
              harmonics={simulationResult.harmonicsSourceCurrent}
              metrics={simulationResult.metrics}
              onScrubPhase={handleScrubPhase}
            />
          </div>
        </div>

        {/* MIDDLE SECTION: 3-Panel Parametric Controls */}
        <div>
          <ParametricControls
            topology={topology}
            onSelectTopology={setTopology}
            grid={grid}
            semi={semi}
            load={load}
            controls={controls}
            currentStep={currentStep}
            onChangeGrid={(g) => setGrid((prev) => ({ ...prev, ...g }))}
            onChangeSemi={(s) => setSemi((prev) => ({ ...prev, ...s }))}
            onChangeLoad={(l) => setLoad((prev) => ({ ...prev, ...l }))}
            onChangeControls={(c) => setControls((prev) => ({ ...prev, ...c }))}
          />
        </div>

        {/* BOTTOM SECTION: 6 Metric Cards & Analytical Formula Banner */}
        <div>
          <PhysicalMetricsGrid
            topology={topology}
            metrics={simulationResult.metrics}
            grid={grid}
            controls={controls}
          />
        </div>
      </main>

      {/* VIEW MODALS */}
      <LatexDerivationsModal
        isOpen={showDerivations}
        onClose={() => setShowDerivations(false)}
        topology={topology}
      />

      <ParkVectorModal
        isOpen={showParkVector}
        onClose={() => setShowParkVector(false)}
        result={simulationResult}
        currentStep={currentStep}
      />

      <SpiceNetlistModal
        isOpen={showSpiceNetlist}
        onClose={() => setShowSpiceNetlist(false)}
        topology={topology}
        grid={grid}
        semi={semi}
        load={load}
        controls={controls}
      />
    </div>
  );
}
