import mongoose, { Schema } from 'mongoose';
import { IExam } from '@/types';

const examSchema = new Schema<IExam>({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Exam description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['GATE', 'GRE', 'TOEFL']
  },
  duration: {
    type: Number,
    required: [true, 'Exam duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 480 minutes (8 hours)']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  instructions: [{
    type: String,
    trim: true,
    maxlength: [500, 'Instruction cannot exceed 500 characters']
  }],
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  randomizeQuestions: {
    type: Boolean,
    default: true
  },
  randomizeOptions: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: Boolean,
    default: true
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: [1, 'Max attempts must be at least 1'],
    max: [10, 'Max attempts cannot exceed 10']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
examSchema.index({ type: 1, isActive: 1 });
examSchema.index({ isPublic: 1, isActive: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ createdAt: -1 });

// Text index for search functionality
examSchema.index({
  title: 'text',
  description: 'text'
});

// Virtual for question count
examSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for average time per question
examSchema.virtual('avgTimePerQuestion').get(function() {
  if (this.questions.length === 0) return 0;
  return Math.round((this.duration * 60) / this.questions.length); // in seconds
});

// Virtual to check if exam is currently active
examSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  
  return true;
});

// Pre-save validation
examSchema.pre('save', function(next) {
  // Validate passing marks doesn't exceed total marks
  if (this.passingMarks > this.totalMarks) {
    return next(new Error('Passing marks cannot exceed total marks'));
  }
  
  // Validate date range
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('Start date must be before end date'));
  }
  
  // Validate questions array is not empty
  if (this.questions.length === 0) {
    return next(new Error('Exam must have at least one question'));
  }
  
  // Validate max questions limit
  const maxQuestions = parseInt(process.env.MAX_QUESTIONS_PER_EXAM || '100');
  if (this.questions.length > maxQuestions) {
    return next(new Error(`Exam cannot have more than ${maxQuestions} questions`));
  }
  
  next();
});

// Method to get randomized questions for a session
examSchema.methods.getRandomizedQuestions = function() {
  if (!this.randomizeQuestions) {
    return this.questions;
  }
  
  // Fisher-Yates shuffle algorithm
  const shuffled = [...this.questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Method to check if user can attempt this exam
examSchema.methods.canUserAttempt = function(userAttempts: number) {
  return userAttempts < this.maxAttempts;
};

// Static method to get active exams
examSchema.statics.getActiveExams = function(filters: any = {}) {
  const now = new Date();
  
  const matchStage: any = {
    isActive: true,
    isPublic: true,
    $or: [
      { startDate: { $exists: false } },
      { startDate: null },
      { startDate: { $lte: now } }
    ],
    $and: [
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      }
    ]
  };
  
  // Apply additional filters
  if (filters.type) matchStage.type = filters.type;
  if (filters.createdBy) matchStage.createdBy = filters.createdBy;
  
  return this.find(matchStage)
    .populate('createdBy', 'firstName lastName')
    .populate('questions', 'type difficulty points')
    .sort({ createdAt: -1 });
};

export default mongoose.model<IExam>('Exam', examSchema);  sch
eduledStart?: Date;
  scheduledEnd?: Date;
  
  // Access control
  isPublic: boolean;
  allowedUsers: mongoose.Types.ObjectId[];
  allowedRoles: ('student' | 'instructor' | 'admin')[];
  
  // Settings
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    allowReview: boolean;
    allowPause: boolean;
    allowBackNavigation: boolean;
    negativeMarking: {
      enabled: boolean;
      penalty: number; // percentage
    };
    proctoring: {
      enabled: boolean;
      strictMode: boolean;
      allowedViolations: number;
    };
    adaptiveTesting: {
      enabled: boolean;
      algorithm: 'irt' | 'cat' | 'simple';
    };
  };
  
  // Analytics
  analytics: {
    totalAttempts: number;
    averageScore: number;
    averageTime: number;
    completionRate: number;
    lastTaken: Date;
  };
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Exam description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['GATE', 'GRE', 'TOEFL', 'CUSTOM'],
    required: [true, 'Exam type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  
  // Configuration
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot exceed 600 minutes']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: [1, 'Must have at least 1 question'],
    max: [500, 'Cannot exceed 500 questions']
  },
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100%']
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: [1, 'Must allow at least 1 attempt'],
    max: [10, 'Cannot exceed 10 attempts']
  },
  
  // Question configuration
  questionTypes: {
    type: [String],
    enum: ['mcq', 'numerical', 'essay', 'listening', 'speaking', 'reading'],
    default: ['mcq']
  },
  difficultyDistribution: {
    easy: { type: Number, default: 30, min: 0, max: 100 },
    medium: { type: Number, default: 50, min: 0, max: 100 },
    hard: { type: Number, default: 20, min: 0, max: 100 }
  },
  
  // Sections for structured exams
  sections: [{
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['mcq', 'numerical', 'essay', 'listening', 'speaking', 'reading'],
      required: true 
    },
    duration: { type: Number, required: true, min: 1 },
    questionCount: { type: Number, required: true, min: 1 },
    instructions: String,
    passingScore: { type: Number, min: 0, max: 100 }
  }],
  
  // Question pool
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  
  // Scheduling
  isScheduled: { type: Boolean, default: false },
  scheduledStart: Date,
  scheduledEnd: Date,
  
  // Access control
  isPublic: { type: Boolean, default: false },
  allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  allowedRoles: {
    type: [String],
    enum: ['student', 'instructor', 'admin'],
    default: ['student']
  },
  
  // Settings
  settings: {
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showResults: { type: Boolean, default: true },
    allowReview: { type: Boolean, default: true },
    allowPause: { type: Boolean, default: false },
    allowBackNavigation: { type: Boolean, default: true },
    negativeMarking: {
      enabled: { type: Boolean, default: false },
      penalty: { type: Number, default: 25, min: 0, max: 100 }
    },
    proctoring: {
      enabled: { type: Boolean, default: false },
      strictMode: { type: Boolean, default: false },
      allowedViolations: { type: Number, default: 3, min: 0, max: 10 }
    },
    adaptiveTesting: {
      enabled: { type: Boolean, default: false },
      algorithm: { type: String, enum: ['irt', 'cat', 'simple'], default: 'simple' }
    }
  },
  
  // Analytics
  analytics: {
    totalAttempts: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0, max: 100 },
    averageTime: { type: Number, default: 0, min: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    lastTaken: Date
  },
  
  // Metadata
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
examSchema.index({ type: 1, category: 1 });
examSchema.index({ createdBy: 1, isActive: 1 });
examSchema.index({ isPublic: 1, isActive: 1 });
examSchema.index({ scheduledStart: 1, scheduledEnd: 1 });
examSchema.index({ 'analytics.averageScore': -1 });
examSchema.index({ createdAt: -1 });

// Virtual for exam status
examSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (!this.isActive || this.isDeleted) return 'inactive';
  if (this.isScheduled) {
    if (this.scheduledStart && now < this.scheduledStart) return 'scheduled';
    if (this.scheduledEnd && now > this.scheduledEnd) return 'expired';
  }
  return 'active';
});

// Virtual for difficulty validation
examSchema.virtual('isDifficultyValid').get(function() {
  const total = this.difficultyDistribution.easy + 
                this.difficultyDistribution.medium + 
                this.difficultyDistribution.hard;
  return Math.abs(total - 100) < 0.01; // Allow for floating point precision
});

// Pre-save middleware to validate difficulty distribution
examSchema.pre('save', function(next) {
  const total = this.difficultyDistribution.easy + 
                this.difficultyDistribution.medium + 
                this.difficultyDistribution.hard;
  
  if (Math.abs(total - 100) > 0.01) {
    return next(new Error('Difficulty distribution must sum to 100%'));
  }
  
  next();
});

// Pre-save middleware to validate sections
examSchema.pre('save', function(next) {
  if (this.sections && this.sections.length > 0) {
    const totalSectionQuestions = this.sections.reduce((sum, section) => sum + section.questionCount, 0);
    const totalSectionDuration = this.sections.reduce((sum, section) => sum + section.duration, 0);
    
    if (totalSectionQuestions !== this.totalQuestions) {
      return next(new Error('Total section questions must equal exam total questions'));
    }
    
    if (totalSectionDuration !== this.duration) {
      return next(new Error('Total section duration must equal exam duration'));
    }
  }
  
  next();
});

export const Exam = mongoose.model<IExam>('Exam', examSchema);  sched
uledStart?: Date;
  scheduledEnd?: Date;
  
  // Access control
  isPublic: boolean;
  allowedUsers: mongoose.Types.ObjectId[];
  allowedRoles: ('student' | 'instructor' | 'admin')[];
  
  // Settings
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    allowReview: boolean;
    allowPause: boolean;
    allowBackNavigation: boolean;
    negativeMarking: {
      enabled: boolean;
      penalty: number; // percentage
    };
    proctoring: {
      enabled: boolean;
      strictMode: boolean;
      allowedViolations: number;
    };
    adaptiveTesting: {
      enabled: boolean;
      difficultyAdjustment: number;
    };
  };
  
  // Analytics
  analytics: {
    totalAttempts: number;
    averageScore: number;
    averageTime: number;
    completionRate: number;
    difficultyRating: number;
  };
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;
  version: number;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Exam description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['GATE', 'GRE', 'TOEFL', 'CUSTOM'],
    required: [true, 'Exam type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  
  // Configuration
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot exceed 600 minutes']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: [1, 'Must have at least 1 question'],
    max: [500, 'Cannot exceed 500 questions']
  },
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100%']
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: [1, 'Must allow at least 1 attempt'],
    max: [10, 'Cannot exceed 10 attempts']
  },
  
  // Question configuration
  questionTypes: {
    type: [String],
    enum: ['mcq', 'numerical', 'essay', 'listening', 'speaking', 'reading'],
    default: ['mcq']
  },
  difficultyDistribution: {
    easy: { type: Number, default: 30, min: 0, max: 100 },
    medium: { type: Number, default: 50, min: 0, max: 100 },
    hard: { type: Number, default: 20, min: 0, max: 100 }
  },
  
  // Sections for structured exams
  sections: [{
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['mcq', 'numerical', 'essay', 'listening', 'speaking', 'reading'],
      required: true 
    },
    duration: { type: Number, required: true, min: 1 },
    questionCount: { type: Number, required: true, min: 1 },
    instructions: String,
    passingScore: { type: Number, min: 0, max: 100 }
  }],
  
  // Question pool
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  
  // Scheduling
  isScheduled: { type: Boolean, default: false },
  scheduledStart: Date,
  scheduledEnd: Date,
  
  // Access control
  isPublic: { type: Boolean, default: false },
  allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  allowedRoles: {
    type: [String],
    enum: ['student', 'instructor', 'admin'],
    default: ['student']
  },
  
  // Settings
  settings: {
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showResults: { type: Boolean, default: true },
    allowReview: { type: Boolean, default: true },
    allowPause: { type: Boolean, default: false },
    allowBackNavigation: { type: Boolean, default: true },
    negativeMarking: {
      enabled: { type: Boolean, default: false },
      penalty: { type: Number, default: 25, min: 0, max: 100 }
    },
    proctoring: {
      enabled: { type: Boolean, default: false },
      strictMode: { type: Boolean, default: false },
      allowedViolations: { type: Number, default: 3, min: 0, max: 10 }
    },
    adaptiveTesting: {
      enabled: { type: Boolean, default: false },
      difficultyAdjustment: { type: Number, default: 0.1, min: 0, max: 1 }
    }
  },
  
  // Analytics
  analytics: {
    totalAttempts: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0, max: 100 },
    averageTime: { type: Number, default: 0, min: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    difficultyRating: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  // Metadata
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1, min: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
examSchema.index({ type: 1, category: 1 });
examSchema.index({ createdBy: 1, isActive: 1 });
examSchema.index({ isPublic: 1, isActive: 1 });
examSchema.index({ scheduledStart: 1, scheduledEnd: 1 });
examSchema.index({ 'analytics.averageScore': -1 });

// Virtual for exam status
examSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (this.isScheduled) {
    if (this.scheduledStart && now < this.scheduledStart) return 'scheduled';
    if (this.scheduledEnd && now > this.scheduledEnd) return 'expired';
    return 'active';
  }
  return 'active';
});

// Virtual for difficulty validation
examSchema.virtual('difficultyTotal').get(function() {
  return this.difficultyDistribution.easy + 
         this.difficultyDistribution.medium + 
         this.difficultyDistribution.hard;
});

// Pre-save validation
examSchema.pre('save', function(next) {
  // Validate difficulty distribution totals 100%
  const total = this.difficultyDistribution.easy + 
                this.difficultyDistribution.medium + 
                this.difficultyDistribution.hard;
  
  if (Math.abs(total - 100) > 0.01) {
    return next(new Error('Difficulty distribution must total 100%'));
  }
  
  // Validate section durations don't exceed total duration
  if (this.sections.length > 0) {
    const totalSectionDuration = this.sections.reduce((sum, section) => sum + section.duration, 0);
    if (totalSectionDuration > this.duration) {
      return next(new Error('Total section duration cannot exceed exam duration'));
    }
  }
  
  next();
});

export const Exam = mongoose.model<IExam>('Exam', examSchema);