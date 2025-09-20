import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2024 GATE/GRE/TOEFL Examination Platform. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              href="/privacy"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Terms of Service
            </Link>
            <Link
              href="/support"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Support
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;