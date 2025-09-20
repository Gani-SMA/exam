import mongoose, { Schema } from 'mongoose';
import { IUserAchievement } from '@/types';

const userAchievementSchema = new Schema<IUserAchievement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
    required: [true, 'Achievement ID is required']
  },
  unlockedAt: {
    type: Date,
    required: [true, 'Unlock date is required'],
    default: Date.now
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100'],
    default: 100
  }
}, {
  timestamps: true
});

// Indexes
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, unlockedAt: -1 });

export default mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema);