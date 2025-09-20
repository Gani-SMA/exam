import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'mcq' | 'numerical' | 'essay' | 'listening' | 'speaking' | 'reading';
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Question content
  question: string;
  options?: string[]; // for MCQ
  correctAnswer: string | number | string[];
  explanation?: string;
  hints?: string[];
  
  // Media attachments
  attachments: {
    type: 'image' | 'audio' | 'video' | 'document';
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    description?: string;
  }[];
  
  // Metadata
  tags: string[];
  keywords: string[];
  estimatedTime: number; // seconds
  points: number;
  language: string;
  
  // Question-specific settings
  settings: {
    caseSensitive?: boolean; // for text answers
    allowPartialCredit?: boolean;
    maxWordCount?: number; // for essays
    minWordCount?: number; // for essays
    allowedFileTypes?: string[]; // for file uploads
    maxFileSize?: number; // in bytes
  };
  
  // Analytics and performance
  statistics: {
    timesUsed: number;
    timesAnswered: number;
    correctAnswers: number;
    averageTime: number;
    averageScore: number;
    lastUsed: Date;
    difficultyRating: number; // calculated based on performance
  };
  
  // AI and automation
  isAIGenerated: boolean;
  aiPrompt?: string;
  aiModel?: string;
  aiGeneratedAt?: Date;
  
  // Quality control
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  reviewComments?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  
  // Version control
  version: number;
  parentQuestion?: mongoose.Types.ObjectId;
  isLatestVersion: boolean;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateDifficulty(): Promise<void>;
  updateStatistics(isCorrect: boolean, timeSpent: number, score?: number): Promise<void>;
}

const questionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: ['mcq', 'numerical', 'essay', 'listening', 'speaking', 'reading'],
    required: [true, 'Question type is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  },
  subtopic: {
    type: String,
    trim: true,
    maxlength: [200, 'Subtopic cannot exceed 200 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty is required']
  },
  
  // Question content
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [5000, 'Question cannot exceed 5000 characters']
  },
  options: {
    type: [String],
    validate: {
      validator: function(options: string[]) {
        if (this.type === 'mcq') {
          return options && options.length >= 2 && options.length <= 6;
        }
        return true;
      },
      message: 'MCQ questions must have 2-6 options'
    }
  },
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: [true, 'Correct answer is required']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [2000, 'Explanation cannot exceed 2000 characters']
  },
  hints: {
    type: [String],
    validate: {
      validator: function(hints: string[]) {
        return hints.length <= 3;
      },
      message: 'Cannot have more than 3 hints'
    }
  },
  
  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'audio', 'video', 'document'],
      required: true
    },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true },
    description: String
  }],
  
  // Metadata
  tags: {
    type: [String],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 10;
      },
      message: 'Cannot have more than 10 tags'
    }
  },
  keywords: {
    type: [String],
    validate: {
      validator: function(keywords: string[]) {
        return keywords.length <= 20;
      },
      message: 'Cannot have more than 20 keywords'
    }
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: [10, 'Estimated time must be at least 10 seconds'],
    max: [3600, 'Estimated time cannot exceed 1 hour']
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [1, 'Points must be at least 1'],
    max: [100, 'Points cannot exceed 100']
  },
  language: {
    type: String,
    default: 'en',
    required: true
  },
  
  // Question-specific settings
  settings: {
    caseSensitive: { type: Boolean, default: false },
    allowPartialCredit: { type: Boolean, default: false },
    maxWordCount: { type: Number, min: 1 },
    minWordCount: { type: Number, min: 1 },
    allowedFileTypes: [String],
    maxFileSize: { type: Number, min: 1 }
  },
  
  // Analytics and performance
  statistics: {
    timesUsed: { type: Number, default: 0, min: 0 },
    timesAnswered: { type: Number, default: 0, min: 0 },
    correctAnswers: { type: Number, default: 0, min: 0 },
    averageTime: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0, max: 100 },
    lastUsed: { type: Date, default: Date.now },
    difficultyRating: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  // AI and automation
  isAIGenerated: { type: Boolean, default: false },
  aiPrompt: String,
  aiModel: String,
  aiGeneratedAt: Date,
  
  // Quality control
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_revision'],
    default: 'pending'
  },
  reviewComments: String,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  
  // Version control
  version: { type: Number, default: 1, min: 1 },
  parentQuestion: { type: Schema.Types.ObjectId, ref: 'Question' },
  isLatestVersion: { type: Boolean, default: true },
  
  // Metadata
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
questionSchema.index({ subject: 1, topic: 1, difficulty: 1 });
questionSchema.index({ type: 1, isActive: 1 });
questionSchema.index({ createdBy: 1, isActive: 1 });
questionSchema.index({ reviewStatus: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'statistics.difficultyRating': 1 });
questionSchema.index({ isLatestVersion: 1, parentQuestion: 1 });

// Virtual for success rate
questionSchema.virtual('successRate').get(function() {
  if (this.statistics.timesAnswered === 0) return 0;
  return (this.statistics.correctAnswers / this.statistics.timesAnswered) * 100;
});

// Virtual for usage frequency
questionSchema.virtual('usageFrequency').get(function() {
  const daysSinceCreation = Math.max(1, Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  return this.statistics.timesUsed / daysSinceCreation;
});

// Pre-save validation
questionSchema.pre('save', function(next) {
  // Validate MCQ options and correct answer
  if (this.type === 'mcq') {
    if (!this.options || this.options.length < 2) {
      return next(new Error('MCQ questions must have at least 2 options'));
    }
    
    const correctIndex = parseInt(this.correctAnswer as string);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= this.options.length) {
      return next(new Error('Correct answer must be a valid option index'));
    }
  }
  
  // Validate word count settings
  if (this.settings.minWordCount && this.settings.maxWordCount) {
    if (this.settings.minWordCount > this.settings.maxWordCount) {
      return next(new Error('Minimum word count cannot exceed maximum word count'));
    }
  }
  
  // Set AI generation timestamp
  if (this.isAIGenerated && !this.aiGeneratedAt) {
    this.aiGeneratedAt = new Date();
  }
  
  next();
});

// Instance method to calculate difficulty based on performance
questionSchema.methods.calculateDifficulty = async function(): Promise<void> {
  const successRate = this.successRate;
  const avgTime = this.statistics.averageTime;
  const estimatedTime = this.estimatedTime;
  
  let calculatedDifficulty = 0;
  
  // Base difficulty on success rate
  if (successRate >= 80) calculatedDifficulty += 1;
  else if (successRate >= 60) calculatedDifficulty += 2;
  else if (successRate >= 40) calculatedDifficulty += 3;
  else if (successRate >= 20) calculatedDifficulty += 4;
  else calculatedDifficulty += 5;
  
  // Adjust based on time taken vs estimated time
  if (avgTime > 0 && estimatedTime > 0) {
    const timeRatio = avgTime / estimatedTime;
    if (timeRatio > 1.5) calculatedDifficulty += 0.5;
    else if (timeRatio < 0.7) calculatedDifficulty -= 0.5;
  }
  
  // Ensure rating is within bounds
  this.statistics.difficultyRating = Math.max(1, Math.min(5, calculatedDifficulty));
  
  await this.save();
};

// Instance method to update statistics
questionSchema.methods.updateStatistics = async function(
  isCorrect: boolean, 
  timeSpent: number, 
  score: number = 0
): Promise<void> {
  this.statistics.timesAnswered += 1;
  if (isCorrect) this.statistics.correctAnswers += 1;
  
  // Update average time (running average)
  const totalTime = this.statistics.averageTime * (this.statistics.timesAnswered - 1) + timeSpent;
  this.statistics.averageTime = totalTime / this.statistics.timesAnswered;
  
  // Update average score (running average)
  const totalScore = this.statistics.averageScore * (this.statistics.timesAnswered - 1) + score;
  this.statistics.averageScore = totalScore / this.statistics.timesAnswered;
  
  this.statistics.lastUsed = new Date();
  
  // Recalculate difficulty if we have enough data
  if (this.statistics.timesAnswered >= 10) {
    await this.calculateDifficulty();
  }
  
  await this.save();
};

export const Question = mongoose.model<IQuestion>('Question', questionSchema);