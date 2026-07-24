import assert from 'node:assert/strict';
import { SimulationEngine } from '../client/src/lib/simulation';
import type { CircuitComponent, CircuitWire } from '../client/src/lib/circuitTypes';

type Props = Record<string, unknown>;

function component(id: string, type: string, label: string, props: Props = {}): CircuitComponent {
  return { id, type, label, props, x: 0, y: 0, rotation: 0, flipH: false, flipV: false };
}

function wire(id: string, fromComp: string, fromTerm: string, toComp: string, toTerm: string): CircuitWire {
  return { id, fromComp, fromTerm, toComp, toTerm, routing: 'straight', path: [[0, 0], [1, 1]] };
}

function run(engine: SimulationEngine, seconds: number, increments = 100) {
  for (let index = 0; index < increments; index += 1) engine.step(seconds / increments);
  return engine.getSnapshot();
}

function close(actual: number, expected: number, tolerance: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected} ± ${tolerance}; received ${actual}`);
}

function validateDcDividerAndDmm() {
  const engine = new SimulationEngine();
  engine.setCircuit([
    component('v1', 'dc-voltage', 'V1', { voltage: 12, internalR: 0.01 }),
    component('r1', 'resistor', 'R1', { resistance: 1000 }),
    component('r2', 'resistor', 'R2', { resistance: 1000 }),
    component('g1', 'ground', 'GND1'),
    component('dmm', 'dmm', 'DMM1', { mode: 'DCV', range: 'auto' }),
  ], [
    wire('w1', 'v1', 'pos', 'r1', 'a'),
    wire('w2', 'r1', 'b', 'r2', 'a'),
    wire('w3', 'r1', 'b', 'dmm', 'hi'),
    wire('w4', 'v1', 'neg', 'r2', 'b'),
    wire('w5', 'v1', 'neg', 'g1', 'gnd'),
    wire('w6', 'v1', 'neg', 'dmm', 'com'),
  ]);
  const snapshot = run(engine, 0.03, 30);
  close(snapshot.instrumentReadings.dmm.value, 6, 0.03, 'DC divider DMM voltage');
  close(Math.abs(snapshot.branchCurrents.r1), 0.006, 0.00005, 'DC divider branch current');

  const limited = new SimulationEngine();
  limited.setCircuit([
    component('v1', 'dc-voltage', 'V1', { voltage: 12, internalR: 0.01 }),
    component('g1', 'ground', 'GND1'),
    component('dmm', 'dmm', 'DMM1', { mode: 'DCV', range: '2' }),
  ], [
    wire('w1', 'v1', 'neg', 'g1', 'gnd'),
    wire('w2', 'v1', 'pos', 'dmm', 'hi'),
    wire('w3', 'v1', 'neg', 'dmm', 'com'),
  ]);
  const limitedSnapshot = run(limited, 0.02, 20);
  assert.equal(limitedSnapshot.instrumentReadings.dmm.status, 'overflow', 'DMM should flag a voltage above its selected range');
  assert.equal(snapshot.converged, true, 'DC divider should converge');
}

function validateAcRmsAndScope() {
  const engine = new SimulationEngine();
  engine.setCircuit([
    component('v1', 'ac-voltage', 'V1', { amplitude: 10, frequency: 50, phase: 0, offset: 0, waveform: 'sine' }),
    component('r1', 'resistor', 'R1', { resistance: 1000 }),
    component('g1', 'ground', 'GND1'),
    component('dmm', 'dmm', 'DMM1', { mode: 'ACV', range: 'auto' }),
    component('osc', 'oscilloscope', 'OSC1', { timebase: 0.08, samples: 500 }),
  ], [
    wire('w1', 'v1', 'pos', 'r1', 'a'),
    wire('w2', 'v1', 'neg', 'r1', 'b'),
    wire('w3', 'v1', 'neg', 'g1', 'gnd'),
    wire('w4', 'v1', 'pos', 'dmm', 'hi'),
    wire('w5', 'v1', 'neg', 'dmm', 'com'),
    wire('w6', 'v1', 'pos', 'osc', 'ch1'),
    wire('w7', 'v1', 'neg', 'osc', 'gnd'),
  ]);
  const snapshot = run(engine, 0.24, 120);
  close(snapshot.instrumentReadings.dmm.value, Math.sqrt(50), 0.12, 'DMM true AC RMS');
  const scope = snapshot.instrumentReadings['osc:ch1'];
  assert.equal(scope.status, 'ready', 'scope CH1 should be probe-linked');
  close(scope.value, Math.sqrt(50), 0.12, 'scope CH1 RMS');
  close(scope.frequency ?? 0, 50, 1.5, 'scope frequency');
  assert.ok((scope.samples?.length ?? 0) > 20, 'scope should retain sampled trace data');
}

function validateThreePhaseSource() {
  const engine = new SimulationEngine();
  engine.setCircuit([
    component('v3', 'three-phase-source', 'V31', { lineVoltage: 400, frequency: 50, phaseSequence: 'ABC', internalR: 0.05 }),
    component('g1', 'ground', 'GND1'),
    component('dmm', 'dmm', 'DMM1', { mode: 'ACV', range: 'auto' }),
    component('r1', 'resistor', 'R1', { resistance: 1000 }),
  ], [
    wire('w1', 'v3', 'n', 'g1', 'gnd'),
    wire('w2', 'v3', 'l1', 'dmm', 'hi'),
    wire('w3', 'v3', 'n', 'dmm', 'com'),
    wire('w4', 'v3', 'l1', 'r1', 'a'),
    wire('w5', 'v3', 'n', 'r1', 'b'),
  ]);
  const snapshot = run(engine, 0.24, 120);
  close(snapshot.instrumentReadings.dmm.value, 400 / Math.sqrt(3), 2, '3-phase L-N RMS');

  const lineToLine = new SimulationEngine();
  lineToLine.setCircuit([
    component('v3', 'three-phase-source', 'V31', { lineVoltage: 400, frequency: 50, phaseSequence: 'ABC', internalR: 0.05 }),
    component('dmm', 'dmm', 'DMM1', { mode: 'ACV', range: 'auto' }),
  ], [
    wire('w1', 'v3', 'l1', 'dmm', 'hi'),
    wire('w2', 'v3', 'l2', 'dmm', 'com'),
  ]);
  const lineToLineSnapshot = run(lineToLine, 0.24, 120);
  close(lineToLineSnapshot.instrumentReadings.dmm.value, 400, 3, '3-phase L-L RMS');
}

function validateAuxiliaryContactControl() {
  const engine = new SimulationEngine();
  engine.setCircuit([
    component('v1', 'dc-rail', 'V1', { voltage: 24, internalR: 0.05 }),
    component('g1', 'ground', 'GND1'),
    component('k1', 'contactor', 'K1', { coilVoltage: 24 }),
    component('aux', 'aux-contact-no', 'K2', { linkedTo: 'K1' }),
    component('h1', 'lamp', 'H1', { ratedV: 24, ratedPower: 24 }),
  ], [
    wire('w1', 'v1', 'neg', 'g1', 'gnd'),
    wire('w2', 'v1', 'pos', 'k1', 'coil+'),
    wire('w3', 'v1', 'neg', 'k1', 'coil-'),
    wire('w4', 'v1', 'pos', 'aux', 'a'),
    wire('w5', 'aux', 'b', 'h1', 'a'),
    wire('w6', 'h1', 'b', 'v1', 'neg'),
  ]);
  const snapshot = run(engine, 0.05, 50);
  assert.equal(snapshot.componentPowered.k1, true, 'contactor coil should energize');
  assert.equal(snapshot.componentPowered.aux, true, 'linked auxiliary NO contact should close');
  assert.equal(snapshot.componentPowered.h1, true, 'load after auxiliary contact should receive power');
  assert.ok(snapshot.componentIntensity.h1 > 0.8, 'lamp intensity should follow powered voltage');
}

function validatePotentiometerAndResistanceMeasurement() {
  const divider = new SimulationEngine();
  divider.setCircuit([
    component('v1', 'dc-voltage', 'V1', { voltage: 10, internalR: 0.01 }),
    component('rv1', 'potentiometer', 'RV1', { resistance: 10000, wiper: 0.25, taper: 'linear' }),
    component('g1', 'ground', 'GND1'),
    component('dmm', 'dmm', 'DMM1', { mode: 'DCV', range: 'auto' }),
  ], [
    wire('w1', 'v1', 'pos', 'rv1', 'a'),
    wire('w2', 'v1', 'neg', 'rv1', 'b'),
    wire('w3', 'v1', 'neg', 'g1', 'gnd'),
    wire('w4', 'rv1', 'wiper', 'dmm', 'hi'),
    wire('w5', 'v1', 'neg', 'dmm', 'com'),
  ]);
  const dividerSnapshot = run(divider, 0.03, 30);
  close(dividerSnapshot.instrumentReadings.dmm.value, 7.5, 0.04, 'potentiometer wiper voltage');

  const ohmmeter = new SimulationEngine();
  ohmmeter.setCircuit([
    component('r1', 'resistor', 'R1', { resistance: 1000 }),
    component('dmm', 'dmm', 'DMM1', { mode: 'OHM', range: 'auto' }),
  ], [
    wire('w1', 'dmm', 'hi', 'r1', 'a'),
    wire('w2', 'dmm', 'com', 'r1', 'b'),
  ]);
  const ohmSnapshot = run(ohmmeter, 0.02, 20);
  close(ohmSnapshot.instrumentReadings.dmm.value, 1000, 0.5, 'DMM resistance measurement');
}

validateDcDividerAndDmm();
validateAcRmsAndScope();
validateThreePhaseSource();
validateAuxiliaryContactControl();
validatePotentiometerAndResistanceMeasurement();
console.log('Simulation validation passed: DC, RMS, scope, 3-phase, control contacts, potentiometer, and resistance measurement.');
