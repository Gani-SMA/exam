import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: 'exam' | 'streak' | 'score' | 'speed' | 'social' | 'special';
  type: 'milestone' | 'progressive' | 'rare' | 'seasonal';
  
  // Achievement criteria
  criteria: {
    type: 'exam_count' | 'score_threshold' | 'streak_days' | 'time_limit' | 'subject_mastery' | 'battle_wins' | 'custom';
    value: number;
    operator: 'gte' | 'lte' | 'eq' | 'between';
    additionalParams?: {
      subject?: string;
      examType?: string;
      difficulty?: string;
      timeframe?: number; // days
    };
  };
  
  // Rewards
  rewards: {
    xp: number;
    badge?: {
      name: string;
      icon: string;
      color: string;
    };
    title?: string;
    unlocks?: string[]; // Features or content unlocked
  };
  
  // Visual and metadata
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  // Availability
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  
  // Statistics
  statistics: {
    totalEarned: number;
    firstEarnedBy?: mongoose.Types.ObjectId;
    firstEarnedAt?: Date;
    lastEarnedAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  name: {
    type: String,
    required: [true, 'Achievement name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['exam', 'streak', 'score', 'speed', 'social', 'special'],
    required: [true, 'Category is required']
  },
  type: {
    type: String,
    enum: ['milestone', 'progressive', 'rare', 'seasonal'],
    required: [true, 'Type is required']
  },
  
  criteria: {
    type: {
      type: String,
      enum: ['exam_count', 'score_threshold', 'streak_days', 'time_limit', 'subject_mastery', 'battle_wins', 'custom'],
      required: true
    },
    value: { type: Number, required: true },
    operator: {
      type: String,
      enum: ['gte', 'lte', 'eq', 'between'],
      required: true
    },
    additionalParams: {
      subject: String,
      examType: String,
      difficulty: String,
      timeframe: Number
    }
  },
  
  rewards: {
    xp: { type: Number, required: true, min: 0 },
    badge: {
      name: String,
      icon: String,
      color: String
    },
    title: String,
    unlocks: [String]
  },
  
  icon: { type: String, required: true },
  color: { type: String, required: true },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: true
  },
  
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  
  statistics: {
    totalEarned: { type: Number, default: 0, min: 0 },
    firstEarnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    firstEarnedAt: Date,
    lastEarnedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ 'statistics.totalEarned': -1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);

// User Achievement tracking model
export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  earnedAt: Date;
  progress?: number; // For progressive achievements
  isNotified: boolean;
}

const userAchievementSchema = new Schema<IUserAchievement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate achievements
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, earnedAt: -1 });

export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema);