import { GoBangladeshLogo } from '@/components/GoBangladeshLogo';
import { COLORS } from '@/utils/constants';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent() {
  useEffect(() => {
    const prepare = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        await SplashScreen.hideAsync();
        router.replace('/');
      }
    };

    prepare();
  }, []);

  const { width, height } = Dimensions.get('window');
  const logoSize = Math.min(width, height) * 0.4;

  return (
    <View style={styles.container}>
      <GoBangladeshLogo size={logoSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand.background,
  },
});
