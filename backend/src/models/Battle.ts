import mongoose, { Document, Schema } from 'mongoose';

export interface IBattle extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: '1v1' | 'team' | 'tournament' | 'practice';
  mode: 'speed' | 'accuracy' | 'mixed' | 'survival';
  
  // Configuration
  questionCount: number;
  timeLimit: number; // in minutes
  subject: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  
  // Participants and teams
  maxParticipants: number;
  participants: {
    userId: mongoose.Types.ObjectId;
    username: string;
    avatar?: string;
    joinedAt: Date;
    teamId?: string;
    isReady: boolean;
    score?: number;
    rank?: number;
    answers: {
      questionId: mongoose.Types.ObjectId;
      answer: string | number;
      timeSpent: number;
      isCorrect: boolean;
      points: number;
      submittedAt: Date;
    }[];
    performance: {
      correctAnswers: number;
      incorrectAnswers: number;
      averageTime: number;
      streak: number;
      maxStreak: number;
    };
  }[];
  
  teams?: {
    teamId: string;
    name: string;
    color: string;
    members: mongoose.Types.ObjectId[];
    score: number;
    rank?: number;
  }[];
  
  // Questions and game state
  questions: mongoose.Types.ObjectId[];
  currentQuestionIndex: number;
  questionStartTime?: Date;
  questionTimeLimit: number; // seconds per question
  
  // Battle state and timing
  status: 'waiting' | 'starting' | 'active' | 'paused' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  totalPausedDuration: number;
  
  // Results and leaderboard
  winner?: mongoose.Types.ObjectId | string; // userId or teamId
  leaderboard: {
    userId: mongoose.Types.ObjectId;
    username: string;
    score: number;
    rank: number;
    correctAnswers: number;
    averageTime: number;
    streak: number;
    teamId?: string;
  }[];
  
  // Battle settings
  settings: {
    allowSpectators: boolean;
    showLeaderboard: boolean;
    allowChat: boolean;
    powerUpsEnabled: boolean;
    negativeMarking: boolean;
    shuffleQuestions: boolean;
    instantFeedback: boolean;
    showCorrectAnswers: boolean;
  };
  
  // Power-ups and special features
  powerUps?: {
    type: 'time_freeze' | 'double_points' | 'skip_question' | 'hint' | 'eliminate_option';
    userId: mongoose.Types.ObjectId;
    usedAt: Date;
    questionIndex: number;
  }[];
  
  // Chat and communication
  chat?: {
    userId: mongoose.Types.ObjectId;
    username: string;
    message: string;
    timestamp: Date;
    type: 'message' | 'system' | 'achievement';
  }[];
  
  // Spectators
  spectators?: {
    userId: mongoose.Types.ObjectId;
    username: string;
    joinedAt: Date;
  }[];
  
  // Analytics and statistics
  analytics: {
    totalParticipants: number;
    averageScore: number;
    averageCompletionTime: number;
    questionStats: {
      questionId: mongoose.Types.ObjectId;
      correctAnswers: number;
      totalAnswers: number;
      averageTime: number;
    }[];
    engagementMetrics: {
      chatMessages: number;
      powerUpsUsed: number;
      spectatorCount: number;
    };
  };
  
  // Tournament specific data
  tournamentData?: {
    tournamentId: mongoose.Types.ObjectId;
    round: number;
    bracket: string;
    nextBattleId?: mongoose.Types.ObjectId;
    previousBattleId?: mongoose.Types.ObjectId;
  };
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  password?: string;
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addParticipant(userId: mongoose.Types.ObjectId, username: string): Promise<boolean>;
  removeParticipant(userId: mongoose.Types.ObjectId): Promise<void>;
  startBattle(): Promise<void>;
  endBattle(): Promise<void>;
  submitAnswer(userId: mongoose.Types.ObjectId, answer: any): Promise<void>;
  calculateLeaderboard(): Promise<void>;
  nextQuestion(): Promise<void>;
}

const battleSchema = new Schema<IBattle>({
  title: {
    type: String,
    required: [true, 'Battle title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['1v1', 'team', 'tournament', 'practice'],
    required: [true, 'Battle type is required']
  },
  mode: {
    type: String,
    enum: ['speed', 'accuracy', 'mixed', 'survival'],
    required: [true, 'Battle mode is required']
  },
  
  // Configuration
  questionCount: {
    type: Number,
    required: [true, 'Question count is required'],
    min: [1, 'Must have at least 1 question'],
    max: [100, 'Cannot exceed 100 questions']
  },
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: [1, 'Time limit must be at least 1 minute'],
    max: [180, 'Time limit cannot exceed 180 minutes']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  topics: {
    type: [String],
    required: [true, 'At least one topic is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    required: [true, 'Difficulty is required']
  },
  
  // Participants
  maxParticipants: {
    type: Number,
    required: [true, 'Max participants is required'],
    min: [2, 'Must allow at least 2 participants'],
    max: [100, 'Cannot exceed 100 participants']
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    avatar: String,
    joinedAt: { type: Date, default: Date.now },
    teamId: String,
    isReady: { type: Boolean, default: false },
    score: { type: Number, default: 0, min: 0 },
    rank: { type: Number, min: 1 },
    answers: [{
      questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      answer: { type: Schema.Types.Mixed, required: true },
      timeSpent: { type: Number, required: true, min: 0 },
      isCorrect: { type: Boolean, required: true },
      points: { type: Number, required: true, min: 0 },
      submittedAt: { type: Date, required: true, default: Date.now }
    }],
    performance: {
      correctAnswers: { type: Number, default: 0, min: 0 },
      incorrectAnswers: { type: Number, default: 0, min: 0 },
      averageTime: { type: Number, default: 0, min: 0 },
      streak: { type: Number, default: 0, min: 0 },
      maxStreak: { type: Number, default: 0, min: 0 }
    }
  }],
  
  teams: [{
    teamId: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    score: { type: Number, default: 0, min: 0 },
    rank: { type: Number, min: 1 }
  }],
  
  // Questions and game state
  questions: {
    type: [Schema.Types.ObjectId],
    ref: 'Question',
    required: [true, 'Questions are required']
  },
  currentQuestionIndex: { type: Number, default: 0, min: 0 },
  questionStartTime: Date,
  questionTimeLimit: {
    type: Number,
    default: 30,
    min: [5, 'Question time limit must be at least 5 seconds'],
    max: [300, 'Question time limit cannot exceed 300 seconds']
  },
  
  // Battle state
  status: {
    type: String,
    enum: ['waiting', 'starting', 'active', 'paused', 'completed', 'cancelled'],
    default: 'waiting'
  },
  startTime: Date,
  endTime: Date,
  pausedAt: Date,
  resumedAt: Date,
  totalPausedDuration: { type: Number, default: 0, min: 0 },
  
  // Results
  winner: { type: Schema.Types.Mixed }, // Can be userId or teamId
  leaderboard: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    rank: { type: Number, required: true, min: 1 },
    correctAnswers: { type: Number, required: true, min: 0 },
    averageTime: { type: Number, required: true, min: 0 },
    streak: { type: Number, required: true, min: 0 },
    teamId: String
  }],
  
  // Settings
  settings: {
    allowSpectators: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    powerUpsEnabled: { type: Boolean, default: false },
    negativeMarking: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: true },
    instantFeedback: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: true }
  },
  
  // Power-ups
  powerUps: [{
    type: {
      type: String,
      enum: ['time_freeze', 'double_points', 'skip_question', 'hint', 'eliminate_option'],
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    usedAt: { type: Date, required: true, default: Date.now },
    questionIndex: { type: Number, required: true, min: 0 }
  }],
  
  // Chat
  chat: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    message: { type: String, required: true, maxlength: 500 },
    timestamp: { type: Date, required: true, default: Date.now },
    type: {
      type: String,
      enum: ['message', 'system', 'achievement'],
      default: 'message'
    }
  }],
  
  // Spectators
  spectators: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    joinedAt: { type: Date, required: true, default: Date.now }
  }],
  
  // Analytics
  analytics: {
    totalParticipants: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0 },
    averageCompletionTime: { type: Number, default: 0, min: 0 },
    questionStats: [{
      questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      correctAnswers: { type: Number, default: 0, min: 0 },
      totalAnswers: { type: Number, default: 0, min: 0 },
      averageTime: { type: Number, default: 0, min: 0 }
    }],
    engagementMetrics: {
      chatMessages: { type: Number, default: 0, min: 0 },
      powerUpsUsed: { type: Number, default: 0, min: 0 },
      spectatorCount: { type: Number, default: 0, min: 0 }
    }
  },
  
  // Tournament data
  tournamentData: {
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    round: { type: Number, min: 1 },
    bracket: String,
    nextBattleId: { type: Schema.Types.ObjectId, ref: 'Battle' },
    previousBattleId: { type: Schema.Types.ObjectId, ref: 'Battle' }
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  isPublic: { type: Boolean, default: true },
  password: String,
  tags: { type: [String], default: [] }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ createdBy: 1, status: 1 });
battleSchema.index({ subject: 1, difficulty: 1 });
battleSchema.index({ type: 1, isPublic: 1 });
battleSchema.index({ 'participants.userId': 1 });

// Virtual for battle duration
battleSchema.virtual('duration').get(function() {
  if (!this.endTime || !this.startTime) return 0;
  return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000 / 60);
});

// Virtual for current participants count
battleSchema.virtual('currentParticipants').get(function() {
  return this.participants.length;
});

// Virtual for is full
battleSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

// Instance method to add participant
battleSchema.methods.addParticipant = async function(
  userId: mongoose.Types.ObjectId, 
  username: string
): Promise<boolean> {
  if (this.isFull || this.status !== 'waiting') {
    return false;
  }
  
  // Check if user is already a participant
  const existingParticipant = this.participants.find(p => p.userId.equals(userId));
  if (existingParticipant) {
    return false;
  }
  
  this.participants.push({
    userId,
    username,
    joinedAt: new Date(),
    isReady: false,
    score: 0,
    answers: [],
    performance: {
      correctAnswers: 0,
      incorrectAnswers: 0,
      averageTime: 0,
      streak: 0,
      maxStreak: 0
    }
  });
  
  await this.save();
  return true;
};

// Instance method to remove participant
battleSchema.methods.removeParticipant = async function(userId: mongoose.Types.ObjectId): Promise<void> {
  this.participants = this.participants.filter(p => !p.userId.equals(userId));
  await this.save();
};

// Instance method to start battle
battleSchema.methods.startBattle = async function(): Promise<void> {
  if (this.status === 'waiting' && this.participants.length >= 2) {
    this.status = 'active';
    this.startTime = new Date();
    this.questionStartTime = new Date();
    await this.save();
  }
};

// Instance method to end battle
battleSchema.methods.endBattle = async function(): Promise<void> {
  this.status = 'completed';
  this.endTime = new Date();
  await this.calculateLeaderboard();
  await this.save();
};

// Instance method to submit answer
battleSchema.methods.submitAnswer = async function(
  userId: mongoose.Types.ObjectId, 
  answer: any
): Promise<void> {
  const participant = this.participants.find(p => p.userId.equals(userId));
  if (!participant || this.status !== 'active') return;
  
  const currentQuestion = this.questions[this.currentQuestionIndex];
  const timeSpent = this.questionStartTime ? 
    Math.floor((Date.now() - this.questionStartTime.getTime()) / 1000) : 0;
  
  // This would need question validation logic
  const isCorrect = true; // Placeholder
  const points = isCorrect ? 10 : 0; // Placeholder
  
  participant.answers.push({
    questionId: currentQuestion,
    answer,
    timeSpent,
    isCorrect,
    points,
    submittedAt: new Date()
  });
  
  participant.score += points;
  
  if (isCorrect) {
    participant.performance.correctAnswers++;
    participant.performance.streak++;
    participant.performance.maxStreak = Math.max(
      participant.performance.maxStreak, 
      participant.performance.streak
    );
  } else {
    participant.performance.incorrectAnswers++;
    participant.performance.streak = 0;
  }
  
  // Update average time
  const totalAnswers = participant.performance.correctAnswers + participant.performance.incorrectAnswers;
  participant.performance.averageTime = 
    ((participant.performance.averageTime * (totalAnswers - 1)) + timeSpent) / totalAnswers;
  
  await this.save();
};

// Instance method to calculate leaderboard
battleSchema.methods.calculateLeaderboard = async function(): Promise<void> {
  const leaderboard = this.participants
    .map(p => ({
      userId: p.userId,
      username: p.username,
      score: p.score,
      rank: 0, // Will be calculated
      correctAnswers: p.performance.correctAnswers,
      averageTime: p.performance.averageTime,
      streak: p.performance.maxStreak,
      teamId: p.teamId
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.averageTime !== b.averageTime) return a.averageTime - b.averageTime;
      return b.correctAnswers - a.correctAnswers;
    });
  
  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  this.leaderboard = leaderboard;
  
  // Set winner
  if (leaderboard.length > 0) {
    this.winner = leaderboard[0].userId;
  }
};

// Instance method to move to next question
battleSchema.methods.nextQuestion = async function(): Promise<void> {
  if (this.currentQuestionIndex < this.questions.length - 1) {
    this.currentQuestionIndex++;
    this.questionStartTime = new Date();
    await this.save();
  } else {
    await this.endBattle();
  }
};

export const Battle = mongoose.model<IBattle>('Battle', battleSchema);