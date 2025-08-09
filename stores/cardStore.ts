import { create } from 'zustand';
import { apiService, RechargeTransaction, TripTransaction } from '../services/api';
import { Card, PaginationState, Trip } from '../types';
import { useAuthStore } from './authStore';

interface CardState {
  // State
  card: Card | null;
  tripTransactions: TripTransaction[];
  rechargeTransactions: RechargeTransaction[];
  currentTrip: Trip | null;
  tripStatus: 'idle' | 'active' | 'completed';
  isLoading: boolean;
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
  loadMoreTripHistory: () => Promise<void>;
  loadMoreRechargeHistory: () => Promise<void>;
  checkOngoingTrip: () => Promise<void>;
  tapOut: () => Promise<boolean>;
  forceTapOut: () => Promise<boolean>;
  clearError: () => void;
  refreshData: () => Promise<void>;
  forceRefreshData: () => Promise<void>;
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
  currentTrip: null,
  tripStatus: 'idle',
  isLoading: false,
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
    // This is mainly for refreshing user data, which is handled by auth store
    await useAuthStore.getState().refreshUserData();
    
    // Create card from user data for compatibility
    const user = useAuthStore.getState().user;
    if (user) {
      const card: Card = {
        id: user.id ? parseInt(user.id.toString()) : Date.now(),
        cardNumber: user.cardNumber || '',
        userId: parseInt(user.id?.toString() || '1'),
        balance: typeof user.balance === 'number' ? user.balance : 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      set({ card });
    }
  },

  // Load trip history
  loadTripHistory: async (pageNo = 1, reset = false) => {
    const { tripTransactions, tripPage, tripPagination } = get();
    
    if (reset) {
      set({ 
        isLoading: true, 
        error: null, 
        tripPage: 1, 
        tripHasMore: true,
        tripTransactions: [],
        tripPagination: {
          ...tripPagination,
          currentPage: 1,
          hasMore: true,
          isLoadingMore: false,
          totalLoaded: 0,
          totalCount: 0,
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
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error),
        tripPagination: {
          ...get().tripPagination,
          isLoadingMore: false
        }
      });
    }
  },

  // Load recharge history
  loadRechargeHistory: async (pageNo = 1, reset = false) => {
    const { rechargeTransactions, rechargePage, rechargePagination } = get();
    
    if (reset) {
      set({ 
        isLoading: true, 
        error: null, 
        rechargePage: 1, 
        rechargeHasMore: true,
        rechargeTransactions: [],
        rechargePagination: {
          ...rechargePagination,
          currentPage: 1,
          hasMore: true,
          isLoadingMore: false,
          totalLoaded: 0,
          totalCount: 0,
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
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error),
        rechargePagination: {
          ...get().rechargePagination,
          isLoadingMore: false
        }
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
      get().loadTripHistory(1, true),
      get().loadRechargeHistory(1, true),
      get().checkOngoingTrip()
    ]);
    
    // Also refresh user data in auth store
    await useAuthStore.getState().refreshUserData();
  },

  // Force refresh data (alias for refreshData)
  forceRefreshData: async () => {
    await get().refreshData();
  },

  // Clear all card data
  clearAllCardData: async () => {
    set({
      card: null,
      tripTransactions: [],
      rechargeTransactions: [],
      currentTrip: null,
      tripStatus: 'idle',
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
