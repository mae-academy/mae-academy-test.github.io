/**
 * ElectroLab – IEEE 315 / IEC 60617 SVG Symbol Renderer
 * Each symbol is drawn centered at (0,0).
 * Terminals are at the exact boundary of the symbol.
 */

import React from 'react';

interface SymbolProps {
  powered?: boolean;
  props?: Record<string, any>;
  animTime?: number; // 0..1 for motor rotation etc.
}

type SymbolFC = React.FC<SymbolProps>;

// ─── SOURCES ─────────────────────────────────────────────────────────────────

const DcVoltage: SymbolFC = () => (
  <g>
    <circle cx={0} cy={0} r={22} fill="white" stroke="#1a2744" strokeWidth={2} />
    {/* + symbol at top, - at bottom */}
    <line x1={-6} y1={-8} x2={6} y2={-8} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={-14} x2={0} y2={-2} stroke="#1a2744" strokeWidth={2} />
    <line x1={-6} y1={8} x2={6} y2={8} stroke="#1a2744" strokeWidth={2} />
    {/* wire stubs to boundary */}
    <line x1={0} y1={-22} x2={0} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={22} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const AcVoltage: SymbolFC = ({ props }) => {
  const wf = (props?.waveform as string) || 'sine';
  const waveSymbols: Record<string, React.ReactNode> = {
    sine: <path d="M -10,-8 Q -5,-16 0,-8 Q 5,0 10,-8" fill="none" stroke="#1a2744" strokeWidth={1.5} />,
    square: <path d="M -10,-14 L -10,-4 L 0,-4 L 0,-14 L 10,-14 L 10,-4" fill="none" stroke="#1a2744" strokeWidth={1.5} />,
    sawtooth: <path d="M -10,-4 L 0,-14 L 0,-4 L 10,-14" fill="none" stroke="#1a2744" strokeWidth={1.5} />,
    triangle: <path d="M -10,-4 L -5,-14 L 0,-4 L 5,-14 L 10,-4" fill="none" stroke="#1a2744" strokeWidth={1.5} />,
  };
  const waveSymbol = waveSymbols[wf] || null;
  return (
    <g>
      <circle cx={0} cy={0} r={22} fill="white" stroke="#1a2744" strokeWidth={2} />
      {waveSymbol}
      <line x1={0} y1={-22} x2={0} y2={-30} stroke="#1a2744" strokeWidth={2} />
      <line x1={0} y1={22} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
    </g>
  );
};

const DcCurrent: SymbolFC = () => (
  <g>
    <circle cx={0} cy={0} r={22} fill="white" stroke="#1a2744" strokeWidth={2} />
    {/* Arrow pointing up */}
    <line x1={0} y1={12} x2={0} y2={-12} stroke="#1a2744" strokeWidth={2} />
    <polyline points="-6,-6 0,-14 6,-6" fill="none" stroke="#1a2744" strokeWidth={2} strokeLinejoin="round" />
    <line x1={0} y1={-22} x2={0} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={22} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const AcCurrent: SymbolFC = () => (
  <g>
    <circle cx={0} cy={0} r={22} fill="white" stroke="#1a2744" strokeWidth={2} />
    <path d="M -10,-4 Q -5,-14 0,-4 Q 5,6 10,-4" fill="none" stroke="#1a2744" strokeWidth={1.5} />
    <polyline points="-4,-10 0,-16 4,-10" fill="none" stroke="#1a2744" strokeWidth={1.5} strokeLinejoin="round" />
    <line x1={0} y1={-22} x2={0} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={22} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const DcRail: SymbolFC = ({ props }) => (
  <g>
    <rect x={-30} y={-14} width={60} height={28} rx={4} fill="#eff6ff" stroke="#1a2744" strokeWidth={2} />
    <line x1={-40} y1={0} x2={-30} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={30} y1={0} x2={40} y2={0} stroke="#1a2744" strokeWidth={2} />
    <text x={0} y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1a2744">{String(props?.voltage ?? 24)} V DC</text>
  </g>
);

const ThreePhaseSource: SymbolFC = ({ props }) => {
  const voltage = Number(props?.lineVoltage ?? 400);
  const label = `${voltage} V 3~`;
  return (
    <g>
      <rect x={-22} y={-37} width={54} height={74} rx={8} fill="#fff7ed" stroke="#1a2744" strokeWidth={2} />
      <text x={5} y={-10} textAnchor="middle" fontSize={13} fontWeight={700} fill="#b45309">3~</text>
      <text x={5} y={8} textAnchor="middle" fontSize={7} fill="#1a2744">{label}</text>
      {[-30, -10, 10, 30].map((y, index) => (
        <g key={y}>
          <line x1={-40} y1={y} x2={-22} y2={y} stroke="#1a2744" strokeWidth={2} />
          <text x={-18} y={y + 3} fontSize={7} fill="#1a2744">{['L1', 'L2', 'L3', 'N'][index]}</text>
        </g>
      ))}
    </g>
  );
};

const Ground: SymbolFC = () => (
  <g>
    <line x1={0} y1={-15} x2={0} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={-12} y1={0} x2={12} y2={0} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-8} y1={5} x2={8} y2={5} stroke="#1a2744" strokeWidth={2} />
    <line x1={-4} y1={10} x2={4} y2={10} stroke="#1a2744" strokeWidth={2} />
  </g>
);

// ─── PASSIVE ──────────────────────────────────────────────────────────────────

const Resistor: SymbolFC = () => (
  <g>
    <line x1={-30} y1={0} x2={-15} y2={0} stroke="#1a2744" strokeWidth={2} />
    <rect x={-15} y={-8} width={30} height={16} fill="white" stroke="#1a2744" strokeWidth={2} rx={2} />
    <line x1={15} y1={0} x2={30} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Capacitor: SymbolFC = () => (
  <g>
    <line x1={0} y1={-30} x2={0} y2={-6} stroke="#1a2744" strokeWidth={2} />
    <line x1={-14} y1={-6} x2={14} y2={-6} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-14} y1={6} x2={14} y2={6} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={0} y1={6} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Inductor: SymbolFC = () => (
  <g>
    <line x1={-30} y1={0} x2={-18} y2={0} stroke="#1a2744" strokeWidth={2} />
    <path d="M -18,0 Q -15,-10 -9,-10 Q -3,-10 0,-10 Q 6,-10 9,-10 Q 15,-10 18,0" fill="none" stroke="#1a2744" strokeWidth={2} />
    <line x1={18} y1={0} x2={30} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Potentiometer: SymbolFC = ({ props }) => {
  const position = Math.max(0, Math.min(1, Number(props?.wiper ?? 0.5)));
  const y = -20 + position * 40;
  return (
    <g>
      <line x1={-35} y1={-20} x2={-18} y2={-20} stroke="#1a2744" strokeWidth={2} />
      <line x1={-35} y1={20} x2={-18} y2={20} stroke="#1a2744" strokeWidth={2} />
      <rect x={-18} y={-24} width={36} height={48} rx={3} fill="white" stroke="#1a2744" strokeWidth={2} />
      <line x1={-10} y1={-18} x2={10} y2={18} stroke="#1a2744" strokeWidth={1.5} opacity={0.35} />
      <line x1={35} y1={0} x2={18} y2={y} stroke="#1a2744" strokeWidth={2} />
      <polygon points={`${18},${y} ${25},${y - 4} ${25},${y + 4}`} fill="#1a2744" />
      <line x1={18} y1={-20} x2={18} y2={20} stroke="#1a2744" strokeWidth={1.5} />
    </g>
  );
};

// ─── DIODES ───────────────────────────────────────────────────────────────────

const DiodeBase: SymbolFC = ({ powered, props }) => {
  const isLed = props?._type === 'led';
  const isZener = props?._type === 'zener';
  const isPhoto = props?._type === 'photodiode';
  const ledColor = isLed ? (props?.color || 'red') : null;
  const ledColors: Record<string, string> = {
    white: '#fff', red: '#ff2020', amber: '#ffbf00', orange: '#ff6600',
    yellow: '#ffff00', green: '#00e040', blue: '#0080ff', violet: '#8000ff',
  };
  const glowColor = ledColor ? ledColors[ledColor] || '#ff2020' : null;
  const intensity = Math.max(0, Math.min(1, Number(props?._intensity ?? (powered ? 1 : 0))));
  const emissionOpacity = 0.25 + intensity * 0.75;

  return (
    <g>
      <line x1={-20} y1={0} x2={-8} y2={0} stroke="#1a2744" strokeWidth={2} />
      {/* Triangle body */}
      <polygon points="-8,-10 -8,10 10,0" fill={powered && isLed ? glowColor! : 'white'} fillOpacity={powered && isLed ? emissionOpacity : 1} stroke="#1a2744" strokeWidth={2} />
      {/* Cathode bar */}
      {isZener ? (
        <path d="M 10,-12 L 10,12 M 10,-12 L 16,-18 M 10,12 L 4,18" fill="none" stroke="#1a2744" strokeWidth={2} />
      ) : (
        <line x1={10} y1={-12} x2={10} y2={12} stroke="#1a2744" strokeWidth={2} />
      )}
      <line x1={10} y1={0} x2={20} y2={0} stroke="#1a2744" strokeWidth={2} />
      {/* LED emission arrows */}
      {isLed && (
        <>
          <line x1={14} y1={-14} x2={22} y2={-22} stroke={powered ? glowColor! : '#888'} strokeOpacity={powered ? emissionOpacity : 1} strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1={8} y1={-18} x2={16} y2={-26} stroke={powered ? glowColor! : '#888'} strokeOpacity={powered ? emissionOpacity : 1} strokeWidth={1.5} markerEnd="url(#arrow)" />
        </>
      )}
      {/* Photodiode incoming arrows */}
      {isPhoto && (
        <>
          <line x1={22} y1={-22} x2={14} y2={-14} stroke="#888" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1={16} y1={-26} x2={8} y2={-18} stroke="#888" strokeWidth={1.5} markerEnd="url(#arrow)" />
        </>
      )}
      {/* Glow when powered */}
      {isLed && powered && (
        <circle cx={0} cy={0} r={14 + intensity * 11} fill={glowColor!} fillOpacity={0.04 + intensity * 0.20} pointerEvents="none" />
      )}
    </g>
  );
};

// ─── TRANSISTORS ──────────────────────────────────────────────────────────────

const BjtNpn: SymbolFC = () => (
  <g>
    {/* Base lead */}
    <line x1={-20} y1={0} x2={-6} y2={0} stroke="#1a2744" strokeWidth={2} />
    {/* Vertical base line */}
    <line x1={-6} y1={-22} x2={-6} y2={22} stroke="#1a2744" strokeWidth={3} />
    {/* Collector */}
    <line x1={-6} y1={-12} x2={10} y2={-24} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={-24} x2={10} y2={-30} stroke="#1a2744" strokeWidth={2} />
    {/* Emitter with arrow */}
    <line x1={-6} y1={12} x2={10} y2={24} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={24} x2={10} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* Arrow on emitter (NPN: pointing away) */}
    <polygon points="4,18 12,26 14,16" fill="#1a2744" />
    {/* Collector/emitter stubs to boundary */}
    <line x1={10} y1={-30} x2={20} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={30} x2={20} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const BjtPnp: SymbolFC = () => (
  <g>
    <line x1={-20} y1={0} x2={-6} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={-6} y1={-22} x2={-6} y2={22} stroke="#1a2744" strokeWidth={3} />
    <line x1={-6} y1={-12} x2={10} y2={-24} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={-24} x2={10} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={-6} y1={12} x2={10} y2={24} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={24} x2={10} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* Arrow on emitter (PNP: pointing toward base) */}
    <polygon points="-2,8 6,16 -4,18" fill="#1a2744" />
    <line x1={10} y1={-30} x2={20} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={30} x2={20} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const MosfetN: SymbolFC = () => (
  <g>
    {/* Gate */}
    <line x1={-20} y1={0} x2={-10} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={-10} y1={-18} x2={-10} y2={18} stroke="#1a2744" strokeWidth={2.5} />
    {/* Channel */}
    <line x1={-5} y1={-18} x2={-5} y2={-8} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-5} y1={-4} x2={-5} y2={4} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-5} y1={8} x2={-5} y2={18} stroke="#1a2744" strokeWidth={2.5} />
    {/* Drain */}
    <line x1={-5} y1={-18} x2={10} y2={-18} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={-18} x2={10} y2={-30} stroke="#1a2744" strokeWidth={2} />
    {/* Source with arrow */}
    <line x1={-5} y1={18} x2={10} y2={18} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={18} x2={10} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* N-ch arrow pointing inward */}
    <polygon points="-5,0 5,5 5,-5" fill="#1a2744" />
    <line x1={10} y1={-30} x2={20} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={30} x2={20} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const MosfetP: SymbolFC = () => (
  <g>
    <line x1={-20} y1={0} x2={-10} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={-10} y1={-18} x2={-10} y2={18} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-5} y1={-18} x2={-5} y2={-8} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-5} y1={-4} x2={-5} y2={4} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-5} y1={8} x2={-5} y2={18} stroke="#1a2744" strokeWidth={2.5} />
    <line x1={-5} y1={-18} x2={10} y2={-18} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={-18} x2={10} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={-5} y1={18} x2={10} y2={18} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={18} x2={10} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* P-ch arrow pointing outward */}
    <polygon points="-5,0 -15,5 -15,-5" fill="#1a2744" />
    <line x1={10} y1={-30} x2={20} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={30} x2={20} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const JfetN: SymbolFC = () => (
  <g>
    <line x1={-20} y1={0} x2={-5} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={-5} y1={-22} x2={-5} y2={22} stroke="#1a2744" strokeWidth={3} />
    <line x1={-5} y1={-14} x2={10} y2={-14} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={-14} x2={10} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={-5} y1={14} x2={10} y2={14} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={14} x2={10} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* N-ch arrow on gate pointing in */}
    <polygon points="-5,0 3,4 3,-4" fill="#1a2744" />
    <line x1={10} y1={-30} x2={20} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={30} x2={20} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const JfetP: SymbolFC = () => (
  <g>
    <line x1={-20} y1={0} x2={-5} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={-5} y1={-22} x2={-5} y2={22} stroke="#1a2744" strokeWidth={3} />
    <line x1={-5} y1={-14} x2={10} y2={-14} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={-14} x2={10} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={-5} y1={14} x2={10} y2={14} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={14} x2={10} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* P-ch arrow on gate pointing out */}
    <polygon points="-5,0 -13,4 -13,-4" fill="#1a2744" />
    <line x1={10} y1={-30} x2={20} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={10} y1={30} x2={20} y2={30} stroke="#1a2744" strokeWidth={2} />
  </g>
);

// ─── SWITCHES ─────────────────────────────────────────────────────────────────

const SwSpstNo: SymbolFC = ({ props }) => {
  const closed = props?.state === 'closed';
  return (
    <g>
      <line x1={-25} y1={0} x2={-8} y2={0} stroke="#1a2744" strokeWidth={2} />
      {closed
        ? <line x1={-8} y1={0} x2={8} y2={0} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={0} x2={8} y2={-12} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={8} y1={0} x2={25} y2={0} stroke="#1a2744" strokeWidth={2} />
      <circle cx={-8} cy={0} r={2.5} fill="#1a2744" />
      <circle cx={8} cy={0} r={2.5} fill="#1a2744" />
    </g>
  );
};

const SwSpstNc: SymbolFC = ({ props }) => {
  const open = props?.state === 'open';
  return (
    <g>
      <line x1={-25} y1={0} x2={-8} y2={0} stroke="#1a2744" strokeWidth={2} />
      {open
        ? <line x1={-8} y1={0} x2={8} y2={-12} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={0} x2={8} y2={0} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={8} y1={0} x2={25} y2={0} stroke="#1a2744" strokeWidth={2} />
      <circle cx={-8} cy={0} r={2.5} fill="#1a2744" />
      <circle cx={8} cy={0} r={2.5} fill="#1a2744" />
      {/* NC marker */}
      <line x1={-4} y1={-14} x2={4} y2={-14} stroke="#1a2744" strokeWidth={1.5} />
    </g>
  );
};

const SwSpdt: SymbolFC = ({ props }) => {
  const state = props?.state || 'a';
  return (
    <g>
      <line x1={-30} y1={0} x2={-8} y2={0} stroke="#1a2744" strokeWidth={2} />
      {state === 'a'
        ? <line x1={-8} y1={0} x2={18} y2={-15} stroke="#1a2744" strokeWidth={2} />
        : state === 'b'
          ? <line x1={-8} y1={0} x2={18} y2={15} stroke="#1a2744" strokeWidth={2} />
          : <line x1={-8} y1={0} x2={8} y2={-10} stroke="#1a2744" strokeWidth={2} />
      }
      <circle cx={-8} cy={0} r={2.5} fill="#1a2744" />
      <circle cx={18} cy={-15} r={2.5} fill="#1a2744" />
      <circle cx={18} cy={15} r={2.5} fill="#1a2744" />
      <line x1={18} y1={-15} x2={30} y2={-15} stroke="#1a2744" strokeWidth={2} />
      <line x1={18} y1={15} x2={30} y2={15} stroke="#1a2744" strokeWidth={2} />
    </g>
  );
};

const SwDpst: SymbolFC = ({ props }) => {
  const closed = props?.state === 'closed';
  return (
    <g>
      {/* Pole 1 */}
      <line x1={-30} y1={-15} x2={-8} y2={-15} stroke="#1a2744" strokeWidth={2} />
      {closed
        ? <line x1={-8} y1={-15} x2={8} y2={-15} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={-15} x2={8} y2={-25} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={8} y1={-15} x2={30} y2={-15} stroke="#1a2744" strokeWidth={2} />
      {/* Pole 2 */}
      <line x1={-30} y1={15} x2={-8} y2={15} stroke="#1a2744" strokeWidth={2} />
      {closed
        ? <line x1={-8} y1={15} x2={8} y2={15} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={15} x2={8} y2={5} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={8} y1={15} x2={30} y2={15} stroke="#1a2744" strokeWidth={2} />
      {/* Mechanical link */}
      <line x1={0} y1={-15} x2={0} y2={15} stroke="#1a2744" strokeWidth={1} strokeDasharray="3,2" />
    </g>
  );
};

const SwDpdt: SymbolFC = ({ props }) => {
  const state = props?.state || 'a';
  return (
    <g>
      {/* Pole 1 */}
      <line x1={-35} y1={-15} x2={-8} y2={-15} stroke="#1a2744" strokeWidth={2} />
      {state === 'a'
        ? <line x1={-8} y1={-15} x2={22} y2={-25} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={-15} x2={22} y2={-5} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={22} y1={-25} x2={35} y2={-25} stroke="#1a2744" strokeWidth={2} />
      <line x1={22} y1={-5} x2={35} y2={-5} stroke="#1a2744" strokeWidth={2} />
      {/* Pole 2 */}
      <line x1={-35} y1={15} x2={-8} y2={15} stroke="#1a2744" strokeWidth={2} />
      {state === 'a'
        ? <line x1={-8} y1={15} x2={22} y2={5} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={15} x2={22} y2={25} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={22} y1={5} x2={35} y2={5} stroke="#1a2744" strokeWidth={2} />
      <line x1={22} y1={25} x2={35} y2={25} stroke="#1a2744" strokeWidth={2} />
      <line x1={0} y1={-15} x2={0} y2={15} stroke="#1a2744" strokeWidth={1} strokeDasharray="3,2" />
    </g>
  );
};

const PbNo: SymbolFC = ({ props }) => {
  const pressed = props?.state === 'pressed';
  return (
    <g>
      <line x1={-20} y1={0} x2={-6} y2={0} stroke="#1a2744" strokeWidth={2} />
      {pressed
        ? <line x1={-6} y1={0} x2={6} y2={0} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-6} y1={0} x2={6} y2={-10} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={6} y1={0} x2={20} y2={0} stroke="#1a2744" strokeWidth={2} />
      {/* Actuator */}
      <line x1={0} y1={pressed ? -12 : -16} x2={0} y2={-20} stroke="#1a2744" strokeWidth={2} />
      <line x1={-6} y1={-20} x2={6} y2={-20} stroke="#1a2744" strokeWidth={2} />
      <circle cx={-6} cy={0} r={2} fill="#1a2744" />
      <circle cx={6} cy={0} r={2} fill="#1a2744" />
    </g>
  );
};

const PbNc: SymbolFC = ({ props }) => {
  const pressed = props?.state === 'pressed';
  return (
    <g>
      <line x1={-20} y1={0} x2={-6} y2={0} stroke="#1a2744" strokeWidth={2} />
      {pressed
        ? <line x1={-6} y1={0} x2={6} y2={-10} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-6} y1={0} x2={6} y2={0} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={6} y1={0} x2={20} y2={0} stroke="#1a2744" strokeWidth={2} />
      <line x1={0} y1={pressed ? -12 : -16} x2={0} y2={-20} stroke="#1a2744" strokeWidth={2} />
      <line x1={-6} y1={-20} x2={6} y2={-20} stroke="#1a2744" strokeWidth={2} />
      {/* NC diagonal bar */}
      <line x1={-4} y1={-14} x2={4} y2={-14} stroke="#1a2744" strokeWidth={1.5} />
      <circle cx={-6} cy={0} r={2} fill="#1a2744" />
      <circle cx={6} cy={0} r={2} fill="#1a2744" />
    </g>
  );
};

// ─── PROTECTION ───────────────────────────────────────────────────────────────

const RelaySpst: SymbolFC = ({ powered }) => (
  <g>
    {/* Coil */}
    <rect x={-20} y={-35} width={40} height={20} fill="white" stroke="#1a2744" strokeWidth={2} rx={2} />
    <path d="M -14,-35 Q -10,-45 -6,-35 Q -2,-45 2,-35 Q 6,-45 10,-35 Q 14,-45 18,-35" fill="none" stroke="#1a2744" strokeWidth={1.5} />
    <line x1={-30} y1={-25} x2={-20} y2={-25} stroke="#1a2744" strokeWidth={2} />
    <line x1={20} y1={-25} x2={30} y2={-25} stroke="#1a2744" strokeWidth={2} />
    {/* Contact */}
    <line x1={-30} y1={35} x2={-8} y2={35} stroke="#1a2744" strokeWidth={2} />
    {powered
      ? <line x1={-8} y1={35} x2={8} y2={35} stroke="#1a2744" strokeWidth={2} />
      : <line x1={-8} y1={35} x2={8} y2={25} stroke="#1a2744" strokeWidth={2} />
    }
    <line x1={8} y1={35} x2={30} y2={35} stroke="#1a2744" strokeWidth={2} />
    <circle cx={-8} cy={35} r={2.5} fill="#1a2744" />
    <circle cx={8} cy={35} r={2.5} fill="#1a2744" />
  </g>
);

const Fuse: SymbolFC = () => (
  <g>
    <line x1={-25} y1={0} x2={-12} y2={0} stroke="#1a2744" strokeWidth={2} />
    <rect x={-12} y={-8} width={24} height={16} fill="white" stroke="#1a2744" strokeWidth={2} rx={3} />
    <line x1={-8} y1={0} x2={8} y2={0} stroke="#1a2744" strokeWidth={1.5} strokeDasharray="3,2" />
    <line x1={12} y1={0} x2={25} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const CircuitBreaker: SymbolFC = ({ props }) => {
  const tripped = props?.state === 'tripped';
  return (
    <g>
      <line x1={-25} y1={0} x2={-8} y2={0} stroke="#1a2744" strokeWidth={2} />
      {tripped
        ? <line x1={-8} y1={0} x2={8} y2={-12} stroke="#1a2744" strokeWidth={2} />
        : <line x1={-8} y1={0} x2={8} y2={0} stroke="#1a2744" strokeWidth={2} />
      }
      <line x1={8} y1={0} x2={25} y2={0} stroke="#1a2744" strokeWidth={2} />
      {/* Breaker symbol */}
      <rect x={-8} y={-8} width={16} height={16} fill="none" stroke="#1a2744" strokeWidth={1.5} rx={2} />
      <circle cx={-8} cy={0} r={2.5} fill="#1a2744" />
      <circle cx={8} cy={0} r={2.5} fill="#1a2744" />
    </g>
  );
};

const Contactor: SymbolFC = ({ powered }) => (
  <g>
    {/* Coil */}
    <rect x={-25} y={-60} width={50} height={20} fill="white" stroke="#1a2744" strokeWidth={2} rx={2} />
    <path d="M -18,-60 Q -14,-70 -10,-60 Q -6,-70 -2,-60 Q 2,-70 6,-60 Q 10,-70 14,-60 Q 18,-70 22,-60" fill="none" stroke="#1a2744" strokeWidth={1.5} />
    <line x1={-40} y1={-50} x2={-25} y2={-50} stroke="#1a2744" strokeWidth={2} />
    <line x1={25} y1={-50} x2={40} y2={-50} stroke="#1a2744" strokeWidth={2} />
    {/* Main contacts L1-T1, L2-T2, L3-T3 */}
    {[0, 20, 40].map((y, i) => (
      <g key={i}>
        <line x1={-40} y1={y} x2={-12} y2={y} stroke="#1a2744" strokeWidth={2} />
        {powered
          ? <line x1={-12} y1={y} x2={12} y2={y} stroke="#1a2744" strokeWidth={2} />
          : <line x1={-12} y1={y} x2={12} y2={y - 8} stroke="#1a2744" strokeWidth={2} />
        }
        <line x1={12} y1={y} x2={40} y2={y} stroke="#1a2744" strokeWidth={2} />
      </g>
    ))}
    {/* Auxiliary NO 13-14 */}
    <line x1={-40} y1={50} x2={-12} y2={50} stroke="#1a2744" strokeWidth={1.5} />
    {powered ? <line x1={-12} y1={50} x2={12} y2={50} stroke="#1a2744" strokeWidth={1.5} /> : <line x1={-12} y1={50} x2={12} y2={42} stroke="#1a2744" strokeWidth={1.5} />}
    <line x1={12} y1={50} x2={40} y2={50} stroke="#1a2744" strokeWidth={1.5} />
    {/* Auxiliary NC 21-22 */}
    <line x1={-40} y1={65} x2={-12} y2={65} stroke="#1a2744" strokeWidth={1.5} />
    {!powered ? <line x1={-12} y1={65} x2={12} y2={65} stroke="#1a2744" strokeWidth={1.5} /> : <line x1={-12} y1={65} x2={12} y2={57} stroke="#1a2744" strokeWidth={1.5} />}
    <line x1={12} y1={65} x2={40} y2={65} stroke="#1a2744" strokeWidth={1.5} />
  </g>
);

// ─── TRANSFORMERS ─────────────────────────────────────────────────────────────

const Transformer: SymbolFC = () => (
  <g>
    {/* Primary coil */}
    {[-20, -8, 4].map((y, i) => (
      <path key={i} d={`M -35,${y} Q -28,${y - 10} -22,${y} Q -16,${y + 10} -10,${y}`} fill="none" stroke="#1a2744" strokeWidth={2} />
    ))}
    <line x1={-35} y1={-20} x2={-35} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={-35} y1={4} x2={-35} y2={20} stroke="#1a2744" strokeWidth={2} />
    {/* Core */}
    <line x1={-6} y1={-25} x2={-6} y2={25} stroke="#1a2744" strokeWidth={3} />
    <line x1={6} y1={-25} x2={6} y2={25} stroke="#1a2744" strokeWidth={3} />
    {/* Secondary coil */}
    {[-20, -8, 4].map((y, i) => (
      <path key={i} d={`M 10,${y} Q 16,${y - 10} 22,${y} Q 28,${y + 10} 35,${y}`} fill="none" stroke="#1a2744" strokeWidth={2} />
    ))}
    <line x1={35} y1={-20} x2={35} y2={-30} stroke="#1a2744" strokeWidth={2} />
    <line x1={35} y1={4} x2={35} y2={20} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const TransformerCt: SymbolFC = () => (
  <g>
    {[-25, -10, 5].map((y, i) => (
      <path key={i} d={`M -35,${y} Q -28,${y - 10} -22,${y} Q -16,${y + 10} -10,${y}`} fill="none" stroke="#1a2744" strokeWidth={2} />
    ))}
    <line x1={-35} y1={-25} x2={-35} y2={-35} stroke="#1a2744" strokeWidth={2} />
    <line x1={-35} y1={5} x2={-35} y2={25} stroke="#1a2744" strokeWidth={2} />
    <line x1={-6} y1={-30} x2={-6} y2={30} stroke="#1a2744" strokeWidth={3} />
    <line x1={6} y1={-30} x2={6} y2={30} stroke="#1a2744" strokeWidth={3} />
    {[-25, -10, 5].map((y, i) => (
      <path key={i} d={`M 10,${y} Q 16,${y - 10} 22,${y} Q 28,${y + 10} 35,${y}`} fill="none" stroke="#1a2744" strokeWidth={2} />
    ))}
    <line x1={35} y1={-25} x2={35} y2={-35} stroke="#1a2744" strokeWidth={2} />
    {/* Center tap */}
    <line x1={35} y1={-10} x2={45} y2={-10} stroke="#1a2744" strokeWidth={2} />
    <line x1={35} y1={5} x2={35} y2={25} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Autotransformer: SymbolFC = () => (
  <g>
    {[-25, -10, 5].map((y, i) => (
      <path key={i} d={`M -30,${y} Q -22,${y - 10} -15,${y} Q -8,${y + 10} 0,${y}`} fill="none" stroke="#1a2744" strokeWidth={2} />
    ))}
    <line x1={-30} y1={-25} x2={-30} y2={-35} stroke="#1a2744" strokeWidth={2} />
    <line x1={-30} y1={5} x2={-30} y2={25} stroke="#1a2744" strokeWidth={2} />
    {/* Tap */}
    <line x1={0} y1={-10} x2={30} y2={-10} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={5} x2={30} y2={5} stroke="#1a2744" strokeWidth={2} />
  </g>
);

// ─── POWER SEMICONDUCTORS ─────────────────────────────────────────────────────

const Scr: SymbolFC = () => (
  <g>
    {/* Anode-cathode vertical */}
    <line x1={0} y1={-30} x2={0} y2={-10} stroke="#1a2744" strokeWidth={2} />
    <polygon points="-10,-10 10,-10 0,10" fill="white" stroke="#1a2744" strokeWidth={2} />
    <line x1={-12} y1={10} x2={12} y2={10} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={10} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
    {/* Gate */}
    <line x1={-20} y1={15} x2={0} y2={15} stroke="#1a2744" strokeWidth={2} />
    {/* Cathode bar extensions (SCR marker) */}
    <line x1={10} y1={10} x2={16} y2={16} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Diac: SymbolFC = () => (
  <g>
    <line x1={-20} y1={0} x2={-8} y2={0} stroke="#1a2744" strokeWidth={2} />
    {/* Two back-to-back triangles */}
    <polygon points="-8,-10 -8,10 8,0" fill="white" stroke="#1a2744" strokeWidth={2} />
    <polygon points="8,-10 8,10 -8,0" fill="white" stroke="#1a2744" strokeWidth={2} />
    <line x1={-8} y1={-12} x2={-8} y2={12} stroke="#1a2744" strokeWidth={2} />
    <line x1={8} y1={-12} x2={8} y2={12} stroke="#1a2744" strokeWidth={2} />
    <line x1={8} y1={0} x2={20} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Triac: SymbolFC = () => (
  <g>
    <line x1={0} y1={-30} x2={0} y2={-10} stroke="#1a2744" strokeWidth={2} />
    <polygon points="-10,-10 10,-10 0,10" fill="white" stroke="#1a2744" strokeWidth={2} />
    <polygon points="-10,10 10,10 0,-10" fill="white" stroke="#1a2744" strokeWidth={2} />
    <line x1={-12} y1={-10} x2={12} y2={-10} stroke="#1a2744" strokeWidth={2} />
    <line x1={-12} y1={10} x2={12} y2={10} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={10} x2={0} y2={30} stroke="#1a2744" strokeWidth={2} />
    <line x1={-20} y1={15} x2={0} y2={15} stroke="#1a2744" strokeWidth={2} />
  </g>
);

// ─── MOTORS & LAMPS ───────────────────────────────────────────────────────────

const MotorDc: SymbolFC = ({ powered, animTime = 0 }) => {
  const angle = powered ? animTime * 360 : 0;
  return (
    <g>
      <circle cx={0} cy={0} r={25} fill="white" stroke="#1a2744" strokeWidth={2} />
      <text x={0} y={5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1a2744">M</text>
      {/* Rotating indicator */}
      {powered && (
        <line
          x1={0} y1={0}
          x2={18 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={18 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#08b58d" strokeWidth={2.5}
        />
      )}
      <line x1={-30} y1={0} x2={-25} y2={0} stroke="#1a2744" strokeWidth={2} />
      <line x1={25} y1={0} x2={30} y2={0} stroke="#1a2744" strokeWidth={2} />
    </g>
  );
};

const Motor3Phase: SymbolFC = ({ powered, animTime = 0 }) => {
  const angle = powered ? animTime * 360 : 0;
  return (
    <g>
      <circle cx={0} cy={0} r={28} fill="white" stroke="#1a2744" strokeWidth={2} />
      <text x={0} y={5} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1a2744">3~M</text>
      {powered && (
        <line
          x1={0} y1={0}
          x2={20 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={20 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#08b58d" strokeWidth={2.5}
        />
      )}
      <line x1={-30} y1={-20} x2={-28} y2={-20} stroke="#1a2744" strokeWidth={2} />
      <line x1={-30} y1={0} x2={-28} y2={0} stroke="#1a2744" strokeWidth={2} />
      <line x1={-30} y1={20} x2={-28} y2={20} stroke="#1a2744" strokeWidth={2} />
      <line x1={28} y1={0} x2={30} y2={0} stroke="#1a2744" strokeWidth={2} />
    </g>
  );
};

const Lamp: SymbolFC = ({ powered }) => (
  <g>
    <circle cx={0} cy={0} r={18} fill={powered ? '#fffde0' : 'white'} stroke="#1a2744" strokeWidth={2} />
    <line x1={-12} y1={-12} x2={12} y2={12} stroke="#1a2744" strokeWidth={2} />
    <line x1={12} y1={-12} x2={-12} y2={12} stroke="#1a2744" strokeWidth={2} />
    {powered && <circle cx={0} cy={0} r={22} fill="#ffff80" fillOpacity={0.3} />}
    <line x1={-20} y1={0} x2={-18} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={18} y1={0} x2={20} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

// ─── OP-AMP ───────────────────────────────────────────────────────────────────

const Opamp: SymbolFC = () => (
  <g>
    <polygon points="-30,-30 -30,30 30,0" fill="white" stroke="#1a2744" strokeWidth={2} />
    {/* + input */}
    <line x1={-30} y1={-15} x2={-20} y2={-15} stroke="#1a2744" strokeWidth={2} />
    <text x={-16} y={-11} fontSize={10} fill="#1a2744">+</text>
    {/* − input */}
    <line x1={-30} y1={15} x2={-20} y2={15} stroke="#1a2744" strokeWidth={2} />
    <text x={-16} y={19} fontSize={10} fill="#1a2744">−</text>
    {/* Output */}
    <line x1={30} y1={0} x2={40} y2={0} stroke="#1a2744" strokeWidth={2} />
    {/* Supply */}
    <line x1={0} y1={-30} x2={0} y2={-18} stroke="#1a2744" strokeWidth={1.5} strokeDasharray="3,2" />
    <line x1={0} y1={30} x2={0} y2={18} stroke="#1a2744" strokeWidth={1.5} strokeDasharray="3,2" />
  </g>
);

// ─── MEASUREMENT ──────────────────────────────────────────────────────────────

const Voltmeter: SymbolFC = () => (
  <g>
    <circle cx={0} cy={0} r={22} fill="white" stroke="#1a2744" strokeWidth={2} />
    <text x={0} y={5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1a2744">V</text>
    <line x1={-25} y1={0} x2={-22} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={22} y1={0} x2={25} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

const Ammeter: SymbolFC = () => (
  <g>
    <circle cx={0} cy={0} r={22} fill="white" stroke="#1a2744" strokeWidth={2} />
    <text x={0} y={5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1a2744">A</text>
    <line x1={-25} y1={0} x2={-22} y2={0} stroke="#1a2744" strokeWidth={2} />
    <line x1={22} y1={0} x2={25} y2={0} stroke="#1a2744" strokeWidth={2} />
  </g>
);

// ─── RELAY VARIANTS ─────────────────────────────────────────────────────────

const RelaySpdt: SymbolFC = ({ powered }) => (
  <g>
    {/* Coil */}
    <rect x={-20} y={-35} width={40} height={20} fill="white" stroke="#1a2744" strokeWidth={2} rx={2} />
    <path d="M -14,-35 Q -10,-45 -6,-35 Q -2,-45 2,-35 Q 6,-45 10,-35 Q 14,-45 18,-35" fill="none" stroke="#1a2744" strokeWidth={1.5} />
    <line x1={-30} y1={-25} x2={-20} y2={-25} stroke="#1a2744" strokeWidth={2} />
    <line x1={20} y1={-25} x2={30} y2={-25} stroke="#1a2744" strokeWidth={2} />
    {/* Common contact */}
    <line x1={-30} y1={20} x2={-8} y2={20} stroke="#1a2744" strokeWidth={2} />
    {/* Throw A (NO) */}
    {powered
      ? <line x1={-8} y1={20} x2={8} y2={20} stroke="#1a2744" strokeWidth={2} />
      : <line x1={-8} y1={20} x2={8} y2={10} stroke="#1a2744" strokeWidth={2} />
    }
    <line x1={8} y1={10} x2={30} y2={10} stroke="#1a2744" strokeWidth={2} />
    {/* Throw B (NC) */}
    <line x1={8} y1={30} x2={30} y2={30} stroke="#1a2744" strokeWidth={2} />
    <circle cx={-8} cy={20} r={2.5} fill="#1a2744" />
    <circle cx={8} cy={10} r={2.5} fill="#1a2744" />
    <circle cx={8} cy={30} r={2.5} fill="#1a2744" />
  </g>
);

const RelayDpst: SymbolFC = ({ powered }) => (
  <g>
    {/* Coil */}
    <rect x={-20} y={-50} width={40} height={20} fill="white" stroke="#1a2744" strokeWidth={2} rx={2} />
    <path d="M -14,-50 Q -10,-60 -6,-50 Q -2,-60 2,-50 Q 6,-60 10,-50 Q 14,-60 18,-50" fill="none" stroke="#1a2744" strokeWidth={1.5} />
    <line x1={-30} y1={-40} x2={-20} y2={-40} stroke="#1a2744" strokeWidth={2} />
    <line x1={20} y1={-40} x2={30} y2={-40} stroke="#1a2744" strokeWidth={2} />
    {/* Contact 1 */}
    <line x1={-30} y1={10} x2={-8} y2={10} stroke="#1a2744" strokeWidth={2} />
    {powered
      ? <line x1={-8} y1={10} x2={8} y2={10} stroke="#1a2744" strokeWidth={2} />
      : <line x1={-8} y1={10} x2={8} y2={0} stroke="#1a2744" strokeWidth={2} />
    }
    <line x1={8} y1={10} x2={30} y2={10} stroke="#1a2744" strokeWidth={2} />
    {/* Contact 2 */}
    <line x1={-30} y1={35} x2={-8} y2={35} stroke="#1a2744" strokeWidth={2} />
    {powered
      ? <line x1={-8} y1={35} x2={8} y2={35} stroke="#1a2744" strokeWidth={2} />
      : <line x1={-8} y1={35} x2={8} y2={25} stroke="#1a2744" strokeWidth={2} />
    }
    <line x1={8} y1={35} x2={30} y2={35} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={10} x2={0} y2={35} stroke="#1a2744" strokeWidth={1} strokeDasharray="3,2" />
    <circle cx={-8} cy={10} r={2.5} fill="#1a2744" />
    <circle cx={8} cy={10} r={2.5} fill="#1a2744" />
    <circle cx={-8} cy={35} r={2.5} fill="#1a2744" />
    <circle cx={8} cy={35} r={2.5} fill="#1a2744" />
  </g>
);

const DmmSymbol: SymbolFC = ({ props }) => (
  <g>
    <rect x={-34} y={-40} width={68} height={70} rx={8} fill="#303b33" stroke="#1a2744" strokeWidth={2} />
    <rect x={-25} y={-30} width={50} height={22} rx={3} fill="#d8f3dc" stroke="#1a2744" strokeWidth={1} />
    <text x={0} y={-16} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#166534">{String(props?.mode ?? 'DCV')}</text>
    <circle cx={0} cy={8} r={12} fill="#4b5563" stroke="#d1d5db" strokeWidth={1.5} />
    <line x1={-45} y1={35} x2={-18} y2={25} stroke="#1a2744" strokeWidth={2} />
    <line x1={45} y1={35} x2={18} y2={25} stroke="#1a2744" strokeWidth={2} />
    <circle cx={-18} cy={25} r={4} fill="#dc2626" />
    <circle cx={18} cy={25} r={4} fill="#111827" />
  </g>
);

const OscilloscopeSymbol: SymbolFC = () => (
  <g>
    <rect x={-42} y={-38} width={84} height={70} rx={6} fill="#334155" stroke="#1a2744" strokeWidth={2} />
    <rect x={-26} y={-28} width={48} height={35} fill="#0f172a" stroke="#94a3b8" strokeWidth={1} />
    <path d="M -23,-10 C -16,-27 -8,3 0,-10 S 16,-27 20,-9" fill="none" stroke="#38bdf8" strokeWidth={1.5} />
    {[-30, -10, 10, 30].map((y, index) => <line key={y} x1={-55} y1={y} x2={-42} y2={y} stroke="#1a2744" strokeWidth={2} />)}
    <line x1={55} y1={30} x2={42} y2={24} stroke="#1a2744" strokeWidth={2} />
    <circle cx={42} cy={24} r={4} fill="#111827" />
  </g>
);

const RelayDpdt: SymbolFC = ({ powered }) => (
  <g>
    {/* Coil */}
    <rect x={-20} y={-55} width={40} height={20} fill="white" stroke="#1a2744" strokeWidth={2} rx={2} />
    <path d="M -14,-55 Q -10,-65 -6,-55 Q -2,-65 2,-55 Q 6,-65 10,-55 Q 14,-65 18,-55" fill="none" stroke="#1a2744" strokeWidth={1.5} />
    <line x1={-30} y1={-45} x2={-20} y2={-45} stroke="#1a2744" strokeWidth={2} />
    <line x1={20} y1={-45} x2={30} y2={-45} stroke="#1a2744" strokeWidth={2} />
    {/* Pole 1 common */}
    <line x1={-35} y1={5} x2={-8} y2={5} stroke="#1a2744" strokeWidth={2} />
    {powered
      ? <line x1={-8} y1={5} x2={8} y2={5} stroke="#1a2744" strokeWidth={2} />
      : <line x1={-8} y1={5} x2={8} y2={-5} stroke="#1a2744" strokeWidth={2} />
    }
    <line x1={8} y1={-5} x2={35} y2={-5} stroke="#1a2744" strokeWidth={2} />
    <line x1={8} y1={15} x2={35} y2={15} stroke="#1a2744" strokeWidth={2} />
    {/* Pole 2 common */}
    <line x1={-35} y1={35} x2={-8} y2={35} stroke="#1a2744" strokeWidth={2} />
    {powered
      ? <line x1={-8} y1={35} x2={8} y2={35} stroke="#1a2744" strokeWidth={2} />
      : <line x1={-8} y1={35} x2={8} y2={25} stroke="#1a2744" strokeWidth={2} />
    }
    <line x1={8} y1={25} x2={35} y2={25} stroke="#1a2744" strokeWidth={2} />
    <line x1={8} y1={45} x2={35} y2={45} stroke="#1a2744" strokeWidth={2} />
    <line x1={0} y1={5} x2={0} y2={35} stroke="#1a2744" strokeWidth={1} strokeDasharray="3,2" />
    <circle cx={-8} cy={5} r={2.5} fill="#1a2744" />
    <circle cx={-8} cy={35} r={2.5} fill="#1a2744" />
  </g>
);

// ─── SYMBOL MAP ───────────────────────────────────────────────────────────────

export const SYMBOL_MAP: Record<string, SymbolFC> = {
  'dc-voltage': DcVoltage,
  'dc-rail': DcRail,
  'ac-voltage': AcVoltage,
  'three-phase-source': ThreePhaseSource,
  'three-phase-rail': ThreePhaseSource,
  'dc-current': DcCurrent,
  'ac-current': AcCurrent,
  'ground': Ground,
  'resistor': Resistor,
  'potentiometer': Potentiometer,
  'capacitor': Capacitor,
  'inductor': Inductor,
  'diode': DiodeBase,
  'diode-ideal': DiodeBase,
  'diode-silicon': DiodeBase,
  'diode-germanium': DiodeBase,
  'diode-gaas': DiodeBase,
  'zener': (p) => <DiodeBase {...p} props={{ ...p.props, _type: 'zener' }} />,
  'led': (p) => <DiodeBase {...p} props={{ ...p.props, _type: 'led' }} />,
  'photodiode': (p) => <DiodeBase {...p} props={{ ...p.props, _type: 'photodiode' }} />,
  'bjt-npn': BjtNpn,
  'bjt-pnp': BjtPnp,
  'mosfet-n': MosfetN,
  'mosfet-p': MosfetP,
  'jfet-n': JfetN,
  'jfet-p': JfetP,
  'sw-spst-no': SwSpstNo,
  'sw-spst-nc': SwSpstNc,
  'sw-spdt': SwSpdt,
  'sw-dpst': SwDpst,
  'sw-dpdt': SwDpdt,
  'pb-no': PbNo,
  'pb-nc': PbNc,
  'aux-contact-no': SwSpstNo,
  'aux-contact-nc': SwSpstNc,
  'relay-spst': RelaySpst,
  'relay-spdt': RelaySpdt,
  'relay-dpst': RelayDpst,
  'relay-dpdt': RelayDpdt,
  'contactor': Contactor,
  'fuse': Fuse,
  'circuit-breaker': CircuitBreaker,
  'transformer': Transformer,
  'transformer-ct': TransformerCt,
  'autotransformer': Autotransformer,
  'scr': Scr,
  'diac': Diac,
  'triac': Triac,
  'motor-dc': MotorDc,
  'motor-3phase': Motor3Phase,
  'lamp': Lamp,
  'opamp': Opamp,
  'voltmeter': Voltmeter,
  'ammeter': Ammeter,
  'dmm': DmmSymbol,
  'oscilloscope': OscilloscopeSymbol,
};

export function renderSymbol(
  symbolId: string,
  powered: boolean,
  props: Record<string, any>,
  animTime: number,
): React.ReactNode {
  const Sym = SYMBOL_MAP[symbolId];
  if (!Sym) return <text x={0} y={5} textAnchor="middle" fontSize={10} fill="#666">?</text>;
  return <Sym powered={powered} props={props} animTime={animTime} />;
}
