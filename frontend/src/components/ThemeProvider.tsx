import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { theme, darkTheme } from '../theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme: currentTheme } = useSelector((state: RootState) => state.ui);
  
  const selectedTheme = currentTheme === 'dark' ? darkTheme : theme;

  return (
    <MuiThemeProvider theme={selectedTheme}>
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;