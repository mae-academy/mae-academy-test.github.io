import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Cable,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Grid3X3,
  Info,
  Minus,
  Move,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
  Search,
  Settings2,
  Sun,
  Trash2,
  Type,
  Zap,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  CATEGORIES,
  getComponentsByCategory,
  getDef,
  type ComponentDef,
  type PropertyDef,
} from '@/lib/componentDefs';
import {
  componentPrefix,
  copyComponentForPaste,
  formatEngineering,
  nextComponentLabel,
  terminalKey,
  type CircuitComponent,
  type CircuitWire,
  type InstrumentReading,
  type Selection,
  type SimulationSnapshot,
  type WorkspaceText,
} from '@/lib/circuitTypes';
import { SimulationEngine } from '@/lib/simulation';
import { renderSymbol } from '@/lib/symbols';
import {
  addWireCorner,
  getDotsOnPath,
  getTerminalWorldPos,
  isNearTerminal,
  moveWireCorner,
  nearestWireCorner,
  pathLength,
  pointsToPath,
  reconnectPathEndpoints,
  reversedPath,
  routePath,
  snapPointToGrid,
  snapToGrid,
  type Point,
} from '@/lib/wiring';

const GRID_SIZE = 20;
const TERMINAL_HIT_RADIUS = 13;
const TERMINAL_RADIUS = 4;
const EMPTY_SNAPSHOT: SimulationSnapshot = {
  time: 0,
  nodeVoltages: {},
  terminalVoltages: {},
  branchCurrents: {},
  wireCurrents: {},
  componentPowered: {},
  componentIntensity: {},
  nodeHistory: {},
  branchHistory: {},
  instrumentReadings: {},
  warnings: [],
  converged: true,
};

type DragState =
  | { kind: 'component'; id: string; offset: Point }
  | { kind: 'text'; id: string; offset: Point }
  | { kind: 'wireCorner'; id: string; corner: number }
  | { kind: 'pan'; client: Point }
  | null;

interface WiringState {
  from?: { componentId: string; terminalId: string; position: Point };
}

function numeric(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultProps(definition: ComponentDef): Record<string, unknown> {
  return Object.fromEntries(Object.entries(definition.properties).map(([key, definition]) => [key, definition.value]));
}

function getComponentTerminalPosition(component: CircuitComponent, terminalId: string): Point | null {
  const definition = getDef(component.type);
  const terminal = definition?.terminals.find(item => item.id === terminalId);
  if (!terminal) return null;
  return getTerminalWorldPos(
    component.x,
    component.y,
    terminal.x,
    terminal.y,
    component.rotation,
    component.flipH,
    component.flipV,
  );
}

function currentWireEndpoints(wire: CircuitWire, components: CircuitComponent[]): { from: Point; to: Point } | null {
  const fromComponent = components.find(component => component.id === wire.fromComp);
  const toComponent = components.find(component => component.id === wire.toComp);
  if (!fromComponent || !toComponent) return null;
  const from = getComponentTerminalPosition(fromComponent, wire.fromTerm);
  const to = getComponentTerminalPosition(toComponent, wire.toTerm);
  return from && to ? { from, to } : null;
}

function refreshWireEndpoints(wires: CircuitWire[], components: CircuitComponent[]): CircuitWire[] {
  return wires.map(wire => {
    const endpoints = currentWireEndpoints(wire, components);
    if (!endpoints) return wire;
    return { ...wire, path: reconnectPathEndpoints(wire.path, endpoints.from, endpoints.to, wire.routing) };
  });
}

function sourcePointFromElement(element: SVGSVGElement | null, pan: Point, zoom: number): Point {
  const rect = element?.getBoundingClientRect();
  if (!rect) return [300, 220];
  return [(rect.width / 2 - pan[0]) / zoom, (rect.height / 2 - pan[1]) / zoom];
}

export default function Home() {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<CircuitWire[]>([]);
  const [texts, setTexts] = useState<WorkspaceText[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [clipboardComponent, setClipboardComponent] = useState<CircuitComponent | null>(null);
  const [pan, setPan] = useState<Point>([0, 0]);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [wiring, setWiring] = useState<WiringState>({});
  const [dragState, setDragState] = useState<DragState>(null);
  const [cursor, setCursor] = useState<Point>([0, 0]);
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(EMPTY_SNAPSHOT);
  const [animationTime, setAnimationTime] = useState(0);
  const [darkPreview, setDarkPreview] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const simulation = useRef(new SimulationEngine());
  const animationFrame = useRef<number | null>(null);
  const componentRef = useRef(components);
  componentRef.current = components;

  const colors = darkPreview
    ? {
      background: '#0f172a', canvas: '#111827', panel: '#172033', panelAlt: '#202b3d', line: '#334155', text: '#e2e8f0', muted: '#94a3b8', subtle: '#475569', primary: '#38bdf8', accent: '#14b8a6', danger: '#fb7185', selection: '#38bdf8', grid: '#273449', wire: '#60a5fa', powered: '#2dd4bf', input: '#0f172a', shadow: '0 12px 28px rgba(0,0,0,0.28)',
    }
    : {
      background: '#eef4fb', canvas: '#f8fbff', panel: '#ffffff', panelAlt: '#f5f9fd', line: '#d7e2ef', text: '#172033', muted: '#64748b', subtle: '#94a3b8', primary: '#0369a1', accent: '#0f766e', danger: '#be123c', selection: '#0284c7', grid: '#dbe7f3', wire: '#2563eb', powered: '#059669', input: '#ffffff', shadow: '0 12px 28px rgba(15,23,42,0.10)',
    };

  const selectedComponent = selection?.kind === 'component'
    ? components.find(component => component.id === selection.id)
    : undefined;
  const selectedWire = selection?.kind === 'wire'
    ? wires.find(wire => wire.id === selection.id)
    : undefined;
  const selectedText = selection?.kind === 'text'
    ? texts.find(text => text.id === selection.id)
    : undefined;

  const clientToWorld = useCallback((clientX: number, clientY: number): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [(clientX - rect.left - pan[0]) / zoom, (clientY - rect.top - pan[1]) / zoom];
  }, [pan, zoom]);

  const findTerminalAt = useCallback((point: Point): { componentId: string; terminalId: string; position: Point } | null => {
    for (const component of [...componentRef.current].reverse()) {
      const definition = getDef(component.type);
      if (!definition) continue;
      for (const terminal of definition.terminals) {
        const position = getComponentTerminalPosition(component, terminal.id);
        if (position && isNearTerminal(point[0], point[1], position[0], position[1], TERMINAL_HIT_RADIUS)) {
          return { componentId: component.id, terminalId: terminal.id, position };
        }
      }
    }
    return null;
  }, []);

  const findComponentAt = useCallback((point: Point): CircuitComponent | null => {
    for (const component of [...componentRef.current].reverse()) {
      const definition = getDef(component.type);
      if (!definition) continue;
      const dx = point[0] - component.x;
      const dy = point[1] - component.y;
      const radians = (-component.rotation * Math.PI) / 180;
      const localX = dx * Math.cos(radians) - dy * Math.sin(radians);
      const localY = dx * Math.sin(radians) + dy * Math.cos(radians);
      const flippedX = component.flipH ? -localX : localX;
      const flippedY = component.flipV ? -localY : localY;
      if (Math.abs(flippedX) <= definition.width / 2 + 10 && Math.abs(flippedY) <= definition.height / 2 + 16) return component;
    }
    return null;
  }, []);

  const addComponent = useCallback((type: string, x?: number, y?: number) => {
    const definition = getDef(type);
    if (!definition) return;
    const origin = sourcePointFromElement(svgRef.current, pan, zoom);
    const targetX = x ?? origin[0];
    const targetY = y ?? origin[1];
    const position = snapEnabled ? snapPointToGrid([targetX, targetY], GRID_SIZE) : [targetX, targetY];
    const component: CircuitComponent = {
      id: nanoid(10),
      type,
      x: position[0],
      y: position[1],
      rotation: 0,
      flipH: false,
      flipV: false,
      label: nextComponentLabel(type, components),
      props: defaultProps(definition),
    };
    setComponents(previous => [...previous, component]);
    setSelection({ kind: 'component', id: component.id });
    toast.success(`${component.label} added`);
  }, [components, pan, snapEnabled, zoom]);

  const addText = useCallback(() => {
    const origin = sourcePointFromElement(svgRef.current, pan, zoom);
    const text: WorkspaceText = {
      id: nanoid(10),
      x: snapEnabled ? snapToGrid(origin[0], GRID_SIZE) : origin[0],
      y: snapEnabled ? snapToGrid(origin[1], GRID_SIZE) : origin[1],
      text: 'Text label',
      fontSize: 16,
      color: darkPreview ? '#e2e8f0' : '#172033',
      rotation: 0,
    };
    setTexts(previous => [...previous, text]);
    setSelection({ kind: 'text', id: text.id });
  }, [darkPreview, pan, snapEnabled, zoom]);

  const removeSelection = useCallback(() => {
    if (!selection) return;
    if (selection.kind === 'component') {
      setComponents(previous => previous.filter(component => component.id !== selection.id));
      setWires(previous => previous.filter(wire => wire.fromComp !== selection.id && wire.toComp !== selection.id));
    }
    if (selection.kind === 'wire') setWires(previous => previous.filter(wire => wire.id !== selection.id));
    if (selection.kind === 'text') setTexts(previous => previous.filter(text => text.id !== selection.id));
    setSelection(null);
  }, [selection]);

  const copySelection = useCallback(() => {
    if (!selectedComponent) return;
    setClipboardComponent(structuredClone(selectedComponent));
    toast.success(`${selectedComponent.label} copied`);
  }, [selectedComponent]);

  const cutSelection = useCallback(() => {
    if (!selectedComponent) return;
    setClipboardComponent(structuredClone(selectedComponent));
    removeSelection();
    toast.success(`${selectedComponent.label} cut`);
  }, [removeSelection, selectedComponent]);

  const pasteComponent = useCallback(() => {
    if (!clipboardComponent) return;
    const source = sourcePointFromElement(svgRef.current, pan, zoom);
    const position: Point = snapEnabled
      ? snapPointToGrid([source[0] + GRID_SIZE * 2, source[1] + GRID_SIZE * 2], GRID_SIZE)
      : [source[0] + GRID_SIZE * 2, source[1] + GRID_SIZE * 2];
    const pasted = copyComponentForPaste(
      clipboardComponent,
      nanoid(10),
      nextComponentLabel(clipboardComponent.type, components),
      position[0],
      position[1],
    );
    setComponents(previous => [...previous, pasted]);
    setSelection({ kind: 'component', id: pasted.id });
    toast.success(`${pasted.label} pasted`);
  }, [clipboardComponent, components, pan, snapEnabled, zoom]);

  const moveSelected = useCallback((dx: number, dy: number) => {
    if (selectedComponent) {
      const nextComponents = components.map(component => {
        if (component.id !== selectedComponent.id) return component;
        const next = snapEnabled
          ? snapPointToGrid([component.x + dx, component.y + dy], GRID_SIZE)
          : [component.x + dx, component.y + dy];
        return { ...component, x: next[0], y: next[1] };
      });
      setComponents(nextComponents);
      setWires(previous => refreshWireEndpoints(previous, nextComponents));
      return;
    }
    if (selectedText) {
      setTexts(previous => previous.map(text => text.id === selectedText.id
        ? { ...text, x: text.x + dx, y: text.y + dy }
        : text));
    }
  }, [components, selectedComponent, selectedText, snapEnabled]);

  const rotateSelected = useCallback((degrees: number) => {
    if (!selectedComponent) return;
    const nextComponents = components.map(component => component.id === selectedComponent.id
      ? { ...component, rotation: (component.rotation + degrees + 360) % 360 }
      : component);
    setComponents(nextComponents);
    setWires(previous => refreshWireEndpoints(previous, nextComponents));
  }, [components, selectedComponent]);

  const flipSelected = useCallback((axis: 'h' | 'v') => {
    if (!selectedComponent) return;
    const nextComponents = components.map(component => component.id === selectedComponent.id
      ? { ...component, flipH: axis === 'h' ? !component.flipH : component.flipH, flipV: axis === 'v' ? !component.flipV : component.flipV }
      : component);
    setComponents(nextComponents);
    setWires(previous => refreshWireEndpoints(previous, nextComponents));
  }, [components, selectedComponent]);

  const updateComponent = useCallback((id: string, update: Partial<CircuitComponent>) => {
    const nextComponents = components.map(component => component.id === id ? { ...component, ...update } : component);
    setComponents(nextComponents);
    if ('rotation' in update || 'flipH' in update || 'flipV' in update || 'x' in update || 'y' in update) {
      setWires(previous => refreshWireEndpoints(previous, nextComponents));
    }
  }, [components]);

  const updateComponentProperty = useCallback((key: string, value: unknown) => {
    if (!selectedComponent) return;
    setComponents(previous => previous.map(component => component.id === selectedComponent.id
      ? { ...component, props: { ...component.props, [key]: value } }
      : component));
  }, [selectedComponent]);

  const updateText = useCallback((update: Partial<WorkspaceText>) => {
    if (!selectedText) return;
    setTexts(previous => previous.map(text => text.id === selectedText.id ? { ...text, ...update } : text));
  }, [selectedText]);

  const addWireBetween = useCallback((from: WiringState['from'], target: { componentId: string; terminalId: string; position: Point }) => {
    if (!from) return;
    if (from.componentId === target.componentId && from.terminalId === target.terminalId) return;
    const duplicate = wires.some(wire => (
      wire.fromComp === from.componentId && wire.fromTerm === from.terminalId && wire.toComp === target.componentId && wire.toTerm === target.terminalId
    ) || (
      wire.fromComp === target.componentId && wire.fromTerm === target.terminalId && wire.toComp === from.componentId && wire.toTerm === from.terminalId
    ));
    if (duplicate) {
      toast.message('These terminals are already connected');
      setWiring({});
      return;
    }
    const routing = 'orthogonal';
    const wire: CircuitWire = {
      id: nanoid(10),
      fromComp: from.componentId,
      fromTerm: from.terminalId,
      toComp: target.componentId,
      toTerm: target.terminalId,
      routing,
      path: routePath(from.position, target.position, routing),
    };
    setWires(previous => [...previous, wire]);
    setSelection({ kind: 'wire', id: wire.id });
    setWiring({});
    toast.success('Wire connected');
  }, [wires]);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const point = clientToWorld(event.clientX, event.clientY);
    setCursor(point);
    if (event.button === 1 || event.altKey) {
      event.preventDefault();
      setDragState({ kind: 'pan', client: [event.clientX, event.clientY] });
      return;
    }
    if (event.button !== 0) return;

    const terminal = findTerminalAt(point);
    if (terminal) {
      if (!wiring.from) setWiring({ from: terminal });
      else addWireBetween(wiring.from, terminal);
      return;
    }

    if (wiring.from) {
      setWiring({});
      return;
    }

    const component = findComponentAt(point);
    if (component) {
      setSelection({ kind: 'component', id: component.id });
      setDragState({ kind: 'component', id: component.id, offset: [point[0] - component.x, point[1] - component.y] });
      return;
    }

    setSelection(null);
    setDragState({ kind: 'pan', client: [event.clientX, event.clientY] });
  }, [addWireBetween, clientToWorld, findComponentAt, findTerminalAt, wiring.from]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const point = clientToWorld(event.clientX, event.clientY);
    setCursor(point);
    if (!dragState) return;
    if (dragState.kind === 'pan') {
      const dx = event.clientX - dragState.client[0];
      const dy = event.clientY - dragState.client[1];
      setPan(previous => [previous[0] + dx, previous[1] + dy]);
      setDragState({ kind: 'pan', client: [event.clientX, event.clientY] });
      return;
    }
    if (dragState.kind === 'component') {
      const position = snapEnabled
        ? snapPointToGrid([point[0] - dragState.offset[0], point[1] - dragState.offset[1]], GRID_SIZE)
        : [point[0] - dragState.offset[0], point[1] - dragState.offset[1]];
      const nextComponents = componentRef.current.map(component => component.id === dragState.id
        ? { ...component, x: position[0], y: position[1] }
        : component);
      setComponents(nextComponents);
      setWires(previous => refreshWireEndpoints(previous, nextComponents));
      return;
    }
    if (dragState.kind === 'text') {
      const position = snapEnabled
        ? snapPointToGrid([point[0] - dragState.offset[0], point[1] - dragState.offset[1]], GRID_SIZE)
        : [point[0] - dragState.offset[0], point[1] - dragState.offset[1]];
      setTexts(previous => previous.map(text => text.id === dragState.id ? { ...text, x: position[0], y: position[1] } : text));
      return;
    }
    if (dragState.kind === 'wireCorner') {
      const position = snapEnabled ? snapPointToGrid(point, GRID_SIZE) : point;
      setWires(previous => previous.map(wire => wire.id === dragState.id
        ? { ...wire, routing: 'manual', path: moveWireCorner(wire.path, dragState.corner, position) }
        : wire));
    }
  }, [clientToWorld, dragState, snapEnabled]);

  const handleCanvasMouseUp = useCallback(() => setDragState(null), []);

  const handleWireMouseDown = useCallback((event: React.MouseEvent<SVGPathElement>, wire: CircuitWire) => {
    event.stopPropagation();
    setSelection({ kind: 'wire', id: wire.id });
  }, []);

  const handleWireDoubleClick = useCallback((event: React.MouseEvent<SVGPathElement>, wire: CircuitWire) => {
    event.stopPropagation();
    const point = snapEnabled ? snapPointToGrid(clientToWorld(event.clientX, event.clientY), GRID_SIZE) : clientToWorld(event.clientX, event.clientY);
    setWires(previous => previous.map(current => current.id === wire.id
      ? { ...current, routing: 'manual', path: addWireCorner(current.path, point) }
      : current));
    setSelection({ kind: 'wire', id: wire.id });
  }, [clientToWorld, snapEnabled]);

  const handleTextMouseDown = useCallback((event: React.MouseEvent<SVGTextElement>, text: WorkspaceText) => {
    event.stopPropagation();
    const point = clientToWorld(event.clientX, event.clientY);
    setSelection({ kind: 'text', id: text.id });
    setDragState({ kind: 'text', id: text.id, offset: [point[0] - text.x, point[1] - text.y] });
  }, [clientToWorld]);

  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleFactor = event.deltaY < 0 ? 1.12 : 0.9;
    setZoom(current => {
      const next = Math.max(0.2, Math.min(3, current * scaleFactor));
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      setPan(previous => [mouseX - (mouseX - previous[0]) * (next / current), mouseY - (mouseY - previous[1]) * (next / current)]);
      return next;
    });
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/electrolab-component');
    if (!type) return;
    const position = clientToWorld(event.clientX, event.clientY);
    addComponent(type, position[0], position[1]);
  }, [addComponent, clientToWorld]);

  const updateWireRouting = useCallback((routing: CircuitWire['routing']) => {
    if (!selectedWire) return;
    const endpoints = currentWireEndpoints(selectedWire, components);
    if (!endpoints) return;
    setWires(previous => previous.map(wire => wire.id === selectedWire.id
      ? { ...wire, routing, path: routePath(endpoints.from, endpoints.to, routing) }
      : wire));
  }, [components, selectedWire]);

  const addSelectedWireCorner = useCallback(() => {
    if (!selectedWire) return;
    const midpoint: Point = selectedWire.path.length >= 2
      ? [(selectedWire.path[0][0] + selectedWire.path[selectedWire.path.length - 1][0]) / 2, (selectedWire.path[0][1] + selectedWire.path[selectedWire.path.length - 1][1]) / 2]
      : cursor;
    setWires(previous => previous.map(wire => wire.id === selectedWire.id
      ? { ...wire, routing: 'manual', path: addWireCorner(wire.path, snapEnabled ? snapPointToGrid(midpoint, GRID_SIZE) : midpoint) }
      : wire));
  }, [cursor, selectedWire, snapEnabled]);

  const nudgeSelectedWire = useCallback((amount: number) => {
    if (!selectedWire) return;
    setWires(previous => previous.map(wire => {
      if (wire.id !== selectedWire.id) return wire;
      const path = wire.path.length > 2 ? wire.path : addWireCorner(wire.path, [
        (wire.path[0][0] + wire.path[wire.path.length - 1][0]) / 2,
        (wire.path[0][1] + wire.path[wire.path.length - 1][1]) / 2,
      ]);
      const corner = Math.floor(path.length / 2);
      return { ...wire, routing: 'manual', path: moveWireCorner(path, corner, [path[corner][0], path[corner][1] + amount]) };
    }));
  }, [selectedWire]);

  const resetSimulation = useCallback(() => {
    simulation.current.reset();
    simulation.current.setCircuit(components, wires);
    setSnapshot(simulation.current.getSnapshot());
    setAnimationTime(0);
  }, [components, wires]);

  useEffect(() => {
    simulation.current.setCircuit(components, wires);
    setSnapshot(simulation.current.getSnapshot());
  }, [components, wires]);

  useEffect(() => {
    if (!simulationRunning) return undefined;
    let last = performance.now();
    const animate = (now: number) => {
      const elapsed = Math.min(0.03, (now - last) / 1000);
      last = now;
      const result = simulation.current.step(Math.max(0.0001, elapsed * simulationSpeed));
      setSnapshot(result);
      setAnimationTime(result.time);
      animationFrame.current = requestAnimationFrame(animate);
    };
    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    };
  }, [simulationRunning, simulationSpeed]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelection();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        cutSelection();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteComponent();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSelection();
        return;
      }
      if (event.key === 'Escape') {
        setWiring({});
        setSelection(null);
        return;
      }
      if (event.key.toLowerCase() === 'w') {
        setWiring(previous => previous.from ? {} : previous);
        toast.message('Click a terminal to start wiring');
        return;
      }
      if (event.key.toLowerCase() === 't') {
        addText();
        return;
      }
      if (event.key === ' ' && selectedComponent) {
        event.preventDefault();
        rotateSelected(90);
        return;
      }
      if (event.key.toLowerCase() === 'r' && selectedComponent) {
        rotateSelected(45);
        return;
      }
      const movement = event.shiftKey ? GRID_SIZE * 5 : (snapEnabled ? GRID_SIZE : 1);
      const directions: Record<string, Point> = {
        ArrowLeft: [-movement, 0],
        ArrowRight: [movement, 0],
        ArrowUp: [0, -movement],
        ArrowDown: [0, movement],
      };
      if (directions[event.key]) {
        event.preventDefault();
        moveSelected(directions[event.key][0], directions[event.key][1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addText, copySelection, cutSelection, moveSelected, pasteComponent, removeSelection, rotateSelected, selectedComponent, snapEnabled]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CATEGORIES.reduce<Record<string, ComponentDef[]>>((all, category) => {
      const items = getComponentsByCategory(category).filter(item => !query
        || item.name.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query));
      if (items.length) all[category] = items;
      return all;
    }, {});
  }, [search]);

  const linkedCoils = components.filter(component => ['contactor', 'relay-spst', 'relay-spdt', 'relay-dpst', 'relay-dpdt'].includes(component.type));

  const sidebarButton = (active = false): React.CSSProperties => ({
    border: `1px solid ${active ? colors.primary : colors.line}`,
    background: active ? `${colors.primary}14` : colors.panel,
    color: active ? colors.primary : colors.muted,
    borderRadius: 7,
    minHeight: 30,
    padding: '5px 7px',
    fontSize: 11,
    fontWeight: 650,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  });

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: colors.background, color: colors.text, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ minHeight: 58, display: 'flex', alignItems: 'center', gap: 14, padding: '8px 14px', background: colors.panel, borderBottom: `1px solid ${colors.line}`, boxShadow: darkPreview ? 'none' : '0 3px 12px rgba(15, 23, 42, .04)', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 178 }}>
          <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', color: '#ffffff', background: 'linear-gradient(135deg, #0369a1, #0f766e)', borderRadius: 9, fontWeight: 850, fontSize: 18 }}>E</div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>ElectroLab</div>
            <div style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>Verified circuit workspace</div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <ToolbarButton colors={colors} label="−" title="Zoom out" onClick={() => setZoom(value => Math.max(.2, value / 1.15))} />
          <span style={{ color: colors.muted, fontSize: 11, minWidth: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <ToolbarButton colors={colors} label="+" title="Zoom in" onClick={() => setZoom(value => Math.min(3, value * 1.15))} />
          <ToolbarDivider colors={colors} />
          <ToolbarButton colors={colors} icon={<Grid3X3 size={14} />} title="Grid" onClick={() => setGridVisible(value => !value)} active={gridVisible} />
          <ToolbarButton colors={colors} icon={<Move size={14} />} title="Snap to grid" onClick={() => setSnapEnabled(value => !value)} active={snapEnabled} />
          <ToolbarButton colors={colors} icon={<Cable size={14} />} label="Wire" title="Click one terminal, then another" onClick={() => { setWiring({}); toast.message('Click a terminal to start wiring'); }} active={Boolean(wiring.from)} />
          <ToolbarDivider colors={colors} />
          <ToolbarButton colors={colors} icon={<Copy size={14} />} title="Copy selected component (Ctrl/Cmd+C)" onClick={copySelection} disabled={!selectedComponent} />
          <ToolbarButton colors={colors} icon={<Scissors size={14} />} title="Cut selected component (Ctrl/Cmd+X)" onClick={cutSelection} disabled={!selectedComponent} />
          <ToolbarButton colors={colors} icon={<Clipboard size={14} />} title="Paste component (Ctrl/Cmd+V)" onClick={pasteComponent} disabled={!clipboardComponent} />
          <ToolbarButton colors={colors} icon={<Type size={14} />} label="Text" title="Add editable workspace text (T)" onClick={addText} />
          <ToolbarDivider colors={colors} />
          <ToolbarButton colors={colors} icon={<Zap size={14} />} label="DMM" title="Add a movable DMM with probe terminals" onClick={() => addComponent('dmm')} />
          <ToolbarButton colors={colors} icon={<Activity size={14} />} label="Scope" title="Add a movable 4-channel oscilloscope" onClick={() => addComponent('oscilloscope')} />
          <ToolbarDivider colors={colors} />
          <button onClick={() => setSimulationRunning(value => !value)} style={{ ...sidebarButton(simulationRunning), borderColor: simulationRunning ? colors.danger : colors.accent, color: simulationRunning ? colors.danger : colors.accent, padding: '6px 11px' }}>
            {simulationRunning ? <Pause size={14} /> : <Play size={14} />}{simulationRunning ? 'Pause' : 'Run'}
          </button>
          <ToolbarButton colors={colors} icon={<RotateCcw size={14} />} title="Reset simulation" onClick={resetSimulation} />
          <span style={{ fontSize: 11, minWidth: 55, color: colors.primary, fontVariantNumeric: 'tabular-nums' }}>{snapshot.time.toFixed(3)} s</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 152, justifyContent: 'flex-end' }}>
          <input aria-label="Simulation speed" type="range" min={.25} max={4} step={.25} value={simulationSpeed} onChange={event => setSimulationSpeed(numeric(event.target.value, 1))} style={{ width: 70, accentColor: colors.accent }} />
          <span style={{ color: colors.muted, fontSize: 10 }}>{simulationSpeed.toFixed(2)}×</span>
          <ToolbarButton colors={colors} icon={<Sun size={14} />} title="Toggle light/dark preview" onClick={() => setDarkPreview(value => !value)} active={!darkPreview} />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside style={{ width: 235, background: colors.panel, borderRight: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${colors.line}` }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: colors.subtle }} />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search components" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.line}`, outline: 'none', background: colors.input, color: colors.text, borderRadius: 7, padding: '8px 9px 8px 29px', fontSize: 11 }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', padding: '6px 6px 14px' }}>
            {Object.entries(filteredCategories).map(([category, items]) => {
              const collapsed = collapsedCategories.has(category);
              return (
                <section key={category} style={{ marginBottom: 3 }}>
                  <button onClick={() => setCollapsedCategories(previous => {
                    const next = new Set(previous);
                    if (next.has(category)) next.delete(category); else next.add(category);
                    return next;
                  })} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', color: colors.text, cursor: 'pointer', padding: '8px 5px', fontSize: 11, fontWeight: 750 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}{category}</span>
                    <span style={{ color: colors.subtle, fontWeight: 600 }}>{items.length}</span>
                  </button>
                  {!collapsed && items.map(item => (
                    <button key={item.id} draggable onDragStart={event => {
                      event.dataTransfer.setData('application/electrolab-component', item.id);
                      event.dataTransfer.effectAllowed = 'copy';
                    }} onClick={() => addComponent(item.id)} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: colors.muted, cursor: 'grab', borderRadius: 6, padding: '7px 8px', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }} onMouseEnter={event => { event.currentTarget.style.background = colors.panelAlt; event.currentTarget.style.color = colors.text; }} onMouseLeave={event => { event.currentTarget.style.background = 'transparent'; event.currentTarget.style.color = colors.muted; }}>
                      <span style={{ color: 'inherit', fontWeight: 650 }}>{item.name}</span>
                      <span style={{ color: colors.subtle, fontSize: 9, lineHeight: 1.25 }}>{item.description}</span>
                    </button>
                  ))}
                </section>
              );
            })}
          </div>
        </aside>

        <main style={{ position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden', background: colors.canvas }}>
          <svg ref={svgRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onWheel={handleWheel} onDragOver={event => event.preventDefault()} onDrop={handleDrop} style={{ width: '100%', height: '100%', display: 'block', cursor: dragState?.kind === 'pan' ? 'grabbing' : wiring.from ? 'crosshair' : 'default', touchAction: 'none' }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M 0,0 L 6,3 L 0,6 Z" fill="#64748b" /></marker>
              <pattern id="workspace-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse"><path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke={colors.grid} strokeWidth="1" /></pattern>
            </defs>
            <g transform={`translate(${pan[0]},${pan[1]}) scale(${zoom})`}>
              {gridVisible && <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#workspace-grid)" />}

              {wires.map(wire => {
                const selected = selection?.kind === 'wire' && selection.id === wire.id;
                const current = snapshot.wireCurrents[wire.id] ?? 0;
                const active = Math.abs(current) > 1e-9;
                const path = wire.path;
                const renderPath = pointsToPath(path);
                const electronPath = current > 0 ? reversedPath(path) : path;
                const dots = simulationRunning && active ? getDotsOnPath(electronPath, Math.max(2, Math.min(7, Math.round(pathLength(path) / 85))), animationTime * (0.6 + Math.min(2.2, Math.abs(current) * 50))) : [];
                return (
                  <g key={wire.id}>
                    <path d={renderPath} fill="none" stroke="transparent" strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" onMouseDown={event => handleWireMouseDown(event, wire)} onDoubleClick={event => handleWireDoubleClick(event, wire)} style={{ cursor: 'pointer' }} />
                    <path d={renderPath} fill="none" stroke={selected ? colors.selection : active ? colors.powered : colors.wire} strokeOpacity={selected ? .25 : active ? .16 : .12} strokeWidth={selected ? 7 : active ? 6 : 5} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
                    <path d={renderPath} fill="none" stroke={selected ? colors.selection : active ? colors.powered : colors.wire} strokeWidth={selected ? 2.6 : 1.8} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
                    {dots.map((dot, index) => <circle key={index} cx={dot[0]} cy={dot[1]} r={2.8} fill={colors.powered} opacity={.9} pointerEvents="none" />)}
                    {selected && wire.path.slice(1, -1).map((corner, index) => {
                      const cornerIndex = index + 1;
                      return <circle key={`${wire.id}-${cornerIndex}`} cx={corner[0]} cy={corner[1]} r={6} fill={colors.panel} stroke={colors.selection} strokeWidth={2} onMouseDown={event => { event.stopPropagation(); setDragState({ kind: 'wireCorner', id: wire.id, corner: cornerIndex }); }} style={{ cursor: 'move' }} />;
                    })}
                  </g>
                );
              })}

              {wiring.from && <path d={pointsToPath(routePath(wiring.from.position, cursor, 'orthogonal'))} fill="none" stroke={colors.accent} strokeDasharray="6 4" strokeWidth={1.6} opacity={.75} pointerEvents="none" />}

              {components.map(component => {
                const definition = getDef(component.type);
                if (!definition) return null;
                const isSelected = selection?.kind === 'component' && selection.id === component.id;
                const powered = Boolean(snapshot.componentPowered[component.id]);
                const intensity = snapshot.componentIntensity[component.id] ?? 0;
                const reading = snapshot.instrumentReadings[component.id];
                const transform = `translate(${component.x},${component.y}) rotate(${component.rotation}) scale(${component.flipH ? -1 : 1},${component.flipV ? -1 : 1})`;
                return (
                  <g key={component.id} transform={transform}>
                    {isSelected && <rect x={-definition.width / 2 - 9} y={-definition.height / 2 - 9} width={definition.width + 18} height={definition.height + 18} rx={7} fill={`${colors.selection}0d`} stroke={colors.selection} strokeWidth={1.2} strokeDasharray="4 3" pointerEvents="none" />}
                    {renderSymbol(definition.symbol, powered, { ...component.props, _intensity: intensity }, animationTime)}
                    <text x={0} y={definition.height / 2 + 15} textAnchor="middle" fontSize={9} fontWeight={750} fill={colors.text} pointerEvents="none">{component.label}</text>
                    {component.type === 'dmm' && <InstrumentText reading={reading} x={0} y={-14} color={colors.text} />}
                    {component.type === 'oscilloscope' && <ScopeTrace reading={snapshot.instrumentReadings[`${component.id}:ch1`]} color="#38bdf8" />}
                    {definition.terminals.map(terminal => {
                      const starting = wiring.from?.componentId === component.id && wiring.from.terminalId === terminal.id;
                      const terminalVoltage = snapshot.terminalVoltages[terminalKey(component.id, terminal.id)] ?? 0;
                      const energized = Math.abs(terminalVoltage) > .05;
                      return (
                        <g key={terminal.id}>
                          <circle cx={terminal.x} cy={terminal.y} r={TERMINAL_HIT_RADIUS} fill="transparent" />
                          <circle cx={terminal.x} cy={terminal.y} r={TERMINAL_RADIUS} fill={starting ? colors.accent : energized ? colors.powered : colors.panel} stroke={wiring.from ? colors.primary : colors.muted} strokeWidth={1.4} pointerEvents="none" />
                          {(wiring.from || isSelected) && <text x={terminal.x} y={terminal.y - 8} textAnchor="middle" fontSize={7} fontWeight={700} fill={colors.muted} pointerEvents="none">{terminal.name}</text>}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {texts.map(text => (
                <text key={text.id} transform={`translate(${text.x},${text.y}) rotate(${text.rotation})`} fontSize={text.fontSize} fill={text.color} fontWeight={selection?.kind === 'text' && selection.id === text.id ? 700 : 500} onMouseDown={event => handleTextMouseDown(event, text)} style={{ cursor: 'move', userSelect: 'none' }}>
                  {text.text}
                </text>
              ))}
            </g>
          </svg>

          {components.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
              <div style={{ maxWidth: 350, textAlign: 'center', background: `${colors.panel}dd`, border: `1px solid ${colors.line}`, boxShadow: colors.shadow, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ width: 46, height: 46, display: 'grid', placeItems: 'center', margin: '0 auto 12px', borderRadius: 14, background: `${colors.primary}12`, color: colors.primary }}><Settings2 size={23} /></div>
                <div style={{ fontWeight: 780, fontSize: 15 }}>Build a circuit on the workspace</div>
                <p style={{ color: colors.muted, fontSize: 12, lineHeight: 1.5, margin: '8px 0 0' }}>Drag a component from the library, click two terminals to wire them, then press Run. Measurement tools are physical workspace components with real probe terminals.</p>
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: `${colors.panel}e8`, border: `1px solid ${colors.line}`, color: colors.muted, borderRadius: 8, fontSize: 10, boxShadow: darkPreview ? 'none' : '0 6px 16px rgba(15,23,42,.08)', pointerEvents: 'none' }}>
            <span>{components.length} components</span><span>•</span><span>{wires.length} wires</span><span>•</span><span>Arrows move selected item</span><span>•</span><span>Double-click wire to add a corner</span>
            {simulationRunning && <span style={{ marginLeft: 'auto', color: colors.accent, fontWeight: 750 }}>SIMULATION RUNNING</span>}
            {!snapshot.converged && <span style={{ marginLeft: 'auto', color: colors.danger, fontWeight: 750 }}>CHECK CIRCUIT WARNINGS</span>}
          </div>
        </main>

        <aside style={{ width: 286, background: colors.panel, borderLeft: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selectedComponent ? (
            <ComponentInspector colors={colors} component={selectedComponent} definition={getDef(selectedComponent.type)!} linkedCoils={linkedCoils} reading={snapshot.instrumentReadings[selectedComponent.id]} snapshot={snapshot} onLabelChange={label => updateComponent(selectedComponent.id, { label })} onPropertyChange={updateComponentProperty} onRotate={rotateSelected} onFlip={flipSelected} onMove={moveSelected} onDelete={removeSelection} />
          ) : selectedWire ? (
            <WireInspector colors={colors} wire={selectedWire} onRouting={updateWireRouting} onAddCorner={addSelectedWireCorner} onNudge={nudgeSelectedWire} onDelete={removeSelection} />
          ) : selectedText ? (
            <TextInspector colors={colors} text={selectedText} onUpdate={updateText} onMove={moveSelected} onDelete={removeSelection} />
          ) : (
            <WelcomeInspector colors={colors} onAddDmm={() => addComponent('dmm')} onAddScope={() => addComponent('oscilloscope')} />
          )}
          {snapshot.warnings.length > 0 && (
            <div style={{ margin: 'auto 10px 10px', border: `1px solid ${colors.danger}55`, background: `${colors.danger}0d`, borderRadius: 8, padding: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: colors.danger, fontSize: 10, fontWeight: 780 }}><Info size={13} /> Circuit status</div>
              {snapshot.warnings.slice(0, 3).map((warning, index) => <div key={`${warning.code}-${index}`} style={{ marginTop: 5, fontSize: 10, color: colors.muted, lineHeight: 1.35 }}>{warning.message}</div>)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

interface Palette { background: string; canvas: string; panel: string; panelAlt: string; line: string; text: string; muted: string; subtle: string; primary: string; accent: string; danger: string; selection: string; grid: string; wire: string; powered: string; input: string; shadow: string; }

function ToolbarButton({ colors, icon, label, title, onClick, active, disabled }: { colors: Palette; icon?: React.ReactNode; label?: string; title: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return <button title={title} onClick={onClick} disabled={disabled} style={{ border: `1px solid ${active ? colors.primary : colors.line}`, background: active ? `${colors.primary}14` : colors.panel, color: active ? colors.primary : disabled ? colors.subtle : colors.muted, borderRadius: 7, padding: '5px 7px', minHeight: 30, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1 }}>{icon}{label}</button>;
}

function ToolbarDivider({ colors }: { colors: Palette }) { return <span style={{ width: 1, height: 23, background: colors.line, margin: '0 2px' }} />; }

function InspectorHeader({ colors, title, subtitle, icon }: { colors: Palette; title: string; subtitle: string; icon: React.ReactNode }) {
  return <div style={{ padding: '15px 15px 12px', borderBottom: `1px solid ${colors.line}` }}><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ color: colors.primary }}>{icon}</div><div><div style={{ fontWeight: 800, fontSize: 13 }}>{title}</div><div style={{ marginTop: 2, color: colors.muted, fontSize: 10, lineHeight: 1.3 }}>{subtitle}</div></div></div></div>;
}

function InspectorButton({ colors, children, onClick, danger, active, disabled }: { colors: Palette; children: React.ReactNode; onClick: () => void; danger?: boolean; active?: boolean; disabled?: boolean }) {
  const tone = danger ? colors.danger : active ? colors.primary : colors.muted;
  return <button onClick={onClick} disabled={disabled} style={{ flex: 1, minHeight: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: `1px solid ${tone}55`, borderRadius: 6, background: active || danger ? `${tone}0d` : colors.panelAlt, color: tone, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1, fontSize: 10, fontWeight: 700 }}>{children}</button>;
}

function InspectorSection({ colors, label, children }: { colors: Palette; label: string; children: React.ReactNode }) { return <section style={{ padding: '12px 15px', borderBottom: `1px solid ${colors.line}` }}><div style={{ color: colors.subtle, fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>{children}</section>; }

function PropertyRow({ colors, label, unit, children }: { colors: Palette; label: string; unit?: string; children: React.ReactNode }) { return <label style={{ display: 'grid', gridTemplateColumns: '1fr 132px', gap: 8, alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 10, color: colors.muted, lineHeight: 1.25 }}>{label}{unit && <span style={{ color: colors.subtle }}> ({unit})</span>}</span>{children}</label>; }

function ComponentInspector({ colors, component, definition, linkedCoils, reading, snapshot, onLabelChange, onPropertyChange, onRotate, onFlip, onMove, onDelete }: { colors: Palette; component: CircuitComponent; definition: ComponentDef; linkedCoils: CircuitComponent[]; reading?: InstrumentReading; snapshot: SimulationSnapshot; onLabelChange: (value: string) => void; onPropertyChange: (key: string, value: unknown) => void; onRotate: (degrees: number) => void; onFlip: (axis: 'h' | 'v') => void; onMove: (dx: number, dy: number) => void; onDelete: () => void }) {
  return <div style={{ overflowY: 'auto', minHeight: 0 }}>
    <InspectorHeader colors={colors} icon={<Settings2 size={16} />} title={`${component.label} · ${definition.name}`} subtitle={definition.description} />
    <InspectorSection colors={colors} label="Instance label">
      <PropertyRow colors={colors} label="Reference"><input value={component.label} onChange={event => onLabelChange(event.target.value)} style={inputStyle(colors)} /></PropertyRow>
      <div style={{ color: colors.subtle, fontSize: 9 }}>Auto reference prefix: {componentPrefix(component.type)}. Auxiliary contacts link to this reference.</div>
    </InspectorSection>
    <InspectorSection colors={colors} label="Transform and arrows">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 7 }}>
        <InspectorButton colors={colors} onClick={() => onMove(0, -20)}><ArrowUp size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onMove(-20, 0)}><ArrowLeft size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onMove(20, 0)}><ArrowRight size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onMove(0, 20)}><ArrowDown size={13} /></InspectorButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}><InspectorButton colors={colors} onClick={() => onRotate(90)}><RotateCw size={13} />90°</InspectorButton><InspectorButton colors={colors} onClick={() => onRotate(45)}><RotateCw size={13} />45°</InspectorButton><InspectorButton colors={colors} onClick={() => onFlip('h')}><FlipHorizontal size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onFlip('v')}><FlipVertical size={13} /></InspectorButton></div>
      <div style={{ marginTop: 8, fontSize: 10, color: colors.muted, fontVariantNumeric: 'tabular-nums' }}>Position: ({Math.round(component.x)}, {Math.round(component.y)}) · {component.rotation}°</div>
    </InspectorSection>
    <InspectorSection colors={colors} label="Electrical properties">
      {Object.entries(definition.properties).map(([key, property]) => {
        if (key === 'linkedTo') return <PropertyRow key={key} colors={colors} label={property.label ?? key}><select value={String(component.props[key] ?? '')} onChange={event => onPropertyChange(key, event.target.value)} style={inputStyle(colors)}><option value="">Select coil reference</option>{linkedCoils.filter(coil => coil.id !== component.id).map(coil => <option key={coil.id} value={coil.label}>{coil.label} · {getDef(coil.type)?.name}</option>)}</select></PropertyRow>;
        return <PropertyEditorField key={key} colors={colors} label={property.label ?? key} definition={property} value={component.props[key] ?? property.value} onChange={value => onPropertyChange(key, value)} />;
      })}
    </InspectorSection>
    {component.type === 'dmm' && <DmmReadingInspector colors={colors} reading={reading} />}
    {component.type === 'oscilloscope' && <ScopeReadingInspector colors={colors} component={component} readings={snapshot.instrumentReadings} />}
    <InspectorSection colors={colors} label="Actions"><InspectorButton colors={colors} danger onClick={onDelete}><Trash2 size={13} />Delete</InspectorButton></InspectorSection>
  </div>;
}

function PropertyEditorField({ colors, label, definition, value, onChange }: { colors: Palette; label: string; definition: PropertyDef; value: unknown; onChange: (value: unknown) => void }) {
  if (definition.type === 'boolean') return <PropertyRow colors={colors} label={label}><input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} style={{ justifySelf: 'start', accentColor: colors.primary }} /></PropertyRow>;
  if (definition.type === 'select') return <PropertyRow colors={colors} label={label} unit={definition.unit}><select value={String(value)} onChange={event => onChange(event.target.value)} style={inputStyle(colors)}>{definition.options?.map(option => <option key={option} value={option}>{option}</option>)}</select></PropertyRow>;
  if (definition.type === 'color') return <PropertyRow colors={colors} label={label}><input type="color" value={String(value)} onChange={event => onChange(event.target.value)} style={{ width: '100%', height: 30, border: `1px solid ${colors.line}`, borderRadius: 5, background: colors.input }} /></PropertyRow>;
  if (definition.type === 'text') return <PropertyRow colors={colors} label={label}><input value={String(value)} onChange={event => onChange(event.target.value)} style={inputStyle(colors)} /></PropertyRow>;
  return <PropertyRow colors={colors} label={label} unit={definition.unit}><input type="number" min={definition.min} max={definition.max} step={definition.step ?? 'any'} value={numeric(value)} onChange={event => onChange(numeric(event.target.value, numeric(definition.value)))} style={inputStyle(colors)} /></PropertyRow>;
}

function WireInspector({ colors, wire, onRouting, onAddCorner, onNudge, onDelete }: { colors: Palette; wire: CircuitWire; onRouting: (routing: CircuitWire['routing']) => void; onAddCorner: () => void; onNudge: (amount: number) => void; onDelete: () => void }) {
  return <div style={{ overflowY: 'auto' }}><InspectorHeader colors={colors} icon={<Cable size={16} />} title="Wire path" subtitle="Click to select. Double-click the line or add a corner, then drag the handles." /><InspectorSection colors={colors} label="Route">
    <PropertyRow colors={colors} label="Routing"><select value={wire.routing} onChange={event => onRouting(event.target.value as CircuitWire['routing'])} style={inputStyle(colors)}><option value="orthogonal">Orthogonal</option><option value="straight">Straight</option><option value="manual">Manual</option></select></PropertyRow>
    <div style={{ fontSize: 11, color: colors.text, marginBottom: 7 }}>Geometric length: <strong>{pathLength(wire.path).toFixed(1)} px</strong></div>
    <div style={{ display: 'flex', gap: 5 }}><InspectorButton colors={colors} onClick={onAddCorner}><Plus size={13} />Corner</InspectorButton><InspectorButton colors={colors} onClick={() => onNudge(-20)}><Minus size={13} />Bend</InspectorButton><InspectorButton colors={colors} onClick={() => onNudge(20)}><Plus size={13} />Bend</InspectorButton></div>
  </InspectorSection><InspectorSection colors={colors} label="Electrical meaning"><p style={{ color: colors.muted, fontSize: 10, lineHeight: 1.45, margin: 0 }}>Wire geometry is editable for documentation and layout. The ideal wire remains a zero-ohm connection in the solver; electron markers only appear when solved branch current exists.</p></InspectorSection><InspectorSection colors={colors} label="Actions"><InspectorButton colors={colors} danger onClick={onDelete}><Trash2 size={13} />Delete wire</InspectorButton></InspectorSection></div>;
}

function TextInspector({ colors, text, onUpdate, onMove, onDelete }: { colors: Palette; text: WorkspaceText; onUpdate: (update: Partial<WorkspaceText>) => void; onMove: (dx: number, dy: number) => void; onDelete: () => void }) {
  return <div style={{ overflowY: 'auto' }}><InspectorHeader colors={colors} icon={<Type size={16} />} title="Workspace text" subtitle="Editable annotation that can be placed anywhere in the schematic." /><InspectorSection colors={colors} label="Text properties"><PropertyRow colors={colors} label="Content"><input value={text.text} onChange={event => onUpdate({ text: event.target.value })} style={inputStyle(colors)} /></PropertyRow><PropertyRow colors={colors} label="Size"><input type="number" min={8} max={72} value={text.fontSize} onChange={event => onUpdate({ fontSize: numeric(event.target.value, 16) })} style={inputStyle(colors)} /></PropertyRow><PropertyRow colors={colors} label="Color"><input type="color" value={text.color} onChange={event => onUpdate({ color: event.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${colors.line}`, borderRadius: 5, background: colors.input }} /></PropertyRow></InspectorSection><InspectorSection colors={colors} label="Move"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}><InspectorButton colors={colors} onClick={() => onMove(0, -20)}><ArrowUp size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onMove(-20, 0)}><ArrowLeft size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onMove(20, 0)}><ArrowRight size={13} /></InspectorButton><InspectorButton colors={colors} onClick={() => onMove(0, 20)}><ArrowDown size={13} /></InspectorButton></div></InspectorSection><InspectorSection colors={colors} label="Actions"><InspectorButton colors={colors} danger onClick={onDelete}><Trash2 size={13} />Delete text</InspectorButton></InspectorSection></div>;
}

function WelcomeInspector({ colors, onAddDmm, onAddScope }: { colors: Palette; onAddDmm: () => void; onAddScope: () => void }) { return <div><InspectorHeader colors={colors} icon={<Info size={16} />} title="Workspace ready" subtitle="Select a component, wire, or annotation to edit it." /><InspectorSection colors={colors} label="Circuit controls"><p style={{ margin: 0, color: colors.muted, fontSize: 11, lineHeight: 1.55 }}>The solver uses named nodes built from terminal wires. Add Ground to define the 0 V reference. Each source, load, switch and instrument is electrically represented rather than supplied with aggregate demo values.</p></InspectorSection><InspectorSection colors={colors} label="Measurement tools"><div style={{ display: 'flex', gap: 6 }}><InspectorButton colors={colors} onClick={onAddDmm}><Zap size={13} />Add DMM</InspectorButton><InspectorButton colors={colors} onClick={onAddScope}><Activity size={13} />Add scope</InspectorButton></div></InspectorSection><InspectorSection colors={colors} label="Keyboard"><div style={{ color: colors.muted, fontSize: 10, lineHeight: 1.65 }}>Arrows: move selection<br />Shift + arrows: 5-grid move<br />Ctrl/Cmd+C/X/V: copy, cut, paste component<br />Del: delete · Space: rotate 90° · T: add text</div></InspectorSection></div>; }

function DmmReadingInspector({ colors, reading }: { colors: Palette; reading?: InstrumentReading }) { return <InspectorSection colors={colors} label="Live DMM result"><div style={{ padding: 10, background: '#e8f5ea', border: '1px solid #b6dfbc', borderRadius: 7, textAlign: 'right', color: '#166534', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}><div style={{ fontSize: 22, fontWeight: 800 }}>{reading?.status === 'open' ? 'OL' : reading ? formatEngineering(reading.value, reading.unit) : '—'}</div><div style={{ marginTop: 4, fontSize: 10, color: '#4b7b56' }}>{reading?.status === 'ready' ? 'Probe-linked measurement' : reading?.status === 'open' ? 'Open / not fully connected' : 'Connect HI and COM probes'}</div></div>{reading?.continuity !== undefined && <div style={{ marginTop: 7, fontSize: 10, color: colors.muted }}>Continuity: <strong>{reading.continuity ? 'closed' : 'open'}</strong>{reading.frequency ? ` · ${reading.frequency.toFixed(2)} Hz` : ''}</div>}</InspectorSection>; }

function ScopeReadingInspector({ colors, component, readings }: { colors: Palette; component: CircuitComponent; readings: Record<string, InstrumentReading> }) { const channels = ['ch1', 'ch2', 'ch3', 'ch4']; return <InspectorSection colors={colors} label="Live scope acquisition"><div style={{ padding: 8, background: '#0f172a', borderRadius: 7 }}>{channels.map((channel, index) => { const reading = readings[`${component.id}:${channel}`]; return <div key={channel} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 2px', color: ['#38bdf8', '#f472b6', '#facc15', '#a78bfa'][index], fontSize: 10, fontFamily: 'ui-monospace, monospace' }}><span>{channel.toUpperCase()}</span><span>{reading?.status === 'ready' ? `${formatEngineering(reading.value, reading.unit)} RMS` : 'not connected'}</span></div>; })}</div><p style={{ color: colors.muted, fontSize: 10, lineHeight: 1.45, margin: '8px 0 0' }}>Each channel is measured against the scope GND terminal. The display trace uses sampled solved node voltage history.</p></InspectorSection>; }

function InstrumentText({ reading, x, y, color }: { reading?: InstrumentReading; x: number; y: number; color: string }) { const label = reading?.status === 'open' ? 'OL' : reading?.status === 'ready' ? formatEngineering(reading.value, reading.unit, 2) : '—'; return <text x={x} y={y} textAnchor="middle" fontFamily="monospace" fontSize={9} fontWeight={750} fill={color} pointerEvents="none">{label}</text>; }

function ScopeTrace({ reading, color }: { reading?: InstrumentReading; color: string }) { const samples = reading?.samples?.slice(-80) ?? []; if (samples.length < 2) return null; const values = samples.map(sample => sample.value); const amplitude = Math.max(1e-6, ...values.map(value => Math.abs(value))); const path = values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${-25 + index * (48 / (values.length - 1))},${-10 - (value / amplitude) * 12}`).join(' '); return <path d={path} fill="none" stroke={color} strokeWidth={1.2} pointerEvents="none" />; }

function inputStyle(colors: Palette): React.CSSProperties { return { width: '100%', minWidth: 0, boxSizing: 'border-box', background: colors.input, color: colors.text, border: `1px solid ${colors.line}`, borderRadius: 5, padding: '6px 7px', fontSize: 10, outline: 'none' }; }
