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
const extractUserFromJWT = (token: string, identifier: string): User | null => {
  const { decodeJWT } = require('../utils/jwt');
  const payload = decodeJWT(token);
  
  if (!payload) return null;
  
  // Determine if identifier is mobile or email
  const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
  const isMobile = phoneRegex.test(identifier);
  
  return {
    id: payload.UserId || Date.now(),
    name: payload.Name || payload.unique_name || 'User',
    mobile: isMobile ? identifier : '', // Use identifier if it's mobile
    email: !isMobile ? identifier : undefined, // Use identifier if it's email
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
  refreshUserData: () => Promise<boolean>;
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
          
          if (userResponse) {
            const user: User = {
              id: userResponse.id,
              name: userResponse.name,
              email: userResponse.emailAddress,
              mobile: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
              cardNumber: userResponse.cardNumber,
              profileImage: userResponse.imageUrl,
              userType: 'passenger' as const,
              isActive: true, // Assuming active if we got the data
              createdAt: new Date().toISOString(), // API doesn't provide this
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
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
          }
        } catch (userError: any) {
          // API call failed, continue to JWT fallback
        }
        
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
    console.log('🚀 [LOGIN] Starting login with password...');
    console.log('📱 [LOGIN] Identifier:', identifier);
    
    set({ isLoading: true, error: null });
    
    try {
      // Use the real API login flow with identifier and password
      const authResponse = await apiService.getAuthToken(identifier, password);
      
      await storeAuthTokens(authResponse);
      
      // Extract user ID from the JWT token
      const userId = extractUserIdFromToken(authResponse.token);
      console.log('🆔 [LOGIN] Extracted User ID from JWT:', userId);
      
      // PRIORITY 1: Try to get user details from API first (this has all the rich data)
      if (userId) {
        try {
          console.log('🔄 [LOGIN] Attempting to fetch user details from API...');
          const userResponse = await apiService.getUserById(userId);
          
          if (userResponse) {
            console.log('✅ [LOGIN] API user data retrieved successfully!');
            console.log('📋 [LOGIN] Creating user object from API data...');
            
            const user: User = {
              id: userResponse.id,
              name: userResponse.name,
              email: userResponse.emailAddress,
              mobile: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
              cardNumber: userResponse.cardNumber,
              profileImage: userResponse.imageUrl,
              userType: 'passenger' as const,
              isActive: true, // Assuming active if we got the data
              createdAt: new Date().toISOString(), // API doesn't provide this
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
            };

            console.log('👤 [LOGIN] Final user object created from API:', {
              id: user.id,
              name: user.name,
              mobile: user.mobile,
              email: user.email,
              address: user.address,
              passengerId: user.passengerId,
              cardNumber: user.cardNumber,
              balance: user.balance,
              gender: user.gender
            });

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

            console.log('🎉 [LOGIN] Login successful with API data!');
            return true;
          } else {
            console.warn('⚠️ [LOGIN] API returned null, falling back to JWT data...');
          }
        } catch (userError: any) {
          console.warn('⚠️ [LOGIN] API call failed, falling back to JWT data:', userError.message);
        }
      }
      
      // PRIORITY 2: Fallback to JWT extraction if API fails
      const jwtUser = extractUserFromJWT(authResponse.token, identifier);
      
      if (jwtUser) {
        console.log('✅ [LOGIN] Using JWT user data as fallback');
        console.log('👤 [LOGIN] JWT User data:', {
          id: jwtUser.id,
          name: jwtUser.name,
          mobile: jwtUser.mobile,
          email: jwtUser.email
        });
        
        // Store auth data
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
        // If we can't extract user ID from token, create a basic user with timestamp ID
        const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
        const mobileNumber = phoneRegex.test(identifier) ? identifier : '';
        
        const basicUser: User = {
          id: Date.now(),
          name: 'User',
          mobile: mobileNumber,
          email: !phoneRegex.test(identifier) ? identifier : undefined,
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
          
          if (userResponse) {
            const user: User = {
              id: userResponse.id,
              name: userResponse.name || userData.name, // Use provided name if API doesn't have one
              email: userResponse.emailAddress || userData.email,
              mobile: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : (userData.sex || 'male'),
              cardNumber: userResponse.cardNumber || userData.cardNumber,
              profileImage: userResponse.imageUrl,
              userType: 'passenger' as const,
              isActive: true, // Assuming active if we got the data
              createdAt: new Date().toISOString(), // API doesn't provide this
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
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
          }
        } catch (userError: any) {
          // API call failed, continue to create basic profile
        }
        
        // If user doesn't exist in the system or API is not available, create a basic profile with provided data
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

  refreshUserData: async () => {
    const { user } = get();
    if (!user?.id) {
      console.warn('⚠️ [REFRESH] No user ID available for refresh');
      return false;
    }

    console.log('🔄 [REFRESH] Starting user data refresh...');
    console.log('🆔 [REFRESH] User ID:', user.id);
    
    set({ isLoading: true, error: null });
    
    try {
      // Try to fetch fresh user data from API
      const userResponse = await apiService.getUserById(user.id.toString());
      
      if (!userResponse) {
        // API returned null (endpoint not available or failed)
        console.warn('⚠️ [REFRESH] User details API is not available - using cached data');
        
        set({
          isLoading: false,
          error: null // Don't show error to user, just use cached data silently
        });
        
        return false;
      }
      
      console.log('✅ [REFRESH] Fresh user data retrieved from API!');
      console.log('📋 [REFRESH] Updated user data:', {
        id: userResponse.id,
        name: userResponse.name,
        mobile: userResponse.mobileNumber,
        email: userResponse.emailAddress,
        address: userResponse.address,
        passengerId: userResponse.passengerId,
        cardNumber: userResponse.cardNumber,
        balance: userResponse.balance,
        gender: userResponse.gender
      });
      
      const updatedUser: User = {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.emailAddress,
        mobile: userResponse.mobileNumber,
        sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
        cardNumber: userResponse.cardNumber,
        profileImage: userResponse.imageUrl,
        userType: 'passenger' as const,
        isActive: true, // Assuming active if we got the data
        createdAt: user.createdAt, // Keep original creation date
        dateOfBirth: userResponse.dateOfBirth,
        address: userResponse.address,
        passengerId: userResponse.passengerId,
        organizationId: userResponse.organizationId,
        organization: userResponse.organization,
        balance: userResponse.balance,
        gender: userResponse.gender
      };

      // Update storage and state
      await storageService.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
      
      set({
        user: updatedUser,
        isLoading: false,
        error: null
      });

      console.log('🎉 [REFRESH] User data refresh completed successfully!');
      return true;
    } catch (error: any) {
      console.warn('💥 [REFRESH] Refresh failed - unexpected error:', error.message);
      
      set({
        isLoading: false,
        error: null // Don't show error to user, just use cached data silently
      });
      
      return false;
    }
  },

  hideWelcomePopup: () => {
    set({ showWelcomePopup: false });
  }
}));