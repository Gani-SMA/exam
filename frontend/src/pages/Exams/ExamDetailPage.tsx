import React from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, Grid } from '@mui/material';
import { PlayArrow, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

const ExamDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams();

  const examDetails = {
    title: 'GATE Computer Science Mock Test 1',
    type: 'GATE',
    difficulty: 'Medium',
    questions: 65,
    duration: 180,
    description: 'Comprehensive mock test covering all GATE Computer Science topics including Data Structures, Algorithms, Operating Systems, Computer Networks, and Database Management Systems.',
    topics: ['Data Structures', 'Algorithms', 'Operating Systems', 'Computer Networks', 'DBMS'],
    instructions: [
      'Read all questions carefully before answering',
      'Each question carries equal marks',
      'There is negative marking for wrong answers',
      'You can flag questions for review',
      'Submit the exam before time runs out',
    ],
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/exams')}
          sx={{ mb: 3 }}
        >
          Back to Exams
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {examDetails.title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={examDetails.type} color="primary" />
          <Chip
            label={examDetails.difficulty}
            color={
              examDetails.difficulty === 'Easy'
                ? 'success'
                : examDetails.difficulty === 'Medium'
                ? 'warning'
                : 'error'
            }
          />
          <Chip label={`${examDetails.questions} questions`} variant="outlined" />
          <Chip label={`${examDetails.duration} minutes`} variant="outlined" />
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  About This Exam
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {examDetails.description}
                </Typography>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Topics Covered
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {examDetails.topics.map((topic, index) => (
                    <Chip key={index} label={topic} variant="outlined" size="small" />
                  ))}
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Instructions
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {examDetails.instructions.map((instruction, index) => (
                    <Typography component="li" variant="body2" key={index} sx={{ mb: 1 }}>
                      {instruction}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Exam Details
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Total Questions:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {examDetails.questions}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Duration:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {examDetails.duration} minutes
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Difficulty:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {examDetails.difficulty}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="body2">Exam Type:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {examDetails.type}
                  </Typography>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate(`/exam/${examId}`)}
                  sx={{ py: 1.5 }}
                >
                  Start Exam
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExamDetailPage;