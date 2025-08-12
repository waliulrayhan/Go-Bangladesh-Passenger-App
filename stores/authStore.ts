import { router } from 'expo-router';
import { create } from 'zustand';
import { apiService } from '../services/api';
import { User } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { extractUserIdFromToken } from '../utils/jwt';
import { storageService } from '../utils/storage';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  justLoggedIn: boolean;
  isLoggingOut: boolean; // Global logout state

  // Actions
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  clearError: () => void;
  sendOTP: (mobile: string) => Promise<boolean>;
  verifyOTP: (mobile: string, otp: string) => Promise<boolean>;
  resetPassword: (mobile: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string, confirmNewPassword: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  refreshBalance: () => Promise<number | null>;
  refreshUserFromToken: () => Promise<boolean>;
  handleUnauthorized: () => Promise<void>;
  clearJustLoggedIn: () => void;
  deactivateAccount: () => Promise<{ success: boolean; message: string }>;
}

const formatError = (error: any): string => {
  if (error.response?.data?.data?.message) {
    return error.response.data.data.message;
  }
  return error.message || 'An error occurred';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  justLoggedIn: false,
  isLoggingOut: false, // Initialize global logout state

  // Login with identifier and password
  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token from API
      const authResponse = await apiService.getAuthToken(identifier, password);
      
      // Store tokens
      await storageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, authResponse.token);
      if (authResponse.refreshToken) {
        await storageService.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
      }
      
      // Get user ID from token
      const userId = extractUserIdFromToken(authResponse.token);
      if (!userId) {
        throw new Error('Invalid token received');
      }
      
      // Fetch user details from API
      const userResponse = await apiService.getUserById(userId);
      if (!userResponse) {
        throw new Error('Failed to fetch user details');
      }
      
      // Create user object
      const user: User = {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.emailAddress,
        emailAddress: userResponse.emailAddress,
        mobile: userResponse.mobileNumber,
        mobileNumber: userResponse.mobileNumber,
        sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
        gender: userResponse.gender,
        cardNumber: userResponse.cardNumber,
        userType: userResponse.userType?.toLowerCase() as 'passenger' | 'public' | 'private',
        isActive: true,
        createdAt: new Date().toISOString(),
        profileImage: userResponse.imageUrl,
        imageUrl: userResponse.imageUrl,
        dateOfBirth: userResponse.dateOfBirth,
        address: userResponse.address,
        passengerId: userResponse.passengerId,
        organizationId: userResponse.organizationId,
        organization: userResponse.organization?.name || userResponse.organization,
        balance: userResponse.balance
      };
      
      // Store user data
      await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        justLoggedIn: true
      });
      
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      console.log('🔄 [AUTH] Starting logout process...');
      
      // Set global logout state immediately
      set({ isLoggingOut: true });
      
      // Clear card store data first to prevent stale data
      try {
        const { useCardStore } = await import('../stores/cardStore');
        const cardStore = useCardStore.getState();
        await cardStore.clearAllCardData();
        console.log('✅ [AUTH] Card store cleared');
      } catch (cardError) {
        console.warn('⚠️ [AUTH] Card store clear error:', cardError);
      }
      
      // Clear all auth-related data from storage
      await storageService.clearAllAppData();
      
      // Reset the auth state completely - this will trigger navigation in main layout
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
        justLoggedIn: false,
        isLoggingOut: false // Clear immediately so navigation can proceed
      });
      
      console.log('✅ [AUTH] Logout state cleared successfully');
      
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
      
      // Force clear state even if storage clearing fails
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
        justLoggedIn: false,
        isLoggingOut: false // Clear immediately so navigation can proceed
      });
    }
  },

  // Load user from storage on app start
  loadUserFromStorage: async () => {
    set({ isLoading: true });
    
    try {
      console.log('🔍 [AUTH] Loading user data from storage...');
      
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await storageService.getItem<User>(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        console.log('📱 [AUTH] Token and user data found in storage');
        
        // Import JWT utilities to check token expiration
        const { isTokenExpired } = await import('../utils/jwt');
        
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('⏰ [AUTH] Token has expired - clearing session silently');
          
          // Token is expired, clear everything silently without triggering handleUnauthorized
          await storageService.clearAllAppData();
          
          // Clear card store data as well
          try {
            const { useCardStore } = await import('./cardStore');
            const cardStore = useCardStore.getState();
            await cardStore.clearAllCardData();
          } catch (cardError) {
            console.warn('⚠️ [AUTH] Card store clear error during token expiry:', cardError);
          }
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          return;
        }
        
        console.log('✅ [AUTH] Token is valid - restoring user session');
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        console.log('ℹ️ [AUTH] No valid session found in storage');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('💥 [AUTH] Error loading user from storage:', error);
      
      // Clear potentially corrupted data silently
      try {
        await storageService.clearAllAppData();
        
        // Clear card store data as well
        try {
          const { useCardStore } = await import('./cardStore');
          const cardStore = useCardStore.getState();
          await cardStore.clearAllCardData();
        } catch (cardError) {
          console.warn('⚠️ [AUTH] Card store clear error during error recovery:', cardError);
        }
      } catch (cleanupError) {
        console.error('💥 [AUTH] Error during cleanup:', cleanupError);
      }
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  // Send OTP
  sendOTP: async (mobile: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.sendOTP(mobile);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Verify OTP
  verifyOTP: async (mobile: string, otp: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.verifyOTP(mobile, otp);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Reset password
  resetPassword: async (mobile: string, newPassword: string, confirmPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.resetPassword(mobile, newPassword, confirmPassword);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string, confirmNewPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.changePassword({
        oldPassword,
        newPassword,
        confirmNewPassword
      });
      
      set({ isLoading: false });
      return { success: response.isSuccess, message: response.message };
    } catch (error: any) {
      const errorMessage = formatError(error);
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  },

  // Register user
  registerUser: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const registrationData = {
        Name: userData.name,
        MobileNumber: userData.mobile,
        EmailAddress: userData.email,
        Gender: userData.sex,
        Password: '123456', // Default password or get from user
        CardNumber: userData.cardNumber
      };
      
      const success = await apiService.registerPassenger(registrationData);
      
      if (success) {
        // After successful registration, login the user
        return await get().login(userData.mobile, '123456');
      }
      
      set({ isLoading: false });
      return false;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  // Refresh user data
  refreshUserData: async () => {
    const { user } = get();
    if (!user?.id) return;
    
    try {
      console.log('🔄 [AUTH] Refreshing user data from API...');
      const userResponse = await apiService.getUserById(user.id.toString());
      if (userResponse) {
        console.log('✅ [AUTH] Fresh user data received from API');
        
        // Create a completely updated user object with ALL fields from API response
        const updatedUser: User = {
          id: userResponse.id,
          name: userResponse.name,
          email: userResponse.emailAddress,
          emailAddress: userResponse.emailAddress,
          mobile: userResponse.mobileNumber,
          mobileNumber: userResponse.mobileNumber,
          sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
          gender: userResponse.gender,
          cardNumber: userResponse.cardNumber,
          userType: userResponse.userType?.toLowerCase() as 'passenger' | 'public' | 'private',
          isActive: true,
          createdAt: user.createdAt || new Date().toISOString(), // Keep original or set default
          profileImage: userResponse.imageUrl,
          imageUrl: userResponse.imageUrl,
          dateOfBirth: userResponse.dateOfBirth,
          address: userResponse.address,
          passengerId: userResponse.passengerId,
          organizationId: userResponse.organizationId,
          organization: userResponse.organization?.name || userResponse.organization,
          balance: userResponse.balance
        };
        
        console.log('💾 [AUTH] Saving updated user data to storage...');
        await storageService.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
        
        console.log('🔄 [AUTH] Updating auth store with fresh user data...');
        set({ user: updatedUser });
        
        console.log('✅ [AUTH] User data refresh completed successfully');
      }
    } catch (error) {
      console.error('❌ [AUTH] Error refreshing user data:', error);
    }
  },

  // Refresh only balance (lightweight)
  refreshBalance: async () => {
    const { user } = get();
    if (!user?.id) return null;
    
    try {
      const userResponse = await apiService.getUserById(user.id.toString());
      if (userResponse && typeof userResponse.balance === 'number') {
        const updatedUser: User = {
          ...user,
          balance: userResponse.balance
        };
        
        await storageService.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
        set({ user: updatedUser });
        return userResponse.balance;
      }
    } catch (error) {
      console.error('❌ [BALANCE] Error refreshing balance:', error);
    }
    
    return null;
  },

  // Refresh user from token (for compatibility)
  refreshUserFromToken: async () => {
    await get().refreshUserData();
    return true;
  },

  // Handle unauthorized access
  handleUnauthorized: async () => {
    console.log('🚫 [AUTH] Handling unauthorized access - session expired');
    
    try {
      console.log('🧹 [AUTH] Clearing all application data...');
      
      // Use clearAllAppData instead of just clearAuthData for complete cleanup
      await storageService.clearAllAppData();
      
      console.log('🔄 [AUTH] Resetting authentication state...');
      
      // Reset all auth state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
        justLoggedIn: false
      });
      
      console.log('✅ [AUTH] Session cleanup completed successfully');
      
      // Simple navigation to welcome screen
      setTimeout(() => {
        try {
          router.replace('/');
          console.log('✅ [AUTH] Navigation to welcome successful');
        } catch (navError) {
          console.error('💥 [AUTH] Navigation failed:', navError);
          // Try alternative navigation
          try {
            router.push('/');
          } catch (pushError) {
            console.error('💥 [AUTH] Push navigation also failed:', pushError);
          }
        }
      }, 200);
      
    } catch (error) {
      console.error('💥 [AUTH] Error during session cleanup:', error);
      
      // Force reset state even if storage clearing fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
        justLoggedIn: false
      });
      
      // Still try to navigate even if cleanup failed
      setTimeout(() => {
        try {
          router.replace('/');
        } catch (navError) {
          console.error('💥 [AUTH] Final navigation attempt failed:', navError);
        }
      }, 200);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear just logged in flag
  clearJustLoggedIn: () => set({ justLoggedIn: false }),

  // Deactivate account
  deactivateAccount: async () => {
    const { user } = get();
    if (!user?.id) {
      return { success: false, message: 'User ID not found' };
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.deactivateAccount(user.id.toString());
      
      if (response.isSuccess) {
        // Clear all data and redirect to home
        await get().logout();
        
        set({ isLoading: false });
        return { success: true, message: response.message };
      } else {
        set({ isLoading: false });
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      const errorMessage = formatError(error);
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }
}));
