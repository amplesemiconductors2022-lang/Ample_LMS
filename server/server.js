import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const isProd = process.env.NODE_ENV === 'production';
const distDir = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined));
app.use(express.json({ limit: '2mb' }));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// ==================== AUTH HELPERS ====================
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET && isProd) {
  console.warn('[auth] SESSION_SECRET is not set: sessions will reset on every restart.');
}
const b64 = (b) => Buffer.from(b).toString('base64url');

function signToken(user) {
  const payload = b64(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 7 * 24 * 3600 * 1000 }));
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig), e = Buffer.from(expected);
  if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(plain, salt, 64).toString('hex')}`;
}

function checkPassword(plain, stored) {
  if (!stored) return false;
  if (!stored.startsWith('scrypt$')) return plain === stored; // legacy plaintext, migrated on startup
  const [, salt, hash] = stored.split('$');
  const test = crypto.scryptSync(String(plain), salt, 64);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

app.use((req, _res, next) => {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  req.auth = m ? verifyToken(m[1]) : null;
  next();
});

const requireAuth = (req, res, next) => req.auth ? next() : res.status(401).json({ error: 'Sign in required.' });
const requireAdmin = (req, res, next) => {
  if (!req.auth) return res.status(401).json({ error: 'Sign in required.' });
  if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
};

// Rate limit sign-in attempts (in memory, per IP)
const attempts = new Map();
const loginLimiter = (req, res, next) => {
  const key = req.ip, now = Date.now();
  const recent = (attempts.get(key) || []).filter(t => now - t < 15 * 60 * 1000);
  if (recent.length >= 20) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  recent.push(now);
  attempts.set(key, recent);
  next();
};


const dataFilePath = path.join(__dirname, 'data', 'store.json');

// Initial default seed state
const initialData = {
  courses: [
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
      sampleLabCode: `// 4-bit Synchronous Up-Counter with Synchronous Reset\nmodule sync_counter (\n    input  wire       clk,\n    input  wire       rst_n,\n    input  wire       enable,\n    output reg  [3:0] count,\n    output wire       overflow\n);\n    always @(posedge clk or negedge rst_n) begin\n        if (!rst_n) count <= 4'b0000;\n        else if (enable) count <= count + 1'b1;\n    end\n    assign overflow = (count == 4'b1111) && enable;\nendmodule`,
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
                theoryText: 'Static Timing Analysis (STA) verifies that every registered path satisfies setup (max-delay) and hold (min-delay) constraints.'
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
                  'High-effort timing-driven logic structuring vs area recovery.'
                ],
                theoryText: 'Logic synthesis converts HDL code (Verilog/VHDL) into technology-specific gate-level representations.'
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
      sampleLabCode: `// UVM Sequence Item Definition\nclass axi_transaction extends uvm_sequence_item;\n    rand bit [31:0] addr;\n    rand bit [31:0] data;\n    \`uvm_object_utils_begin(axi_transaction)\n        \`uvm_field_int(addr, UVM_ALL_ON)\n        \`uvm_field_int(data, UVM_ALL_ON)\n    \`uvm_object_utils_end\nendclass`,
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
                keyTakeaways: ['Virtual methods enabling run-time polymorphism for drivers and scoreboards.'],
                theoryText: 'SystemVerilog OOP enables modular verification architectures.'
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
      sampleLabCode: `/* FreeRTOS Sensor Task */\nvoid vSensorAcquisitionTask(void *pvParameters) {\n    for (;;) {\n        vTaskDelay(pdMS_TO_TICKS(10));\n    }\n}`,
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
                keyTakeaways: ['Preemptive scheduling guarantees highest-priority ready task executes.'],
                theoryText: 'In hard real-time systems, predictability takes precedence over throughput.'
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
      sampleLabCode: `# PyTorch INT8 Post-Training Quantization\nimport torch\nimport torch.quantization`,
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
                keyTakeaways: ['Scale factor (S) and Zero-point (Z) calibration techniques.'],
                theoryText: 'Quantizing to 8-bit integers reduces memory bandwidth by 75% and enables high-throughput integer systolic MAC units.'
              }
            }
          ]
        }
      ]
    }
  ],
  trainees: [
    {
      id: 'TR-101',
      name: 'Varun Reddy',
      email: 'varun.reddy@gmail.com',
      track: 'VLSI Physical Design & STA',
      progress: 92,
      labHours: 28.5,
      streak: 12,
      passportLevel: 'Level 2 Sign-off',
      interviewStatus: 'eligible',
      topScore: 98
    },
    {
      id: 'TR-102',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@outlook.com',
      track: 'SystemVerilog & UVM Verification',
      progress: 88,
      labHours: 24.0,
      streak: 15,
      passportLevel: 'Level 2 Sign-off',
      interviewStatus: 'referred',
      topScore: 95
    },
    {
      id: 'TR-103',
      name: 'Sneha Kulkarni',
      email: 'sneha.k@iitb.ac.in',
      track: 'VLSI Physical Design & STA',
      progress: 100,
      labHours: 42.0,
      streak: 28,
      passportLevel: 'Tapeout Certified',
      interviewStatus: 'hired',
      topScore: 99
    },
    {
      id: 'TR-104',
      name: 'Rohan Mehra',
      email: 'rohan.m@gmail.com',
      track: 'Embedded Linux & RTOS',
      progress: 74,
      labHours: 18.5,
      streak: 8,
      passportLevel: 'Level 1 Foundation',
      interviewStatus: 'under_review',
      topScore: 89
    },
    {
      id: 'TR-105',
      name: 'Divya Nair',
      email: 'divya.nair@pes.edu',
      track: 'TinyML & Edge AI Silicon',
      progress: 95,
      labHours: 31.0,
      streak: 21,
      passportLevel: 'Level 2 Sign-off',
      interviewStatus: 'eligible',
      topScore: 96
    }
  ],
  tapeouts: [
    {
      id: 'TAP-2026-08',
      candidate: 'Varun Reddy',
      project: 'RV32IM RISC-V SoC Subsystem',
      pdk: 'SkyWater 130nm',
      coreArea: '1.44 mm²',
      staSlack: '+0.45ns MET',
      drcStatus: 'Clean (0 errors)',
      lvsStatus: 'Matched',
      submissionDate: 'Today, 2:40 PM',
      status: 'Ready for Review'
    },
    {
      id: 'TAP-2026-07',
      candidate: 'Sneha Kulkarni',
      project: 'AXI-4 Crossbar & DMA Engine',
      pdk: 'SkyWater 130nm',
      coreArea: '1.12 mm²',
      staSlack: '+0.62ns MET',
      drcStatus: 'Clean (0 errors)',
      lvsStatus: 'Matched',
      submissionDate: 'Yesterday',
      status: 'Approved'
    },
    {
      id: 'TAP-2026-06',
      candidate: 'Aarav Sharma',
      project: 'Systolic Array 8x8 INT8 MAC',
      pdk: 'FreePDK 45nm',
      coreArea: '0.85 mm²',
      staSlack: '-0.12ns Setup (Fixing)',
      drcStatus: 'Clean (0 errors)',
      lvsStatus: 'Pending',
      submissionDate: '2 days ago',
      status: 'Action Required'
    }
  ],
  cohorts: [
    {
      id: 'COH-BLR-26',
      name: 'Bengaluru Winter 2026 Silicon Fellows',
      campus: 'Bengaluru Innovation HQ',
      track: 'VLSI Physical Design & STA',
      startDate: '2026-12-01',
      seatLimit: 40,
      enrolledCount: 38,
      mentor: 'R. K. Narayanan (Ample)'
    },
    {
      id: 'COH-HYD-26',
      name: 'Hyderabad Edge AI & Embedded Cohort',
      campus: 'Hyderabad Innovation Lab',
      track: 'Embedded Linux & RTOS',
      startDate: '2026-12-15',
      seatLimit: 35,
      enrolledCount: 29,
      mentor: 'Aditya V. Reddy (Ample)'
    }
  ],
  enquiries: [
    {
      id: 'ENQ-2026-01',
      studentName: 'Varun Reddy',
      studentEmail: 'varun.reddy@gmail.com',
      studentCampus: 'Bengaluru Innovation HQ',
      subject: 'Inquiry on Sub-14nm Clock Tree Synthesis Skew Bounds',
      track: 'VLSI Physical Design & STA',
      message: 'Hello Ample Team, during CTS in the SkyWater flow, my clock insertion delay is 1.2ns but clock skew between memory macro clock pins and register clocks is 85ps. Is this acceptable for the upcoming tapeout sign-off?',
      status: 'pending',
      createdAt: '2026-11-10T11:20:00Z',
      reply: ''
    },
    {
      id: 'ENQ-2026-02',
      studentName: 'Sneha Kulkarni',
      studentEmail: 'sneha.k@gmail.com',
      studentCampus: 'Bengaluru Innovation HQ',
      subject: 'UVM Sequence Arbitration in AXI Crossbar Testbench',
      track: 'Advanced SystemVerilog & UVM Verification',
      message: 'Could you provide guidance on setting SEQ_ARB_STRICT_FIFO vs SEQ_ARB_WEIGHTED when two virtual sequences contend for the address write phase driver?',
      status: 'resolved',
      createdAt: '2026-11-09T14:45:00Z',
      reply: 'Hi Sneha, excellent question. In commercial AXI testbenches, use SEQ_ARB_WEIGHTED with priority tags so write-response transactions do not starve under high slave latency.'
    },
    {
      id: 'ENQ-2026-03',
      studentName: 'Rohan Mehra',
      studentEmail: 'rohan.m@gmail.com',
      studentCampus: 'Hyderabad Innovation Lab',
      subject: 'Embedded Linux Device Tree binding for SPI Flash controller',
      track: 'Embedded Linux Kernel & RTOS Firmware',
      message: 'Our custom FPGA board boots U-Boot, but the kernel panics while probing the QSPI flash node in DTB. Can an instructor review my dts snippet?',
      status: 'in_progress',
      createdAt: '2026-11-10T09:10:00Z',
      reply: 'Under review by Aditya V. Reddy. Please ensure the compatible string matches jedec,spi-nor.'
    }
  ],
  users: [
    {
      id: 'usr-101',
      name: 'Varun Reddy',
      email: 'varun.reddy@gmail.com',
      password: 'password123',
      role: 'trainee',
      avatar: '',
      campus: 'Bengaluru Innovation HQ',
      targetTrack: 'VLSI Physical Design & STA',
      bio: 'Physical Design & STA engineering fellow at Ample Bengaluru. Working on sub-14nm RISC-V clock tree synthesis & PrimeTime sign-off.',
      githubUrl: 'https://github.com/varun-reddy-vlsi',
      linkedinUrl: 'https://linkedin.com/in/varun-reddy-pd',
      passportLevel: 'Level 2 Sign-off',
      enrolledCourseIds: ['course-vlsi-01', 'course-vlsi-02'],
      completedLessonIds: ['les-101', 'les-102'],
      labHours: 28.5,
      streakDays: 12,
      topScore: 98,
      createdAt: '2026-09-01T08:00:00Z'
    },
    {
      id: 'usr-admin-01',
      name: 'Ample Administrator',
      email: 'admin@amplesemi.com',
      password: 'adminpassword',
      role: 'admin',
      avatar: '/assets/img/team.jpg',
      campus: 'Bengaluru Innovation HQ',
      targetTrack: 'Advanced SystemVerilog & UVM Verification',
      bio: 'Academy Director & Technical Administrator at Ample Semiconductors. 14+ tapeouts in sub-7nm FinFET.',
      githubUrl: 'https://github.com/ample-semiconductors',
      linkedinUrl: 'https://linkedin.com/company/ample-semiconductors',
      passportLevel: 'Tapeout Certified (Master Sign-off)',
      enrolledCourseIds: ['course-vlsi-01', 'course-vlsi-02', 'course-emb-01', 'course-ai-01'],
      completedLessonIds: ['les-101', 'les-102', 'uvm-les-101'],
      labHours: 120.0,
      streakDays: 45,
      topScore: 100,
      createdAt: '2026-01-15T08:00:00Z'
    }
  ]
};

// Helper: Read store
function readStore() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.courses) && parsed.courses.length > 0) {
        if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
          parsed.users = initialData.users;
          fs.writeFileSync(dataFilePath, JSON.stringify(parsed, null, 2), 'utf8');
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading store file, falling back to seed:', err);
  }
  // If file doesn't exist or corrupted or empty, write initialData
  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
  fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2), 'utf8');
  return initialData;
}

// Helper: Save store
function saveStore(data) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    const tempPath = `${dataFilePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, dataFilePath);
  } catch (err) {
    console.error('Error saving store file:', err);
  }
}

// Ensure data folder and file initialized on startup
readStore();

// ==================== REST API ROUTES ====================

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Ample Learn API' });
});

// Analytics
app.get('/api/analytics', requireAdmin, (req, res) => {
  const data = readStore();
  res.json({
    activeTrainees: data.trainees.length,
    tapeoutsVerified: data.tapeouts.filter(t => t.status === 'Approved').length,
    interviewQualified: data.trainees.filter(t => t.interviewStatus === 'eligible' || t.interviewStatus === 'referred' || t.interviewStatus === 'hired').length,
    totalLabHours: data.trainees.reduce((acc, curr) => acc + (curr.labHours || 0), 0)
  });
});

// ==================== AUTHENTICATION & USER PROFILES ====================

// Login
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const data = readStore();
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = (data.users || []).find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please check spelling or sign up.' });
  }

  // Password check (allow demo access or match)
  if (!(DEMO_MODE && password === 'demo') && !checkPassword(password, user.password)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const { password: _, ...userSafe } = user;
  res.json({
    user: userSafe,
    token: signToken(user)
  });
});

// Signup
app.post('/api/auth/signup', loginLimiter, (req, res) => {
  const data = readStore();
  const { name, email, password, campus, targetTrack } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = (data.users || []).find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const newUser = {
    id: 'usr-' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: hashPassword(password || crypto.randomBytes(9).toString('hex')),
    role: 'trainee',
    avatar: '',
    campus: campus || 'Bengaluru Innovation HQ',
    targetTrack: targetTrack || 'VLSI Physical Design & STA',
    bio: 'Semiconductor engineering trainee at Ample Semiconductors Academy.',
    githubUrl: '',
    linkedinUrl: '',
    passportLevel: 'Level 1 Foundation',
    enrolledCourseIds: ['course-vlsi-01'],
    completedLessonIds: [],
    labHours: 0,
    streakDays: 1,
    topScore: 0,
    createdAt: new Date().toISOString()
  };

  data.users = data.users || [];
  data.users.unshift(newUser);

  // Also add to trainees roster for admin tracking!
  data.trainees = data.trainees || [];
  data.trainees.unshift({
    id: 'TR-' + (100 + data.trainees.length + 1),
    name: newUser.name,
    email: newUser.email,
    track: newUser.targetTrack,
    progress: 5,
    labHours: 0,
    streak: 1,
    passportLevel: newUser.passportLevel,
    interviewStatus: 'under_review',
    topScore: 0
  });

  saveStore(data);

  const { password: _, ...userSafe } = newUser;
  res.status(201).json({
    user: userSafe,
    token: 'ample-jwt-' + Buffer.from(newUser.id + ':' + Date.now()).toString('base64')
  });
});

// Get current user profile
app.get('/api/auth/me', (req, res) => {
  const data = readStore();
  if (!req.auth) return res.status(401).json({ error: 'Sign in required.' });
  const user = (data.users || []).find(u => u.id === req.auth.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});

// Update profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const data = readStore();
  const { id, name, campus, targetTrack, bio, githubUrl, linkedinUrl, avatar } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  if (id !== req.auth.id && req.auth.role !== 'admin') {
    return res.status(403).json({ error: 'You can only edit your own profile.' });
  }

  const index = (data.users || []).findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  data.users[index] = {
    ...data.users[index],
    name: name !== undefined ? name : data.users[index].name,
    campus: campus !== undefined ? campus : data.users[index].campus,
    targetTrack: targetTrack !== undefined ? targetTrack : data.users[index].targetTrack,
    bio: bio !== undefined ? bio : data.users[index].bio,
    githubUrl: githubUrl !== undefined ? githubUrl : data.users[index].githubUrl,
    linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : data.users[index].linkedinUrl,
    avatar: avatar !== undefined ? avatar : data.users[index].avatar
  };

  // Also sync with trainees table if matching email
  const traineeIndex = (data.trainees || []).findIndex(t => t.email.toLowerCase() === data.users[index].email.toLowerCase());
  if (traineeIndex !== -1) {
    data.trainees[traineeIndex].name = data.users[index].name;
    data.trainees[traineeIndex].track = data.users[index].targetTrack;
  }

  saveStore(data);

  const { password: _, ...userSafe } = data.users[index];
  res.json(userSafe);
});

// Quick switch demo user (1-click testing)
app.post('/api/auth/switch-demo', (req, res) => {
  if (!DEMO_MODE) return res.status(403).json({ error: 'Disabled outside demo mode' });
  const data = readStore();
  const { role } = req.body; // 'trainee' | 'admin'

  const targetRole = role === 'admin' ? 'admin' : 'trainee';
  const user = (data.users || []).find(u => u.role === targetRole) || data.users[0];

  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const { password: _, ...userSafe } = user;
  res.json({
    user: userSafe,
    token: signToken(user)
  });
});

// List all registered users
app.get('/api/auth/users', requireAdmin, (req, res) => {
  const data = readStore();
  const safeUsers = (data.users || []).map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Courses (Tracks)
app.get('/api/courses', (req, res) => {
  const data = readStore();
  res.json(data.courses);
});

app.get('/api/courses/:id', (req, res) => {
  const data = readStore();
  const course = data.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
});

app.post('/api/courses', requireAdmin, (req, res) => {
  const data = readStore();
  const newCourse = req.body;
  if (!newCourse.id) {
    newCourse.id = 'course-' + Date.now();
  }
  if (!newCourse.slug) {
    newCourse.slug = (newCourse.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (!newCourse.modules) {
    newCourse.modules = [];
  }
  data.courses.unshift(newCourse);
  saveStore(data);
  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', requireAdmin, (req, res) => {
  const data = readStore();
  const { id } = req.params;
  const index = data.courses.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  data.courses[index] = { ...data.courses[index], ...req.body };
  saveStore(data);
  res.json(data.courses[index]);
});

app.delete('/api/courses/:id', requireAdmin, (req, res) => {
  const data = readStore();
  const { id } = req.params;
  data.courses = data.courses.filter(c => c.id !== id);
  saveStore(data);
  res.json({ success: true, id });
});

// Trainees
app.get('/api/trainees', requireAdmin, (req, res) => {
  const data = readStore();
  res.json(data.trainees);
});

app.get('/api/trainees/:id', requireAdmin, (req, res) => {
  const data = readStore();
  const trainee = data.trainees.find(t => t.id === req.params.id);
  if (!trainee) {
    return res.status(404).json({ error: 'Trainee not found' });
  }
  res.json(trainee);
});

app.post('/api/trainees', requireAdmin, (req, res) => {
  const data = readStore();
  const trainee = {
    id: 'TR-' + (100 + data.trainees.length + 1),
    ...req.body
  };
  data.trainees.unshift(trainee);
  saveStore(data);
  res.status(201).json(trainee);
});

app.patch('/api/trainees/:id/status', requireAdmin, (req, res) => {
  const data = readStore();
  const { id } = req.params;
  const { interviewStatus } = req.body;
  const index = data.trainees.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Trainee not found' });
  }
  data.trainees[index].interviewStatus = interviewStatus;
  saveStore(data);
  res.json(data.trainees[index]);
});

// Tapeouts
app.get('/api/tapeouts', requireAdmin, (req, res) => {
  const data = readStore();
  res.json(data.tapeouts);
});

app.get('/api/tapeouts/:id', requireAdmin, (req, res) => {
  const data = readStore();
  const tapeout = data.tapeouts.find(t => t.id === req.params.id);
  if (!tapeout) {
    return res.status(404).json({ error: 'Tapeout not found' });
  }
  res.json(tapeout);
});

app.post('/api/tapeouts', requireAdmin, (req, res) => {
  const data = readStore();
  const newTapeout = {
    id: 'TAP-2026-' + (data.tapeouts.length + 1).toString().padStart(2, '0'),
    submissionDate: 'Just now',
    status: 'Ready for Review',
    ...req.body
  };
  data.tapeouts.unshift(newTapeout);
  saveStore(data);
  res.status(201).json(newTapeout);
});

app.patch('/api/tapeouts/:id/status', requireAdmin, (req, res) => {
  const data = readStore();
  const { id } = req.params;
  const { status } = req.body;
  const index = data.tapeouts.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tapeout not found' });
  }
  data.tapeouts[index].status = status;
  saveStore(data);
  res.json(data.tapeouts[index]);
});

// Cohorts
app.get('/api/cohorts', requireAdmin, (req, res) => {
  const data = readStore();
  res.json(data.cohorts);
});

app.get('/api/cohorts/:id', requireAdmin, (req, res) => {
  const data = readStore();
  const cohort = data.cohorts.find(c => c.id === req.params.id);
  if (!cohort) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  res.json(cohort);
});

app.post('/api/cohorts', requireAdmin, (req, res) => {
  const data = readStore();
  const newCohort = {
    id: 'COH-' + Date.now().toString().slice(-4),
    enrolledCount: 0,
    ...req.body
  };
  data.cohorts.unshift(newCohort);
  saveStore(data);
  res.status(201).json(newCohort);
});

// User Enquiries & Student Questions
app.get('/api/enquiries', requireAdmin, (req, res) => {
  const data = readStore();
  if (!data.enquiries) {
    data.enquiries = initialData.enquiries;
    saveStore(data);
  }
  res.json(data.enquiries);
});

app.post('/api/enquiries', (req, res) => {
  const data = readStore();
  if (!data.enquiries) data.enquiries = [];
  
  const newEnquiry = {
    id: 'ENQ-' + Date.now().toString().slice(-6),
    studentName: req.body.studentName || 'Student Trainee',
    studentEmail: req.body.studentEmail || 'student@ample.com',
    studentCampus: req.body.studentCampus || 'Bengaluru Innovation HQ',
    subject: req.body.subject || 'General Inquiry',
    track: req.body.track || 'VLSI Physical Design & STA',
    message: req.body.message || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    reply: ''
  };

  data.enquiries.unshift(newEnquiry);
  saveStore(data);
  res.status(201).json(newEnquiry);
});

app.put('/api/enquiries/:id/reply', requireAdmin, (req, res) => {
  const data = readStore();
  if (!data.enquiries) data.enquiries = [];
  const { id } = req.params;
  const { reply, status } = req.body;

  const index = data.enquiries.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  data.enquiries[index].reply = reply;
  data.enquiries[index].status = status || 'resolved';
  data.enquiries[index].repliedAt = new Date().toISOString();
  saveStore(data);
  res.json(data.enquiries[index]);
});

app.patch('/api/enquiries/:id/status', requireAdmin, (req, res) => {
  const data = readStore();
  if (!data.enquiries) data.enquiries = [];
  const { id } = req.params;
  const { status } = req.body;

  const index = data.enquiries.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  data.enquiries[index].status = status;
  saveStore(data);
  res.json(data.enquiries[index]);
});

app.delete('/api/enquiries/:id', requireAdmin, (req, res) => {
  const data = readStore();
  if (!data.enquiries) data.enquiries = [];
  const { id } = req.params;
  data.enquiries = data.enquiries.filter(e => e.id !== id);
  saveStore(data);
  res.json({ success: true, id });
});

// Reset to initial seed state
app.post('/api/reset', requireAdmin, (req, res) => {
  if (!DEMO_MODE) return res.status(403).json({ error: 'Disabled outside demo mode' });
  saveStore(initialData);
  res.json({ success: true, message: 'Data store reset to Ample default state' });
});

// Hash any legacy plaintext passwords in the store
(function migratePasswords() {
  try {
    const data = readStore();
    let changed = false;
    (data.users || []).forEach(u => {
      if (u.password && !String(u.password).startsWith('scrypt$')) { u.password = hashPassword(u.password); changed = true; }
    });
    if (changed) saveStore(data);
  } catch (e) { console.warn('[auth] password migration skipped:', e.message); }
})();

if (isProd && fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '7d', index: false, setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[Ample Learn Backend] REST API server running on port ${PORT}`);
});
