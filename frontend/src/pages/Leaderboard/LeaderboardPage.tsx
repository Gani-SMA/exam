import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  School,
  Psychology,
  Language,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leaderboard-tabpanel-${index}`}
      aria-labelledby={`leaderboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const LeaderboardPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data - replace with actual API calls
  const leaderboardData = [
    {
      rank: 1,
      name: 'Alex Johnson',
      avatar: '/avatars/alex.jpg',
      score: 2850,
      exams: 45,
      accuracy: 94,
      streak: 15,
      badge: 'Gold',
    },
    {
      rank: 2,
      name: 'Sarah Chen',
      avatar: '/avatars/sarah.jpg',
      score: 2720,
      exams: 38,
      accuracy: 91,
      streak: 12,
      badge: 'Silver',
    },
    {
      rank: 3,
      name: 'Mike Rodriguez',
      avatar: '/avatars/mike.jpg',
      score: 2650,
      exams: 42,
      accuracy: 89,
      streak: 8,
      badge: 'Bronze',
    },
    // Add more mock data...
  ];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return theme.palette.text.secondary;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <EmojiEvents sx={{ color: getRankColor(rank) }} />;
    }
    return rank;
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Leaderboard 🏆
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          See how you rank against other students
        </Typography>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="Overall"
              icon={<TrendingUp />}
              iconPosition="start"
            />
            <Tab
              label="GATE"
              icon={<School />}
              iconPosition="start"
            />
            <Tab
              label="GRE"
              icon={<Psychology />}
              iconPosition="start"
            />
            <Tab
              label="TOEFL"
              icon={<Language />}
              iconPosition="start"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell align="center">Exams</TableCell>
                    <TableCell align="center">Accuracy</TableCell>
                    <TableCell align="center">Streak</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboardData.map((student) => (
                    <TableRow
                      key={student.rank}
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' },
                        backgroundColor: student.rank <= 3 ? 'action.selected' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRankIcon(student.rank)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={student.avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            {student.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {student.name}
                            </Typography>
                            {student.rank <= 3 && (
                              <Chip
                                label={student.badge}
                                size="small"
                                sx={{
                                  backgroundColor: getRankColor(student.rank),
                                  color: 'white',
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {student.score.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{student.exams}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${student.accuracy}%`}
                          size="small"
                          color={student.accuracy >= 90 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${student.streak} days`}
                          size="small"
                          color={student.streak >= 10 ? 'warning' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              GATE leaderboard coming soon...
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              GRE leaderboard coming soon...
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              TOEFL leaderboard coming soon...
            </Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeaderboardPage;