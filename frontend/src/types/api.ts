// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// User Types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  role: 'student' | 'educator' | 'admin';
  avatar?: string;
  isVerified: boolean;
  subscription: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt?: string;
  };
  stats: {
    totalExams: number;
    averageScore: number;
    totalTimeSpent: number;
    streak: number;
    level: number;
    xp: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Exam Types
export interface Question {
  _id: string;
  type: 'mcq' | 'numerical' | 'essay' | 'listening' | 'speaking' | 'reading';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  marks: number;
}

export interface Exam {
  _id: string;
  title: string;
  description: string;
  type: 'GATE' | 'GRE' | 'TOEFL';
  duration: number; // in minutes
  totalMarks: number;
  questions: Question[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSession {
  _id: string;
  examId: string;
  userId: string;
  answers: Record<string, string | number>;
  score?: number;
  percentage?: number;
  timeSpent: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
}

// User Stats and Progress
export interface UserStats {
  totalExams: number;
  averageScore: number;
  totalTimeSpent: number;
  streak: number;
  level: number;
  xp: number;
  subjectWiseStats: Record<string, {
    totalExams: number;
    averageScore: number;
    bestScore: number;
  }>;
}

export interface UserProgress {
  examType: 'GATE' | 'GRE' | 'TOEFL';
  progress: number; // percentage
  completedTopics: string[];
  totalTopics: number;
  weakAreas: string[];
  strongAreas: string[];
}

// Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ExamFilters {
  type?: 'GATE' | 'GRE' | 'TOEFL';
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  limit?: number;
  page?: number;
}

export interface UserProgressFilters {
  examType?: 'GATE' | 'GRE' | 'TOEFL';
  timeRange?: 'week' | 'month' | 'year';
}

// Achievement Types
export interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  type: 'exam' | 'streak' | 'score' | 'time' | 'special';
  criteria: {
    type: string;
    value: number;
  };
  unlockedAt?: string;
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  type: 'exam_reminder' | 'achievement' | 'friend_request' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}