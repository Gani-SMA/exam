import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  TextField,
  Chip,
  LinearProgress,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  EmojiEvents,
  TrendingUp,
  School,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Implement save functionality
    setIsEditing(false);
  };

  const stats = [
    {
      label: 'Total Exams',
      value: user?.stats?.totalExams || 0,
      icon: <School />,
      color: '#1976d2',
    },
    {
      label: 'Average Score',
      value: `${user?.stats?.averageScore || 0}%`,
      icon: <TrendingUp />,
      color: '#2e7d32',
    },
    {
      label: 'Study Streak',
      value: `${user?.stats?.streak || 0} days`,
      icon: <Schedule />,
      color: '#ed6c02',
    },
    {
      label: 'Achievements',
      value: 8,
      icon: <EmojiEvents />,
      color: '#dc004e',
    },
  ];

  const achievements = [
    { name: 'First Exam', description: 'Complete your first exam', earned: true },
    { name: 'Perfect Score', description: 'Score 100% on any exam', earned: true },
    { name: 'Week Warrior', description: 'Study for 7 consecutive days', earned: true },
    { name: 'Speed Demon', description: 'Complete an exam in record time', earned: false },
    { name: 'Knowledge Seeker', description: 'Take 50 exams', earned: false },
    { name: 'Master Student', description: 'Maintain 90%+ average', earned: true },
  ];

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your account settings and view your progress
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Avatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      <PhotoCamera fontSize="small" />
                    </IconButton>
                  }
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                <Chip
                  label={`Level ${user?.stats?.level || 1}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={user?.role || 'Student'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Level Progress */}
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

              <Button
                variant={isEditing ? 'contained' : 'outlined'}
                startIcon={<Edit />}
                onClick={() => setIsEditing(!isEditing)}
                fullWidth
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details & Stats */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Personal Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Personal Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>

                {isEditing && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Statistics
                </Typography>

                <Grid container spacing={2}>
                  {stats.map((stat, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Box
                          sx={{
                            color: stat.color,
                            mb: 1,
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          {stat.icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Achievements
                </Typography>

                <Grid container spacing={2}>
                  {achievements.map((achievement, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          border: 1,
                          borderColor: achievement.earned ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          backgroundColor: achievement.earned ? 'primary.light' : 'action.hover',
                          opacity: achievement.earned ? 1 : 0.6,
                        }}
                      >
                        <EmojiEvents
                          sx={{
                            color: achievement.earned ? 'primary.main' : 'text.secondary',
                            mr: 2,
                          }}
                        />
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: achievement.earned ? 'primary.main' : 'text.secondary',
                            }}
                          >
                            {achievement.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {achievement.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;