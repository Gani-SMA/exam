import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', md: '8rem' },
              fontWeight: 700,
              mb: 2,
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            404
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 2,
              opacity: 0.9,
            }}
          >
            Page Not Found
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.8,
              maxWidth: 500,
              mx: 'auto',
            }}
          >
            Oops! The page you're looking for doesn't exist. 
            It might have been moved, deleted, or you entered the wrong URL.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 3,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Go Home
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 3,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Go Back
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default NotFoundPage;