import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, StatusBar, View } from "react-native";
import { useTokenExpirationCheck } from "../hooks/useTokenExpirationCheck";
import { useAuthStore } from "../stores/authStore";
import { COLORS } from "../utils/constants";
import { plusJakartaSansFonts } from "../utils/fonts";
import WelcomeScreen from "./index";

// Polyfill for buffer in React Native
import { Buffer } from "buffer";
global.Buffer = Buffer;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(plusJakartaSansFonts);
  const { isAuthenticated, loadUserFromStorage, isLoggingOut } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize status bar immediately to prevent flickering
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(COLORS.brand.blue, false);
      StatusBar.setBarStyle('light-content', false);
      StatusBar.setTranslucent(false);
    } else {
      StatusBar.setBarStyle('light-content', false);
    }
    StatusBar.setHidden(false, 'none');
  }, []);

  // Initialize token expiration monitoring
  useTokenExpirationCheck();

  // Load user from storage with token-based refresh
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // First load user from storage
        await loadUserFromStorage();

        console.log("✅ [APP] Session initialization completed");
      } catch (error) {
        console.error("❌ [APP] Error during session initialization:", error);
        // Continue with normal app flow even if session init fails
      }
    };

    initializeSession();
  }, []);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Handle navigation based on authentication
  useEffect(() => {
    // Only proceed with navigation if fonts are loaded
    if (!loaded && !error) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    console.log(`🔄 [NAVIGATION] Auth: ${isAuthenticated}, Segments: ${segments.join('/')}, IsLoggingOut: ${isLoggingOut}`);

    if (isAuthenticated && !inTabsGroup && !inAuthGroup && !isLoggingOut) {
      // User is authenticated but not in tabs - navigate to tabs
      console.log('🔄 [NAVIGATION] User authenticated, redirecting to tabs...');
      
      try {
        router.replace("/(tabs)");
        console.log('✅ [NAVIGATION] Redirect to tabs successful');
      } catch (navError) {
        console.error('💥 [NAVIGATION] Error redirecting to tabs:', navError);
      }
    }
    // Note: Logout navigation is now handled by the welcome screen overlay
    // No need for complex navigation logic since overlay shows the right content
  }, [isAuthenticated, segments, loaded, error, isLoggingOut]);

  // Show loading state while fonts are loading
  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      {/* Show welcome screen overlay if user is logged out but still in tabs */}
      {!isAuthenticated && segments[0] === "(tabs)" && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <WelcomeScreen />
        </View>
      )}
      <Slot />
    </>
  );
}
