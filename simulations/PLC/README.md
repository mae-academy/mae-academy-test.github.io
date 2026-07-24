# PLC Ladder Logic Simulator ⚡

A web-based PLC (Programmable Logic Controller) programming simulator with visual ladder diagram editor, real-time execution, and I/O simulation.

![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)
![HTML5](https://img.shields.io/badge/Frontend-HTML5-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Visual Ladder Editor
- **Drag-and-Drop Components**: Easily add contacts, coils, timers, and counters
- **Real-Time Wire Animation**: See power flow through the circuit
- **Click to Edit**: Double-click elements to modify properties
- **Keyboard Shortcuts**: F5 Run, Shift+F5 Stop, F10 Step

### Components Library
| Category | Components |
|----------|------------|
| **Inputs** | NO Contact, NC Contact, Positive Edge, Negative Edge |
| **Outputs** | Output Coil, Negated Output, Set (Latch), Reset (Unlatch) |
| **Timers** | TON (On-Delay), TOF (Off-Delay), TP (Pulse) |
| **Counters** | CTU (Count Up), CTD (Count Down), CTUD (Up/Down) |
| **Compare** | Equal (==), Greater Than (>), Less Than (<) |

### I/O Simulation
- **8 Digital Inputs** (I0.0 - I0.7) with toggle buttons
- **8 Digital Outputs** (Q0.0 - Q0.7) with status indicators
- **8 Memory Bits** (M0.0 - M0.7) for internal flags
- **8 Timers** (T0 - T7) with visual progress bars
- **8 Counters** (C0 - C7) with count display

### Real-Time Execution
- **Run Mode**: Continuous scan cycle execution
- **Step Mode**: Execute one scan at a time for debugging
- **Scan Time Display**: Monitor PLC performance
- **Live Power Flow**: Visual indication of circuit state

### Example Programs
1. **Start/Stop Motor** - Classic motor control with seal-in
2. **Traffic Light** - Sequential timer-based control
3. **Conveyor System** - Counter and sensor integration
4. **Tank Level Control** - Fill/drain with alarms
5. **Sequential Process** - Multi-step automation

## Screenshot Preview

```
┌──────────────────────────────────────────────────────────────┐
│  ⚡ PLC Simulator    [New][Open][Save] [▶Run][⏹Stop][⏭Step]  │
├──────────────────────────────────────────────────────────────┤
│ Components │        Ladder Diagram           │  I/O Monitor │
│            │                                  │              │
│ ─┤ ├─ NO   │  ══╪═══════╪═══════╪═══════╪══  │  I0.0 [●]    │
│ ─┤/├─ NC   │  1 │I0.0   │Q0.0   │I0.1   │Q0.0│  I0.1 [○]    │
│ ─( )─ OUT  │    │Start  │Seal   │Stop   │Mtr │  Q0.0 [●]    │
│ [TON]Timer │  ══╪═══════════════════════╪══  │              │
│ [CTU]Count │  2 │Q0.0              │Q0.1    │  T0: 1500ms  │
│            │    │Motor Running     │Run Lamp│  C0: 5       │
└──────────────────────────────────────────────────────────────┘
```

## Getting Started

### Option 1: Open Directly
Simply open `index.html` in any modern web browser.

### Option 2: Local Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

Then visit `http://localhost:8000`

## Usage Guide

### Creating a Program

1. **Add Rungs**: Click "Add Rung" button or drag components to create rungs
2. **Add Components**: Drag from the left panel onto drop zones
3. **Configure**: Double-click elements to set addresses and properties
4. **Run**: Press F5 or click Run to execute

### Component Addresses

| Type | Format | Example |
|------|--------|---------|
| Input | I{byte}.{bit} | I0.0, I0.7 |
| Output | Q{byte}.{bit} | Q0.0, Q0.7 |
| Memory | M{byte}.{bit} | M0.0, M0.7 |
| Timer | T{number} | T0, T1, T7 |
| Counter | C{number} | C0, C1, C7 |

### Timer Configuration

| Type | Description | Behavior |
|------|-------------|----------|
| TON | On-Delay | Output turns ON after input is ON for preset time |
| TOF | Off-Delay | Output stays ON for preset time after input turns OFF |
| TP | Pulse | Output pulses for preset time on rising edge |

### Counter Configuration

| Type | Description | Behavior |
|------|-------------|----------|
| CTU | Count Up | Increments on rising edge, Q=true when CV >= PV |
| CTD | Count Down | Decrements on rising edge, Q=true when CV <= 0 |
| CTUD | Up/Down | Can count both directions |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F5 | Run program |
| Shift+F5 | Stop program |
| F10 | Step (single scan) |
| Ctrl+N | New program |
| Ctrl+O | Open program |
| Ctrl+S | Save program |
| Delete | Delete selected element |
| Enter | Edit selected element |
| Escape | Stop program |

## Example: Start/Stop Motor

```
Rung 1: Motor Control with Seal-In
─┤ ├─────┤ ├─────┤/├─────( )─
 I0.0    Q0.0    I0.1    Q0.0
 Start   Seal    Stop    Motor

Rung 2: Run Indicator
─┤ ├─────────────────────( )─
 Q0.0                    Q0.1
 Motor                   Lamp
```

**Operation:**
1. Press I0.0 (Start) → Motor (Q0.0) turns ON
2. Q0.0 seals in the circuit (latches)
3. Press I0.1 (Stop) → Motor turns OFF
4. Q0.1 shows motor status

## File Format

Programs are saved as JSON:

```json
{
  "name": "My Program",
  "rungs": [
    {
      "id": 1,
      "comment": "Motor Control",
      "elements": [
        { "type": "NO", "address": "I0.0", "comment": "Start" },
        { "type": "OUT", "address": "Q0.0", "comment": "Motor" }
      ]
    }
  ]
}
```

## Project Structure

```
PLC-Ladder-Simulator/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles and layout
├── js/
│   ├── plc-core.js     # PLC execution engine
│   ├── ladder-editor.js # Visual editor
│   ├── examples.js     # Example programs
│   └── app.js          # Main application
├── examples/           # Sample programs
├── docs/               # Documentation
├── README.md
└── LICENSE
```

## Technical Details

### PLC Scan Cycle
1. **Read Inputs**: Sample all input states
2. **Execute Logic**: Process rungs top-to-bottom, left-to-right
3. **Update Outputs**: Write output states
4. **Repeat**: Default 50ms scan rate

### Power Flow Logic
- Power flows from left rail through contacts
- Series contacts: AND logic
- Parallel branches: OR logic
- Coils energize when power reaches them

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Educational Use

Perfect for:
- Learning PLC programming concepts
- Teaching industrial automation
- Practicing ladder logic design
- Debugging logic before deploying

## Future Enhancements

- [ ] Function blocks (ADD, SUB, MUL, DIV)
- [ ] Analog I/O simulation
- [ ] Subroutines / Program blocks
- [ ] Online monitoring mode
- [ ] PLC hardware integration (Arduino/ESP32)
- [ ] ST (Structured Text) editor
- [ ] FBD (Function Block Diagram) view

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Haris Sohail**
- Portfolio: [harrissohail6.github.io](https://harrissohail6.github.io)
- GitHub: [@harrissohail6](https://github.com/harrissohail6)

## Acknowledgments

- IEC 61131-3 standard for PLC programming
- Industrial automation community
- Open-source contributors

---

⭐ Star this repo if you find it useful for learning PLC programming!
