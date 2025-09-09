import { create } from 'zustand';
import { apiService, RechargeTransaction, TripTransaction } from '../services/api';
import { Card, PaginationState, Trip } from '../types';
import { nowISO, timestamp } from '../utils/dateTime';
import { useAuthStore } from './authStore';

interface CardState {
  // State
  card: Card | null;
  tripTransactions: TripTransaction[];
  rechargeTransactions: RechargeTransaction[];
  recentActivity: any[]; // Using any[] to handle the flexible transaction structure
  currentTrip: Trip | null;
  tripStatus: 'idle' | 'active' | 'completed';
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Trip pagination
  tripPage: number;
  tripHasMore: boolean;
  tripPagination: PaginationState;

  // Recharge pagination
  rechargePage: number;
  rechargeHasMore: boolean;
  rechargePagination: PaginationState;

  // Actions
  loadCardDetails: () => Promise<void>;
  loadTripHistory: (pageNo?: number, reset?: boolean) => Promise<void>;
  loadRechargeHistory: (pageNo?: number, reset?: boolean) => Promise<void>;
  loadAllHistory: (reset?: boolean) => Promise<void>;
  loadRecentActivity: () => Promise<void>;
  loadMoreTripHistory: () => Promise<void>;
  loadMoreRechargeHistory: () => Promise<void>;
  checkOngoingTrip: () => Promise<void>;
  tapOut: () => Promise<boolean>;
  forceTapOut: () => Promise<boolean>;
  clearError: () => void;
  refreshData: () => Promise<void>;
  clearAllCardData: () => Promise<void>;
}

const formatError = (error: any): string => {
  if (error.response?.data?.data?.message) {
    return error.response.data.data.message;
  }
  return error.message || 'An error occurred';
};

export const useCardStore = create<CardState>((set, get) => ({
  // Initial state
  card: null,
  tripTransactions: [],
  rechargeTransactions: [],
  recentActivity: [],
  currentTrip: null,
  tripStatus: 'idle',
  isLoading: false,
  isRefreshing: false,
  error: null,
  tripPage: 1,
  tripHasMore: true,
  tripPagination: {
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
    totalCount: 0,
  },
  rechargePage: 1,
  rechargeHasMore: true,
  rechargePagination: {
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
    totalCount: 0,
  },

  // Load card details (for compatibility)
  loadCardDetails: async () => {
    const user = useAuthStore.getState().user;
    if (user) {
      const card: Card = {
        id: user.id ? parseInt(user.id.toString()) : timestamp(),
        cardNumber: user.cardNumber || '',
        userId: parseInt(user.id?.toString() || '1'),
        balance: typeof user.balance === 'number' ? user.balance : 0,
        isActive: true,
        createdAt: nowISO()
      };
      set({ card });
    }
  },

  // Load trip history (for pagination)
  loadTripHistory: async (pageNo = 1, reset = false) => {
    const { tripTransactions, tripPage, tripPagination } = get();

    if (reset) {
      if (tripTransactions.length > 0) {
        set({ isRefreshing: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }
    } else {
      if (tripTransactions.length === 0) {
        set({ isLoading: true, error: null });
      } else {
        set({
          tripPagination: { ...tripPagination, isLoadingMore: true }
        });
      }
    }

    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      const pageToLoad = reset ? 1 : (pageNo || tripPage);
      const response = await apiService.getPassengerTripHistory(
        user.id.toString(),
        pageToLoad,
        10
      );

      const newTransactions = response.data || [];
      const totalCount = response.rowCount || 0;
      const hasMore = newTransactions.length === 10;
      const currentTotal = reset ? newTransactions.length : tripPagination.totalLoaded + newTransactions.length;

      set({
        tripTransactions: reset ? newTransactions : [...tripTransactions, ...newTransactions],
        tripPage: pageToLoad,
        tripHasMore: hasMore,
        tripPagination: {
          ...tripPagination,
          currentPage: pageToLoad,
          hasMore,
          isLoadingMore: false,
          totalLoaded: currentTotal,
          totalCount
        },
        isLoading: false,
        isRefreshing: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: formatError(error),
        tripPagination: { ...get().tripPagination, isLoadingMore: false }
      });
    }
  },

  // Load recharge history (for pagination)
  loadRechargeHistory: async (pageNo = 1, reset = false) => {
    const { rechargeTransactions, rechargePage, rechargePagination } = get();

    if (reset) {
      if (rechargeTransactions.length > 0) {
        set({ isRefreshing: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }
    } else {
      if (rechargeTransactions.length === 0) {
        set({ isLoading: true, error: null });
      } else {
        set({
          rechargePagination: { ...rechargePagination, isLoadingMore: true }
        });
      }
    }

    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      const pageToLoad = reset ? 1 : (pageNo || rechargePage);
      const response = await apiService.getPassengerRechargeHistory(
        user.id.toString(),
        pageToLoad,
        10
      );

      const newTransactions = response.data || [];
      const totalCount = response.rowCount || 0;
      const hasMore = newTransactions.length === 10;
      const currentTotal = reset ? newTransactions.length : rechargePagination.totalLoaded + newTransactions.length;

      set({
        rechargeTransactions: reset ? newTransactions : [...rechargeTransactions, ...newTransactions],
        rechargePage: pageToLoad,
        rechargeHasMore: hasMore,
        rechargePagination: {
          ...rechargePagination,
          currentPage: pageToLoad,
          hasMore,
          isLoadingMore: false,
          totalLoaded: currentTotal,
          totalCount
        },
        isLoading: false,
        isRefreshing: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: formatError(error),
        rechargePagination: { ...get().rechargePagination, isLoadingMore: false }
      });
    }
  },

  // Load all history (trip and recharge) - optimized for concurrent loading
  loadAllHistory: async (reset = false) => {
    const { tripTransactions, rechargeTransactions } = get();
    
    // Set loading state based on whether this is initial load or refresh
    if (reset) {
      if (tripTransactions.length > 0 || rechargeTransactions.length > 0) {
        set({ isRefreshing: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      // Load both trip and recharge history concurrently
      const [tripResponse, rechargeResponse] = await Promise.all([
        apiService.getPassengerTripHistory(user.id.toString(), 1, 10),
        apiService.getPassengerRechargeHistory(user.id.toString(), 1, 10)
      ]);

      const newTripTransactions = tripResponse.data || [];
      const newRechargeTransactions = rechargeResponse.data || [];
      
      // Update both sets of data
      set({
        tripTransactions: newTripTransactions,
        rechargeTransactions: newRechargeTransactions,
        tripPage: 1,
        rechargePage: 1,
        tripHasMore: newTripTransactions.length === 10,
        rechargeHasMore: newRechargeTransactions.length === 10,
        tripPagination: {
          ...get().tripPagination,
          currentPage: 1,
          hasMore: newTripTransactions.length === 10,
          isLoadingMore: false,
          totalLoaded: newTripTransactions.length,
          totalCount: tripResponse.rowCount || 0,
        },
        rechargePagination: {
          ...get().rechargePagination,
          currentPage: 1,
          hasMore: newRechargeTransactions.length === 10,
          isLoadingMore: false,
          totalLoaded: newRechargeTransactions.length,
          totalCount: rechargeResponse.rowCount || 0,
        },
        isLoading: false,
        isRefreshing: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: formatError(error)
      });
    }
  },

  // Load recent activity
  loadRecentActivity: async () => {
    set({ isLoading: true, error: null });

    try {
      const recentActivity = await apiService.getRecentActivity();

      set({
        recentActivity,
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error),
        recentActivity: []
      });
    }
  },

  // Load more trip history
  loadMoreTripHistory: async () => {
    const { tripHasMore, isLoading, tripPage, tripPagination } = get();

    if (!tripHasMore || isLoading || tripPagination.isLoadingMore) return;

    set({ tripPage: tripPage + 1 });
    await get().loadTripHistory(tripPage + 1, false);
  },

  // Load more recharge history
  loadMoreRechargeHistory: async () => {
    const { rechargeHasMore, isLoading, rechargePage, rechargePagination } = get();

    if (!rechargeHasMore || isLoading || rechargePagination.isLoadingMore) return;

    set({ rechargePage: rechargePage + 1 });
    await get().loadRechargeHistory(rechargePage + 1, false);
  },

  // Check for ongoing trip
  checkOngoingTrip: async () => {
    try {
      // Check if user is authenticated before making API call
      const { user, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !user) {
        console.log('🚫 [CARD STORE] Skipping ongoing trip check - user not authenticated');
        return;
      }

      const ongoingTrip = await apiService.getOnGoingTrip();

      set({
        currentTrip: ongoingTrip && ongoingTrip.isRunning ? ongoingTrip : null,
        tripStatus: ongoingTrip && ongoingTrip.isRunning ? 'active' : 'idle'
      });
    } catch (error: any) {
      console.error('Error checking ongoing trip:', error);
      // Don't set error for background checks
    }
  },

  // Regular tap out
  tapOut: async () => {
    set({ isLoading: true, error: null });

    try {
      const success = await apiService.tapOutTrip();

      if (success) {
        set({
          currentTrip: null,
          tripStatus: 'idle',
          isLoading: false
        });

        // Refresh data after tap out
        await get().refreshData();
        return true;
      }

      throw new Error('Tap out failed');
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Force tap out
  forceTapOut: async () => {
    const { currentTrip } = get();

    if (!currentTrip) {
      set({ error: 'No active trip found' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await apiService.forceTripStop(
        currentTrip.cardId,
        currentTrip.tripId,
        currentTrip.sessionId
      );

      if (result.success) {
        set({
          currentTrip: null,
          tripStatus: 'idle',
          isLoading: false
        });

        // Refresh data after force tap out
        await get().refreshData();
        return true;
      }

      throw new Error(result.message || 'Force tap out failed');
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Refresh all data
  refreshData: async () => {
    await Promise.all([
      get().loadAllHistory(true),
      get().checkOngoingTrip()
    ]);
  },

  // Clear all card data
  clearAllCardData: async () => {
    set({
      card: null,
      tripTransactions: [],
      rechargeTransactions: [],
      recentActivity: [],
      currentTrip: null,
      tripStatus: 'idle',
      isLoading: false,
      isRefreshing: false,
      error: null,
      tripPage: 1,
      tripHasMore: true,
      rechargePage: 1,
      rechargeHasMore: true,
      tripPagination: {
        currentPage: 1,
        pageSize: 10,
        hasMore: true,
        isLoadingMore: false,
        totalLoaded: 0,
        totalCount: 0,
      },
      rechargePagination: {
        currentPage: 1,
        pageSize: 10,
        hasMore: true,
        isLoadingMore: false,
        totalLoaded: 0,
        totalCount: 0,
      }
    });
  },

  // Clear error
  clearError: () => set({ error: null })
}));
