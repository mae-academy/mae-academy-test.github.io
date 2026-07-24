/**
 * PLC Ladder Logic Simulator - Core Engine
 * Handles logic execution, I/O, timers, and counters
 */

class PLCCore {
    constructor() {
        // I/O Memory
        this.inputs = {};      // I0.0 - I0.7
        this.outputs = {};     // Q0.0 - Q0.7
        this.memory = {};      // M0.0 - M0.7

        // Timers
        this.timers = {};

        // Counters
        this.counters = {};

        // Edge detection
        this.previousInputs = {};

        // Program
        this.program = {
            name: 'Untitled Program',
            rungs: []
        };

        // Execution state
        this.isRunning = false;
        this.scanCycle = 0;
        this.scanTime = 0;
        this.scanInterval = null;
        this.scanRate = 50; // ms

        // Change tracking
        this.dirty = false;

        // Callbacks
        this.onUpdate = null;
        this.onStateChange = null;

        // Initialize memory
        this.initializeMemory();
    }

    initializeMemory() {
        // Initialize 8 inputs
        for (let i = 0; i < 8; i++) {
            this.inputs[`I0.${i}`] = false;
            this.previousInputs[`I0.${i}`] = false;
        }

        // Initialize 8 outputs
        for (let i = 0; i < 8; i++) {
            this.outputs[`Q0.${i}`] = false;
        }

        // Initialize 8 memory bits
        for (let i = 0; i < 8; i++) {
            this.memory[`M0.${i}`] = false;
        }

        // Initialize timers
        for (let i = 0; i < 8; i++) {
            this.timers[`T${i}`] = {
                IN: false,
                Q: false,
                ET: 0,
                PT: 1000,
                type: 'TON',
                running: false,
                startTime: 0
            };
        }

        // Initialize counters
        for (let i = 0; i < 8; i++) {
            this.counters[`C${i}`] = {
                CU: false,
                CD: false,
                R: false,
                LD: false,
                QU: false,
                QD: false,
                CV: 0,
                PV: 10,
                prevCU: false,
                prevCD: false
            };
        }
    }

    // ============================================================
    // Program Management
    // ============================================================

    loadProgram(program) {
        this.program = program;
        this.resetAll();
        this.dirty = false; // Not dirty after loading a fresh program
        if (this.onUpdate) this.onUpdate();
    }

    getProgram() {
        return this.program;
    }

    addRung(rung = null) {
        if (!rung) {
            rung = {
                id: Date.now(),
                elements: [],
                comment: ''
            };
        }
        this.program.rungs.push(rung);
        this.dirty = true;
        if (this.onUpdate) this.onUpdate();
        return rung;
    }

    removeRung(index) {
        if (index >= 0 && index < this.program.rungs.length) {
            this.program.rungs.splice(index, 1);
            this.dirty = true;
            if (this.onUpdate) this.onUpdate();
        }
    }

    addElement(rungIndex, element) {
        if (rungIndex >= 0 && rungIndex < this.program.rungs.length) {
            this.program.rungs[rungIndex].elements.push(element);
            this.dirty = true;
            if (this.onUpdate) this.onUpdate();
        }
    }

    removeElement(rungIndex, elementIndex) {
        if (rungIndex >= 0 && rungIndex < this.program.rungs.length) {
            const rung = this.program.rungs[rungIndex];
            if (elementIndex >= 0 && elementIndex < rung.elements.length) {
                rung.elements.splice(elementIndex, 1);
                this.dirty = true;
                if (this.onUpdate) this.onUpdate();
            }
        }
    }

    // ============================================================
    // I/O Operations
    // ============================================================

    setInput(address, value) {
        if (address in this.inputs) {
            this.inputs[address] = Boolean(value);
            if (this.onUpdate) this.onUpdate();
        }
    }

    toggleInput(address) {
        if (address in this.inputs) {
            this.inputs[address] = !this.inputs[address];
            if (this.onUpdate) this.onUpdate();
        }
    }

    getInput(address) {
        return this.inputs[address] || false;
    }

    getOutput(address) {
        return this.outputs[address] || false;
    }

    getMemory(address) {
        return this.memory[address] || false;
    }

    getBit(address) {
        if (address.startsWith('I')) return this.inputs[address] || false;
        if (address.startsWith('Q')) return this.outputs[address] || false;
        if (address.startsWith('M')) return this.memory[address] || false;
        if (address.startsWith('T')) {
            const timer = this.timers[address.split('.')[0]];
            return timer ? timer.Q : false;
        }
        if (address.startsWith('C')) {
            const counter = this.counters[address.split('.')[0]];
            return counter ? counter.QU : false;
        }
        return false;
    }

    setBit(address, value) {
        if (address.startsWith('I')) {
            this.inputs[address] = Boolean(value);
        } else if (address.startsWith('Q')) {
            this.outputs[address] = Boolean(value);
        } else if (address.startsWith('M')) {
            this.memory[address] = Boolean(value);
        }
    }

    // ============================================================
    // Timer Operations
    // ============================================================

    updateTimer(id, input) {
        const timer = this.timers[id];
        if (!timer) return false;

        const now = Date.now();

        switch (timer.type) {
            case 'TON': // Timer On-Delay
                if (input && !timer.IN) {
                    // Rising edge - start timer
                    timer.startTime = now;
                    timer.running = true;
                }
                if (!input) {
                    // Input off - reset timer
                    timer.Q = false;
                    timer.ET = 0;
                    timer.running = false;
                }
                if (timer.running && input) {
                    timer.ET = now - timer.startTime;
                    if (timer.ET >= timer.PT) {
                        timer.Q = true;
                        timer.ET = timer.PT;
                    }
                }
                timer.IN = input;
                break;

            case 'TOF': // Timer Off-Delay
                if (!input && timer.IN) {
                    // Falling edge - start timer
                    timer.startTime = now;
                    timer.running = true;
                }
                if (input) {
                    // Input on - output on, reset timer
                    timer.Q = true;
                    timer.ET = 0;
                    timer.running = false;
                }
                if (timer.running && !input) {
                    timer.ET = now - timer.startTime;
                    if (timer.ET >= timer.PT) {
                        timer.Q = false;
                        timer.ET = timer.PT;
                        timer.running = false;
                    }
                }
                timer.IN = input;
                break;

            case 'TP': // Pulse Timer
                if (input && !timer.IN && !timer.running) {
                    // Rising edge - start pulse
                    timer.startTime = now;
                    timer.running = true;
                    timer.Q = true;
                }
                if (timer.running) {
                    timer.ET = now - timer.startTime;
                    if (timer.ET >= timer.PT) {
                        timer.Q = false;
                        timer.ET = timer.PT;
                        timer.running = false;
                    }
                }
                timer.IN = input;
                break;
        }

        return timer.Q;
    }

    // ============================================================
    // Counter Operations
    // ============================================================

    updateCounter(id, cu, cd, reset) {
        const counter = this.counters[id];
        if (!counter) return { QU: false, QD: false };

        // Reset (asynchronous)
        if (reset) {
            counter.CV = 0;
            counter.QU = false;
            counter.QD = false;
        } else {
            // Count Up (rising edge)
            if (cu && !counter.prevCU) {
                if (counter.CV < counter.PV) {
                    counter.CV++;
                }
            }

            // Count Down (rising edge)
            if (cd && !counter.prevCD) {
                if (counter.CV > 0) {
                    counter.CV--;
                }
            }
        }

        // Update outputs
        counter.QU = counter.CV >= counter.PV;
        counter.QD = counter.CV <= 0;

        counter.prevCU = cu;
        counter.prevCD = cd;

        return { QU: counter.QU, QD: counter.QD };
    }

    // ============================================================
    // Execution Engine
    // ============================================================

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.scanCycle = 0;

        if (this.onStateChange) {
            this.onStateChange('running');
        }

        // Start scan cycle
        this.scanInterval = setInterval(() => {
            this.executeScan();
        }, this.scanRate);
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        if (this.onStateChange) {
            this.onStateChange('stopped');
        }
    }

    step() {
        if (this.isRunning) return;
        this.executeScan();
    }

    executeScan() {
        const startTime = performance.now();

        // Store previous inputs for edge detection
        for (const addr in this.inputs) {
            this.previousInputs[addr] = this.inputs[addr];
        }

        // Execute each rung
        for (let i = 0; i < this.program.rungs.length; i++) {
            this.executeRung(this.program.rungs[i]);
        }

        this.scanCycle++;
        this.scanTime = Math.round(performance.now() - startTime);

        if (this.onUpdate) this.onUpdate();
    }

    executeRung(rung) {
        if (!rung.elements || rung.elements.length === 0) {
            rung.active = false;
            return;
        }

        // Power flows from left to right
        let powerFlow = true;

        for (let i = 0; i < rung.elements.length; i++) {
            const element = rung.elements[i];
            const result = this.evaluateElement(element, powerFlow);

            // Update element state
            element.active = result.active;

            // For inputs/contacts, they affect power flow
            if (this.isContact(element.type)) {
                powerFlow = result.output;
            }
            // For outputs/coils, they receive power flow
            else if (this.isCoil(element.type)) {
                if (powerFlow) {
                    this.executeOutput(element);
                } else if (element.type === 'OUT') {
                    // Turn off output if no power
                    this.setBit(element.address, false);
                }
                element.active = powerFlow;
            }
            // For function blocks (timers, counters)
            else if (this.isBlock(element.type)) {
                this.executeBlock(element, powerFlow);
                powerFlow = element.active;
            }
        }

        rung.active = powerFlow;
    }

    evaluateElement(element, powerIn) {
        const address = element.address;
        let bitValue = false;
        let output = false;
        let active = false;

        switch (element.type) {
            case 'NO': // Normally Open Contact
                bitValue = this.getBit(address);
                output = powerIn && bitValue;
                active = bitValue;
                break;

            case 'NC': // Normally Closed Contact
                bitValue = this.getBit(address);
                output = powerIn && !bitValue;
                active = !bitValue;
                break;

            case 'P_TRIG': // Positive Edge
                bitValue = this.getBit(address);
                const prevP = this.previousInputs[address] || false;
                output = powerIn && bitValue && !prevP;
                active = output;
                break;

            case 'N_TRIG': // Negative Edge
                bitValue = this.getBit(address);
                const prevN = this.previousInputs[address] || false;
                output = powerIn && !bitValue && prevN;
                active = output;
                break;

            default:
                console.warn(`Unsupported element type: ${element.type}`);
                output = powerIn;
                active = powerIn;
        }

        return { output, active };
    }

    executeOutput(element) {
        const address = element.address;

        switch (element.type) {
            case 'OUT': // Output Coil
                this.setBit(address, true);
                break;

            case 'OUT_N': // Negated Output
                this.setBit(address, false);
                break;

            case 'SET': // Set (Latch)
                this.setBit(address, true);
                break;

            case 'RESET': // Reset (Unlatch)
                this.setBit(address, false);
                break;
        }
    }

    executeBlock(element, powerIn) {
        switch (element.type) {
            case 'TON':
            case 'TOF':
            case 'TP':
                const timerId = element.timerId || 'T0';
                const timer = this.timers[timerId];
                if (timer) {
                    timer.type = element.type;
                    timer.PT = element.preset || 1000;
                    element.active = this.updateTimer(timerId, powerIn);
                    element.currentValue = timer.ET;
                }
                break;

            case 'CTU':
            case 'CTD':
            case 'CTUD':
                const counterId = element.counterId || 'C0';
                const counter = this.counters[counterId];
                if (counter) {
                    counter.PV = element.preset || 10;
                    const result = this.updateCounter(
                        counterId,
                        element.type === 'CTU' || element.type === 'CTUD' ? powerIn : false,
                        element.type === 'CTD' || element.type === 'CTUD' ? powerIn : false,
                        false // Reset input - would need to be implemented as a separate connection
                    );
                    element.active = result.QU;
                    element.currentValue = counter.CV;
                }
                break;

            case 'EQ':
            case 'GT':
            case 'LT':
                // Comparison operations
                const val1 = element.value1 || 0;
                const val2 = element.value2 || 0;
                if (element.type === 'EQ') element.active = val1 === val2;
                if (element.type === 'GT') element.active = val1 > val2;
                if (element.type === 'LT') element.active = val1 < val2;
                break;
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    isContact(type) {
        return ['NO', 'NC', 'P_TRIG', 'N_TRIG'].includes(type);
    }

    isCoil(type) {
        return ['OUT', 'OUT_N', 'SET', 'RESET'].includes(type);
    }

    isBlock(type) {
        return ['TON', 'TOF', 'TP', 'CTU', 'CTD', 'CTUD', 'EQ', 'GT', 'LT'].includes(type);
    }

    // ============================================================
    // Reset
    // ============================================================

    resetAll() {
        this.stop();

        // Reset outputs
        for (const addr in this.outputs) {
            this.outputs[addr] = false;
        }

        // Reset memory
        for (const addr in this.memory) {
            this.memory[addr] = false;
        }

        // Reset timers
        for (const id in this.timers) {
            this.timers[id].IN = false;
            this.timers[id].Q = false;
            this.timers[id].ET = 0;
            this.timers[id].running = false;
        }

        // Reset counters
        for (const id in this.counters) {
            this.counters[id].CV = 0;
            this.counters[id].QU = false;
            this.counters[id].QD = false;
            this.counters[id].prevCU = false;
            this.counters[id].prevCD = false;
        }

        // Reset rung states
        for (const rung of this.program.rungs) {
            rung.active = false;
            for (const element of rung.elements || []) {
                element.active = false;
            }
        }

        this.scanCycle = 0;
        this.scanTime = 0;

        if (this.onUpdate) this.onUpdate();
    }

    resetInputs() {
        for (const addr in this.inputs) {
            this.inputs[addr] = false;
            this.previousInputs[addr] = false;
        }
        if (this.onUpdate) this.onUpdate();
    }

    // ============================================================
    // Import/Export
    // ============================================================

    exportProgram() {
        return JSON.stringify(this.program, null, 2);
    }

    importProgram(json) {
        try {
            const program = JSON.parse(json);
            this.loadProgram(program);
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
}

// Export
window.PLCCore = PLCCore;
