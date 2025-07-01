import { create } from 'zustand';
import { mockApi } from '../services/mockData';
import { User } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { storageService } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showWelcomePopup: boolean;
  
  login: (mobile: string, otp: string) => Promise<boolean>;
  loginWithPassword: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  clearError: () => void;
  sendOTP: (mobile: string) => Promise<boolean>;
  checkCardExists: (cardNumber: string) => Promise<boolean>;
  verifyOTP: (mobile: string, otp: string) => Promise<boolean>;
  sendPasswordReset: (identifier: string) => Promise<boolean>;
  registerUser: (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }) => Promise<boolean>;
  updateUserProfile: (userData: User) => Promise<boolean>;
  hideWelcomePopup: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  showWelcomePopup: false,

  sendOTP: async (mobile: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await mockApi.sendOTP(mobile);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to send OTP'
      });
      return false;
    }
  },

  login: async (mobile: string, otp: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await mockApi.login(mobile, otp);
      
      const userWithType = { ...response.user, userType: 'passenger' as const };
      
      await storageService.storeAuthTokens(response.tokens);
      await storageService.setItem(STORAGE_KEYS.USER_DATA, userWithType);
      await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

      set({
        user: userWithType,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        showWelcomePopup: true // Show welcome popup for successful login
      });

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed'
      });
      return false;
    }
  },

  loginWithPassword: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock login - in real app, this would call your API
      // For demo purposes, accept any credentials
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: identifier.includes('@') ? identifier : 'student@example.com',
        mobile: identifier.includes('@') ? '+8801712345678' : identifier,
        cardNumber: 'GB-7823456012',
        sex: 'male' as const,
        profileImage: undefined,
        userType: 'passenger' as const,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      await storageService.storeAuthTokens(mockTokens);
      await storageService.setItem(STORAGE_KEYS.USER_DATA, mockUser);
      await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        showWelcomePopup: true
      });

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed'
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      await storageService.clearAuthData();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showWelcomePopup: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      await storageService.clearAuthData();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showWelcomePopup: false
      });
    }
  },

  loadUserFromStorage: async () => {
    set({ isLoading: true });
    
    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await storageService.getItem<User>(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },
  clearError: () => set({ error: null }),

  checkCardExists: async (cardNumber: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const exists = await mockApi.checkCardExists(cardNumber);
      set({ isLoading: false });
      return exists;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to check card'
      });
      return false;
    }
  },

  verifyOTP: async (mobile: string, otp: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const isValid = await mockApi.verifyOTP(mobile, otp);
      set({ isLoading: false });
      return isValid;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'OTP verification failed'
      });
      return false;
    }
  },

  sendPasswordReset: async (identifier: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to send password reset'
      });
      return false;
    }
  },

  registerUser: async (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await mockApi.registerUser(userData);
      
      // Store auth data after successful registration
      await storageService.storeAuthTokens(response.tokens);
      await storageService.setItem(STORAGE_KEYS.USER_DATA, response.user);
      await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        showWelcomePopup: true  // Always show for new registrations (they are passengers)
      });

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed'
      });      return false;
    }
  },

  updateUserProfile: async (userData: User) => {
    set({ isLoading: true, error: null });
    
    try {
      // Update user data in storage
      await storageService.setItem(STORAGE_KEYS.USER_DATA, userData);

      set({
        user: userData,
        isLoading: false,
        error: null
      });

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Profile update failed'
      });
      return false;
    }
  },

  hideWelcomePopup: () => {
    set({ showWelcomePopup: false });
  }
}));
