import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

interface UseStatusBarProps {
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content';
  translucent?: boolean;
  hidden?: boolean;
}

/**
 * Hook to manage status bar appearance consistently across platforms and environments
 * This ensures proper status bar handling in Expo Go, standalone builds, and development
 */
export const useStatusBar = ({
  backgroundColor = '#4A90E2',
  barStyle = 'light-content',
  translucent = false,
  hidden = false,
}: UseStatusBarProps = {}) => {
  // Set status bar configuration when component mounts
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(backgroundColor, true);
      StatusBar.setBarStyle(barStyle, true);
      StatusBar.setTranslucent(translucent);
    } else {
      StatusBar.setBarStyle(barStyle, true);
    }
    StatusBar.setHidden(hidden, 'slide');
  }, [backgroundColor, barStyle, translucent, hidden]);

  // Re-apply status bar settings when screen comes into focus
  // This is important for maintaining consistency in tab navigation
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(backgroundColor, true);
        StatusBar.setBarStyle(barStyle, true);
        StatusBar.setTranslucent(translucent);
      } else {
        StatusBar.setBarStyle(barStyle, true);
      }
      StatusBar.setHidden(hidden, 'slide');
    }, [backgroundColor, barStyle, translucent, hidden])
  );
};
