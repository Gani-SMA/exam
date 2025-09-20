import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Quiz,
  Assessment,
  Leaderboard,
  Person,
  Settings,
  EmojiEvents,
  Group,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'persistent' | 'temporary';
}

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    badge: null,
  },
  {
    text: 'Exams',
    icon: <Quiz />,
    path: '/exams',
    badge: null,
  },
  {
    text: 'Results',
    icon: <Assessment />,
    path: '/results',
    badge: null,
  },
  {
    text: 'Leaderboard',
    icon: <Leaderboard />,
    path: '/leaderboard',
    badge: 'Hot',
  },
  {
    text: 'Study Groups',
    icon: <Group />,
    path: '/groups',
    badge: 'New',
  },
  {
    text: 'Achievements',
    icon: <EmojiEvents />,
    path: '/achievements',
    badge: null,
  },
];

const bottomMenuItems = [
  {
    text: 'Profile',
    icon: <Person />,
    path: '/profile',
  },
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Info Section */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          {user?.email}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Level ${user?.stats?.level || 1}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
          <Chip
            label={`${user?.stats?.xp || 0} XP`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
        </Box>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color={item.badge === 'Hot' ? 'error' : 'success'}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mx: 2, my: 1 }} />

        {/* Quick Stats */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            QUICK STATS
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Exams Taken</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.stats?.totalExams || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Avg Score</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.stats?.averageScore || 0}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Streak</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.stats?.streak || 0} days
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <Box>
        <Divider />
        <List>
          {bottomMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;