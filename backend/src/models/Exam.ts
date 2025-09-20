import mongoose, { Schema } from 'mongoose';
import { IExam } from '@/types';

const examSchema = new Schema<IExam>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['GATE', 'GRE', 'TOEFL'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // in minutes
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  passingScore: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  subjects: [{
    type: String,
    required: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isAdaptive: {
    type: Boolean,
    default: false,
  },
  instructions: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
examSchema.index({ type: 1, isActive: 1 });
examSchema.index({ difficulty: 1 });
examSchema.index({ subjects: 1 });
examSchema.index({ createdBy: 1 });

export default mongoose.model<IExam>('Exam', examSchema);