import mongoose, { Schema } from 'mongoose';
import { IExamSession } from '@/types';

const examSessionSchema = new Schema<IExamSession>({
  userId: {
    type: String,
    required: true,
  },
  examId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'terminated'],
    default: 'active',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  timeRemaining: {
    type: Number,
    required: true, // in seconds
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  answers: [{
    questionId: {
      type: String,
      required: true,
    },
    answer: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timeSpent: {
      type: Number,
      required: true, // in seconds
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
  }],
  score: {
    type: Number,
    default: null,
  },
  violations: [{
    type: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  }],
  proctoring: {
    enabled: {
      type: Boolean,
      default: true,
    },
    flags: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
});

// Indexes for performance
examSessionSchema.index({ userId: 1, status: 1 });
examSessionSchema.index({ examId: 1 });
examSessionSchema.index({ startTime: -1 });

export default mongoose.model<IExamSession>('ExamSession', examSessionSchema);