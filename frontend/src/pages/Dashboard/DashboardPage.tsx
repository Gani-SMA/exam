import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Quiz,
  EmojiEvents,
  Schedule,
  PlayArrow,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { RootState } from '../../store';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const stats = [
    {
      title: 'Total Exams',
      value: user?.stats?.totalExams || 0,
      icon: <Quiz />,
      color: '#1976d2',
      change: '+12%',
    },
    {
      title: 'Average Score',
      value: `${user?.stats?.averageScore || 0}%`,
      icon: <TrendingUp />,
      color: '#2e7d32',
      change: '+5%',
    },
    {
      title: 'Study Streak',
      value: `${user?.stats?.streak || 0} days`,
      icon: <Schedule />,
      color: '#ed6c02',
      change: '+2 days',
    },
    {
      title: 'Achievements',
      value: 8,
      icon: <EmojiEvents />,
      color: '#dc004e',
      change: '+1 new',
    },
  ];

  const recentExams = [
    {
      id: '1',
      title: 'GATE Computer Science Mock Test 1',
      type: 'GATE',
      difficulty: 'Medium',
      questions: 65,
      duration: 180,
      lastScore: 85,
    },
    {
      id: '2',
      title: 'GRE Quantitative Reasoning Practice',
      type: 'GRE',
      difficulty: 'Hard',
      questions: 20,
      duration: 35,
      lastScore: null,
    },
    {
      id: '3',
      title: 'TOEFL Reading Comprehension',
      type: 'TOEFL',
      difficulty: 'Easy',
      questions: 30,
      duration: 60,
      lastScore: 92,
    },
  ];

  const upcomingExams = [
    {
      title: 'GATE 2024 Full Length Test',
      date: '2024-01-15',
      time: '09:00 AM',
      type: 'GATE',
    },
    {
      title: 'GRE Practice Test Series',
      date: '2024-01-18',
      time: '02:00 PM',
      type: 'GRE',
    },
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back, {user?.firstName}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ready to continue your exam preparation journey?
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: stat.color,
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={stat.change}
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Exams */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Continue Your Practice
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/exams')}
                  >
                    View All
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentExams.map((exam) => (
                    <Card
                      key={exam.id}
                      variant="outlined"
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {exam.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                              <Chip label={exam.type} size="small" color="primary" />
                              <Chip
                                label={exam.difficulty}
                                size="small"
                                color={
                                  exam.difficulty === 'Easy'
                                    ? 'success'
                                    : exam.difficulty === 'Medium'
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                              <Chip label={`${exam.questions} questions`} size="small" variant="outlined" />
                              <Chip label={`${exam.duration} min`} size="small" variant="outlined" />
                            </Box>
                            {exam.lastScore && (
                              <Typography variant="body2" color="text.secondary">
                                Last Score: {exam.lastScore}%
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              color="primary"
                              onClick={() => navigate(`/exams/${exam.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => navigate(`/exam/${exam.id}`)}
                            >
                              {exam.lastScore ? 'Retake' : 'Start'}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Your Progress
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Level Progress</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user?.stats?.xp || 0} / 1000 XP
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={((user?.stats?.xp || 0) / 1000) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Current Level</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Level {user?.stats?.level || 1}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/achievements')}
                  >
                    View Achievements
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Exams */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Upcoming Exams
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {upcomingExams.map((exam, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                          backgroundColor: 'action.hover',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {exam.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {exam.date} at {exam.time}
                        </Typography>
                        <Chip label={exam.type} size="small" color="primary" />
                      </Box>
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="text"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/exams')}
                  >
                    View All Exams
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;