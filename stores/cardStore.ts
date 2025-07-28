import { create } from 'zustand';
import { apiService, RechargeTransaction, TripTransaction } from '../services/api';
import { Bus, Card, PaginationState, Trip } from '../types';
import { useAuthStore } from './authStore';

interface CardState {
  card: Card | null;
  tripTransactions: TripTransaction[];
  rechargeTransactions: RechargeTransaction[];
  buses: Bus[];
  isLoading: boolean;
  error: string | null;
  tripStatus: 'idle' | 'active' | 'completed';
  currentTrip: Trip | null;
  tripPagination: PaginationState;
  rechargePagination: PaginationState;
  lastDataLoadTime: Date | null;
  lastTripCheckTime: Date | null;
  tripCheckCount: number;

  loadCardDetails: () => Promise<void>;
  loadTripHistory: (pageNo?: number, reset?: boolean) => Promise<void>;
  loadRechargeHistory: (pageNo?: number, reset?: boolean) => Promise<void>;
  loadBuses: () => Promise<void>;
  tapIn: (cardNumber: string, busId: number) => Promise<boolean>;
  tapOut: (cardNumber: string) => Promise<boolean>;
  recharge: (cardNumber: string, amount: number) => Promise<boolean>;
  realTapOut: () => Promise<boolean>;
  forceTapOut: () => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  loadMoreTripHistory: () => Promise<void>;
  loadMoreRechargeHistory: () => Promise<void>;
  checkOngoingTrip: () => Promise<void>;
  clearAllCardData: () => Promise<void>;
  refreshCardData: () => Promise<void>;
  forceRefreshData: () => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  card: null,
  tripTransactions: [],
  rechargeTransactions: [],
  buses: [],
  isLoading: false,
  error: null,
  tripStatus: 'idle',
  currentTrip: null,
  lastDataLoadTime: null,
  lastTripCheckTime: null,
  tripCheckCount: 0,
  tripPagination: {
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
  },
  rechargePagination: {
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
  },

  loadCardDetails: async () => {
    const { lastDataLoadTime } = get();

    // Prevent excessive API calls - only reload if it's been more than 30 seconds
    if (lastDataLoadTime && (Date.now() - lastDataLoadTime.getTime()) < 30000) {
      console.log('🔒 [CARD] Skipping card details reload - recent data available');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Get fresh user data from auth store (NO MOCK DATA)
      const authStore = useAuthStore.getState();
      const user = authStore.user;

      if (!user) {
        throw new Error('No user data available. Please login again.');
      }

      // Create fresh card object from current user data (NO MOCK DATA)
      const card: Card = {
        id: user.id ? parseInt(user.id.toString()) : Date.now(),
        cardNumber: user.cardNumber || 'GB-0000000000', // Default for new users without card
        userId: parseInt(user.id?.toString() || '1'),
        balance: typeof user.balance === 'number' ? user.balance : 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      set({
        card,
        isLoading: false,
        lastDataLoadTime: new Date()
      });

      // Check for ongoing trip after loading fresh card details
      get().checkOngoingTrip();

    } catch (error: any) {
      console.error('❌ [CARD] Error loading card details:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load card details'
      });
    }
  },

  loadTripHistory: async (pageNo: number = 1, reset: boolean = false) => {
    const { tripPagination, tripTransactions } = get();

    // Skip loading if we already have recent data and it's not a forced reset
    if (!reset && tripTransactions.length > 0 && pageNo === 1) {
      console.log('🔒 [TRIP HISTORY] Skipping reload - recent data available');
      return;
    }

    if (reset) {
      set({
        isLoading: true,
        error: null,
        tripPagination: {
          ...tripPagination,
          currentPage: 1,
          hasMore: true,
          totalLoaded: 0
        }
      });
    } else {
      set({
        tripPagination: {
          ...tripPagination,
          isLoadingMore: true
        }
      });
    }

    try {
      // Get user ID from auth store
      const authStore = useAuthStore.getState();
      const user = authStore.user;

      const userId = user?.id?.toString();

      if (!userId) {
        throw new Error('No user ID available. Please login again.');
      }

      console.log('🚌 [TRIP HISTORY] Loading trip history for user:', userId);

      // Use the new trip history API
      const response = await apiService.getPassengerTripHistory(userId, pageNo, tripPagination.pageSize);

      if (response.data.isSuccess) {
        const newTripTransactions = response.data.content || [];
        console.log('✅ [TRIP HISTORY] Loaded:', newTripTransactions.length, 'trip transactions');

        const hasMore = newTripTransactions.length === tripPagination.pageSize;

        set({
          tripTransactions: reset ? newTripTransactions : [...get().tripTransactions, ...newTripTransactions],
          isLoading: false,
          tripPagination: {
            ...tripPagination,
            currentPage: pageNo,
            hasMore,
            isLoadingMore: false,
            totalLoaded: reset ? newTripTransactions.length : tripPagination.totalLoaded + newTripTransactions.length
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to load trip history');
      }
    } catch (error: any) {
      console.error('❌ [TRIP HISTORY] Error loading trip history:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load trip history',
        tripPagination: {
          ...tripPagination,
          isLoadingMore: false
        }
      });
    }
  },

  loadRechargeHistory: async (pageNo: number = 1, reset: boolean = false) => {
    const { rechargePagination, rechargeTransactions } = get();

    // Skip loading if we already have recent data and it's not a forced reset
    if (!reset && rechargeTransactions.length > 0 && pageNo === 1) {
      console.log('🔒 [RECHARGE HISTORY] Skipping reload - recent data available');
      return;
    }

    if (reset) {
      set({
        isLoading: true,
        error: null,
        rechargePagination: {
          ...rechargePagination,
          currentPage: 1,
          hasMore: true,
          totalLoaded: 0
        }
      });
    } else {
      set({
        rechargePagination: {
          ...rechargePagination,
          isLoadingMore: true
        }
      });
    }

    try {
      // Get user ID from auth store
      const authStore = useAuthStore.getState();
      const user = authStore.user;

      const userId = user?.id?.toString();

      if (!userId) {
        throw new Error('No user ID available. Please login again.');
      }

      console.log('� [RECHARGE HISTORY] Loading recharge history for user:', userId);

      // Use the new recharge history API
      const response = await apiService.getPassengerRechargeHistory(userId, pageNo, rechargePagination.pageSize);

      if (response.data.isSuccess) {
        const newRechargeTransactions = response.data.content || [];
        console.log('✅ [RECHARGE HISTORY] Loaded:', newRechargeTransactions.length, 'recharge transactions');

        const hasMore = newRechargeTransactions.length === rechargePagination.pageSize;

        set({
          rechargeTransactions: reset ? newRechargeTransactions : [...get().rechargeTransactions, ...newRechargeTransactions],
          isLoading: false,
          rechargePagination: {
            ...rechargePagination,
            currentPage: pageNo,
            hasMore,
            isLoadingMore: false,
            totalLoaded: reset ? newRechargeTransactions.length : rechargePagination.totalLoaded + newRechargeTransactions.length
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to load recharge history');
      }
    } catch (error: any) {
      console.error('❌ [RECHARGE HISTORY] Error loading recharge history:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load recharge history',
        rechargePagination: {
          ...rechargePagination,
          isLoadingMore: false
        }
      });
    }
  },

  loadMoreTripHistory: async () => {
    const { tripPagination } = get();
    if (tripPagination.hasMore && !tripPagination.isLoadingMore) {
      await get().loadTripHistory(tripPagination.currentPage + 1, false);
    }
  },

  loadMoreRechargeHistory: async () => {
    const { rechargePagination } = get();
    if (rechargePagination.hasMore && !rechargePagination.isLoadingMore) {
      await get().loadRechargeHistory(rechargePagination.currentPage + 1, false);
    }
  },

  loadBuses: async () => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with real API call when bus endpoints are available
      // For now, return empty array to avoid crashes
      const buses: Bus[] = [];
      set({ buses, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load buses'
      });
    }
  },

  tapIn: async (cardNumber: string, busId: number) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with real API call when tap-in endpoints are available
      // For now, simulate success to avoid crashes
      console.log('Tap-in simulated for card:', cardNumber, 'bus:', busId);
      set({ isLoading: false, tripStatus: 'active' });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Tap in failed'
      });
      return false;
    }
  },

  tapOut: async (cardNumber: string) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with real API call when tap-out endpoints are available
      // For now, simulate success to avoid crashes
      console.log('Tap-out simulated for card:', cardNumber);
      set({ isLoading: false, tripStatus: 'completed', currentTrip: null });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Tap out failed'
      });
      return false;
    }
  },

  recharge: async (cardNumber: string, amount: number) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with real API call when recharge endpoints are available
      // For now, simulate success to avoid crashes
      console.log('Recharge simulated for card:', cardNumber, 'amount:', amount);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Recharge failed'
      });
      return false;
    }
  },

  realTapOut: async () => {
    console.log('🔄 [TRIP] Attempting real tap out...');

    try {
      const success = await apiService.tapOutTrip();

      if (success) {
        console.log('✅ [TRIP] Tap out successful, updating state');
        set({
          tripStatus: 'idle',
          currentTrip: null
        });

        // Refresh card details and history after tap out
        get().loadCardDetails();
        get().loadTripHistory(1, true);

        return true;
      } else {
        console.log('❌ [TRIP] Tap out failed');
        set({ error: 'Failed to tap out. Please try again.' });
        return false;
      }
    } catch (error: any) {
      console.error('💥 [TRIP] Error during tap out:', error.message);
      set({ error: error.message || 'Failed to tap out. Please try again.' });
      return false;
    }
  },

  forceTapOut: async () => {
    console.log('🔄 [FORCE TAP OUT] Attempting force tap out...');

    try {
      const state = get();
      const { user } = useAuthStore.getState();

      if (!state.currentTrip || !user) {
        console.log('❌ [FORCE TAP OUT] No active trip or user found');
        return {
          success: false,
          message: 'No active trip found or user not logged in'
        };
      }

      // Debug user data structure
      console.log('🔍 [FORCE TAP OUT] User data available:', {
        id: user.id,
        passengerId: user.passengerId,
        cardNumber: user.cardNumber,
        userType: user.userType,
        name: user.name
      });

      // Use user.cardNumber for the new API
      const cardNumber = user.cardNumber;

      if (!cardNumber) {
        console.log('❌ [FORCE TAP OUT] No card number found for user');
        return {
          success: false,
          message: 'Card number not found. Please contact support.'
        };
      }

      console.log('💡 [FORCE TAP OUT] Using cardNumber:', cardNumber);

      const tripId = state.currentTrip.tripId;
      const sessionId = state.currentTrip.sessionId;

      console.log('📋 [FORCE TAP OUT] Trip details:', {
        cardNumber,
        tripId,
        sessionId,
        currentTripData: state.currentTrip
      });

      // Ensure all required IDs are available
      if (!cardNumber || !tripId || !sessionId) {
        console.log('❌ [FORCE TAP OUT] Missing required IDs:', { cardNumber, tripId, sessionId });
        return {
          success: false,
          message: 'Missing required trip information. Please try again.'
        };
      }

      const result = await apiService.forceTripStop(cardNumber, tripId, sessionId);

      if (result.success) {
        console.log('✅ [FORCE TAP OUT] Force tap out successful, updating state');
        set({
          tripStatus: 'idle',
          currentTrip: null
        });

        // Refresh card details and history after force tap out
        get().loadCardDetails();
        get().loadTripHistory(1, true);

        return {
          success: true,
          message: result.message
        };
      } else {
        console.log('❌ [FORCE TAP OUT] Force tap out failed');
        set({ error: result.message });
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error: any) {
      console.error('💥 [FORCE TAP OUT] Error during force tap out:', error.message);
      const errorMessage = error.message || 'Failed to force tap out. Please try again.';
      set({ error: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  clearError: () => set({ error: null }),

  checkOngoingTrip: async () => {
    const { lastTripCheckTime, tripCheckCount } = get();
    const now = new Date();
    
    console.log('🔄 [TRIP] Checking for ongoing trip...');

    try {
      // Update check metadata
      set({
        lastTripCheckTime: now,
        tripCheckCount: tripCheckCount + 1
      });

      const ongoingTrip = await apiService.getOnGoingTrip();

      if (ongoingTrip && ongoingTrip.isRunning) {
        console.log('✅ [TRIP] Ongoing trip found, updating state');
        
        const previousStatus = get().tripStatus;
        
        set({
          tripStatus: 'active',
          currentTrip: ongoingTrip as Trip
        });

        // Log status changes
        if (previousStatus !== 'active') {
          console.log('🚨 [TRIP] Trip status changed to active');
        }
      } else {
        console.log('ℹ️ [TRIP] No ongoing trip found');
        
        const previousStatus = get().tripStatus;
        
        set({
          tripStatus: 'idle',  
          currentTrip: null
        });

        // Log when trip ends
        if (previousStatus === 'active') {
          console.log('🏁 [TRIP] Trip ended');
        }
      }
    } catch (error: any) {
      console.error('💥 [TRIP] Error checking ongoing trip:', error.message);
      
      // Don't set error state for trip checks as this is a background operation
      // But if we had an active trip and now we can't check, keep the state
      const currentState = get();
      if (currentState.tripStatus !== 'active') {
        set({
          tripStatus: 'idle',
          currentTrip: null
        });
      }
    }
  },

  clearAllCardData: async () => {
    try {
      // Clear card-related storage
      const keysToRemove = [
        'card_data',
        'trip_data',
        'transaction_cache',
        'history_cache',
        'bus_data_cache'
      ];

      const { storageService } = await import('../utils/storage');
      await Promise.all(
        keysToRemove.map(key => storageService.removeItem(key))
      );

      // Reset card store state
      set({
        card: null,
        tripTransactions: [],
        rechargeTransactions: [],
        buses: [],
        tripStatus: 'idle',
        currentTrip: null,
        error: null,
        tripPagination: {
          currentPage: 1,
          pageSize: 10,
          hasMore: true,
          isLoadingMore: false,
          totalLoaded: 0,
        },
        rechargePagination: {
          currentPage: 1,
          pageSize: 10,
          hasMore: true,
          isLoadingMore: false,
          totalLoaded: 0,
        }
      });

      console.log('✅ [CARD] All card data cleared successfully');
    } catch (error) {
      console.error('❌ [CARD] Error clearing card data:', error);
    }
  },

  refreshCardData: async () => {
    try {
      // Clear existing data first
      await get().clearAllCardData();

      // Load fresh data (NO CACHE, NO MOCK DATA)
      await Promise.all([
        get().loadCardDetails(),
        get().loadTripHistory(1, true),
        get().loadRechargeHistory(1, true),
        get().loadBuses()
      ]);

      // Check for ongoing trips with fresh data
      await get().checkOngoingTrip();

      console.log('✅ [CARD] All card data refreshed successfully');
    } catch (error) {
      console.error('❌ [CARD] Error refreshing card data:', error);
    }
  },

  forceRefreshData: async () => {
    try {
      // Reset lastDataLoadTime to force fresh API calls
      set({ lastDataLoadTime: null });

      // Force reload all data
      await Promise.all([
        get().loadCardDetails(),
        get().loadTripHistory(1, true),
        get().loadRechargeHistory(1, true),
        get().checkOngoingTrip()
      ]);

      console.log('✅ [CARD] Force refresh completed successfully');
    } catch (error) {
      console.error('❌ [CARD] Error during force refresh:', error);
    }
  }
}));
