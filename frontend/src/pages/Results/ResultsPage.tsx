import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, Grid } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ResultsPage: React.FC = () => {
  const mockResults = [
    {
      id: '1',
      examTitle: 'GATE Computer Science Mock Test 1',
      type: 'GATE',
      score: 85,
      totalQuestions: 65,
      correctAnswers: 55,
      date: '2024-01-10',
      duration: 165,
    },
    {
      id: '2',
      examTitle: 'GRE Quantitative Practice',
      type: 'GRE',
      score: 92,
      totalQuestions: 20,
      correctAnswers: 18,
      date: '2024-01-08',
      duration: 32,
    },
  ];

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Exam Results
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Track your performance and progress over time
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {mockResults.map((result, index) => (
          <Grid item xs={12} key={result.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {result.examTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip label={result.type} size="small" color="primary" />
                        <Chip label={`${result.score}%`} size="small" color="success" />
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {result.score}%
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Correct Answers
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.correctAnswers}/{result.totalQuestions}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Date Taken
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.date}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Time Taken
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.duration} min
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        fullWidth
                      >
                        View Details
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ResultsPage;