import { create } from 'zustand';
import { ApiResponse, Bus, Card, PaginationState, Transaction, Trip } from '../types';
import { useAuthStore } from './authStore';

interface CardState {
  card: Card | null;
  transactions: Transaction[];
  trips: Trip[];
  buses: Bus[];
  isLoading: boolean;
  error: string | null;
  tripStatus: 'idle' | 'active' | 'completed';
  currentTrip: Trip | null;
  historyPagination: PaginationState;
  
  loadCardDetails: () => Promise<void>;
  loadHistory: (pageNo?: number, reset?: boolean) => Promise<void>;
  loadBuses: () => Promise<void>;
  tapIn: (cardNumber: string, busId: number) => Promise<boolean>;
  tapOut: (cardNumber: string) => Promise<boolean>;
  recharge: (cardNumber: string, amount: number) => Promise<boolean>;
  simulateTapIn: () => void;
  simulateTapOut: () => void;
  clearError: () => void;
  loadMoreHistory: () => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  card: null,
  transactions: [],
  trips: [],
  buses: [],
  isLoading: false,
  error: null,
  tripStatus: 'idle',
  currentTrip: null,
  historyPagination: {
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
  },

  loadCardDetails: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: Replace with real API call when card endpoints are available
      // For now, create a basic card object to avoid crashes
      const card: Card = {
        id: 1,
        cardNumber: 'GB-0000000000',
        userId: 1,
        balance: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      set({ card, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load card details'
      });
    }
  },

  loadHistory: async (pageNo: number = 1, reset: boolean = false) => {
    const { historyPagination } = get();
    
    if (reset) {
      set({ 
        isLoading: true, 
        error: null,
        historyPagination: {
          ...historyPagination,
          currentPage: 1,
          hasMore: true,
          totalLoaded: 0
        }
      });
    } else {
      set({ 
        historyPagination: {
          ...historyPagination,
          isLoadingMore: true
        }
      });
    }
    
    try {
      // Get passenger ID from auth store
      const authStore = useAuthStore.getState();
      const user = authStore.user;
      console.log('👤 [HISTORY] Current user from auth store:', user);
      
      // For testing, use the test ID that we know has data, then fallback to user ID
      const testPassengerId = '585ce04804e64057a2dc6a0840c4f53e'; // This ID has data
      const passengerId = testPassengerId; // Use test ID for now to verify API works
      
      console.log('🔄 [HISTORY] Loading history for passenger:', passengerId);
      console.log('📄 [HISTORY] Page:', pageNo, 'Page Size:', historyPagination.pageSize);
      
      const apiUrl = `https://mhmahi-001-site1.qtempurl.com/api/history/passenger?id=${passengerId}&pageNo=${pageNo}&pageSize=${historyPagination.pageSize}`;
      console.log('🌐 [HISTORY] API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('❌ [HISTORY] API request failed:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: ApiResponse<Transaction> = await response.json();
      console.log('📥 [HISTORY] API response received:', data);
      
      if (data.data.isSuccess) {
        const newTransactions = data.data.content || [];
        console.log('📊 [HISTORY] Transactions loaded:', newTransactions.length);
        
        if (newTransactions.length > 0) {
          console.log('🔍 [HISTORY] Sample transaction:', newTransactions[0]);
        } else {
          console.log('ℹ️ [HISTORY] No transactions found for this user');
        }
        
        const hasMore = newTransactions.length === historyPagination.pageSize;
        
        set({
          transactions: reset ? newTransactions : [...get().transactions, ...newTransactions],
          trips: reset ? 
            newTransactions.filter(t => t.transactionType === 'BusFare' && t.trip).map(t => ({
              ...t.trip!,
              createdBy: t.createdBy,
              lastModifiedBy: t.lastModifiedBy,
              isDeleted: t.isDeleted
            })) :
            [...get().trips, ...newTransactions.filter(t => t.transactionType === 'BusFare' && t.trip).map(t => ({
              ...t.trip!,
              createdBy: t.createdBy,
              lastModifiedBy: t.lastModifiedBy,
              isDeleted: t.isDeleted
            }))],
          isLoading: false,
          historyPagination: {
            ...historyPagination,
            currentPage: pageNo,
            hasMore,
            isLoadingMore: false,
            totalLoaded: reset ? newTransactions.length : historyPagination.totalLoaded + newTransactions.length
          }
        });
        console.log('✅ [HISTORY] History data updated successfully');
        console.log('📊 [HISTORY] Total transactions:', reset ? newTransactions.length : get().transactions.length);
        console.log('🚌 [HISTORY] Total trips:', reset ? 
          newTransactions.filter(t => t.transactionType === 'BusFare' && t.trip).length : 
          get().trips.length);
      } else {
        console.error('❌ [HISTORY] API returned error:', data.data.message);
        throw new Error(data.data.message || 'Failed to load history');
      }
    } catch (error: any) {
      console.error('❌ [HISTORY] Error loading history:', error);
      set({
        isLoading: false,
        historyPagination: {
          ...historyPagination,
          isLoadingMore: false
        },
        error: error.message || 'Failed to load history'
      });
    }
  },

  loadMoreHistory: async () => {
    const { historyPagination } = get();
    if (historyPagination.hasMore && !historyPagination.isLoadingMore) {
      await get().loadHistory(historyPagination.currentPage + 1, false);
    }
  },

  loadTransactions: async () => {
    await get().loadHistory(1, true);
  },

  loadTrips: async () => {
    await get().loadHistory(1, true);
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

  simulateTapIn: () => {
    const currentTime = new Date().toISOString();
    const mockTrip: Trip = {
      id: Date.now().toString(),
      passengerId: '585ce04804e64057a2dc6a0840c4f53e',
      sessionId: 'mock-session-' + Date.now(),
      startingLatitude: '23.7808',
      startingLongitude: '90.2792',
      endingLatitude: '23.7808',
      endingLongitude: '90.2792',
      tripStartTime: currentTime,
      tripEndTime: currentTime,
      amount: 0,
      isRunning: true,
      distance: 0,
      createTime: currentTime,
      lastModifiedTime: currentTime,
      createdBy: 'mock-user',
      lastModifiedBy: 'mock-user',
      isDeleted: false
    };

    set({
      tripStatus: 'active',
      currentTrip: mockTrip
    });
  },

  simulateTapOut: () => {
    const currentTrip = get().currentTrip;
    const card = get().card;
    
    if (currentTrip && card) {
      const fare = 25; // Mock fare
      const newBalance = card.balance - fare;
      const currentTime = new Date().toISOString();
      
      const completedTrip: Trip = {
        ...currentTrip,
        tripEndTime: currentTime,
        endingLatitude: '23.7908',
        endingLongitude: '90.2892',
        amount: fare,
        isRunning: false,
        distance: 5.2,
        lastModifiedTime: currentTime
      };

      set({
        tripStatus: 'idle',
        currentTrip: null,
        card: { ...card, balance: newBalance },
        trips: [completedTrip, ...get().trips]
      });
    }
  },

  clearError: () => set({ error: null })
}));
