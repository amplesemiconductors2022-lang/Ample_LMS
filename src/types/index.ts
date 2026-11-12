export type Category = 'All' | 'VLSI' | 'Embedded' | 'AI/ML';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'Industry Specialization';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'lab' | 'reading' | 'quiz';
  completed: boolean;
  content: {
    summary: string;
    keyTakeaways: string[];
    theoryText: string;
    codeSnippet?: string;
    codeLanguage?: string;
    quiz?: QuizQuestion[];
  };
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  category: 'VLSI' | 'Embedded' | 'AI/ML';
  level: Level;
  duration: string;
  lessonsCount: number;
  rating: number;
  reviewsCount: number;
  instructor: {
    name: string;
    title: string;
    avatar: string;
    company: string;
  };
  thumbnail: string;
  tagline: string;
  description: string;
  targetRole: string;
  toolsLearned: string[];
  enrolledCount: number;
  modules: Module[];
  sampleLabCode?: string;
}

export interface WaveformSignal {
  name: string;
  type: 'clock' | 'binary' | 'bus';
  data: (number | string)[];
  color?: string;
}

export interface UserProgress {
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  labHours: number;
  streakDays: number;
  certificationReady?: boolean;
  siliconPassportReady?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'trainee' | 'admin' | 'mentor';
  avatar?: string;
  campus: string;
  targetTrack: string;
  bio: string;
  githubUrl?: string;
  linkedinUrl?: string;
  certificationLevel?: string;
  passportLevel?: string;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  labHours: number;
  streakDays: number;
  topScore: number;
  createdAt: string;
}

