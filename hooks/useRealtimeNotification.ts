import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';
import { useNotificationStore } from '../stores/notificationStore';

interface RealtimeNotificationOptions {
  /** Whether to enable real-time polling (default: true) */
  enabled?: boolean;
  /** Whether to poll only when app is in foreground (default: true) */
  onlyWhenActive?: boolean;
  /** Custom callback when new notification arrives */
  onNewNotification?: (unreadCount: number) => void;
}

/**
 * Custom hook for real-time notification monitoring
 * Automatically polls for new notifications at 30 second intervals
 * Syncs with trip polling to maintain consistent API load
 */
export const useRealtimeNotification = (options: RealtimeNotificationOptions = {}) => {
  const {
    enabled = true,
    onlyWhenActive = true,
    onNewNotification
  } = options;

  const { checkUnreadCount, unreadCount } = useNotificationStore();
  const { user, isAuthenticated } = useAuthStore();
  const { card } = useCardStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const previousUnreadCountRef = useRef<number>(unreadCount);
  const isPollingRef = useRef<boolean>(false);
  const lastCallTimeRef = useRef<number>(0);

  // Fixed polling interval (30 seconds - matches trip polling for active state)
  const POLLING_INTERVAL = 30000;

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    appStateRef.current = nextAppState;

    if (onlyWhenActive) {
      if (nextAppState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    }
  }, [onlyWhenActive]);

  // Debounced API call to prevent multiple rapid calls
  const debouncedCheckUnreadCount = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const minInterval = 10000; // Minimum 10 seconds between calls

    if (timeSinceLastCall < minInterval) {
      console.log(`🚫 [REALTIME NOTIFICATION] Skipping API call - too soon since last call (${Math.round(timeSinceLastCall / 1000)}s ago, min ${minInterval / 1000}s)`);
      return;
    }

    lastCallTimeRef.current = now;
    console.log('✅ [REALTIME NOTIFICATION] Checking for new notifications');
    checkUnreadCount();
  }, [checkUnreadCount]);

  // Start polling function
  const startPolling = useCallback(() => {
    // Early return conditions
    if (!enabled || !isAuthenticated || !user || !card?.cardNumber) {
      console.log('🛑 [REALTIME NOTIFICATION] Not starting polling - conditions not met:', {
        enabled,
        isAuthenticated,
        hasUser: !!user,
        hasCard: !!card?.cardNumber
      });
      return;
    }

    if (onlyWhenActive && appStateRef.current !== 'active') {
      console.log('🛑 [REALTIME NOTIFICATION] Not starting polling - app not active');
      return;
    }

    if (isPollingRef.current) {
      console.log('🔄 [REALTIME NOTIFICATION] Already polling, skipping start');
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`🔄 [REALTIME NOTIFICATION] Starting polling (${POLLING_INTERVAL}ms interval)`);
    
    isPollingRef.current = true;
    
    // Initial check (debounced)
    debouncedCheckUnreadCount();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (onlyWhenActive && appStateRef.current === 'active') {
        debouncedCheckUnreadCount();
      } else if (!onlyWhenActive) {
        debouncedCheckUnreadCount();
      }
    }, POLLING_INTERVAL);
  }, [enabled, isAuthenticated, user, card?.cardNumber, onlyWhenActive, debouncedCheckUnreadCount]);

  // Stop polling function
  const stopPolling = useCallback(() => {
    console.log('🛑 [REALTIME NOTIFICATION] Stopping polling');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Restart polling function
  const restartPolling = useCallback(() => {
    stopPolling();
    setTimeout(() => startPolling(), 100); // Small delay to ensure cleanup
  }, [stopPolling, startPolling]);

  // Effect to handle unread count changes
  useEffect(() => {
    // Check if unread count changed
    if (previousUnreadCountRef.current !== unreadCount) {
      console.log(`🔔 [REALTIME NOTIFICATION] Unread count changed: ${previousUnreadCountRef.current} → ${unreadCount}`);
      
      // Call custom callback if provided and count increased
      if (onNewNotification && unreadCount > previousUnreadCountRef.current) {
        onNewNotification(unreadCount);
      }

      previousUnreadCountRef.current = unreadCount;
    }
  }, [unreadCount, onNewNotification]);

  // Set up app state listener
  useEffect(() => {
    if (onlyWhenActive) {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription?.remove();
    }
  }, [handleAppStateChange, onlyWhenActive]);

  // Main effect to start/stop polling based on dependencies
  useEffect(() => {
    if (enabled && isAuthenticated && user && card?.cardNumber) {
      // Add a small delay after login to prevent race conditions with initial data loading
      const startDelay = 3000; // 3 second delay (slightly after trip polling)
      
      console.log('🔔 [REALTIME NOTIFICATION] Scheduling polling start after authentication');
      const timeoutId = setTimeout(() => {
        startPolling();
      }, startDelay);

      return () => {
        clearTimeout(timeoutId);
        stopPolling();
      };
    } else {
      stopPolling();
    }
  }, [enabled, isAuthenticated, user, card?.cardNumber, startPolling, stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    unreadCount,
    startPolling,
    stopPolling,
    restartPolling,
    /** Force check for new notifications immediately */
    checkNow: debouncedCheckUnreadCount
  };
};
