import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  _id: string;
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
  audioUrl?: string;
  imageUrl?: string;
}

interface ExamSession {
  _id: string;
  examId: string;
  status: 'active' | 'completed' | 'paused' | 'terminated';
  startTime: string;
  timeRemaining: number;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Array<{
    questionId: string;
    answer: string | number;
    timeSpent: number;
    isCorrect?: boolean;
  }>;
  score?: number;
}

interface ExamResults {
  sessionId: string;
  examId: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  subjectWiseResults: Record<string, {
    correct: number;
    total: number;
    percentage: number;
  }>;
}

interface ExamState {
  currentSession: ExamSession | null;
  isExamActive: boolean;
  currentQuestion: Question | null;
  timeRemaining: number;
  answers: Record<string, string | number>;
  flaggedQuestions: string[];
  isLoading: boolean;
  error: string | null;
  examResults: ExamResults | null;
}

const initialState: ExamState = {
  currentSession: null,
  isExamActive: false,
  currentQuestion: null,
  timeRemaining: 0,
  answers: {},
  flaggedQuestions: [],
  isLoading: false,
  error: null,
  examResults: null,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (state, action: PayloadAction<ExamSession>) => {
      state.currentSession = action.payload;
      state.isExamActive = true;
      state.timeRemaining = action.payload.timeRemaining;
      state.currentQuestion = action.payload.questions[0] || null;
      state.answers = {};
      state.flaggedQuestions = [];
      state.error = null;
    },
    endExam: (state) => {
      state.isExamActive = false;
      state.currentSession = null;
      state.currentQuestion = null;
      state.timeRemaining = 0;
    },
    pauseExam: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'paused';
      }
    },
    resumeExam: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'active';
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<{ question: Question; index: number }>) => {
      state.currentQuestion = action.payload.question;
      if (state.currentSession) {
        state.currentSession.currentQuestionIndex = action.payload.index;
      }
    },
    submitAnswer: (state, action: PayloadAction<{ questionId: string; answer: string | number; timeSpent: number }>) => {
      const { questionId, answer, timeSpent } = action.payload;
      state.answers[questionId] = answer;
      
      if (state.currentSession) {
        const existingAnswerIndex = state.currentSession.answers.findIndex(a => a.questionId === questionId);
        const answerData = { questionId, answer, timeSpent };
        
        if (existingAnswerIndex >= 0) {
          state.currentSession.answers[existingAnswerIndex] = answerData;
        } else {
          state.currentSession.answers.push(answerData);
        }
      }
    },
    flagQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      if (!state.flaggedQuestions.includes(questionId)) {
        state.flaggedQuestions.push(questionId);
      }
    },
    unflagQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      state.flaggedQuestions = state.flaggedQuestions.filter(id => id !== questionId);
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
      if (state.currentSession) {
        state.currentSession.timeRemaining = action.payload;
      }
    },
    setExamResults: (state, action: PayloadAction<ExamResults>) => {
      state.examResults = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearExamState: (state) => {
      return initialState;
    },
  },
});

export const {
  startExam,
  endExam,
  pauseExam,
  resumeExam,
  setCurrentQuestion,
  submitAnswer,
  flagQuestion,
  unflagQuestion,
  updateTimeRemaining,
  setExamResults,
  setLoading,
  setError,
  clearExamState,
} = examSlice.actions;

export default examSlice.reducer;