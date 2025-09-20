import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setSidebarOpen } from '../../store/slices/uiSlice';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : `-240px`,
        }}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.default',
            minHeight: 'calc(100vh - 64px - 60px)', // Subtract header and footer height
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;