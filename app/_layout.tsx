import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { useTokenExpirationCheck } from "../hooks/useTokenExpirationCheck";
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
  const isNavigatingRef = useRef(false);

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

    // Prevent multiple concurrent navigation attempts
    if (isNavigatingRef.current) {
      console.log('🔄 [NAVIGATION] Navigation already in progress, skipping...');
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    console.log(`🔄 [NAVIGATION] Auth: ${isAuthenticated}, Segments: ${segments.join('/')}`);

    if (!isAuthenticated && inTabsGroup) {
      console.log('🔄 [NAVIGATION] User not authenticated, forcefully redirecting to welcome...');
      
      isNavigatingRef.current = true;
      
      // Use navigation service for robust redirect
      setTimeout(async () => {
        try {
          const { navigationService } = await import('../utils/navigationService');
          const success = await navigationService.forceRedirectToWelcome();
          
          if (success) {
            console.log('✅ [NAVIGATION] Navigation service redirect successful');
          } else {
            console.log('❌ [NAVIGATION] Navigation service failed, trying manual redirect');
            
            // Fallback to manual navigation
            router.dismissAll();
            router.replace("/");
          }
        } catch (navError) {
          console.error('💥 [NAVIGATION] Error during forced redirect:', navError);
          
          // Last resort: manual navigation
          try {
            router.dismissAll();
            router.push("/");
          } catch (pushError) {
            console.error('💥 [NAVIGATION] Push also failed:', pushError);
          }
        } finally {
          // Reset navigation flag after a delay
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 1000);
        }
      }, 100);
      
    } else if (isAuthenticated && !inTabsGroup && !inAuthGroup) {
      console.log('🔄 [NAVIGATION] User authenticated, redirecting to tabs...');
      
      isNavigatingRef.current = true;
      
      // Default to passenger tabs for authenticated users
      try {
        router.replace("/(tabs)");
      } catch (navError) {
        console.error('💥 [NAVIGATION] Error redirecting to tabs:', navError);
      } finally {
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }
    }
  }, [isAuthenticated, segments, loaded, error]);

  // Show loading state while fonts are loading
  if (!loaded && !error) {
    return null;
  }

  return <Slot />;
}
