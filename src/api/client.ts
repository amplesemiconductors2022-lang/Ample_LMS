import type { Course, User } from '../types';
import { COURSES_DATA } from '../data/coursesData';

const API_BASE = '/api';

const authHeaders = (json = true): Record<string, string> => {
  const h: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {};
  const t = localStorage.getItem('ample_token');
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

export type { User };

export const DEFAULT_USER: User = {
  id: 'usr-101',
  name: 'Varun Reddy',
  email: 'varun.reddy@gmail.com',
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
};

export const ADMIN_DEMO_USER: User = {
  id: 'usr-admin-01',
  name: 'Ample Administrator',
  email: 'admin@amplesemi.com',
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
};

export interface TraineeRecord {
  id: string;
  name: string;
  email: string;
  track: string;
  progress: number;
  labHours: number;
  streak: number;
  passportLevel: string;
  interviewStatus: 'eligible' | 'under_review' | 'referred' | 'hired';
  topScore: number;
}

export interface TapeoutRecord {
  id: string;
  candidate: string;
  project: string;
  pdk: string;
  coreArea: string;
  staSlack: string;
  drcStatus: string;
  lvsStatus: string;
  submissionDate: string;
  status: string;
}

export interface CohortRecord {
  id: string;
  name: string;
  campus: string;
  track: string;
  startDate: string;
  seatLimit: number;
  enrolledCount: number;
  mentor: string;
}

export interface EnquiryRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  studentCampus?: string;
  subject: string;
  track?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

// Fallback in-memory storage synced with LocalStorage
function getLocalFallback<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(`ample_${key}`);
    if (item) return JSON.parse(item);
  } catch { }
  return defaultVal;
}

function setLocalFallback<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`ample_${key}`, JSON.stringify(val));
  } catch { }
}

// ================= Courses API =================
export async function fetchCourses(): Promise<Course[]> {
  try {
    const res = await fetch(`${API_BASE}/courses`);
    if (res.ok) {
      const data = await res.json();
      setLocalFallback('courses', data);
      return data;
    }
  } catch (err) {
    console.warn('Backend unavailable, using local store for courses:', err);
  }
  return getLocalFallback('courses', COURSES_DATA);
}

export async function createCourseApi(course: Course): Promise<Course> {
  let created = course;
  try {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(course)
    });
    if (res.ok) {
      created = await res.json();
    }
  } catch (err) {
    console.warn('Backend error, persisting course locally:', err);
  }
  const current = getLocalFallback('courses', COURSES_DATA);
  const updated = [created, ...current.filter(c => c.id !== created.id)];
  setLocalFallback('courses', updated);
  return created;
}

export async function updateCourseApi(id: string, updates: Partial<Course>): Promise<Course | null> {
  let updatedCourse: Course | null = null;
  try {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      updatedCourse = await res.json();
    }
  } catch (err) {
    console.warn('Backend error on updateCourse:', err);
  }
  const current = getLocalFallback<Course[]>('courses', COURSES_DATA);
  const index = current.findIndex(c => c.id === id);
  if (index !== -1) {
    current[index] = updatedCourse || { ...current[index], ...updates };
    setLocalFallback('courses', current);
    return current[index];
  }
  return updatedCourse;
}

export async function deleteCourseApi(id: string): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE', headers: authHeaders(false) });
  } catch (err) {
    console.warn('Backend error on deleteCourse:', err);
  }
  const current = getLocalFallback<Course[]>('courses', COURSES_DATA);
  const filtered = current.filter(c => c.id !== id);
  setLocalFallback('courses', filtered);
  return true;
}

// ================= Trainees API =================
export async function fetchTrainees(): Promise<TraineeRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/trainees`, { headers: authHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      setLocalFallback('trainees', data);
      return data;
    }
  } catch (err) {
    console.warn('Backend unavailable, using local store for trainees:', err);
  }
  return getLocalFallback('trainees', [
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
  ]);
}

export async function updateTraineeStatusApi(id: string, interviewStatus: TraineeRecord['interviewStatus']): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/trainees/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ interviewStatus })
    });
  } catch (err) {
    console.warn('Backend error on updateTraineeStatus:', err);
  }
  const current = getLocalFallback<TraineeRecord[]>('trainees', []);
  const index = current.findIndex(t => t.id === id);
  if (index !== -1) {
    current[index].interviewStatus = interviewStatus;
    setLocalFallback('trainees', current);
  }
  return true;
}

// ================= Tapeouts API =================
export async function fetchTapeouts(): Promise<TapeoutRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/tapeouts`, { headers: authHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      setLocalFallback('tapeouts', data);
      return data;
    }
  } catch (err) {
    console.warn('Backend unavailable, using local store for tapeouts:', err);
  }
  return getLocalFallback('tapeouts', [
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
  ]);
}

export async function updateTapeoutStatusApi(id: string, status: string): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/tapeouts/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
  } catch (err) {
    console.warn('Backend error on updateTapeoutStatus:', err);
  }
  const current = getLocalFallback<TapeoutRecord[]>('tapeouts', []);
  const index = current.findIndex(t => t.id === id);
  if (index !== -1) {
    current[index].status = status;
    setLocalFallback('tapeouts', current);
  }
  return true;
}

// ================= Cohorts API =================
export async function fetchCohorts(): Promise<CohortRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/cohorts`, { headers: authHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      setLocalFallback('cohorts', data);
      return data;
    }
  } catch (err) {
    console.warn('Backend unavailable, using local store for cohorts:', err);
  }
  return getLocalFallback('cohorts', [
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
  ]);
}

export async function createCohortApi(cohort: Omit<CohortRecord, 'id' | 'enrolledCount'>): Promise<CohortRecord> {
  const newCohort: CohortRecord = {
    id: 'COH-' + Date.now().toString().slice(-4),
    enrolledCount: 0,
    ...cohort
  };
  let created = newCohort;
  try {
    const res = await fetch(`${API_BASE}/cohorts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(newCohort)
    });
    if (res.ok) {
      created = await res.json();
    }
  } catch (err) {
    console.warn('Backend error on createCohort:', err);
  }
  const current = getLocalFallback<CohortRecord[]>('cohorts', []);
  const updated = [created, ...current.filter(c => c.id !== created.id)];
  setLocalFallback('cohorts', updated);
  return created;
}

// ================= Auth & User Profiles API =================

export async function fetchCurrentUser(): Promise<User | null> {
  const localSaved = getLocalFallback<User | null>('current_user', null);
  const token = localStorage.getItem('ample_token');
  if (!token) {
    localStorage.removeItem('ample_current_user');
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(false) });
    if (res.ok) {
      const user = await res.json();
      setLocalFallback('current_user', user);
      return user;
    }
    if (res.status === 401 || res.status === 404) {
      logoutUser();
      return null;
    }
  } catch (err) {
    console.warn('Backend unavailable, using cached profile:', err);
  }
  return localSaved || null;
}

export async function loginUser(email: string, password?: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Authentication failed');
  }
  const data = await res.json();
  setLocalFallback('current_user', data.user);
  if (data.token) localStorage.setItem('ample_token', data.token);
  return data;
}

export async function signupUser(userData: {
  name: string;
  email: string;
  password?: string;
  campus?: string;
  targetTrack?: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Sign up failed');
  }
  const data = await res.json();
  setLocalFallback('current_user', data.user);
  if (data.token) localStorage.setItem('ample_token', data.token);
  return data;
}

export interface ProgressSyncResponse {
  user: User;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  labHours: number;
  streakDays: number;
}

export async function enrollCourseApi(courseId: string): Promise<ProgressSyncResponse> {
  const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: 'POST',
    headers: authHeaders(false)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to enroll in course');
  }
  const data: ProgressSyncResponse = await res.json();
  if (data.user) setLocalFallback('current_user', data.user);
  return data;
}

export async function completeLessonApi(
  lessonId: string,
  payload?: { courseId?: string; quizScore?: number }
): Promise<ProgressSyncResponse> {
  const res = await fetch(`${API_BASE}/progress/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save lesson progress');
  }
  const data: ProgressSyncResponse = await res.json();
  if (data.user) setLocalFallback('current_user', data.user);
  return data;
}

export async function updateUserProfile(updates: Partial<User> & { id: string }): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updated = await res.json();
      setLocalFallback('current_user', updated);
      return updated;
    }
  } catch (err) {
    console.warn('Backend error on updateUserProfile:', err);
  }
  const current = getLocalFallback<User>('current_user', DEFAULT_USER);
  const merged: User = { ...current, ...updates };
  setLocalFallback('current_user', merged);
  return merged;
}

export async function switchDemoUser(role: 'trainee' | 'admin'): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem('ample_token', data.token);
      setLocalFallback('current_user', data.user);
      return data.user;
    }
  } catch (err) {
    console.warn('Backend error on switchDemoUser:', err);
  }
  const fallback = role === 'admin' ? ADMIN_DEMO_USER : DEFAULT_USER;
  setLocalFallback('current_user', fallback);
  return fallback;
}

export function logoutUser(): void {
  try {
    localStorage.removeItem('ample_current_user');
    localStorage.removeItem('ample_token');
  } catch { }
}

// ================= User Enquiries API =================
export const INITIAL_ENQUIRIES: EnquiryRecord[] = [
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
];

export async function fetchMyEnquiries(): Promise<EnquiryRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/enquiries/mine`, { headers: authHeaders(false) });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (err) {
    console.warn('Backend fetchMyEnquiries failed:', err);
    return [];
  }
}

export async function fetchEnquiries(): Promise<EnquiryRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/enquiries`, { headers: authHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      setLocalFallback('enquiries', data);
      return data;
    }
    return [];
  } catch (err) {
    console.warn('Backend fetchEnquiries failed:', err);
    return [];
  }
}

export async function createEnquiryApi(data: Partial<EnquiryRecord>): Promise<EnquiryRecord> {
  const res = await fetch(`${API_BASE}/enquiries`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit enquiry');
  }
  return await res.json();
}

export async function replyEnquiryApi(id: string, reply: string, status: 'resolved' | 'in_progress' = 'resolved'): Promise<EnquiryRecord> {
  try {
    const res = await fetch(`${API_BASE}/enquiries/${id}/reply`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ reply, status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend replyEnquiryApi failed:', err);
  }
  const list = getLocalFallback<EnquiryRecord[]>('enquiries', INITIAL_ENQUIRIES);
  const updated = list.map(e => e.id === id ? { ...e, reply, status, repliedAt: new Date().toISOString() } : e);
  setLocalFallback('enquiries', updated);
  return updated.find(e => e.id === id)!;
}

export async function updateEnquiryStatusApi(id: string, status: 'pending' | 'in_progress' | 'resolved'): Promise<void> {
  try {
    await fetch(`${API_BASE}/enquiries/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
  } catch (err) {
    console.warn('Backend updateEnquiryStatusApi failed:', err);
  }
  const list = getLocalFallback<EnquiryRecord[]>('enquiries', INITIAL_ENQUIRIES);
  const updated = list.map(e => e.id === id ? { ...e, status } : e);
  setLocalFallback('enquiries', updated);
}

export async function deleteEnquiryApi(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/enquiries/${id}`, { method: 'DELETE', headers: authHeaders(false) });
  } catch (err) {
    console.warn('Backend deleteEnquiryApi failed:', err);
  }
  const list = getLocalFallback<EnquiryRecord[]>('enquiries', INITIAL_ENQUIRIES);
  setLocalFallback('enquiries', list.filter(e => e.id !== id));
}
