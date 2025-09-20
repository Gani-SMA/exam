import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Notifications,
  Security,
  Palette,
  Save,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { toggleTheme } from '../../store/slices/uiSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  const darkMode = theme === 'dark';
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      examReminders: true,
      achievementAlerts: true,
      weeklyReports: false,
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      soundEffects: true,
      volume: 70,
      autoSave: true,
      showHints: true,
    },
    privacy: {
      profileVisibility: 'public',
      showStats: true,
      allowFriendRequests: true,
      dataSharing: false,
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (category: string, setting: string, value: boolean | string | number) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    // Implement save functionality
    // Settings saved successfully
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Settings ⚙️
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Customize your experience and manage your preferences
        </Typography>
      </motion.div>

      <Card>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="General"
              icon={<Palette />}
              iconPosition="start"
            />
            <Tab
              label="Notifications"
              icon={<Notifications />}
              iconPosition="start"
            />
            <Tab
              label="Privacy"
              icon={<Security />}
              iconPosition="start"
            />
          </Tabs>

          {/* General Settings */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Appearance */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Appearance
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={() => dispatch(toggleTheme())}
                    />
                  }
                  label="Dark Mode"
                />
              </Box>

              <Divider />

              {/* Language & Region */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Language & Region
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.preferences.language}
                      label="Language"
                      onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.preferences.timezone}
                      label="Timezone"
                      onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="EST">Eastern Time</MenuItem>
                      <MenuItem value="PST">Pacific Time</MenuItem>
                      <MenuItem value="IST">India Standard Time</MenuItem>
                      <MenuItem value="GMT">Greenwich Mean Time</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Divider />

              {/* Audio Settings */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Audio Settings
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.soundEffects}
                        onChange={(e) => handleSettingChange('preferences', 'soundEffects', e.target.checked)}
                      />
                    }
                    label="Sound Effects"
                  />
                </Box>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Volume: {settings.preferences.volume}%
                  </Typography>
                  <Slider
                    value={settings.preferences.volume}
                    onChange={(e, value) => handleSettingChange('preferences', 'volume', Array.isArray(value) ? value[0] : value)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    disabled={!settings.preferences.soundEffects}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Study Preferences */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Study Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.autoSave}
                        onChange={(e) => handleSettingChange('preferences', 'autoSave', e.target.checked)}
                      />
                    }
                    label="Auto-save progress"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.showHints}
                        onChange={(e) => handleSettingChange('preferences', 'showHints', e.target.checked)}
                      />
                    }
                    label="Show hints during exams"
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          {/* Notification Settings */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                Manage how you receive notifications about your exam progress and platform updates.
              </Alert>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Email Notifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.email}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      />
                    }
                    label="Email notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.examReminders}
                        onChange={(e) => handleSettingChange('notifications', 'examReminders', e.target.checked)}
                      />
                    }
                    label="Exam reminders"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.weeklyReports}
                        onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                      />
                    }
                    label="Weekly progress reports"
                  />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Push Notifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.push}
                        onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                      />
                    }
                    label="Push notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.achievementAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'achievementAlerts', e.target.checked)}
                      />
                    }
                    label="Achievement alerts"
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          {/* Privacy Settings */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="warning">
                These settings control how your information is shared and displayed to other users.
              </Alert>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Profile Visibility
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Profile Visibility</InputLabel>
                  <Select
                    value={settings.privacy.profileVisibility}
                    label="Profile Visibility"
                    onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="friends">Friends Only</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Data Sharing
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.showStats}
                        onChange={(e) => handleSettingChange('privacy', 'showStats', e.target.checked)}
                      />
                    }
                    label="Show my statistics on leaderboard"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.allowFriendRequests}
                        onChange={(e) => handleSettingChange('privacy', 'allowFriendRequests', e.target.checked)}
                      />
                    }
                    label="Allow friend requests"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.dataSharing}
                        onChange={(e) => handleSettingChange('privacy', 'dataSharing', e.target.checked)}
                      />
                    }
                    label="Share anonymous usage data for platform improvement"
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveSettings}
              size="large"
            >
              Save Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;