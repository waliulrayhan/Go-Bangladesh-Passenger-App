import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { STORAGE_KEYS } from '../utils/constants';
import { isTokenExpired } from '../utils/jwt';
import { storageService } from '../utils/storage';

/**
 * Hook to monitor token expiration and handle automatic logout
 * This hook checks token validity periodically and when app comes to foreground
 */
export function useTokenExpirationCheck() {
  const { isAuthenticated, handleUnauthorized } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const checkTokenExpiration = async () => {
    if (!isAuthenticated) return;

    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        console.log('🚫 [TOKEN CHECK] No token found - triggering logout');
        await handleUnauthorized();
        return;
      }

      if (isTokenExpired(token)) {
        console.log('⏰ [TOKEN CHECK] Token expired - triggering automatic logout');
        await handleUnauthorized();
        return;
      }

      console.log('✅ [TOKEN CHECK] Token is still valid');
    } catch (error) {
      console.error('💥 [TOKEN CHECK] Error checking token:', error);
      // If we can't check the token, better to logout for security
      await handleUnauthorized();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('🔍 [TOKEN CHECK] Starting token expiration monitoring');

    // Check immediately
    checkTokenExpiration();

    // Set up periodic check every 5 minutes (300000ms)
    intervalRef.current = setInterval(checkTokenExpiration, 300000);

    // Handle app state changes
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 [TOKEN CHECK] App came to foreground - checking token');
        await checkTokenExpiration();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
