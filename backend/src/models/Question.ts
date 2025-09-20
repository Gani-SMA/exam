import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '@/types';

const questionSchema = new Schema<IQuestion>({
  examType: {
    type: String,
    enum: ['GATE', 'GRE', 'TOEFL'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'numerical', 'essay', 'listening', 'speaking', 'reading'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
  }],
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 1,
  },
  timeLimit: {
    type: Number, // in seconds
    default: 120,
  },
  audioUrl: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  tags: [{
    type: String,
  }],
  createdBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
questionSchema.index({ examType: 1, subject: 1, difficulty: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdBy: 1 });

export default mongoose.model<IQuestion>('Question', questionSchema);