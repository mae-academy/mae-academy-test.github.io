/**
 * PLC Ladder Logic Simulator - Example Programs
 * Pre-built ladder logic programs for learning
 */

const EXAMPLES = {
    // ============================================================
    // Start/Stop Motor Control
    // ============================================================
    'start-stop': {
        name: 'Start/Stop Motor Control',
        description: 'Classic motor control with start button, stop button, and seal-in circuit',
        rungs: [
            {
                id: 1,
                comment: 'Motor Start/Stop with Seal-In',
                elements: [
                    { type: 'NO', address: 'I0.0', comment: 'Start Button' },
                    { type: 'NO', address: 'Q0.0', comment: 'Seal-In Contact' },
                    { type: 'NC', address: 'I0.1', comment: 'Stop Button' },
                    { type: 'OUT', address: 'Q0.0', comment: 'Motor Contactor' }
                ]
            },
            {
                id: 2,
                comment: 'Motor Running Indicator',
                elements: [
                    { type: 'NO', address: 'Q0.0', comment: 'Motor Running' },
                    { type: 'OUT', address: 'Q0.1', comment: 'Run Lamp' }
                ]
            },
            {
                id: 3,
                comment: 'Motor Stopped Indicator',
                elements: [
                    { type: 'NC', address: 'Q0.0', comment: 'Motor Stopped' },
                    { type: 'OUT', address: 'Q0.2', comment: 'Stop Lamp' }
                ]
            }
        ]
    },

    // ============================================================
    // Traffic Light Control
    // ============================================================
    'traffic-light': {
        name: 'Traffic Light Control',
        description: 'Sequential traffic light with red, yellow, and green phases',
        rungs: [
            {
                id: 1,
                comment: 'System Enable - Start Sequence',
                elements: [
                    { type: 'NO', address: 'I0.0', comment: 'Enable Switch' },
                    { type: 'NC', address: 'M0.2', comment: 'Not Yellow' },
                    { type: 'SET', address: 'M0.0', comment: 'Start Red' }
                ]
            },
            {
                id: 2,
                comment: 'Red Light Timer (5 seconds)',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Red Phase' },
                    { type: 'TON', timerId: 'T0', preset: 5000, comment: 'Red Timer' }
                ]
            },
            {
                id: 3,
                comment: 'Switch to Green after Red',
                elements: [
                    { type: 'NO', address: 'T0', comment: 'Red Timer Done' },
                    { type: 'RESET', address: 'M0.0', comment: 'End Red' }
                ]
            },
            {
                id: 4,
                comment: 'Start Green Phase',
                elements: [
                    { type: 'NO', address: 'T0', comment: 'Red Timer Done' },
                    { type: 'SET', address: 'M0.1', comment: 'Start Green' }
                ]
            },
            {
                id: 5,
                comment: 'Green Light Timer (5 seconds)',
                elements: [
                    { type: 'NO', address: 'M0.1', comment: 'Green Phase' },
                    { type: 'TON', timerId: 'T1', preset: 5000, comment: 'Green Timer' }
                ]
            },
            {
                id: 6,
                comment: 'Switch to Yellow after Green',
                elements: [
                    { type: 'NO', address: 'T1', comment: 'Green Timer Done' },
                    { type: 'RESET', address: 'M0.1', comment: 'End Green' }
                ]
            },
            {
                id: 7,
                comment: 'Start Yellow Phase',
                elements: [
                    { type: 'NO', address: 'T1', comment: 'Green Timer Done' },
                    { type: 'SET', address: 'M0.2', comment: 'Start Yellow' }
                ]
            },
            {
                id: 8,
                comment: 'Yellow Light Timer (2 seconds)',
                elements: [
                    { type: 'NO', address: 'M0.2', comment: 'Yellow Phase' },
                    { type: 'TON', timerId: 'T2', preset: 2000, comment: 'Yellow Timer' }
                ]
            },
            {
                id: 9,
                comment: 'Reset to Red after Yellow',
                elements: [
                    { type: 'NO', address: 'T2', comment: 'Yellow Timer Done' },
                    { type: 'RESET', address: 'M0.2', comment: 'End Yellow' }
                ]
            },
            {
                id: 10,
                comment: 'Restart Cycle - Back to Red',
                elements: [
                    { type: 'NO', address: 'T2', comment: 'Yellow Done' },
                    { type: 'NO', address: 'I0.0', comment: 'System Enabled' },
                    { type: 'SET', address: 'M0.0', comment: 'Start Red' }
                ]
            },
            {
                id: 11,
                comment: 'Red Light Output',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Red Phase' },
                    { type: 'OUT', address: 'Q0.0', comment: 'Red Light' }
                ]
            },
            {
                id: 12,
                comment: 'Yellow Light Output',
                elements: [
                    { type: 'NO', address: 'M0.2', comment: 'Yellow Phase' },
                    { type: 'OUT', address: 'Q0.1', comment: 'Yellow Light' }
                ]
            },
            {
                id: 13,
                comment: 'Green Light Output',
                elements: [
                    { type: 'NO', address: 'M0.1', comment: 'Green Phase' },
                    { type: 'OUT', address: 'Q0.2', comment: 'Green Light' }
                ]
            }
        ]
    },

    // ============================================================
    // Conveyor Belt System
    // ============================================================
    'conveyor': {
        name: 'Conveyor Belt System',
        description: 'Conveyor with start/stop, product sensor, and counter',
        rungs: [
            {
                id: 1,
                comment: 'Conveyor Start/Stop Control',
                elements: [
                    { type: 'NO', address: 'I0.0', comment: 'Start' },
                    { type: 'NO', address: 'M0.0', comment: 'Seal-In' },
                    { type: 'NC', address: 'I0.1', comment: 'Stop' },
                    { type: 'NC', address: 'I0.2', comment: 'E-Stop' },
                    { type: 'SET', address: 'M0.0', comment: 'Running' }
                ]
            },
            {
                id: 2,
                comment: 'Stop Conveyor',
                elements: [
                    { type: 'NO', address: 'I0.1', comment: 'Stop Pressed' },
                    { type: 'RESET', address: 'M0.0', comment: 'Stop Running' }
                ]
            },
            {
                id: 3,
                comment: 'Emergency Stop',
                elements: [
                    { type: 'NO', address: 'I0.2', comment: 'E-Stop Pressed' },
                    { type: 'RESET', address: 'M0.0', comment: 'Emergency Stop' }
                ]
            },
            {
                id: 4,
                comment: 'Conveyor Motor Output',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Running' },
                    { type: 'OUT', address: 'Q0.0', comment: 'Conveyor Motor' }
                ]
            },
            {
                id: 5,
                comment: 'Product Counter (counts to 10)',
                elements: [
                    { type: 'NO', address: 'I0.3', comment: 'Product Sensor' },
                    { type: 'NO', address: 'M0.0', comment: 'Running' },
                    { type: 'CTU', counterId: 'C0', preset: 10, comment: 'Product Count' }
                ]
            },
            {
                id: 6,
                comment: 'Batch Complete - Stop for Packaging',
                elements: [
                    { type: 'NO', address: 'C0', comment: 'Count Complete' },
                    { type: 'OUT', address: 'Q0.1', comment: 'Batch Lamp' }
                ]
            },
            {
                id: 7,
                comment: 'Running Indicator',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Running' },
                    { type: 'OUT', address: 'Q0.2', comment: 'Run Lamp' }
                ]
            }
        ]
    },

    // ============================================================
    // Tank Level Control
    // ============================================================
    'tank-level': {
        name: 'Tank Level Control',
        description: 'Automatic fill valve with high/low level sensors',
        rungs: [
            {
                id: 1,
                comment: 'Start Fill when Level Low',
                elements: [
                    { type: 'NO', address: 'I0.0', comment: 'Low Level Sensor' },
                    { type: 'NC', address: 'I0.1', comment: 'High Level (NC)' },
                    { type: 'SET', address: 'M0.0', comment: 'Fill Enable' }
                ]
            },
            {
                id: 2,
                comment: 'Stop Fill when Level High',
                elements: [
                    { type: 'NO', address: 'I0.1', comment: 'High Level Sensor' },
                    { type: 'RESET', address: 'M0.0', comment: 'Stop Fill' }
                ]
            },
            {
                id: 3,
                comment: 'Fill Valve Output',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Fill Enable' },
                    { type: 'NC', address: 'I0.2', comment: 'Manual Override' },
                    { type: 'OUT', address: 'Q0.0', comment: 'Fill Valve' }
                ]
            },
            {
                id: 4,
                comment: 'Drain Valve (Manual)',
                elements: [
                    { type: 'NO', address: 'I0.3', comment: 'Drain Button' },
                    { type: 'OUT', address: 'Q0.1', comment: 'Drain Valve' }
                ]
            },
            {
                id: 5,
                comment: 'Low Level Alarm',
                elements: [
                    { type: 'NC', address: 'I0.0', comment: 'Level Not Low' },
                    { type: 'OUT', address: 'Q0.2', comment: 'Low Alarm' }
                ]
            },
            {
                id: 6,
                comment: 'High Level Alarm',
                elements: [
                    { type: 'NO', address: 'I0.1', comment: 'High Level' },
                    { type: 'OUT', address: 'Q0.3', comment: 'High Alarm' }
                ]
            },
            {
                id: 7,
                comment: 'Fill Timer - Max Fill Time',
                elements: [
                    { type: 'NO', address: 'Q0.0', comment: 'Filling' },
                    { type: 'TON', timerId: 'T0', preset: 30000, comment: 'Fill Timeout' }
                ]
            },
            {
                id: 8,
                comment: 'Fill Timeout Alarm',
                elements: [
                    { type: 'NO', address: 'T0', comment: 'Timeout' },
                    { type: 'OUT', address: 'Q0.4', comment: 'Timeout Alarm' }
                ]
            }
        ]
    },

    // ============================================================
    // Sequential Process
    // ============================================================
    'sequence': {
        name: 'Sequential Process',
        description: 'Three-step sequential process with interlocks',
        rungs: [
            {
                id: 1,
                comment: 'Step 1 Start - Initial Conditions',
                elements: [
                    { type: 'NO', address: 'I0.0', comment: 'Start Button' },
                    { type: 'NC', address: 'M0.1', comment: 'Step 2 Not Active' },
                    { type: 'NC', address: 'M0.2', comment: 'Step 3 Not Active' },
                    { type: 'SET', address: 'M0.0', comment: 'Start Step 1' }
                ]
            },
            {
                id: 2,
                comment: 'Step 1 Timer (3 seconds)',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Step 1 Active' },
                    { type: 'TON', timerId: 'T0', preset: 3000, comment: 'Step 1 Timer' }
                ]
            },
            {
                id: 3,
                comment: 'Step 1 Complete - Move to Step 2',
                elements: [
                    { type: 'NO', address: 'T0', comment: 'Step 1 Done' },
                    { type: 'RESET', address: 'M0.0', comment: 'End Step 1' }
                ]
            },
            {
                id: 4,
                comment: 'Start Step 2',
                elements: [
                    { type: 'NO', address: 'T0', comment: 'Step 1 Done' },
                    { type: 'SET', address: 'M0.1', comment: 'Start Step 2' }
                ]
            },
            {
                id: 5,
                comment: 'Step 2 Timer (3 seconds)',
                elements: [
                    { type: 'NO', address: 'M0.1', comment: 'Step 2 Active' },
                    { type: 'TON', timerId: 'T1', preset: 3000, comment: 'Step 2 Timer' }
                ]
            },
            {
                id: 6,
                comment: 'Step 2 Complete - Move to Step 3',
                elements: [
                    { type: 'NO', address: 'T1', comment: 'Step 2 Done' },
                    { type: 'RESET', address: 'M0.1', comment: 'End Step 2' }
                ]
            },
            {
                id: 7,
                comment: 'Start Step 3',
                elements: [
                    { type: 'NO', address: 'T1', comment: 'Step 2 Done' },
                    { type: 'SET', address: 'M0.2', comment: 'Start Step 3' }
                ]
            },
            {
                id: 8,
                comment: 'Step 3 Timer (3 seconds)',
                elements: [
                    { type: 'NO', address: 'M0.2', comment: 'Step 3 Active' },
                    { type: 'TON', timerId: 'T2', preset: 3000, comment: 'Step 3 Timer' }
                ]
            },
            {
                id: 9,
                comment: 'Step 3 Complete - Cycle Done',
                elements: [
                    { type: 'NO', address: 'T2', comment: 'Step 3 Done' },
                    { type: 'RESET', address: 'M0.2', comment: 'End Step 3' }
                ]
            },
            {
                id: 10,
                comment: 'Cycle Complete Output',
                elements: [
                    { type: 'NO', address: 'T2', comment: 'All Done' },
                    { type: 'OUT', address: 'Q0.3', comment: 'Complete Lamp' }
                ]
            },
            {
                id: 11,
                comment: 'Step 1 Output',
                elements: [
                    { type: 'NO', address: 'M0.0', comment: 'Step 1' },
                    { type: 'OUT', address: 'Q0.0', comment: 'Step 1 Lamp' }
                ]
            },
            {
                id: 12,
                comment: 'Step 2 Output',
                elements: [
                    { type: 'NO', address: 'M0.1', comment: 'Step 2' },
                    { type: 'OUT', address: 'Q0.1', comment: 'Step 2 Lamp' }
                ]
            },
            {
                id: 13,
                comment: 'Step 3 Output',
                elements: [
                    { type: 'NO', address: 'M0.2', comment: 'Step 3' },
                    { type: 'OUT', address: 'Q0.2', comment: 'Step 3 Lamp' }
                ]
            }
        ]
    }
};

// Export
window.EXAMPLES = EXAMPLES;
