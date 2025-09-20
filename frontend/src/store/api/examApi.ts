import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import {
  ApiResponse,
  Exam,
  ExamSession,
  User,
} from '../../types/api';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/exams',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const examApi = createApi({
  reducerPath: 'examApi',
  baseQuery,
  tagTypes: ['Exam', 'ExamSession', 'Result'],
  endpoints: (builder) => ({
    getExams: builder.query<
      ApiResponse<Exam[]>,
      { type?: 'GATE' | 'GRE' | 'TOEFL'; difficulty?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/',
        params,
      }),
      providesTags: ['Exam'],
    }),
    getExamById: builder.query<ApiResponse<Exam>, string>({
      query: (id) => `/${id}`,
      providesTags: ['Exam'],
    }),
    startExam: builder.mutation<ApiResponse<ExamSession>, string>({
      query: (examId) => ({
        url: `/${examId}/start`,
        method: 'POST',
      }),
    }),
    submitAnswer: builder.mutation<
      ApiResponse<void>,
      { sessionId: string; questionId: string; answer: string | number; timeSpent: number }
    >({
      query: ({ sessionId, ...data }) => ({
        url: `/sessions/${sessionId}/answer`,
        method: 'POST',
        body: data,
      }),
    }),
    endExam: builder.mutation<ApiResponse<ExamSession>, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/end`,
        method: 'POST',
      }),
      invalidatesTags: ['Result'],
    }),
    pauseExam: builder.mutation<ApiResponse<void>, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/pause`,
        method: 'POST',
      }),
    }),
    resumeExam: builder.mutation<ApiResponse<void>, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/resume`,
        method: 'POST',
      }),
    }),
    getExamSession: builder.query<ApiResponse<ExamSession>, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      providesTags: ['ExamSession'],
    }),
    getResults: builder.query<
      ApiResponse<ExamSession[]>,
      { page?: number; limit?: number; examType?: string }
    >({
      query: (params) => ({
        url: '/results',
        params,
      }),
      providesTags: ['Result'],
    }),
    getResultById: builder.query<ApiResponse<ExamSession>, string>({
      query: (resultId) => `/results/${resultId}`,
      providesTags: ['Result'],
    }),
    getLeaderboard: builder.query<
      ApiResponse<User[]>,
      { examType?: string; period?: string; limit?: number }
    >({
      query: (params) => ({
        url: '/leaderboard',
        params,
      }),
    }),
  }),
});

export const {
  useGetExamsQuery,
  useGetExamByIdQuery,
  useStartExamMutation,
  useSubmitAnswerMutation,
  useEndExamMutation,
  usePauseExamMutation,
  useResumeExamMutation,
  useGetExamSessionQuery,
  useGetResultsQuery,
  useGetResultByIdQuery,
  useGetLeaderboardQuery,
} = examApi;