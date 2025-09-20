import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin';
  avatar?: string;
  isVerified: boolean;
  subscription: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt?: Date;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  stats: {
    totalExams: number;
    averageScore: number;
    totalTimeSpent: number;
    streak: number;
    level: number;
    xp: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Exam Types
export interface IExam extends Document {
  title: string;
  type: 'GATE' | 'GRE' | 'TOEFL';
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subjects: string[];
  isActive: boolean;
  isAdaptive: boolean;
  instructions: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Question Types
export interface IQuestion extends Document {
  examType: 'GATE' | 'GRE' | 'TOEFL';
  subject: string;
  topic: string;
  type: 'mcq' | 'numerical' | 'essay' | 'listening' | 'speaking' | 'reading';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  points: number;
  timeLimit?: number;
  audioUrl?: string;
  imageUrl?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
}

// Exam Session Types
export interface IExamSession extends Document {
  userId: string;
  examId: string;
  status: 'active' | 'completed' | 'paused' | 'terminated';
  startTime: Date;
  endTime?: Date;
  timeRemaining: number;
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: string | number;
    timeSpent: number;
    isCorrect?: boolean;
  }>;
  score?: number;
  violations: Array<{
    type: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;
  proctoring: {
    enabled: boolean;
    flags: string[];
  };
}

// Result Types
export interface IResult extends Document {
  userId: string;
  examId: string;
  sessionId: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  sectionWiseScores: Array<{
    subject: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
  }>;
  rank?: number;
  feedback: string;
  createdAt: Date;
}

// Leaderboard Types
export interface ILeaderboard extends Document {
  examType: 'GATE' | 'GRE' | 'TOEFL';
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  rankings: Array<{
    userId: string;
    score: number;
    rank: number;
    examCount: number;
  }>;
  updatedAt: Date;
}

// Socket Types
export interface SocketUser {
  userId: string;
  socketId: string;
  examSessionId?: string;
  room?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Request with User
export interface AuthRequest extends Request {
  user?: IUser;
}

// Gemini API Types
export interface GeminiQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
}

export interface GeminiEssayScore {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  grammarErrors: Array<{
    error: string;
    suggestion: string;
    position: number;
  }>;
}

// Multiplayer Battle Types
export interface IBattle extends Document {
  battleId: string;
  type: '1v1' | 'team' | 'tournament';
  participants: Array<{
    userId: string;
    score: number;
    rank: number;
  }>;
  questions: string[];
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  startTime: Date;
  endTime?: Date;
  settings: {
    timePerQuestion: number;
    totalQuestions: number;
    subject: string;
  };
}