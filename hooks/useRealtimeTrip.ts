import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';

interface RealtimeTripOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Whether to enable real-time polling (default: true) */
  enabled?: boolean;
  /** Whether to poll only when app is in foreground (default: true) */
  onlyWhenActive?: boolean;
  /** Custom callback when trip status changes */
  onTripStatusChange?: (status: 'idle' | 'active' | 'completed', trip: any) => void;
}

/**
 * Custom hook for real-time ongoing trip monitoring
 * Automatically polls the getOnGoingTrip API at regular intervals
 */
export const useRealtimeTrip = (options: RealtimeTripOptions = {}) => {
  const {
    interval = 30000, // 30 seconds default
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

  // Start polling function
  const startPolling = useCallback(() => {
    if (!enabled || !isAuthenticated || !user) {
      return;
    }

    if (onlyWhenActive && appStateRef.current !== 'active') {
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`🔄 [REALTIME TRIP] Starting polling (${interval}ms interval)`);
    
    // Initial check
    checkOngoingTrip();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (onlyWhenActive && appStateRef.current === 'active') {
        checkOngoingTrip();
      } else if (!onlyWhenActive) {
        checkOngoingTrip();
      }
    }, interval);
  }, [enabled, isAuthenticated, user, interval, onlyWhenActive, checkOngoingTrip]);

  // Stop polling function
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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
      // Call custom callback if provided
      if (onTripStatusChange) {
        onTripStatusChange(tripStatus, currentTrip);
      }

      // Adjust polling frequency based on trip status
      if (tripStatus === 'active' && previousTripStatusRef.current !== 'active') {
        // More frequent polling when trip is active (15 seconds)
        if (enabled && interval > 15000) {
          restartPolling();
        }
      } else if (tripStatus === 'idle' && previousTripStatusRef.current === 'active') {
        // Normal polling when no active trip
        restartPolling();
      }

      previousTripStatusRef.current = tripStatus;
    }

    // Check if trip ID changed (new trip started)
    if (previousTripIdRef.current !== currentTripId) {
      previousTripIdRef.current = currentTripId;
    }
  }, [tripStatus, currentTrip, onTripStatusChange, enabled, interval, restartPolling]);

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
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, isAuthenticated, user, startPolling, stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    tripStatus,
    currentTrip,
    startPolling,
    stopPolling,
    restartPolling,
    /** Force check for ongoing trip immediately */
    checkNow: checkOngoingTrip
  };
};