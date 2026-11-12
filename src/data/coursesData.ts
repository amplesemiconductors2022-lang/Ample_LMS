import type { Course } from '../types';

export const COURSES_DATA: Course[] = [
  {
    id: 'course-vlsi-01',
    title: 'RTL to GDSII: Complete ASIC Tapeout & Physical Design Flow',
    slug: 'rtl-to-gdsii-tapeout-flow',
    category: 'VLSI',
    level: 'Advanced',
    duration: '14 Weeks (120 hrs)',
    lessonsCount: 36,
    rating: 4.95,
    reviewsCount: 342,
    instructor: {
      name: 'R. K. Narayanan',
      title: 'Principal Physical Design Lead',
      avatar: '/assets/img/team.jpg',
      company: 'Ample Semiconductors'
    },
    thumbnail: '/assets/img/service-vlsi.jpg',
    tagline: 'From Verilog RTL to Floorplanning, Clock Tree Synthesis, and Sign-off STA for sub-14nm Silicon',
    description: 'Master the complete silicon implementation journey. You will take a high-frequency RISC-V SoC subsystem from synthesizable RTL through logical synthesis, floorplanning, placement, clock tree synthesis (CTS), routing, Static Timing Analysis (STA), and DRC/LVS physical sign-off.',
    targetRole: 'Physical Design Engineer / STA Sign-off Engineer',
    toolsLearned: ['Synopsys ICC2', 'PrimeTime', 'Innovus', 'OpenROAD', 'SkyWater 130nm PDK'],
    enrolledCount: 1420,
    sampleLabCode: `// 4-bit Synchronous Up-Counter with Synchronous Reset
module sync_counter (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       enable,
    output reg  [3:0] count,
    output wire       overflow
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            count <= 4'b0000;
        end else if (enable) begin
            count <= count + 1'b1;
        end
    end

    assign overflow = (count == 4'b1111) && enable;

endmodule`,
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Front-End RTL Synthesis & SDC Timing Constraints',
        lessons: [
          {
            id: 'les-101',
            title: 'Synopsys Design Constraints (SDC) Fundamentals',
            duration: '45 mins',
            type: 'video',
            completed: true,
            content: {
              summary: 'Deep dive into create_clock, set_clock_uncertainty, set_input_delay, and multi-cycle paths.',
              keyTakeaways: [
                'How clock uncertainty accounts for clock jitter and fabrication variation.',
                'Specifying input and output delays relative to virtual and physical clocks.',
                'False paths vs. multi-cycle path definitions for real-world bus protocols.'
              ],
              theoryText: 'Static Timing Analysis (STA) verifies that every registered path satisfies setup (max-delay) and hold (min-delay) constraints. The primary constraint is create_clock -period <P> -waveform {0 P/2} [get_ports clk]. Clock latency consists of source latency and network insertion delay.'
            }
          },
          {
            id: 'les-102',
            title: 'Synthesis Optimization & Gate-Level Netlist Mapping',
            duration: '60 mins',
            type: 'lab',
            completed: true,
            content: {
              summary: 'Transform RTL into cell gates while meeting Power, Performance, and Area (PPA) targets.',
              keyTakeaways: [
                'Standard cell library LEF/Liberty (.lib) format parsing.',
                'High-effort timing-driven logic structuring vs area recovery.',
                'Generating unmapped vs mapped netlists with scan chains.'
              ],
              theoryText: 'Logic synthesis converts HDL code (Verilog/VHDL) into technology-specific gate-level representations. The synthesis compiler uses multi-dimensional lookup tables in .lib files representing cell propagation delay as a function of input transition time and output capacitive load.'
            }
          },
          {
            id: 'les-103',
            title: 'Knowledge Check: Synthesis & SDC Mastery',
            duration: '20 mins',
            type: 'quiz',
            completed: false,
            content: {
              summary: 'Test your understanding of setup/hold formulas, clock skew, and synthesis trade-offs.',
              keyTakeaways: ['Reinforce timing equations', 'Verify understanding of false paths'],
              theoryText: 'Complete the questions below to test your mastery of timing constraint specification.',
              quiz: [
                {
                  id: 'q1',
                  question: 'If clock period is 10ns, Tcq = 1ns, Tcomb = 7ns, Tsetup = 1ns, and clock skew is 0ns, what is the Setup Slack?',
                  options: ['-1ns (Violation)', '1ns (Met)', '0ns (Critical Met)', '2ns (Met)'],
                  correctIndex: 1,
                  explanation: 'Setup Slack = Tclk + Tskew - (Tcq + Tcomb + Tsetup) = 10 + 0 - (1 + 7 + 1) = 10 - 9 = +1.0ns.'
                },
                {
                  id: 'q2',
                  question: 'Which of the following causes Hold Time violations?',
                  options: [
                    'Short data path delay combined with positive clock skew',
                    'Very long combinational logic delay',
                    'Low operating frequency (slow clock)',
                    'High capacitance on the capture flip-flop clock pin'
                  ],
                  correctIndex: 0,
                  explanation: 'Hold violation occurs when data arrives too quickly at the capture register before the hold window has lapsed: Tcq + Tcomb < Thold + Tskew.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'mod-2',
        title: 'Module 2: Floorplanning, Power Distribution & CTS',
        lessons: [
          {
            id: 'les-201',
            title: 'Core Utilization, Die Boundary, and Macro Placement',
            duration: '50 mins',
            type: 'video',
            completed: false,
            content: {
              summary: 'Learn how to partition die space, orient memory SRAM macros, and leave routing corridors.',
              keyTakeaways: [
                'Macro placement guidelines for optimal wirelength and flyline congestion.',
                'Establishing halo margins and keepout zones around memory instances.',
                'Aspect ratio and core-to-IO boundary pad budgeting.'
              ],
              theoryText: 'Floorplanning sets the physical dimensions of the core area, allocates routing channels, defines the I/O pad ring, and places hard IP macros. Bad macro placement cannot be fixed during routing.'
            }
          },
          {
            id: 'les-202',
            title: 'Clock Tree Synthesis (CTS) & Skew Minimization',
            duration: '75 mins',
            type: 'lab',
            completed: false,
            content: {
              summary: 'Synthesize balanced H-Tree and mesh clock networks using buffer/inverter balancing.',
              keyTakeaways: [
                'Understanding global skew vs local skew between synchronous registers.',
                'Sizing clock buffers and NDR (Non-Default Rule) shield routing to minimize crosstalk.',
                'Power dissipation of the clock network: clock gating efficiency.'
              ],
              theoryText: 'CTS balances the insertion delay to all flip-flops so they receive the clock edge simultaneously. Modern flows use multi-corner CTS with clock gating cells (ICGs).'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course-vlsi-02',
    title: 'Advanced SystemVerilog & UVM Design Verification (DV) Elite',
    slug: 'systemverilog-uvm-verification',
    category: 'VLSI',
    level: 'Intermediate',
    duration: '10 Weeks (90 hrs)',
    lessonsCount: 28,
    rating: 4.92,
    reviewsCount: 280,
    instructor: {
      name: 'Vikram Malhotra',
      title: 'Senior Verification Specialist',
      avatar: '/assets/img/team.jpg',
      company: 'Ample Semiconductors'
    },
    thumbnail: '/assets/img/logic-design.jpg',
    tagline: 'Build industry-grade reusable UVM testbenches, assertions, coverage models, and scoreboards',
    description: 'Design Verification makes up 70% of modern chip design cycles. Master SystemVerilog OOP, constrained-random stimulus generation, functional coverage, SystemVerilog Assertions (SVA), and full Universal Verification Methodology (UVM 1.2) components.',
    targetRole: 'Design Verification Engineer / DV Lead',
    toolsLearned: ['Synopsys VCS', 'Cadence Xcelium', 'Verilator', 'SystemVerilog / UVM 1.2'],
    enrolledCount: 980,
    sampleLabCode: `// UVM Sequence Item Definition
class axi_transaction extends uvm_sequence_item;
    rand bit [31:0] addr;
    rand bit [31:0] data;
    rand bit [1:0]  burst_type;
    rand bit [3:0]  length;

    \`uvm_object_utils_begin(axi_transaction)
        \`uvm_field_int(addr, UVM_ALL_ON)
        \`uvm_field_int(data, UVM_ALL_ON)
        \`uvm_field_int(burst_type, UVM_ALL_ON)
        \`uvm_field_int(length, UVM_ALL_ON)
    \`uvm_object_utils_end

    constraint valid_addr { addr[1:0] == 2'b00; } // Word-aligned
    constraint reasonable_len { length inside {[1:16]}; }

    function new(string name = "axi_transaction");
        super.new(name);
    endfunction
endclass`,
    modules: [
      {
        id: 'uvm-mod-1',
        title: 'Module 1: SystemVerilog OOP for Verification Architecture',
        lessons: [
          {
            id: 'uvm-les-101',
            title: 'Classes, Inheritance, Virtual Methods, and Polymorphism',
            duration: '50 mins',
            type: 'video',
            completed: false,
            content: {
              summary: 'Master OOP principles specifically as applied to hardware verification testbenches.',
              keyTakeaways: [
                'Difference between handles and objects; memory allocation with new().',
                'Virtual methods enabling run-time polymorphism for drivers and scoreboards.',
                'Deep copy vs shallow copy operations in transaction classes.'
              ],
              theoryText: 'SystemVerilog OOP enables modular verification architectures. By declaring methods as virtual, derived test classes can override base behavior without recompiling the testbench infrastructure.'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course-emb-01',
    title: 'Embedded Linux, RTOS & Device Driver Development',
    slug: 'embedded-linux-rtos-drivers',
    category: 'Embedded',
    level: 'Intermediate',
    duration: '12 Weeks (100 hrs)',
    lessonsCount: 32,
    rating: 4.88,
    reviewsCount: 215,
    instructor: {
      name: 'Aditya V. Reddy',
      title: 'Principal Embedded Systems Architect',
      avatar: '/assets/img/team.jpg',
      company: 'Ample Semiconductors'
    },
    thumbnail: '/assets/img/embedded.jpg',
    tagline: 'Kernel internals, FreeRTOS scheduling, DMA drivers, and board bring-up for ARM Cortex & RISC-V',
    description: 'Bridge hardware and software. Learn how to write Linux Character & Platform Device Drivers, configure Device Trees, build customized BSPs with Yocto, and implement real-time multi-threaded applications on FreeRTOS and Zephyr.',
    targetRole: 'Embedded Software Engineer / Firmware Engineer',
    toolsLearned: ['Linux Kernel 6.x', 'FreeRTOS', 'Yocto Project', 'GDB / JTAG', 'QEMU ARM'],
    enrolledCount: 840,
    sampleLabCode: `/* FreeRTOS High-Priority Sensor Task */
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

extern QueueHandle_t xSensorQueue;

void vSensorAcquisitionTask(void *pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(10); // 100Hz loop
    uint32_t sensor_reading = 0;

    for (;;) {
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
        sensor_reading = READ_ADC_CHANNEL(0); // Hardware register read
        xQueueSendToBack(xSensorQueue, &sensor_reading, 0);
    }
}`,
    modules: [
      {
        id: 'emb-mod-1',
        title: 'Module 1: RTOS Internals & Multi-Thread Synchronization',
        lessons: [
          {
            id: 'emb-les-101',
            title: 'Preemptive Scheduling, Priority Inversion & Mutexes',
            duration: '45 mins',
            type: 'video',
            completed: false,
            content: {
              summary: 'Understand how real-time schedulers switch context in sub-microsecond intervals.',
              keyTakeaways: [
                'Context switching register stacking and PendSV exceptions on ARM Cortex-M.',
                'Priority inversion dilemma and Priority Inheritance protocol solution.',
                'Semaphores vs Mutexes: ownership and ISR safety rules.'
              ],
              theoryText: 'In hard real-time systems, predictability takes precedence over throughput. FreeRTOS uses a prioritized preemptive scheduling algorithm that guarantees the highest-priority Ready task always occupies the CPU.'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course-ai-01',
    title: 'TinyML & Edge AI Silicon Acceleration',
    slug: 'tinyml-edge-ai-silicon-accelerators',
    category: 'AI/ML',
    level: 'Industry Specialization',
    duration: '8 Weeks (65 hrs)',
    lessonsCount: 22,
    rating: 4.97,
    reviewsCount: 160,
    instructor: {
      name: 'Dr. Sameer Joshi',
      title: 'Head of AI & Silicon Acceleration',
      avatar: '/assets/img/team.jpg',
      company: 'Ample Semiconductors'
    },
    thumbnail: '/assets/img/service-ai-ml.jpg',
    tagline: 'Quantize, prune, and deploy deep neural networks on microcontrollers and custom NPU silicon cores',
    description: 'Discover how modern edge computing brings intelligence directly onto milliwatt silicon chips. Learn INT8/INT4 Post-Training Quantization, systolic array matrix-multiplication hardware accelerators, and TensorFlow Lite for Microcontrollers.',
    targetRole: 'Edge AI Engineer / NPU Architecture Specialist',
    toolsLearned: ['TFLite Micro', 'ONNX Runtime', 'TVM', 'Verilog Matrix MAC Engine', 'CMSIS-NN'],
    enrolledCount: 650,
    sampleLabCode: `# PyTorch INT8 Post-Training Quantization for Edge Deployment
import torch
import torch.quantization

class EdgeClassifier(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.quant = torch.quantization.QuantStub()
        self.fc1 = torch.nn.Linear(64, 32)
        self.relu = torch.nn.ReLU()
        self.fc2 = torch.nn.Linear(32, 4)
        self.dequant = torch.quantization.DeQuantStub()

    def forward(self, x):
        x = self.quant(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return self.dequant(x)`,
    modules: [
      {
        id: 'ai-mod-1',
        title: 'Module 1: Deep Learning Quantization & Silicon Constraints',
        lessons: [
          {
            id: 'ai-les-101',
            title: 'Floating Point FP32 to Fixed-Point INT8 Quantization Math',
            duration: '40 mins',
            type: 'video',
            completed: false,
            content: {
              summary: 'Learn the mathematical mapping between real numbers and 8-bit integers for 4x memory savings.',
              keyTakeaways: [
                'Scale factor (S) and Zero-point (Z) calibration techniques.',
                'Symmetric vs Asymmetric quantization tradeoffs.',
                'Minimizing accuracy degradation using KL-divergence calibration.'
              ],
              theoryText: 'Standard neural networks run on 32-bit floating point arithmetic, which is expensive in silicon area and power. Quantizing to 8-bit integers reduces memory bandwidth by 75% and enables high-throughput integer systolic MAC units.'
            }
          }
        ]
      }
    ]
  }
];

export const LAB_TEMPLATES = [
  {
    id: 'counter-4bit',
    title: '4-bit Synchronous Counter',
    category: 'Digital Logic',
    code: `// 4-bit Synchronous Up-Counter with Reset & Enable
module sync_counter (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       enable,
    output reg  [3:0] count,
    output wire       overflow
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            count <= 4'b0000;
        end else if (enable) begin
            count <= count + 1'b1;
        end
    end

    assign overflow = (count == 4'b1111) && enable;

endmodule`,
    description: 'Standard 4-bit sequential counter with synchronous overflow flag. Observe transitions on clk posedge.'
  },
  {
    id: 'fsm-sequence',
    title: 'Moore State Machine (101 Detector)',
    category: 'Sequential Logic',
    code: `// 3-State Moore FSM for '101' Sequence Detection
module fsm_101_detector (
    input  wire clk,
    input  wire rst_n,
    input  wire din,
    output reg  detected
);

    typedef enum logic [1:0] {
        IDLE = 2'b00,
        S_1  = 2'b01,
        S_10 = 2'b10
    } state_t;

    state_t current_state, next_state;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            current_state <= IDLE;
        else
            current_state <= next_state;
    end

    always @(*) begin
        next_state = current_state;
        detected   = 1'b0;
        case (current_state)
            IDLE: next_state = din ? S_1 : IDLE;
            S_1:  next_state = din ? S_1 : S_10;
            S_10: begin
                if (din) begin
                    next_state = S_1;
                    detected   = 1'b1; // Detected 1-0-1!
                end else begin
                    next_state = IDLE;
                end
            end
            default: next_state = IDLE;
        endcase
    end

endmodule`,
    description: 'Classic Moore finite state machine detecting binary sequence "101" across clock pulses.'
  },
  {
    id: 'clock-divider',
    title: 'Even Clock Divider (/4)',
    category: 'Clocking & STA',
    code: `// Frequency Divider by 4 with 50% Duty Cycle
module clk_div_4 (
    input  wire clk_in,
    input  wire rst_n,
    output reg  clk_out
);

    reg [1:0] div_count;

    always @(posedge clk_in or negedge rst_n) begin
        if (!rst_n) begin
            div_count <= 2'b00;
            clk_out   <= 1'b0;
        end else begin
            div_count <= div_count + 1'b1;
            if (div_count == 2'b01) begin
                clk_out <= ~clk_out;
                div_count <= 2'b00;
            end
        end
    end

endmodule`,
    description: 'Divide high-speed clock down to generate lower frequency internal peripheral domain clock.'
  }
];
