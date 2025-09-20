import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import {
  ApiResponse,
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../../types/api';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/auth',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<ApiResponse<User>, UpdateProfileRequest>({
      query: (updates) => ({
        url: '/profile',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<ApiResponse<void>, ChangePasswordRequest>({
      query: (passwords) => ({
        url: '/change-password',
        method: 'POST',
        body: passwords,
      }),
    }),
    forgotPassword: builder.mutation<ApiResponse<void>, ForgotPasswordRequest>({
      query: (data) => ({
        url: '/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<void>, ResetPasswordRequest>({
      query: (data) => ({
        url: '/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;