/**
 * PLC Ladder Logic Simulator - Main Application
 * Initializes and coordinates all components
 */

// ============================================================
// Initialization
// ============================================================

let plc;
let editor;

document.addEventListener('DOMContentLoaded', () => {
    console.log('⚡ PLC Ladder Logic Simulator - Initializing...');

    // Initialize PLC Core
    plc = new PLCCore();

    // Initialize Ladder Editor
    editor = new LadderEditor(plc, 'rungs-container');

    // Setup callbacks
    plc.onUpdate = () => {
        editor.update();
        updateIOPanel();
        updateTimersCounters();
    };

    plc.onStateChange = (state) => {
        updateStatusIndicator(state);
    };

    // Setup UI handlers
    setupToolbarHandlers();
    setupIOHandlers();
    setupExampleHandlers();
    setupFileHandlers();

    // Load default example
    loadExample('start-stop');

    console.log('✅ PLC Simulator initialized');
});

// ============================================================
// Toolbar Handlers
// ============================================================

function setupToolbarHandlers() {
    // New Program
    document.getElementById('btn-new').addEventListener('click', () => {
        if (confirm('Create a new program? Unsaved changes will be lost.')) {
            plc.loadProgram({
                name: 'New Program',
                rungs: []
            });
            editor.render();
        }
    });

    // Run
    document.getElementById('btn-run').addEventListener('click', () => {
        plc.start();
        document.getElementById('btn-run').disabled = true;
        document.getElementById('btn-stop').disabled = false;
    });

    // Stop
    document.getElementById('btn-stop').addEventListener('click', () => {
        plc.stop();
        document.getElementById('btn-run').disabled = false;
        document.getElementById('btn-stop').disabled = true;
    });

    // Step
    document.getElementById('btn-step').addEventListener('click', () => {
        plc.step();
    });

    // Add Rung
    document.getElementById('btn-add-rung').addEventListener('click', () => {
        editor.addRung();
    });
}

function updateStatusIndicator(state) {
    const indicator = document.getElementById('plc-status');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');

    if (state === 'running') {
        dot.className = 'status-dot running';
        text.textContent = 'RUNNING';
    } else {
        dot.className = 'status-dot stopped';
        text.textContent = 'STOPPED';
    }
}

// ============================================================
// I/O Panel Handlers
// ============================================================

function setupIOHandlers() {
    // Input toggles
    Array.from(document.querySelectorAll('.io-toggle')).forEach(btn => {
        btn.addEventListener('click', () => {
            const address = btn.dataset.address;
            plc.toggleInput(address);
        });

        // Also support click-and-hold for momentary
        btn.addEventListener('mousedown', () => {
            btn.classList.add('active');
        });

        btn.addEventListener('mouseup', () => {
            btn.classList.remove('active');
        });
    });
}

function updateIOPanel() {
    // Update input indicators
    for (const [address, value] of Object.entries(plc.inputs)) {
        const item = document.querySelector(`.io-item[data-address="${address}"]`);
        if (item) {
            const indicator = item.querySelector('.io-indicator');
            indicator.classList.toggle('on', value);
        }
    }

    // Update output indicators
    for (const [address, value] of Object.entries(plc.outputs)) {
        const item = document.querySelector(`.io-item[data-address="${address}"]`);
        if (item) {
            const indicator = item.querySelector('.io-indicator');
            indicator.classList.toggle('on', value);
        }
    }

    // Update memory indicators
    for (const [address, value] of Object.entries(plc.memory)) {
        const item = document.querySelector(`.io-item[data-address="${address}"]`);
        if (item) {
            const indicator = item.querySelector('.io-indicator');
            indicator.classList.toggle('on', value);
        }
    }
}

function updateTimersCounters() {
    // Update timer displays
    for (let i = 0; i < 2; i++) {
        const timer = plc.timers[`T${i}`];
        const item = document.querySelector(`.tc-item[data-id="T${i}"]`);
        if (item && timer) {
            const valueEl = item.querySelector('.tc-value');
            const fillEl = item.querySelector('.tc-fill');

            valueEl.textContent = `${timer.ET}ms`;
            const percent = timer.PT > 0 ? (timer.ET / timer.PT * 100) : 0;
            fillEl.style.width = `${Math.min(percent, 100)}%`;
        }
    }

    // Update counter displays
    for (let i = 0; i < 2; i++) {
        const counter = plc.counters[`C${i}`];
        const item = document.querySelector(`.tc-item[data-id="C${i}"]`);
        if (item && counter) {
            const valueEl = item.querySelector('.tc-value');
            const fillEl = item.querySelector('.tc-fill');

            valueEl.textContent = counter.CV;
            const percent = counter.PV > 0 ? (counter.CV / counter.PV * 100) : 0;
            fillEl.style.width = `${Math.min(percent, 100)}%`;
        }
    }
}

// ============================================================
// Example Programs
// ============================================================

function setupExampleHandlers() {
    Array.from(document.querySelectorAll('.example-btn')).forEach(btn => {
        btn.addEventListener('click', () => {
            const exampleId = btn.dataset.example;
            loadExample(exampleId);
        });
    });
}

function loadExample(exampleId) {
    const example = EXAMPLES[exampleId];
    if (!example) {
        console.error('Example not found:', exampleId);
        return;
    }

    // Stop if running
    plc.stop();
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-stop').disabled = true;

    // Load program
    plc.loadProgram({
        name: example.name,
        rungs: JSON.parse(JSON.stringify(example.rungs)) // Deep copy
    });

    // Reset inputs
    plc.resetInputs();

    // Render
    editor.render();

    console.log(`📄 Loaded example: ${example.name}`);
}

// ============================================================
// File Operations
// ============================================================

function setupFileHandlers() {
    const fileInput = document.getElementById('file-input');

    // Open
    document.getElementById('btn-open').addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    if (plc.importProgram(content)) {
                        editor.render();
                        console.log('📂 Program loaded from file');
                    } else {
                        alert('Failed to load program. Invalid format.');
                    }
                } catch (error) {
                    console.error('Load error:', error);
                    alert('Failed to load program.');
                }
            };
            reader.readAsText(file);
        }
        fileInput.value = ''; // Reset for next use
    });

    // Save
    document.getElementById('btn-save').addEventListener('click', () => {
        const json = plc.exportProgram();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${plc.program.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Program saved');
    });
}

// ============================================================
// Keyboard Shortcuts
// ============================================================

document.addEventListener('keydown', (e) => {
    // Ctrl+S - Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        document.getElementById('btn-save').click();
    }

    // Ctrl+O - Open
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        document.getElementById('btn-open').click();
    }

    // Ctrl+N - New
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('btn-new').click();
    }

    // F5 - Run
    if (e.key === 'F5') {
        e.preventDefault();
        if (!plc.isRunning) {
            document.getElementById('btn-run').click();
        }
    }

    // Shift+F5 - Stop
    if (e.shiftKey && e.key === 'F5') {
        e.preventDefault();
        if (plc.isRunning) {
            document.getElementById('btn-stop').click();
        }
    }

    // F10 - Step
    if (e.key === 'F10') {
        e.preventDefault();
        if (!plc.isRunning) {
            document.getElementById('btn-step').click();
        }
    }

    // Escape - Stop
    if (e.key === 'Escape') {
        if (plc.isRunning) {
            document.getElementById('btn-stop').click();
        }
    }
});

// ============================================================
// Export for debugging
// ============================================================

window.PLCApp = {
    plc,
    editor,
    loadExample,
    EXAMPLES
};

console.log('⚡ PLC Simulator ready. Debug: window.PLCApp');
