import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  role: 'student' | 'educator' | 'admin';
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  subscription: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt?: Date;
  };
  stats: {
    totalExams: number;
    averageScore: number;
    totalTimeSpent: number;
    streak: number;
    level: number;
    xp: number;
    lastActiveDate: Date;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      examReminders: boolean;
    };
  };
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
}

// Question Types
export interface IQuestion extends Document {
  _id: Types.ObjectId;
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
  tags: string[];
  audioUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Exam Types
export interface IExam extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  type: 'GATE' | 'GRE' | 'TOEFL';
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  instructions: string[];
  questions: Types.ObjectId[];
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResults: boolean;
  allowReview: boolean;
  isActive: boolean;
  isPublic: boolean;
  startDate?: Date;
  endDate?: Date;
  maxAttempts: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Exam Session Types
export interface IExamSession extends Document {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'active' | 'completed' | 'paused' | 'terminated';
  startTime: Date;
  endTime?: Date;
  timeRemaining: number;
  currentQuestionIndex: number;
  questions: Types.ObjectId[];
  answers: Array<{
    questionId: Types.ObjectId;
    answer: string | number;
    timeSpent: number;
    isCorrect?: boolean;
    markedForReview: boolean;
  }>;
  score?: number;
  percentage?: number;
  totalCorrect?: number;
  totalIncorrect?: number;
  totalUnanswered?: number;
  subjectWiseResults?: Array<{
    subject: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

// Achievement Types
export interface IAchievement extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  icon: string;
  type: 'exam' | 'streak' | 'score' | 'time' | 'special';
  criteria: {
    type: string;
    value: number;
  };
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Achievement Types
export interface IUserAchievement extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  achievementId: Types.ObjectId;
  unlockedAt: Date;
  progress?: number;
}

// Notification Types
export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'exam_reminder' | 'achievement' | 'friend_request' | 'system' | 'result';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Battle/Multiplayer Types
export interface IBattle extends Document {
  _id: Types.ObjectId;
  title: string;
  type: 'quick' | 'tournament';
  participants: Array<{
    userId: Types.ObjectId;
    joinedAt: Date;
    score?: number;
    rank?: number;
  }>;
  questions: Types.ObjectId[];
  status: 'waiting' | 'active' | 'completed';
  maxParticipants: number;
  duration: number;
  startTime?: Date;
  endTime?: Date;
  winner?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
}

export interface ExamFilters extends PaginationQuery {
  type?: 'GATE' | 'GRE' | 'TOEFL';
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  isActive?: string;
}

export interface QuestionFilters extends PaginationQuery {
  examType?: 'GATE' | 'GRE' | 'TOEFL';
  subject?: string;
  topic?: string;
  type?: 'mcq' | 'numerical' | 'essay' | 'listening' | 'speaking' | 'reading';
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Socket Types
export interface SocketUser {
  userId: string;
  socketId: string;
  examSessionId?: string;
  battleId?: string;
}

// AI Types
export interface AIQuestionGeneration {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'numerical' | 'essay';
  count: number;
  examType: 'GATE' | 'GRE' | 'TOEFL';
}

// File Upload Types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  userId: Types.ObjectId;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  score: number;
  totalExams: number;
  averageScore: number;
  streak: number;
  level: number;
  xp: number;
  rank: number;
}

// Statistics Types
export interface UserStatistics {
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
    totalTimeSpent: number;
  }>;
  recentActivity: Array<{
    type: 'exam' | 'achievement' | 'level_up';
    data: any;
    timestamp: Date;
  }>;
}

// Plagiarism Detection Types
export interface PlagiarismResult {
  similarity: number;
  matches: Array<{
    text: string;
    source?: string;
    confidence: number;
  }>;
  isPlagiarized: boolean;
}