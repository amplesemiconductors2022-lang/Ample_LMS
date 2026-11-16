import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createStore } from './services/store.js';
import { getEmailStatus, sendEmail, sendVerificationEmail, escapeHtml } from './services/email.js';
import { getMediaStatus, createCloudinarySignature } from './services/media.js';
import { getOAuthProviders, getAuthorizeUrl, exchangeOAuthCode, verifyOAuthState, getBaseUrl } from './services/oauth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const k = trimmed.slice(0, eq).trim();
        const v = trimmed.slice(eq + 1).trim();
        process.env[k] = v;
      }
    }
  } catch { }
}

const app = express();
const PORT = process.env.PORT || 5001;

const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const isProd = process.env.NODE_ENV === 'production';
const distDir = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IPs behind Vercel / reverse proxies (rate limiting)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'");
  if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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
      passportLevel: 'Verified Trainee',
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
      passportLevel: 'Verified Trainee',
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
      passportLevel: 'Enrolled Trainee',
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
      passportLevel: 'Verified Trainee',
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
      passportLevel: 'Verified Trainee',
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

// Storage adapter (MongoDB Atlas when MONGODB_URI is set, JSON file fallback otherwise)
const { readStore, saveStore, getStorageMode, cloneSeed } = createStore({
  initialData,
  dataFilePath,
  hashPassword,
});

// ==================== REST API ROUTES ====================

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    platform: 'Ample Learn API',
    storage: getStorageMode(),
    integrations: {
      mongodb: Boolean(process.env.MONGODB_URI),
      email: getEmailStatus(),
      media: getMediaStatus(),
      oauth: getOAuthProviders(),
    },
  });
});

// Analytics
app.get('/api/analytics', requireAdmin, async (_req, res) => {
  const data = await readStore();
  res.json({
    activeTrainees: data.trainees.length,
    tapeoutsVerified: data.tapeouts.filter(t => t.status === 'Approved').length,
    interviewQualified: data.trainees.filter(t => t.interviewStatus === 'eligible' || t.interviewStatus === 'referred' || t.interviewStatus === 'hired').length,
    totalLabHours: data.trainees.reduce((acc, curr) => acc + (curr.labHours || 0), 0)
  });
});

// ==================== AUTHENTICATION & USER PROFILES ====================

// Enabled OAuth providers
app.get('/api/auth/providers', (_req, res) => {
  res.json(getOAuthProviders());
});

// Start OAuth 2.0 flow (Google / GitHub)
app.get('/api/auth/oauth/:provider', (req, res) => {
  const { provider } = req.params;
  try {
    const url = getAuthorizeUrl(provider, req, SESSION_SECRET);
    res.redirect(url);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// OAuth 2.0 callback
app.get('/api/auth/oauth/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  const appBase = getBaseUrl(req);

  if (error) {
    return res.redirect(`${appBase}/#oauth_error=${encodeURIComponent(String(error))}`);
  }
  if (!code || !verifyOAuthState(String(state || ''), provider, SESSION_SECRET)) {
    return res.redirect(`${appBase}/#oauth_error=${encodeURIComponent('Invalid or expired OAuth state.')}`);
  }

  try {
    const profile = await exchangeOAuthCode(provider, String(code), req);
    const data = await readStore();
    data.users = data.users || [];
    data.trainees = data.trainees || [];

    let user = data.users.find(u => u.email.toLowerCase() === profile.email);
    if (!user) {
      user = {
        id: 'usr-' + Date.now(),
        name: profile.name,
        email: profile.email,
        password: hashPassword(crypto.randomBytes(18).toString('hex')),
        role: 'trainee',
        authProvider: profile.provider,
        avatar: profile.avatar || '',
        campus: 'Bengaluru Innovation HQ',
        targetTrack: 'VLSI Physical Design & STA',
        bio: 'Semiconductor engineering trainee at Ample Semiconductors Academy.',
        githubUrl: '',
        linkedinUrl: '',
        passportLevel: 'Enrolled Trainee',
        enrolledCourseIds: ['course-vlsi-01'],
        completedLessonIds: [],
        labHours: 0,
        streakDays: 1,
        topScore: 0,
        createdAt: new Date().toISOString()
      };
      data.users.unshift(user);
      data.trainees.unshift({
        id: 'TR-' + (100 + data.trainees.length + 1),
        name: user.name,
        email: user.email,
        track: user.targetTrack,
        progress: 5,
        labHours: 0,
        streak: 1,
        passportLevel: user.passportLevel,
        interviewStatus: 'under_review',
        topScore: 0
      });
      await saveStore(data);
    }

    const token = signToken(user);
    return res.redirect(`${appBase}/#oauth=${encodeURIComponent(token)}`);
  } catch (err) {
    return res.redirect(`${appBase}/#oauth_error=${encodeURIComponent(err.message || 'OAuth sign-in failed.')}`);
  }
});

// Login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const data = await readStore();
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

  if (user.isVerified === false) {
    return res.status(403).json({
      error: 'Please verify your email address to log in.',
      requiresVerification: true,
      email: user.email
    });
  }

  const { password: _, ...userSafe } = user;
  res.json({
    user: userSafe,
    token: signToken(user)
  });
});

// Signup
app.post('/api/auth/signup', loginLimiter, async (req, res) => {
  const data = await readStore();
  const { name, email, password, campus, targetTrack } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = (data.users || []).find(u => u.email.toLowerCase() === cleanEmail);

  const code = String(crypto.randomInt(100000, 1000000));
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  let targetUser = existing;
  if (!targetUser) {
    targetUser = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password || crypto.randomBytes(9).toString('hex')),
      role: 'trainee',
      avatar: '',
      campus: campus || 'Bengaluru',
      targetTrack: targetTrack || 'VLSI',
      bio: 'Semiconductor engineering trainee at Ample Semiconductors Academy.',
      githubUrl: '',
      linkedinUrl: '',
      passportLevel: 'Enrolled Trainee',
      enrolledCourseIds: ['course-vlsi-01'],
      completedLessonIds: [],
      labHours: 0,
      streakDays: 1,
      topScore: 0,
      createdAt: new Date().toISOString(),
      isVerified: false,
      verificationCode: code,
      verificationToken: token,
      verificationTokenExpiry: expiry,
    };

    data.users = data.users || [];
    data.users.unshift(targetUser);

    data.trainees = data.trainees || [];
    data.trainees.unshift({
      id: 'TR-' + (100 + data.trainees.length + 1),
      name: targetUser.name,
      email: targetUser.email,
      track: targetUser.targetTrack,
      progress: 5,
      labHours: 0,
      streak: 1,
      passportLevel: targetUser.passportLevel,
      interviewStatus: 'under_review',
      topScore: 0
    });
  } else {
    targetUser.name = name.trim() || targetUser.name;
    if (password) targetUser.password = hashPassword(password);
    targetUser.campus = campus || targetUser.campus || 'Bengaluru';
    targetUser.targetTrack = targetTrack || targetUser.targetTrack || 'VLSI';
    targetUser.verificationCode = code;
    targetUser.verificationToken = token;
    targetUser.verificationTokenExpiry = expiry;
  }

  await saveStore(data);

  // Send verification email via Brevo
  const baseUrl = process.env.APP_URL || 'http://localhost:5174';
  const verificationUrl = `${baseUrl}/#verify=${token}&email=${encodeURIComponent(cleanEmail)}`;
  console.log(`[Auth] Verification email requested for ${cleanEmail} (code: ${code})`);
  sendVerificationEmail({
    to: cleanEmail,
    name: targetUser.name,
    code,
    verificationUrl,
  }).catch((err) => console.warn('[Brevo Error]:', err.message));

  res.status(201).json({
    success: true,
    requiresVerification: true,
    email: cleanEmail,
    message: `We sent a 6-digit verification code to ${cleanEmail}. Please enter it to activate your account.`
  });
});

// Verify Email
app.post('/api/auth/verify-email', async (req, res) => {
  const data = await readStore();
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const token = String(req.body.token || '').trim();

  let user = null;
  if (token) {
    user = (data.users || []).find(u => u.verificationToken === token && (!u.verificationTokenExpiry || new Date(u.verificationTokenExpiry) > new Date()));
  } else if (email && code) {
    user = (data.users || []).find(u => u.email.toLowerCase() === email);
    if (!user) return res.status(400).json({ error: 'User not found. Please register first.' });
    if (user.isVerified) {
      const { password: _, ...userSafe } = user;
      return res.json({ success: true, user: userSafe, token: signToken(user), message: 'Account is already verified.' });
    }
    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email or request a new code.' });
    }
    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }
  } else {
    return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
  }

  // Gracefully handle already-verified user when clicking an already-consumed email token link
  if (!user && email) {
    const existing = (data.users || []).find(u => u.email.toLowerCase() === email);
    if (existing && existing.isVerified) {
      const { password: _, ...userSafe } = existing;
      return res.json({
        success: true,
        user: userSafe,
        token: signToken(existing),
        message: 'Account is already verified! Welcome to Ample LMS.'
      });
    }
  }

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired verification token. Please sign in or request a new code.' });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;

  await saveStore(data);

  const { password: _, ...userSafe } = user;
  res.json({
    success: true,
    user: userSafe,
    token: signToken(user),
    message: 'Email successfully verified! Welcome to Ample LMS.'
  });
});

// Resend Verification Code
app.post('/api/auth/resend-verification', async (req, res) => {
  const data = await readStore();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = (data.users || []).find(u => u.email.toLowerCase() === email);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email. Please sign up.' });
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  user.verificationCode = code;
  user.verificationToken = token;
  user.verificationTokenExpiry = expiry;
  await saveStore(data);

  const baseUrl = process.env.APP_URL || 'http://localhost:5174';
  const verificationUrl = `${baseUrl}/#verify=${token}&email=${encodeURIComponent(user.email)}`;

  console.log(`[Auth] Resending verification email to ${user.email} (code: ${code})`);
  sendVerificationEmail({
    to: user.email,
    name: user.name,
    code,
    verificationUrl,
  }).catch((err) => console.warn('[Brevo Error]:', err.message));

  res.json({
    success: true,
    message: `A new 6-digit code has been sent to ${user.email}.`
  });
});

// Get current user profile
app.get('/api/auth/me', async (req, res) => {
  const data = await readStore();
  if (!req.auth) return res.status(401).json({ error: 'Sign in required.' });
  const user = (data.users || []).find(u => u.id === req.auth.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});

// Update profile
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const data = await readStore();
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

  await saveStore(data);

  const { password: _, ...userSafe } = data.users[index];
  res.json(userSafe);
});

// Quick switch demo user (1-click testing)
app.post('/api/auth/switch-demo', async (req, res) => {
  if (!DEMO_MODE) return res.status(403).json({ error: 'Disabled outside demo mode' });
  const data = await readStore();
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
app.get('/api/auth/users', requireAdmin, async (_req, res) => {
  const data = await readStore();
  const safeUsers = (data.users || []).map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Courses (Tracks)
app.get('/api/courses', async (_req, res) => {
  const data = await readStore();
  res.json(data.courses);
});

app.get('/api/courses/:id', async (req, res) => {
  const data = await readStore();
  const course = data.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
});

app.post('/api/courses', requireAdmin, async (req, res) => {
  const data = await readStore();
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
  await saveStore(data);
  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', requireAdmin, async (req, res) => {
  const data = await readStore();
  const { id } = req.params;
  const index = data.courses.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  data.courses[index] = { ...data.courses[index], ...req.body };
  await saveStore(data);
  res.json(data.courses[index]);
});

app.delete('/api/courses/:id', requireAdmin, async (req, res) => {
  const data = await readStore();
  const { id } = req.params;
  data.courses = data.courses.filter(c => c.id !== id);
  await saveStore(data);
  res.json({ success: true, id });
});

// Enroll authenticated user in a course
app.post('/api/courses/:id/enroll', requireAuth, async (req, res) => {
  const data = await readStore();
  const { id } = req.params;
  const course = (data.courses || []).find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const userIndex = (data.users || []).findIndex(u => u.id === req.auth.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = data.users[userIndex];
  user.enrolledCourseIds = Array.isArray(user.enrolledCourseIds) ? user.enrolledCourseIds : [];
  if (!user.enrolledCourseIds.includes(id)) {
    user.enrolledCourseIds.push(id);
    course.enrolledCount = (course.enrolledCount || 0) + 1;
    await saveStore(data);
  }

  const { password: _, ...userSafe } = user;
  res.json({
    user: userSafe,
    enrolledCourseIds: user.enrolledCourseIds,
    completedLessonIds: user.completedLessonIds || [],
    quizScores: user.quizScores || {},
    labHours: user.labHours || 0,
    streakDays: user.streakDays || 1
  });
});

// Mark a lesson complete & persist progress/quiz score
app.post('/api/progress/lessons/:lessonId/complete', requireAuth, async (req, res) => {
  const data = await readStore();
  const { lessonId } = req.params;
  const { quizScore } = req.body || {};

  const userIndex = (data.users || []).findIndex(u => u.id === req.auth.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = data.users[userIndex];
  user.completedLessonIds = Array.isArray(user.completedLessonIds) ? user.completedLessonIds : [];
  user.quizScores = user.quizScores && typeof user.quizScores === 'object' ? user.quizScores : {};

  let changed = false;
  if (!user.completedLessonIds.includes(lessonId)) {
    user.completedLessonIds.push(lessonId);
    user.labHours = +((user.labHours || 0) + 0.5).toFixed(1);
    changed = true;
  }

  if (typeof quizScore === 'number' && !Number.isNaN(quizScore)) {
    const prevScore = user.quizScores[lessonId] || 0;
    if (quizScore >= prevScore) {
      user.quizScores[lessonId] = quizScore;
      changed = true;
    }
    if (quizScore > (user.topScore || 0)) {
      user.topScore = quizScore;
      changed = true;
    }
  }

  // Sync progress metrics to matching trainee record
  const traineeIndex = (data.trainees || []).findIndex(
    t => t.email.toLowerCase() === user.email.toLowerCase()
  );
  if (traineeIndex !== -1) {
    const enrolledCourses = (data.courses || []).filter(c =>
      (user.enrolledCourseIds || []).includes(c.id)
    );
    const totalLessons = enrolledCourses.reduce(
      (sum, c) => sum + (c.modules || []).reduce((mSum, m) => mSum + (m.lessons || []).length, 0),
      0
    );
    const completedCount = user.completedLessonIds.length;
    data.trainees[traineeIndex].labHours = user.labHours || 0;
    data.trainees[traineeIndex].topScore = user.topScore || data.trainees[traineeIndex].topScore || 0;
    if (totalLessons > 0) {
      data.trainees[traineeIndex].progress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
    }
    changed = true;
  }

  if (changed) {
    await saveStore(data);
  }

  const { password: _, ...userSafe } = user;
  res.json({
    user: userSafe,
    enrolledCourseIds: user.enrolledCourseIds || [],
    completedLessonIds: user.completedLessonIds,
    quizScores: user.quizScores,
    labHours: user.labHours || 0,
    streakDays: user.streakDays || 1
  });
});

// Trainees
app.get('/api/trainees', requireAdmin, async (_req, res) => {
  const data = await readStore();
  res.json(data.trainees);
});

app.get('/api/trainees/:id', requireAdmin, async (req, res) => {
  const data = await readStore();
  const trainee = data.trainees.find(t => t.id === req.params.id);
  if (!trainee) {
    return res.status(404).json({ error: 'Trainee not found' });
  }
  res.json(trainee);
});

app.post('/api/trainees', requireAdmin, async (req, res) => {
  const data = await readStore();
  const trainee = {
    id: 'TR-' + (100 + data.trainees.length + 1),
    ...req.body
  };
  data.trainees.unshift(trainee);
  await saveStore(data);
  res.status(201).json(trainee);
});

app.patch('/api/trainees/:id/status', requireAdmin, async (req, res) => {
  const data = await readStore();
  const { id } = req.params;
  const { interviewStatus } = req.body;
  const index = data.trainees.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Trainee not found' });
  }
  data.trainees[index].interviewStatus = interviewStatus;
  await saveStore(data);
  res.json(data.trainees[index]);
});

// Tapeouts
app.get('/api/tapeouts', requireAdmin, async (_req, res) => {
  const data = await readStore();
  res.json(data.tapeouts);
});

app.get('/api/tapeouts/:id', requireAdmin, async (req, res) => {
  const data = await readStore();
  const tapeout = data.tapeouts.find(t => t.id === req.params.id);
  if (!tapeout) {
    return res.status(404).json({ error: 'Tapeout not found' });
  }
  res.json(tapeout);
});

app.post('/api/tapeouts', requireAdmin, async (req, res) => {
  const data = await readStore();
  const newTapeout = {
    id: 'TAP-2026-' + (data.tapeouts.length + 1).toString().padStart(2, '0'),
    submissionDate: 'Just now',
    status: 'Ready for Review',
    ...req.body
  };
  data.tapeouts.unshift(newTapeout);
  await saveStore(data);
  res.status(201).json(newTapeout);
});

app.patch('/api/tapeouts/:id/status', requireAdmin, async (req, res) => {
  const data = await readStore();
  const { id } = req.params;
  const { status } = req.body;
  const index = data.tapeouts.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tapeout not found' });
  }
  data.tapeouts[index].status = status;
  await saveStore(data);
  res.json(data.tapeouts[index]);
});

// Cohorts
app.get('/api/cohorts', requireAdmin, async (_req, res) => {
  const data = await readStore();
  res.json(data.cohorts);
});

app.get('/api/cohorts/:id', requireAdmin, async (req, res) => {
  const data = await readStore();
  const cohort = data.cohorts.find(c => c.id === req.params.id);
  if (!cohort) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  res.json(cohort);
});

app.post('/api/cohorts', requireAdmin, async (req, res) => {
  const data = await readStore();
  const newCohort = {
    id: 'COH-' + Date.now().toString().slice(-4),
    enrolledCount: 0,
    ...req.body
  };
  data.cohorts.unshift(newCohort);
  await saveStore(data);
  res.status(201).json(newCohort);
});

// User Enquiries & Student Questions
app.get('/api/enquiries/mine', requireAuth, async (req, res) => {
  const data = await readStore();
  const user = (data.users || []).find(u => u.id === req.auth.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const list = (data.enquiries || []).filter(
    e => e.studentId === user.id || (e.studentEmail && e.studentEmail.toLowerCase() === user.email.toLowerCase())
  );
  res.json(list);
});

app.get('/api/enquiries', requireAdmin, async (_req, res) => {
  const data = await readStore();
  if (!data.enquiries) {
    data.enquiries = initialData.enquiries;
    await saveStore(data);
  }
  res.json(data.enquiries);
});

app.post('/api/enquiries', requireAuth, async (req, res) => {
  const data = await readStore();
  if (!data.enquiries) data.enquiries = [];

  const user = (data.users || []).find(u => u.id === req.auth.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }
  if (subject.length > 200 || message.length > 4000) {
    return res.status(400).json({ error: 'Subject must be under 200 characters and message under 4000.' });
  }

  const newEnquiry = {
    id: 'ENQ-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    studentId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    studentCampus: user.campus || 'Bengaluru Innovation HQ',
    subject,
    track: String(req.body.track || user.targetTrack || 'VLSI Physical Design & STA').slice(0, 120),
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reply: ''
  };

  data.enquiries.unshift(newEnquiry);
  await saveStore(data);
  res.status(201).json(newEnquiry);
});

app.put('/api/enquiries/:id/reply', requireAdmin, async (req, res) => {
  const data = await readStore();
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
  await saveStore(data);

  const enq = data.enquiries[index];
  if (enq.studentEmail && reply) {
    sendEmail({
      to: enq.studentEmail,
      toName: enq.studentName,
      subject: `Re: ${enq.subject} [Ample LMS]`,
      htmlContent: `<p>Hi ${escapeHtml(enq.studentName)},</p><p>Our faculty replied to your inquiry:</p><blockquote>${escapeHtml(reply)}</blockquote>`,
      textContent: `Hi ${enq.studentName},\n\nOur faculty replied to your inquiry:\n${reply}`,
    }).catch((err) => console.warn('[email] Enquiry reply notification failed:', err.message));
  }

  res.json(enq);
});

app.patch('/api/enquiries/:id/status', requireAdmin, async (req, res) => {
  const data = await readStore();
  if (!data.enquiries) data.enquiries = [];
  const { id } = req.params;
  const { status } = req.body;

  const index = data.enquiries.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  data.enquiries[index].status = status;
  await saveStore(data);
  res.json(data.enquiries[index]);
});

app.delete('/api/enquiries/:id', requireAdmin, async (req, res) => {
  const data = await readStore();
  if (!data.enquiries) data.enquiries = [];
  const { id } = req.params;
  data.enquiries = data.enquiries.filter(e => e.id !== id);
  await saveStore(data);
  res.json({ success: true, id });
});

// Cloud Media (Cloudinary signed upload config for images & videos)
app.get('/api/media/config', (_req, res) => {
  res.json(getMediaStatus());
});

app.post('/api/media/sign', requireAdmin, (req, res) => {
  try {
    const { folder, resourceType } = req.body || {};
    res.json(createCloudinarySignature({ folder, resourceType }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Transactional Email test endpoint (Brevo)
app.post('/api/email/test', requireAdmin, async (req, res) => {
  const { to, subject, message } = req.body || {};
  if (!to) return res.status(400).json({ error: 'Recipient email ("to") is required.' });
  const result = await sendEmail({
    to,
    subject: subject || 'Ample LMS Brevo Test',
    htmlContent: `<p>${escapeHtml(message || 'Brevo transactional email is connected to Ample LMS.')}</p>`,
    textContent: message || 'Brevo transactional email is connected to Ample LMS.',
  });
  res.json(result);
});

// Reset to initial seed state
app.post('/api/reset', requireAdmin, async (_req, res) => {
  if (!DEMO_MODE) return res.status(403).json({ error: 'Disabled outside demo mode' });
  await saveStore(cloneSeed());
  res.json({ success: true, message: 'Data store reset to Ample default state' });
});

app.use((err, _req, res, _next) => {
  console.error('[api:error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (!process.env.VERCEL && isProd && fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '7d', index: false, setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Ample Learn Backend] REST API server running on port ${PORT} (storage: ${getStorageMode()})`);
  });
}

export default app;
