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
  refreshUserFromToken: () => Promise<boolean>;
  handleUnauthorized: () => Promise<void>;
  clearJustLoggedIn: () => void;
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
      await storageService.clearAuthData();
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Load user from storage on app start
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
      const userResponse = await apiService.getUserById(user.id.toString());
      if (userResponse) {
        const updatedUser: User = {
          ...user,
          name: userResponse.name,
          email: userResponse.emailAddress,
          mobile: userResponse.mobileNumber,
          balance: userResponse.balance,
          cardNumber: userResponse.cardNumber,
          organization: userResponse.organization?.name || userResponse.organization,
          profileImage: userResponse.imageUrl,
          imageUrl: userResponse.imageUrl
        };
        
        await storageService.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
        set({ user: updatedUser });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  },

  // Refresh user from token (for compatibility)
  refreshUserFromToken: async () => {
    await get().refreshUserData();
    return true;
  },

  // Handle unauthorized access
  handleUnauthorized: async () => {
    console.log('Handling unauthorized access - clearing session...');
    
    try {
      await storageService.clearAuthData();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
        justLoggedIn: false
      });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear just logged in flag
  clearJustLoggedIn: () => set({ justLoggedIn: false })
}));
