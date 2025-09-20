import React from 'react';
import { Box } from '@mui/material';

interface ExamLayoutProps {
  children: React.ReactNode;
}

const ExamLayout: React.FC<ExamLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};

export default ExamLayout;