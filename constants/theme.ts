import { StyleSheet } from 'react-native';

export const Colors = {
  primary: '#1d1d1f', // Elegant Black
  primaryLight: 'rgba(29, 29, 31, 0.1)',
  danger: '#1d1d1f', // Monochrome Danger
  success: '#1d1d1f', // Monochrome Success
  warning: '#86868b',
  
  // Light Theme (Premium Monochrome)
  light: {
    background: '#ffffff',
    panel: '#ffffff',
    panelSecondary: '#f5f5f7',
    text: '#1d1d1f',
    textMuted: '#86868b',
    border: '#1d1d1f', // Black borders for luxury feel
  },
  
  // Dark Theme
  dark: {
    background: '#000000',
    panel: '#1c1c1e',
    panelSecondary: '#2c2c2e',
    text: '#ffffff',
    textMuted: '#8e8e93',
    border: '#38383a',
  },
};

export const GlassStyles = (isDark = true) => ({
  panel: {
    backgroundColor: isDark ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  blurIntensity: isDark ? 80 : 50,
});
