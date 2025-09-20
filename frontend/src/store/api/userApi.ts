import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import { ApiResponse, UserStats, UserProgress, User, Achievement, Notification } from '../../types/api';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/users',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery,
  tagTypes: ['User', 'Stats'],
  endpoints: (builder) => ({
    getUserStats: builder.query<ApiResponse<UserStats>, void>({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
    getUserProgress: builder.query<
      ApiResponse<UserProgress>,
      { examType?: string; period?: string }
    >({
      query: (params) => ({
        url: '/progress',
        params,
      }),
      providesTags: ['Stats'],
    }),
    getAchievements: builder.query<ApiResponse<Achievement[]>, void>({
      query: () => '/achievements',
    }),
    getFriends: builder.query<ApiResponse<User[]>, void>({
      query: () => '/friends',
    }),
    sendFriendRequest: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/friends/request/${userId}`,
        method: 'POST',
      }),
    }),
    acceptFriendRequest: builder.mutation<ApiResponse<void>, string>({
      query: (requestId) => ({
        url: `/friends/accept/${requestId}`,
        method: 'POST',
      }),
    }),
    getNotifications: builder.query<ApiResponse<Notification[]>, void>({
      query: () => '/notifications',
    }),
    markNotificationRead: builder.mutation<ApiResponse<void>, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
    }),
  }),
});

export const {
  useGetUserStatsQuery,
  useGetUserProgressQuery,
  useGetAchievementsQuery,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} = userApi;