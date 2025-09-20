import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { PlayArrow, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ExamsPage: React.FC = () => {
  const mockExams = [
    {
      id: '1',
      title: 'GATE Computer Science Mock Test 1',
      type: 'GATE',
      difficulty: 'Medium',
      questions: 65,
      duration: 180,
      description: 'Comprehensive mock test covering all GATE CS topics',
    },
    {
      id: '2',
      title: 'GRE Quantitative Reasoning Practice',
      type: 'GRE',
      difficulty: 'Hard',
      questions: 20,
      duration: 35,
      description: 'Advanced quantitative reasoning practice test',
    },
    {
      id: '3',
      title: 'TOEFL Reading Comprehension',
      type: 'TOEFL',
      difficulty: 'Easy',
      questions: 30,
      duration: 60,
      description: 'Reading comprehension practice for TOEFL preparation',
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
          Available Exams
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Choose from our comprehensive collection of practice tests
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {mockExams.map((exam, index) => (
          <Grid item xs={12} md={6} lg={4} key={exam.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {exam.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {exam.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">
                      <strong>{exam.questions}</strong> questions
                    </Typography>
                    <Typography variant="body2">
                      <strong>{exam.duration}</strong> minutes
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      sx={{ flexGrow: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrow />}
                      sx={{ flexGrow: 1 }}
                    >
                      Start Exam
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExamsPage;