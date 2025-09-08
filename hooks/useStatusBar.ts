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
 * with improved iOS support and consistent primary blue color
 */
export const useStatusBar = ({
  backgroundColor = '#4A90E2', // COLORS.brand.blue
  barStyle = 'light-content',
  translucent = false,
  hidden = false,
}: UseStatusBarProps = {}) => {
  
  // Apply status bar configuration
  const applyStatusBarConfig = useCallback(() => {
    if (Platform.OS === 'android') {
      // Android specific configuration
      StatusBar.setBackgroundColor(backgroundColor, true);
      StatusBar.setBarStyle(barStyle, true);
      StatusBar.setTranslucent(translucent);
    } else {
      // iOS specific configuration - always light content for primary blue
      StatusBar.setBarStyle(barStyle, true);
    }
    StatusBar.setHidden(hidden, 'fade');
  }, [backgroundColor, barStyle, translucent, hidden]);

  // Set status bar configuration when component mounts
  useEffect(() => {
    applyStatusBarConfig();
  }, [applyStatusBarConfig]);

  // Re-apply status bar settings when screen comes into focus
  // This is critical for maintaining consistency in tab navigation
  // and prevents the status bar from reverting to default colors
  useFocusEffect(
    useCallback(() => {
      // Add a small delay to ensure the focus effect takes priority
      const timeoutId = setTimeout(() => {
        applyStatusBarConfig();
      }, 50);

      return () => clearTimeout(timeoutId);
    }, [applyStatusBarConfig])
  );
};
