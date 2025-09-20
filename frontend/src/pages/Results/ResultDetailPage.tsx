import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ResultDetailPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/results')}
          sx={{ mb: 3 }}
        >
          Back to Results
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Detailed Result Analysis
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Performance Breakdown
              </Typography>
              <Typography variant="body1">
                Detailed analysis coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Score Summary
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 2 }}>
                85%
              </Typography>
              <Chip label="Above Average" color="success" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultDetailPage;