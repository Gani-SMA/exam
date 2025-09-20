import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School,
  Psychology,
  Language,
  TrendingUp,
  EmojiEvents,
  Group,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const features = [
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'GATE Preparation',
      description: 'Comprehensive practice tests for all GATE subjects with detailed solutions.',
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: 'GRE Excellence',
      description: 'Adaptive testing system that adjusts to your skill level for optimal preparation.',
    },
    {
      icon: <Language sx={{ fontSize: 40 }} />,
      title: 'TOEFL Mastery',
      description: 'Complete TOEFL preparation with speaking, listening, reading, and writing sections.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Analytics',
      description: 'Get personalized insights and recommendations based on your performance.',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40 }} />,
      title: 'Gamification',
      description: 'Earn points, badges, and compete with friends to stay motivated.',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Multiplayer Battles',
      description: 'Challenge friends and peers in real-time quiz battles.',
    },
  ];

  return (
    <Box>
      {/* Navigation */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'transparent' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2, #dc004e)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ExamPlatform
          </Typography>
          <Button
            color="primary"
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{ mr: 1 }}
          >
            Login
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => navigate('/register')}
          >
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Master GATE, GRE & TOEFL
            </Typography>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}
            >
              AI-powered examination platform with adaptive testing, real-time analytics,
              and gamified learning experience.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Watch Demo
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Why Choose Our Platform?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Experience the future of exam preparation with our comprehensive,
            AI-driven learning platform.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 2,
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of students who have already improved their scores
            with our platform.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            Start Free Trial
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          py: 4,
          textAlign: 'center',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            © 2024 GATE/GRE/TOEFL Examination Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;