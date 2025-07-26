import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { plusJakartaSansFonts } from "../utils/fonts";

// Polyfill for buffer in React Native
import { Buffer } from "buffer";
global.Buffer = Buffer;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(plusJakartaSansFonts);
  const { isAuthenticated, loadUserFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

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

    if (!isAuthenticated && inTabsGroup) {
      router.replace("/");
    } else if (isAuthenticated && !inTabsGroup && !inAuthGroup) {
      // Default to passenger tabs for authenticated users
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, loaded, error]);

  // Show loading state while fonts are loading
  if (!loaded && !error) {
    return null;
  }

  return <Slot />;
}
