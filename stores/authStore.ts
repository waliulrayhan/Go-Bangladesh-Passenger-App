import { create } from 'zustand';
import { apiService } from '../services/api';
import { User } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { extractUserIdFromToken } from '../utils/jwt';
import { storageService } from '../utils/storage';

// Helper function to format API error messages
const formatApiError = (error: any, defaultMessage: string = 'Operation failed'): string => {
  // Handle specific API error messages
  if (error.message === 'User not found!') {
    return 'Account not found. Please check your email/mobile number or contact support to register.';
  } else if (error.response?.data?.data?.message) {
    return error.response.data.data.message;
  } else if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Helper function to safely store auth tokens
const storeAuthTokens = async (authResponse: any): Promise<void> => {
  // Validate and store access token
  if (!authResponse.token || typeof authResponse.token !== 'string') {
    throw new Error('Invalid authentication token received');
  }
  await storageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, authResponse.token);
  
  // Validate and store refresh token if it exists
  if (authResponse.refreshToken && typeof authResponse.refreshToken === 'string') {
    await storageService.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
  }
};

// Helper function to extract user info from JWT token
const extractUserFromJWT = (token: string, mobile: string): User | null => {
  const { decodeJWT } = require('../utils/jwt');
  const payload = decodeJWT(token);
  
  if (!payload) return null;
  
  return {
    id: payload.UserId || Date.now(),
    name: payload.Name || payload.unique_name || 'User',
    mobile: mobile,
    sex: 'male' as const, // Default since JWT doesn't contain this
    userType: 'passenger' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    profileImage: undefined
  };
};

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
      // For the real API, we'll try to get a token using the mobile number and password
      // This serves as both auth and OTP sending in one step
      const authResponse = await apiService.getAuthToken(mobile, '123456');
      
      // Store the mobile number temporarily for the login process
      await storageService.setItem('temp_mobile', mobile);
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const errorMessage = formatApiError(error, 'Failed to send OTP');
      
      set({
        isLoading: false,
        error: errorMessage
      });
      return false;
    }
  },

  login: async (mobile: string, otp: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get bearer token using mobile number and OTP as password
      const authResponse = await apiService.getAuthToken(mobile, otp || '123456');
      
      await storeAuthTokens(authResponse);
      
      // Extract user ID from the JWT token
      const userId = extractUserIdFromToken(authResponse.token);
      
      if (userId) {
        try {
          // Try to get user details by ID
          const userResponse = await apiService.getUserById(userId);
          
          const user: User = {
            id: userResponse.id,
            name: userResponse.name,
            email: userResponse.email,
            mobile: userResponse.mobile,
            sex: userResponse.sex,
            cardNumber: userResponse.cardNumber,
            profileImage: userResponse.profileImage,
            userType: 'passenger' as const,
            isActive: userResponse.isActive,
            createdAt: userResponse.createdAt
          };

          // Store auth data
          await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        } catch (userError: any) {
          // Try to extract user info from JWT token
          const jwtUser = extractUserFromJWT(authResponse.token, mobile);
          
          if (jwtUser) {
            await storageService.setItem(STORAGE_KEYS.USER_DATA, jwtUser);
            await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

            set({
              user: jwtUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showWelcomePopup: true
            });

            return true;
          } else {
            // Fallback to basic user object
            const basicUser: User = {
              id: userId,
              name: 'User',
              mobile: mobile,
              sex: 'male',
              profileImage: undefined,
              userType: 'passenger' as const,
              isActive: true,
              createdAt: new Date().toISOString()
            };

            await storageService.setItem(STORAGE_KEYS.USER_DATA, basicUser);
            await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

            set({
              user: basicUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showWelcomePopup: true
            });

            return true;
          }
        }
      } else {
        // Try to extract user info from JWT token
        const jwtUser = extractUserFromJWT(authResponse.token, mobile);
        
        if (jwtUser) {
          await storageService.setItem(STORAGE_KEYS.USER_DATA, jwtUser);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user: jwtUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        } else {
          // Fallback to timestamp ID
          const basicUser: User = {
            id: Date.now(),
            name: 'User',
            mobile: mobile,
            sex: 'male',
            profileImage: undefined,
            userType: 'passenger' as const,
            isActive: true,
            createdAt: new Date().toISOString()
          };

          await storageService.setItem(STORAGE_KEYS.USER_DATA, basicUser);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user: basicUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        }
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error.message || error);
      set({
        isLoading: false,
        error: formatApiError(error, 'Login failed')
      });
      return false;
    }
  },

  loginWithPassword: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the real API login flow with identifier and password
      const authResponse = await apiService.getAuthToken(identifier, password);
      
      await storeAuthTokens(authResponse);
      
      // Extract user ID from the JWT token
      const userId = extractUserIdFromToken(authResponse.token);
      
      if (userId) {
        try {
          // Try to get user details by ID
          const userResponse = await apiService.getUserById(userId);
          
          const user: User = {
            id: userResponse.id,
            name: userResponse.name,
            email: userResponse.email,
            mobile: userResponse.mobile,
            sex: userResponse.sex,
            cardNumber: userResponse.cardNumber,
            profileImage: userResponse.profileImage,
            userType: 'passenger' as const,
            isActive: userResponse.isActive,
            createdAt: userResponse.createdAt
          };

          // Store auth data
          await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        } catch (userError: any) {
          console.error('Error fetching user details:', userError);
          // If we can't get user details, create a basic user object
          // For mobile, use identifier if it's a phone number, otherwise leave empty
          const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
          const mobileNumber = phoneRegex.test(identifier) ? identifier : '';
          
          const basicUser: User = {
            id: userId,
            name: 'User',
            mobile: mobileNumber,
            sex: 'male',
            profileImage: undefined,
            userType: 'passenger' as const,
            isActive: true,
            createdAt: new Date().toISOString()
          };

          await storageService.setItem(STORAGE_KEYS.USER_DATA, basicUser);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user: basicUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        }
      } else {
        // If we can't extract user ID from token, create a basic user with timestamp ID
        // For mobile, use identifier if it's a phone number, otherwise leave empty
        const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
        const mobileNumber = phoneRegex.test(identifier) ? identifier : '';
        
        const basicUser: User = {
          id: Date.now(),
          name: 'User',
          mobile: mobileNumber,
          sex: 'male',
          profileImage: undefined,
          userType: 'passenger' as const,
          isActive: true,
          createdAt: new Date().toISOString()
        };

        await storageService.setItem(STORAGE_KEYS.USER_DATA, basicUser);
        await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

        set({
          user: basicUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          showWelcomePopup: true
        });

        return true;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatApiError(error, 'Login failed')
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      // Clear all auth-related data
      await storageService.clearAuthData();
      // Also clear any temporary data
      await storageService.removeItem('temp_mobile');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showWelcomePopup: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear everything even if there's an error
      try {
        await storageService.clearAuthData();
        await storageService.removeItem('temp_mobile');
      } catch (clearError) {
        console.error('Error clearing storage:', clearError);
      }
      
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
        // Check if token is expired
        const { isTokenExpired } = await import('../utils/jwt');
        if (isTokenExpired(token)) {
          // Token is expired, clear auth data
          await storageService.clearAuthData();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }
        
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
      // For now, we'll just return true as we don't have a specific endpoint for card checking
      // You can implement this when the API endpoint is available
      set({ isLoading: false });
      return true;
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
      // Since we're using the real API, OTP verification happens during login
      // This method can be used as a separate verification step if needed
      const authResponse = await apiService.getAuthToken(mobile, otp || '123456');
      set({ isLoading: false });
      return !!authResponse.token;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatApiError(error, 'OTP verification failed')
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
        error: formatApiError(error, 'Failed to send password reset')
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
      // Since we don't have a registration endpoint yet, we'll use the auth token endpoint
      // to verify the mobile number and then create a basic user profile
      const authResponse = await apiService.getAuthToken(userData.mobile, '123456');
      
      // Extract user ID from token
      const userId = extractUserIdFromToken(authResponse.token);
      
      if (userId) {
        try {
          // Try to get existing user details
          const userResponse = await apiService.getUserById(userId);
          
          const user: User = {
            id: userResponse.id,
            name: userResponse.name || userData.name, // Use provided name if API doesn't have one
            email: userResponse.email || userData.email,
            mobile: userResponse.mobile,
            sex: userResponse.sex || userData.sex,
            cardNumber: userResponse.cardNumber || userData.cardNumber,
            profileImage: userResponse.profileImage,
            userType: 'passenger' as const,
            isActive: userResponse.isActive,
            createdAt: userResponse.createdAt
          };

          // Store auth data
          await storeAuthTokens(authResponse);
          await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        } catch (userError: any) {
          // If user doesn't exist in the system, create a basic profile with provided data
          const newUser: User = {
            id: userId,
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile,
            sex: userData.sex,
            cardNumber: userData.cardNumber,
            profileImage: undefined,
            userType: 'passenger' as const,
            isActive: true,
            createdAt: new Date().toISOString()
          };

          // Store auth data
          await storeAuthTokens(authResponse);
          await storageService.setItem(STORAGE_KEYS.USER_DATA, newUser);
          await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            showWelcomePopup: true
          });

          return true;
        }
      } else {
        throw new Error('Unable to extract user information from authentication token');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatApiError(error, 'Registration failed')
      });
      return false;
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
        error: formatApiError(error, 'Profile update failed')
      });
      return false;
    }
  },

  hideWelcomePopup: () => {
    set({ showWelcomePopup: false });
  }
}));