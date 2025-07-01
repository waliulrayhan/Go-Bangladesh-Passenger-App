import { COLORS } from '@/utils/constants';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GoBangladeshLogo } from './GoBangladeshLogo';

// Prevent auto-hiding until we're ready
SplashScreen.preventAutoHideAsync();

interface AppSplashScreenProps {
  onReady: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onReady }) => {
  useEffect(() => {
    const prepare = async () => {
      try {
        // Simulate loading time for a smooth transition
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
        onReady();
      }
    };

    prepare();
  }, [onReady]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand.blue} />
      <View style={styles.logoContainer}>
        <GoBangladeshLogo size={150} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
