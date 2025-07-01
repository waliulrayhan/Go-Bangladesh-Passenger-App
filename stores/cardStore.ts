import { create } from 'zustand';
import { mockApi } from '../services/mockData';
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
      const card = await mockApi.getCardDetails('GB-7823456012');
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
      const transactions = await mockApi.getTransactions();
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
      const trips = await mockApi.getTrips();
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
      const buses = await mockApi.getBuses();
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
      const response = await mockApi.tapIn(cardNumber, busId);
      
      const currentCard = get().card;
      if (currentCard && response.newBalance !== undefined) {
        set({
          card: { ...currentCard, balance: response.newBalance },
          isLoading: false
        });
      }
      
      return response.success;
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
      const response = await mockApi.tapOut(cardNumber);
      
      const currentCard = get().card;
      if (currentCard && response.newBalance !== undefined) {
        set({
          card: { ...currentCard, balance: response.newBalance },
          isLoading: false
        });
      }
      
      return response.success;
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
      const transaction = await mockApi.recharge(cardNumber, amount);
      
      const currentCard = get().card;
      if (currentCard) {
        set({
          card: { ...currentCard, balance: transaction.balanceAfter },
          transactions: [transaction, ...get().transactions],
          isLoading: false
        });
      }
      
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
