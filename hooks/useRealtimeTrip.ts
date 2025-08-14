import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';

interface RealtimeTripOptions {
  /** Whether to enable real-time polling (default: true) */
  enabled?: boolean;
  /** Whether to poll only when app is in foreground (default: true) */
  onlyWhenActive?: boolean;
  /** Custom callback when trip status changes */
  onTripStatusChange?: (status: 'idle' | 'active' | 'completed', trip: any) => void;
}

/**
 * Custom hook for real-time ongoing trip monitoring
 * Automatically polls the getOnGoingTrip API at appropriate intervals:
 * - 1 minute when no trip is running
 * - 30 seconds when a trip is active
 */
export const useRealtimeTrip = (options: RealtimeTripOptions = {}) => {
  const {
    enabled = true,
    onlyWhenActive = true,
    onTripStatusChange
  } = options;

  const { checkOngoingTrip, tripStatus, currentTrip } = useCardStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const previousTripStatusRef = useRef<string>(tripStatus);
  const previousTripIdRef = useRef<string | null>(currentTrip?.tripId || null);
  const isPollingRef = useRef<boolean>(false);
  const lastCallTimeRef = useRef<number>(0);

  // Get appropriate interval based on trip status
  const getPollingInterval = useCallback(() => {
    return tripStatus === 'active' ? 30000 : 60000; // 30s for active trip, 1min for idle
  }, [tripStatus]);

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
  const debouncedCheckOngoingTrip = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const minInterval = 10000; // Minimum 10 seconds between calls (increased from 5s)

    if (timeSinceLastCall < minInterval) {
      console.log(`🚫 [REALTIME TRIP] Skipping API call - too soon since last call (${Math.round(timeSinceLastCall / 1000)}s ago, min ${minInterval / 1000}s)`);
      return;
    }

    lastCallTimeRef.current = now;
    console.log('✅ [REALTIME TRIP] Making API call to check ongoing trip');
    checkOngoingTrip();
  }, [checkOngoingTrip]);

  // Start polling function
  const startPolling = useCallback(() => {
    // Early return conditions
    if (!enabled || !isAuthenticated || !user) {
      console.log('🛑 [REALTIME TRIP] Not starting polling - conditions not met:', {
        enabled,
        isAuthenticated,
        hasUser: !!user
      });
      return;
    }

    if (onlyWhenActive && appStateRef.current !== 'active') {
      console.log('🛑 [REALTIME TRIP] Not starting polling - app not active');
      return;
    }

    if (isPollingRef.current) {
      console.log('🔄 [REALTIME TRIP] Already polling, skipping start');
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const currentInterval = getPollingInterval();
    console.log(`🔄 [REALTIME TRIP] Starting polling (${currentInterval}ms interval, status: ${tripStatus})`);
    
    isPollingRef.current = true;
    
    // Initial check (debounced)
    debouncedCheckOngoingTrip();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (onlyWhenActive && appStateRef.current === 'active') {
        debouncedCheckOngoingTrip();
      } else if (!onlyWhenActive) {
        debouncedCheckOngoingTrip();
      }
    }, currentInterval);
  }, [enabled, isAuthenticated, user, onlyWhenActive, getPollingInterval, tripStatus, debouncedCheckOngoingTrip]);

  // Stop polling function
  const stopPolling = useCallback(() => {
    console.log('🛑 [REALTIME TRIP] Stopping polling');
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

  // Effect to handle trip status changes
  useEffect(() => {
    const currentTripId = currentTrip?.tripId || null;
    
    // Check if trip status changed
    if (previousTripStatusRef.current !== tripStatus) {
      console.log(`🔄 [REALTIME TRIP] Trip status changed: ${previousTripStatusRef.current} → ${tripStatus}`);
      
      // Call custom callback if provided
      if (onTripStatusChange) {
        onTripStatusChange(tripStatus, currentTrip);
      }

      // Restart polling with new interval based on trip status
      if (tripStatus !== previousTripStatusRef.current && isPollingRef.current) {
        console.log('🔄 [REALTIME TRIP] Restarting polling due to status change');
        restartPolling();
      }

      previousTripStatusRef.current = tripStatus;
    }

    // Check if trip ID changed (new trip started)
    if (previousTripIdRef.current !== currentTripId) {
      console.log(`🔄 [REALTIME TRIP] Trip ID changed: ${previousTripIdRef.current} → ${currentTripId}`);
      previousTripIdRef.current = currentTripId;
    }
  }, [tripStatus, currentTrip, onTripStatusChange, restartPolling]);

  // Set up app state listener
  useEffect(() => {
    if (onlyWhenActive) {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription?.remove();
    }
  }, [handleAppStateChange, onlyWhenActive]);

  // Main effect to start/stop polling based on dependencies
  useEffect(() => {
    if (enabled && isAuthenticated && user) {
      // Add a small delay after login to prevent race conditions with initial data loading
      const startDelay = 2000; // 2 second delay
      
      console.log('🔄 [REALTIME TRIP] Scheduling polling start after authentication');
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
  }, [enabled, isAuthenticated, user, startPolling, stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    tripStatus,
    currentTrip,
    startPolling,
    stopPolling,
    restartPolling,
    /** Force check for ongoing trip immediately */
    checkNow: debouncedCheckOngoingTrip
  };
};