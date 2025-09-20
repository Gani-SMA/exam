import React from 'react';
import { Box, Typography, Button, Card, CardContent, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

const ExamInterfacePage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Exam Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            GATE Computer Science Mock Test 1
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Time Remaining: 02:45:30
            </Typography>
            <Button variant="contained" color="error">
              End Exam
            </Button>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Question 1 of 65</Typography>
            <Typography variant="body2">Progress: 1.5%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={1.5} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        {/* Question Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Question 1
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Which of the following data structures is most suitable for implementing a priority queue?
            </Typography>
            
            {/* Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['Array', 'Linked List', 'Binary Heap', 'Stack'].map((option, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    p: 2,
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                    },
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" disabled>
            Previous
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined">
              Flag for Review
            </Button>
            <Button variant="contained">
              Next
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default ExamInterfacePage;