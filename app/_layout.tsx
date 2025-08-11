import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
import { useTokenExpirationCheck } from "../hooks/useTokenExpirationCheck";
import { useAuthStore } from "../stores/authStore";
import { COLORS } from "../utils/constants";
import { plusJakartaSansFonts } from "../utils/fonts";

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
          const navigationModule = await import('../utils/navigationService');
          const success = await navigationModule.navigationService.forceRedirectToWelcome();
          
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

  return (
    <>
      <Slot />
      
      {/* Global logout overlay to prevent flash of empty data */}
      {isLoggingOut && (
        <Animated.View 
          entering={FadeInUp.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.globalLogoutOverlay}
        >
          <View style={styles.logoutContent}>
            <Animated.View 
              style={styles.logoutSpinner}
              entering={FadeInUp.duration(400).delay(200)}
            >
              <Ionicons name="log-out-outline" size={40} color={COLORS.primary} />
            </Animated.View>
            <Animated.Text 
              entering={FadeInUp.duration(400).delay(400)}
              style={styles.logoutText}
            >
              Signing you out...
            </Animated.Text>
            <Animated.Text 
              entering={FadeInUp.duration(400).delay(600)}
              style={styles.logoutSubtext}
            >
              Please wait a moment
            </Animated.Text>
          </View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  globalLogoutOverlay: {
    position: 'absolute',
    top: -50, // Extend above to cover status bar
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF', // Completely opaque white
    zIndex: 99999, // Even higher z-index
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1000, // For Android
  },
  logoutContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  logoutSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
  },
  logoutText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutSubtext: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
});
