import Constants from 'expo-constants';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { COLORS } from '../utils/constants';

interface StatusBarManagerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content';
  translucent?: boolean;
}

/**
 * StatusBarManager - Wrapper component to handle status bar consistently
 * across different environments (Expo Go, standalone builds, development)
 */
export const StatusBarManager: React.FC<StatusBarManagerProps> = ({
  children,
  backgroundColor = COLORS.primary,
  barStyle = 'light-content',
  translucent = false,
}) => {
  // Check if we're running in Expo Go vs standalone
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // For Android, we want to ensure the status bar matches our header
  const statusBarConfig = {
    backgroundColor: backgroundColor,
    barStyle: barStyle,
    translucent: Platform.OS === 'ios' ? translucent : false, // Android should not be translucent for our design
    hidden: false,
    animated: true,
  };

  return (
    <>
      <StatusBar {...statusBarConfig} />
      {children}
    </>
  );
};

