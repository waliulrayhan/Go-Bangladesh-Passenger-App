import { create } from 'zustand';
import { Bus, Card, Transaction, Trip } from '../types';

interface CardState {
  card: Card | null;
  transactions: Transaction[];
  trips: Trip[];
  buses: Bus[];
  isLoading: boolean;
  error: string | null;
  tripStatus: 'idle' | 'active' | 'completed';
  currentTrip: Trip | null;
  
  loadCardDetails: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadTrips: () => Promise<void>;
  loadBuses: () => Promise<void>;
  tapIn: (cardNumber: string, busId: number) => Promise<boolean>;
  tapOut: (cardNumber: string) => Promise<boolean>;
  recharge: (cardNumber: string, amount: number) => Promise<boolean>;
  simulateTapIn: () => void;
  simulateTapOut: () => void;
  clearError: () => void;
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

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: Replace with real API call when transaction endpoints are available
      // For now, return empty array to avoid crashes
      const transactions: Transaction[] = [];
      set({ transactions, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load transactions'
      });
    }
  },

  loadTrips: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: Replace with real API call when trip endpoints are available
      // For now, return empty array to avoid crashes
      const trips: Trip[] = [];
      set({ trips, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load trips'
      });
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

  simulateTapIn: () => {
    const currentTime = new Date().toISOString();
    const mockTrip = {
      id: Date.now(),
      cardId: 1,
      busId: 1,
      tapInTime: currentTime,
      tapInLocation: {
        latitude: 23.7808,
        longitude: 90.2792
      },
      tapOutTime: undefined,
      tapOutLocation: undefined,
      fareAmount: 0,
      tripStatus: 'ongoing' as const,
      busNumber: 'DHK-123-4567',
      createdAt: currentTime
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
      
      const completedTrip = {
        ...currentTrip,
        tapOutTime: currentTime,
        tapOutLocation: {
          latitude: 23.7908,
          longitude: 90.2892
        },
        fareAmount: fare,
        tripStatus: 'completed' as const
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
