import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import { RootState } from './store';
import { loginSuccess } from './store/slices/authSlice';
import { useGetProfileQuery } from './store/api/authApi';

// Layout Components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';
import ExamLayout from './components/Layout/ExamLayout';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ExamsPage from './pages/Exams/ExamsPage';
import ExamDetailPage from './pages/Exams/ExamDetailPage';
import ExamInterfacePage from './pages/Exams/ExamInterfacePage';
import ResultsPage from './pages/Results/ResultsPage';
import ResultDetailPage from './pages/Results/ResultDetailPage';
import LeaderboardPage from './pages/Leaderboard/LeaderboardPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Auto-login if token exists
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery(undefined, {
    skip: !token || isAuthenticated,
  });

  useEffect(() => {
    if (profileData?.success && token) {
      dispatch(loginSuccess({ user: profileData.data, token }));
    }
  }, [profileData, token, dispatch]);

  // Show loading spinner while checking authentication
  if (token && !isAuthenticated && profileLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HomePage />
            </motion.div>
          }
        />
        
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <Layout>
                <ExamsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/exams/:examId"
          element={
            <ProtectedRoute>
              <Layout>
                <ExamDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Exam Interface (Full Screen) */}
        <Route
          path="/exam/:sessionId"
          element={
            <ProtectedRoute>
              <ExamLayout>
                <ExamInterfacePage />
              </ExamLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Layout>
                <ResultsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/results/:resultId"
          element={
            <ProtectedRoute>
              <Layout>
                <ResultDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Layout>
                <LeaderboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;