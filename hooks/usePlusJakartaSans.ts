import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { plusJakartaSansFonts } from '../utils/fonts';

export const usePlusJakartaSans = () => {
  const [fontsLoaded, fontError] = useFonts(plusJakartaSansFonts);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      console.log('✅ Plus Jakarta Sans fonts loaded successfully');
      console.log('Available fonts:', Object.keys(plusJakartaSansFonts));
    }
    if (fontError) {
      console.error('❌ Error loading Plus Jakarta Sans fonts:', fontError);
    }
  }, [fontsLoaded, fontError]);

  return {
    fontsLoaded,
    fontError,
    isReady: fontsLoaded && !fontError
  };
};
