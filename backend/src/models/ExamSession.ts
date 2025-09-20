import mongoose, { Document, Schema } from 'mongoose';

export interface IExamSession extends Document {
  _id: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Session state
  status: 'active' | 'paused' | 'completed' | 'expired' | 'terminated';
  startTime: Date;
  endTime?: Date;
  pausedTime?: Date;
  resumedTime?: Date;
  totalPausedDuration: number; // in seconds
  actualDuration: number; // actual time spent in minutes
  
  // Questions and navigation
  questions: mongoose.Types.ObjectId[];
  currentQuestionIndex: number;
  visitedQuestions: number[];
  flaggedQuestions: number[];
  
  // Answers and responses
  answers: {
    questionId: mongoose.Types.ObjectId;
    answer: string | number | string[];
    timeSpent: number; // in seconds
    submittedAt: Date;
    isCorrect?: boolean;
    points?: number;
    partialCredit?: number;
    flagged?: boolean;
    reviewNotes?: string;
  }[];
  
  // Scoring and results
  score: {
    total: number;
    percentage: number;
    maxPossible: number;
    sectionWise?: {
      sectionName: string;
      score: number;
      maxScore: number;
      percentage: number;
      timeSpent: number;
    }[];
    breakdown: {
      correct: number;
      incorrect: number;
      unanswered: number;
      flagged: number;
    };
  };
  
  // Proctoring and monitoring
  proctoring: {
    enabled: boolean;
    violations: {
      type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'copy_paste' | 'right_click' | 'keyboard_shortcut' | 'suspicious_activity';
      timestamp: Date;
      severity: 'low' | 'medium' | 'high';
      description: string;
      evidence?: string;
      resolved?: boolean;
    }[];
    screenshots?: {
      timestamp: Date;
      url: string;
      reason: string;
    }[];
    eyeTracking?: {
      timestamp: Date;
      x: number;
      y: number;
      duration: number;
    }[];
  };
  
  // Session metadata
  browserInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
  };
  
  networkInfo: {
    ipAddress: string;
    location?: {
      country: string;
      region: string;
      city: string;
    };
    connectionType?: string;
  };
  
  // Performance metrics
  performance: {
    averageTimePerQuestion: number;
    fastestQuestion: number;
    slowestQuestion: number;
    accuracyTrend: number[];
    speedTrend: number[];
    difficultyProgression: string[];
  };
  
  // Adaptive testing data
  adaptiveData?: {
    initialDifficulty: string;
    currentDifficulty: string;
    difficultyAdjustments: {
      questionIndex: number;
      oldDifficulty: string;
      newDifficulty: string;
      reason: string;
      timestamp: Date;
    }[];
    abilityEstimate: number;
    confidenceInterval: number;
  };
  
  // Review and feedback
  review: {
    allowReview: boolean;
    reviewStartTime?: Date;
    reviewEndTime?: Date;
    reviewedQuestions: number[];
    feedback?: string;
    rating?: number;
  };
  
  // Attempt information
  attemptNumber: number;
  maxAttempts: number;
  previousAttempts: mongoose.Types.ObjectId[];
  
  // Timestamps and metadata
  lastActivity: Date;
  autoSaveInterval: number; // in seconds
  lastAutoSave: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateScore(): Promise<void>;
  addViolation(type: string, severity: string, description: string): Promise<void>;
  pauseSession(): Promise<void>;
  resumeSession(): Promise<void>;
  completeSession(): Promise<void>;
  getTimeRemaining(): number;
  canSubmitAnswer(): boolean;
}

const examSessionSchema = new Schema<IExamSession>({
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Session state
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'expired', 'terminated'],
    default: 'active'
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    default: Date.now
  },
  endTime: Date,
  pausedTime: Date,
  resumedTime: Date,
  totalPausedDuration: { type: Number, default: 0, min: 0 },
  actualDuration: { type: Number, default: 0, min: 0 },
  
  // Questions and navigation
  questions: {
    type: [Schema.Types.ObjectId],
    ref: 'Question',
    required: [true, 'Questions are required']
  },
  currentQuestionIndex: { type: Number, default: 0, min: 0 },
  visitedQuestions: { type: [Number], default: [] },
  flaggedQuestions: { type: [Number], default: [] },
  
  // Answers and responses
  answers: [{
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: {
      type: Schema.Types.Mixed,
      required: true
    },
    timeSpent: { type: Number, required: true, min: 0 },
    submittedAt: { type: Date, required: true, default: Date.now },
    isCorrect: Boolean,
    points: { type: Number, min: 0 },
    partialCredit: { type: Number, min: 0, max: 100 },
    flagged: { type: Boolean, default: false },
    reviewNotes: String
  }],
  
  // Scoring and results
  score: {
    total: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    maxPossible: { type: Number, default: 0, min: 0 },
    sectionWise: [{
      sectionName: { type: String, required: true },
      score: { type: Number, required: true, min: 0 },
      maxScore: { type: Number, required: true, min: 0 },
      percentage: { type: Number, required: true, min: 0, max: 100 },
      timeSpent: { type: Number, required: true, min: 0 }
    }],
    breakdown: {
      correct: { type: Number, default: 0, min: 0 },
      incorrect: { type: Number, default: 0, min: 0 },
      unanswered: { type: Number, default: 0, min: 0 },
      flagged: { type: Number, default: 0, min: 0 }
    }
  },
  
  // Proctoring and monitoring
  proctoring: {
    enabled: { type: Boolean, default: false },
    violations: [{
      type: {
        type: String,
        enum: ['tab_switch', 'window_blur', 'fullscreen_exit', 'copy_paste', 'right_click', 'keyboard_shortcut', 'suspicious_activity'],
        required: true
      },
      timestamp: { type: Date, required: true, default: Date.now },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
      },
      description: { type: String, required: true },
      evidence: String,
      resolved: { type: Boolean, default: false }
    }],
    screenshots: [{
      timestamp: { type: Date, required: true },
      url: { type: String, required: true },
      reason: { type: String, required: true }
    }],
    eyeTracking: [{
      timestamp: { type: Date, required: true },
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      duration: { type: Number, required: true, min: 0 }
    }]
  },
  
  // Session metadata
  browserInfo: {
    userAgent: { type: String, required: true },
    platform: { type: String, required: true },
    language: { type: String, required: true },
    screenResolution: { type: String, required: true },
    timezone: { type: String, required: true }
  },
  
  networkInfo: {
    ipAddress: { type: String, required: true },
    location: {
      country: String,
      region: String,
      city: String
    },
    connectionType: String
  },
  
  // Performance metrics
  performance: {
    averageTimePerQuestion: { type: Number, default: 0, min: 0 },
    fastestQuestion: { type: Number, default: 0, min: 0 },
    slowestQuestion: { type: Number, default: 0, min: 0 },
    accuracyTrend: { type: [Number], default: [] },
    speedTrend: { type: [Number], default: [] },
    difficultyProgression: { type: [String], default: [] }
  },
  
  // Adaptive testing data
  adaptiveData: {
    initialDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    currentDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    difficultyAdjustments: [{
      questionIndex: { type: Number, required: true },
      oldDifficulty: { type: String, required: true },
      newDifficulty: { type: String, required: true },
      reason: { type: String, required: true },
      timestamp: { type: Date, required: true, default: Date.now }
    }],
    abilityEstimate: { type: Number, min: -3, max: 3 },
    confidenceInterval: { type: Number, min: 0, max: 1 }
  },
  
  // Review and feedback
  review: {
    allowReview: { type: Boolean, default: true },
    reviewStartTime: Date,
    reviewEndTime: Date,
    reviewedQuestions: { type: [Number], default: [] },
    feedback: String,
    rating: { type: Number, min: 1, max: 5 }
  },
  
  // Attempt information
  attemptNumber: { type: Number, required: true, min: 1 },
  maxAttempts: { type: Number, required: true, min: 1 },
  previousAttempts: [{ type: Schema.Types.ObjectId, ref: 'ExamSession' }],
  
  // Timestamps and metadata
  lastActivity: { type: Date, default: Date.now },
  autoSaveInterval: { type: Number, default: 30, min: 10 }, // seconds
  lastAutoSave: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
examSessionSchema.index({ examId: 1, userId: 1 });
examSessionSchema.index({ userId: 1, status: 1 });
examSessionSchema.index({ status: 1, startTime: -1 });
examSessionSchema.index({ lastActivity: -1 });
examSessionSchema.index({ 'score.percentage': -1 });

// Compound index for user attempts
examSessionSchema.index({ examId: 1, userId: 1, attemptNumber: 1 }, { unique: true });

// Virtual for session duration
examSessionSchema.virtual('sessionDuration').get(function() {
  if (!this.endTime) {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000 / 60); // minutes
  }
  return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000 / 60);
});

// Virtual for time remaining
examSessionSchema.virtual('timeRemaining').get(function() {
  // This would need exam duration from populated exam
  return 0; // Placeholder
});

// Virtual for completion percentage
examSessionSchema.virtual('completionPercentage').get(function() {
  if (this.questions.length === 0) return 0;
  return Math.round((this.answers.length / this.questions.length) * 100);
});

// Pre-save middleware
examSessionSchema.pre('save', function(next) {
  // Update last activity
  this.lastActivity = new Date();
  
  // Calculate actual duration if session is completed
  if (this.status === 'completed' && this.endTime) {
    const totalTime = (this.endTime.getTime() - this.startTime.getTime()) / 1000 / 60;
    this.actualDuration = Math.max(0, totalTime - (this.totalPausedDuration / 60));
  }
  
  next();
});

// Instance method to calculate score
examSessionSchema.methods.calculateScore = async function(): Promise<void> {
  await this.populate('questions');
  
  let totalScore = 0;
  let maxPossible = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let flagged = 0;
  
  // Create a map of answers for quick lookup
  const answerMap = new Map();
  this.answers.forEach(answer => {
    answerMap.set(answer.questionId.toString(), answer);
  });
  
  // Calculate scores for each question
  for (const question of this.questions) {
    maxPossible += question.points;
    const answer = answerMap.get(question._id.toString());
    
    if (!answer) {
      unanswered++;
      continue;
    }
    
    if (answer.flagged) flagged++;
    
    // Simple scoring logic (can be enhanced)
    if (answer.isCorrect) {
      totalScore += question.points;
      correct++;
    } else {
      incorrect++;
    }
  }
  
  this.score = {
    total: totalScore,
    percentage: maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0,
    maxPossible,
    breakdown: { correct, incorrect, unanswered, flagged }
  };
  
  await this.save();
};

// Instance method to add violation
examSessionSchema.methods.addViolation = async function(
  type: string, 
  severity: string, 
  description: string
): Promise<void> {
  this.proctoring.violations.push({
    type: type as any,
    severity: severity as any,
    description,
    timestamp: new Date()
  });
  
  await this.save();
};

// Instance method to pause session
examSessionSchema.methods.pauseSession = async function(): Promise<void> {
  if (this.status === 'active') {
    this.status = 'paused';
    this.pausedTime = new Date();
    await this.save();
  }
};

// Instance method to resume session
examSessionSchema.methods.resumeSession = async function(): Promise<void> {
  if (this.status === 'paused' && this.pausedTime) {
    this.status = 'active';
    this.resumedTime = new Date();
    this.totalPausedDuration += Math.floor((this.resumedTime.getTime() - this.pausedTime.getTime()) / 1000);
    await this.save();
  }
};

// Instance method to complete session
examSessionSchema.methods.completeSession = async function(): Promise<void> {
  this.status = 'completed';
  this.endTime = new Date();
  await this.calculateScore();
};

// Instance method to get time remaining
examSessionSchema.methods.getTimeRemaining = function(): number {
  // This would need exam duration - placeholder implementation
  return 0;
};

// Instance method to check if can submit answer
examSessionSchema.methods.canSubmitAnswer = function(): boolean {
  return this.status === 'active' && this.getTimeRemaining() > 0;
};

export const ExamSession = mongoose.model<IExamSession>('ExamSession', examSessionSchema);