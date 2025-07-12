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

// Helper function to clear all app data for fresh login/registration
const clearAllAppData = async (): Promise<void> => {
  console.log('🧹 [AUTH] Clearing all app data for fresh session...');
  
  try {
    // Clear all auth-related data
    await storageService.clearAuthData();
    
    // Clear additional temporary data
    const keysToRemove = [
      'temp_mobile',
      'temp_registration_data',
      'card_data',
      'trip_data',
      'transaction_cache',
      'history_cache',
      'bus_data_cache',
      'profile_cache',
      STORAGE_KEYS.REGISTRATION_COMPLETE
    ];
    
    await Promise.all(
      keysToRemove.map(key => storageService.removeItem(key))
    );
    
    // Clear card store data
    try {
      const { useCardStore } = await import('./cardStore');
      const cardStore = useCardStore.getState();
      await cardStore.clearAllCardData();
    } catch (cardError) {
      console.warn('⚠️ [AUTH] Could not clear card store data:', cardError);
    }
    
    console.log('✅ [AUTH] All app data cleared successfully');
  } catch (error) {
    console.error('❌ [AUTH] Error clearing app data:', error);
    // Continue anyway - we'll force clear in the next step
  }
};

// Helper function to safely store auth tokens after clearing old data
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
  isRegistering: boolean;
  
  login: (mobile: string, otp: string) => Promise<boolean>;
  loginWithPassword: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  clearError: () => void;
  sendOTP: (mobile: string) => Promise<boolean>;
  checkCardExists: (cardNumber: string) => Promise<boolean>;
  verifyOTP: (mobile: string, otp: string) => Promise<boolean>;
  sendPasswordReset: (identifier: string) => Promise<boolean>;
  resetPassword: (mobile: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string, confirmNewPassword: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }) => Promise<boolean>;
  updateUserProfile: (userData: User) => Promise<boolean>;
  refreshUserData: () => Promise<boolean>;
  refreshUserFromToken: () => Promise<boolean>;
  handleUnauthorized: () => Promise<void>;
  hideWelcomePopup: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  showWelcomePopup: false,
  isRegistering: false,

  sendOTP: async (mobile: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the new OTP API to send OTP
      await apiService.sendOTP(mobile);
      
      // Store the mobile number temporarily for the verification process
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
    console.log('🚀 [LOGIN] Starting login for:', mobile);
    
    set({ isLoading: true, error: null });
    
    try {
      // STEP 1: Clear all existing data for fresh session
      await clearAllAppData();
      
      // STEP 2: Get fresh bearer token using mobile number and OTP
      const authResponse = await apiService.getAuthToken(mobile, otp || '123456');
      
      // STEP 3: Store fresh auth tokens
      await storeAuthTokens(authResponse);
      console.log('✅ [LOGIN] Authentication successful!');
      
      // STEP 4: Extract user ID from the fresh JWT token
      const userId = extractUserIdFromToken(authResponse.token);
      
      if (userId) {
        try {
          // STEP 5: Make fresh API call to get user details (NO CACHE, NO MOCK DATA)
          const userResponse = await apiService.getUserById(userId);
          
          if (userResponse) {
            // Validate user type - only allow Public or Private users to login
            if (userResponse.userType !== 'Public' && userResponse.userType !== 'Private') {
              console.warn('❌ [LOGIN] User type validation failed:', userResponse.userType);
              set({
                isLoading: false,
                error: 'Access denied. This app is only for Public or Private users. Please contact your organization if you believe this is an error.'
              });
              return false;
            }
            
            // STEP 6: Create fresh user object from API data (NO MOCK DATA)
            const user: User = {
              id: userResponse.id,
              name: userResponse.name,
              email: userResponse.emailAddress,
              emailAddress: userResponse.emailAddress,
              mobile: userResponse.mobileNumber,
              mobileNumber: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
              cardNumber: userResponse.cardNumber,
              profileImage: userResponse.imageUrl,
              imageUrl: userResponse.imageUrl,
              userType: (userResponse.userType?.toLowerCase() === 'public' ? 'public' : 
                        userResponse.userType?.toLowerCase() === 'private' ? 'private' : 'passenger') as 'passenger' | 'public' | 'private',
              isActive: true,
              createdAt: new Date().toISOString(),
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: typeof userResponse.organization === 'object' ? userResponse.organization?.name : userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
            };

            // STEP 7: Store fresh user data
            await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
            await storageService.setItem(STORAGE_KEYS.USER_TYPE, userResponse.userType?.toLowerCase() || 'passenger');

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showWelcomePopup: true
            });

            // Load fresh card data after successful login
            try {
              const { useCardStore } = await import('./cardStore');
              const cardStore = useCardStore.getState();
              await cardStore.refreshCardData();
            } catch (cardError) {
              console.warn('⚠️ [LOGIN] Could not load card data:', cardError);
            }

            console.log('🎉 [LOGIN] Login completed successfully!');
            return true;
          }
        } catch (userError: any) {
          console.warn('⚠️ [LOGIN] Fresh API call failed, using JWT fallback:', userError.message);
        }
        
        // STEP 8: JWT fallback (if API fails but token is valid)
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

          console.log('✅ [LOGIN] Fresh login completed with JWT fallback');
          return true;
        } else {
          // STEP 9: Basic fallback (last resort)
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

          console.log('✅ [LOGIN] Fresh login completed with basic fallback');
          return true;
        }
      } else {
        // JWT extraction failed - try to extract from token
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
          // Final fallback
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
      console.error('❌ [LOGIN] Fresh login failed:', error.message || error);
      set({
        isLoading: false,
        error: formatApiError(error, 'Login failed')
      });
      return false;
    }
  },

  loginWithPassword: async (identifier: string, password: string) => {
    console.log('🚀 [LOGIN] Starting fresh login with password process...');
    console.log('📱 [LOGIN] Identifier:', identifier);
    
    set({ isLoading: true, error: null });
    
    try {
      // STEP 1: Clear all existing data for fresh session
      await clearAllAppData();
      
      // STEP 2: Use fresh API login flow with identifier and password
      console.log('🔐 [LOGIN] Requesting fresh authentication token with password...');
      const authResponse = await apiService.getAuthToken(identifier, password);
      
      // STEP 3: Store fresh auth tokens
      await storeAuthTokens(authResponse);
      console.log('✅ [LOGIN] Fresh tokens stored successfully');
      
      // STEP 4: Extract user ID from the fresh JWT token
      const userId = extractUserIdFromToken(authResponse.token);
      console.log('🆔 [LOGIN] Extracted User ID from fresh JWT:', userId);
      
      // STEP 5: Try to get fresh user details from API first (NO CACHE, NO MOCK DATA)
      if (userId) {
        try {
          console.log('🔄 [LOGIN] Making fresh API call for user details...');
          const userResponse = await apiService.getUserById(userId);
          
          if (userResponse) {
            console.log('✅ [LOGIN] Fresh user data retrieved from API!');
            
            // Validate user type - only allow Public or Private users to login
            if (userResponse.userType !== 'Public' && userResponse.userType !== 'Private') {
              console.warn('❌ [LOGIN] User type validation failed:', userResponse.userType);
              set({
                isLoading: false,
                error: 'Access denied. This app is only for Public or Private users. Please contact your organization if you believe this is an error.'
              });
              return false;
            }
            
            console.log('✅ [LOGIN] User type validation passed - User is', userResponse.userType);
            console.log('📋 [LOGIN] Creating fresh user object from API data...');
            
            // STEP 6: Create fresh user object from API data (NO MOCK DATA)
            const user: User = {
              id: userResponse.id,
              name: userResponse.name,
              email: userResponse.emailAddress,
              emailAddress: userResponse.emailAddress,
              mobile: userResponse.mobileNumber,
              mobileNumber: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
              cardNumber: userResponse.cardNumber,
              profileImage: userResponse.imageUrl,
              imageUrl: userResponse.imageUrl,
              userType: (userResponse.userType?.toLowerCase() === 'public' ? 'public' : 
                        userResponse.userType?.toLowerCase() === 'private' ? 'private' : 'passenger') as 'passenger' | 'public' | 'private',
              isActive: true,
              createdAt: new Date().toISOString(),
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: typeof userResponse.organization === 'object' ? userResponse.organization?.name : userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
            };

            console.log('👤 [LOGIN] Fresh user object created from API:', {
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

            // STEP 7: Store fresh user data
            await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
            await storageService.setItem(STORAGE_KEYS.USER_TYPE, userResponse.userType?.toLowerCase() || 'passenger');

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showWelcomePopup: true
            });

            // Load fresh card data after successful login
            try {
              const { useCardStore } = await import('./cardStore');
              const cardStore = useCardStore.getState();
              await cardStore.refreshCardData();
            } catch (cardError) {
              console.warn('⚠️ [LOGIN] Could not load fresh card data:', cardError);
            }

            console.log('🎉 [LOGIN] Fresh login successful with API data!');
            return true;
          } else {
            console.warn('⚠️ [LOGIN] API returned null, falling back to JWT data...');
          }
        } catch (userError: any) {
          console.warn('⚠️ [LOGIN] Fresh API call failed, falling back to JWT data:', userError.message);
        }
      }
      
      // STEP 8: JWT fallback (if API fails but token is valid)
      const jwtUser = extractUserFromJWT(authResponse.token, identifier);
      
      if (jwtUser) {
        console.log('✅ [LOGIN] Using JWT user data as fallback');
        console.log('👤 [LOGIN] JWT User data:', {
          id: jwtUser.id,
          name: jwtUser.name,
          mobile: jwtUser.mobile,
          email: jwtUser.email
        });
        
        // Store fresh auth data
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
        // STEP 9: Basic fallback (last resort)
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
      console.error('❌ [LOGIN] Fresh login with password failed:', error.message || error);
      set({
        isLoading: false,
        error: formatApiError(error, 'Login failed')
      });
      return false;
    }
  },

  logout: async () => {
    console.log('🚪 [LOGOUT] Starting complete logout process...');
    set({ isLoading: true });
    
    try {
      // STEP 1: Clear all auth-related data
      await storageService.clearAuthData();
      
      // STEP 2: Clear all additional app data to ensure fresh state
      const keysToRemove = [
        'temp_mobile',
        'temp_registration_data',
        'card_data',
        'trip_data',
        'transaction_cache',
        'history_cache',
        'bus_data_cache',
        'profile_cache'
      ];
      
      await Promise.all(
        keysToRemove.map(key => storageService.removeItem(key))
      );
      
      // STEP 3: Reset all store states
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showWelcomePopup: false
      });
      
      // STEP 4: Clear card store data
      try {
        const { useCardStore } = await import('./cardStore');
        const cardStore = useCardStore.getState();
        await cardStore.clearAllCardData();
      } catch (cardError) {
        console.warn('⚠️ [LOGOUT] Could not clear card store data:', cardError);
      }
      
      console.log('✅ [LOGOUT] Complete logout successful - all data cleared');
    } catch (error) {
      console.error('❌ [LOGOUT] Logout error:', error);
      // Force clear everything even if there's an error
      try {
        await storageService.clearAuthData();
        await storageService.removeItem('temp_mobile');
      } catch (clearError) {
        console.error('❌ [LOGOUT] Error clearing storage:', clearError);
      }
      
      // Force reset state anyway
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showWelcomePopup: false
      });
      
      console.log('⚠️ [LOGOUT] Forced logout completed despite errors');
    }
  },

  loadUserFromStorage: async () => {
    set({ isLoading: true });
    
    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await storageService.getItem<User>(STORAGE_KEYS.USER_DATA);
      const registrationComplete = await storageService.getItem<string>(STORAGE_KEYS.REGISTRATION_COMPLETE);
      
      console.log('🔍 [LOAD-USER] Loading user from storage...');
      console.log('🔍 [LOAD-USER] Token exists:', !!token);
      console.log('🔍 [LOAD-USER] User data exists:', !!userData);
      
      if (token && userData) {
        try {
          // Check if token is expired
          const { isTokenExpired } = await import('../utils/jwt');
          if (isTokenExpired(token)) {
            console.warn('⚠️ [LOAD-USER] Token is expired, clearing auth data');
            // Token is expired, clear auth data
            await storageService.clearAuthData();
            await storageService.removeItem(STORAGE_KEYS.REGISTRATION_COMPLETE);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            return;
          }
        } catch (jwtError) {
          console.warn('⚠️ [LOAD-USER] JWT validation failed, clearing auth data:', jwtError);
          // If JWT validation fails, clear auth data to be safe
          await storageService.clearAuthData();
          await storageService.removeItem(STORAGE_KEYS.REGISTRATION_COMPLETE);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }
        
        console.log('✅ [LOAD-USER] Valid token and user data found, setting authenticated state');
        
        // Check if user just registered - show welcome popup only if registration was just completed
        const shouldShowWelcomePopup = registrationComplete === 'true';
        
        // Clear the registration complete flag after first load
        if (shouldShowWelcomePopup) {
          await storageService.removeItem(STORAGE_KEYS.REGISTRATION_COMPLETE);
        }
        
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          showWelcomePopup: shouldShowWelcomePopup
        });
        
        console.log('🎉 [LOAD-USER] User authentication restored successfully');
      } else {
        console.log('ℹ️ [LOAD-USER] No valid token or user data found');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('❌ [LOAD-USER] Error loading user from storage:', error);
      // Clear potentially corrupted data
      try {
        await storageService.clearAuthData();
      } catch (clearError) {
        console.error('❌ [LOAD-USER] Error clearing corrupted data:', clearError);
      }
      
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
      // Use the new OTP verification API
      await apiService.verifyOTP(mobile, otp);
      set({ isLoading: false });
      return true;
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

  resetPassword: async (mobile: string, newPassword: string, confirmPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Use the new password reset API
      await apiService.resetPassword(mobile, newPassword, confirmPassword);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatApiError(error, 'Failed to reset password')
      });
      return false;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string, confirmNewPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Validate password confirmation
      if (newPassword !== confirmNewPassword) {
        return { success: false, message: 'New passwords do not match' };
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long' };
      }
      
      // Use the change password API
      const response = await apiService.changePassword({
        oldPassword,
        newPassword,
        confirmNewPassword
      });
      
      set({ isLoading: false });
      
      return {
        success: response.isSuccess,
        message: response.message
      };
    } catch (error: any) {
      const errorMessage = formatApiError(error, 'Failed to change password');
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  },

  registerUser: async (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }) => {
    console.log('🚀 [REGISTRATION] Starting fresh user registration process...');
    console.log('👤 [REGISTRATION] User data:', {
      name: userData.name,
      mobile: userData.mobile,
      email: userData.email,
      cardNumber: userData.cardNumber
    });
    
    set({ isLoading: true, error: null, isRegistering: true });
    
    try {
      // STEP 1: Clear all existing data for fresh session
      await clearAllAppData();
      
      // STEP 2: Get fresh authentication token for registration
      console.log('🔐 [REGISTRATION] Requesting fresh authentication token...');
      const authResponse = await apiService.getAuthToken(userData.mobile, '123456');
      
      // STEP 3: Extract user ID from fresh token
      const userId = extractUserIdFromToken(authResponse.token);
      console.log('🆔 [REGISTRATION] Extracted User ID from fresh JWT:', userId);
      
      if (userId) {
        try {
          // STEP 4: Make fresh API call to get existing user details (NO CACHE, NO MOCK DATA)
          console.log('🔄 [REGISTRATION] Making fresh API call to check user details...');
          const userResponse = await apiService.getUserById(userId);
          
          if (userResponse) {
            console.log('✅ [REGISTRATION] Fresh user data retrieved from API!');
            
            // STEP 5: Create fresh user object from API data (prioritize API over provided data)
            const user: User = {
              id: userResponse.id,
              name: userResponse.name || userData.name, // Use API name if available, fallback to provided
              email: userResponse.emailAddress || userData.email,
              mobile: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : (userData.sex || 'male'),
              cardNumber: userResponse.cardNumber || userData.cardNumber,
              profileImage: userResponse.imageUrl,
              userType: 'passenger' as const,
              isActive: true,
              createdAt: new Date().toISOString(),
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: typeof userResponse.organization === 'object' ? userResponse.organization?.name : userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
            };

            // STEP 6: Store fresh auth data and user data
            await storeAuthTokens(authResponse);
            await storageService.setItem(STORAGE_KEYS.USER_DATA, user);
            await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');
            await storageService.setItem(STORAGE_KEYS.REGISTRATION_COMPLETE, 'true');

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showWelcomePopup: true,
              isRegistering: false
            });

            // Load fresh card data after successful registration
            try {
              const { useCardStore } = await import('./cardStore');
              const cardStore = useCardStore.getState();
              await cardStore.refreshCardData();
            } catch (cardError) {
              console.warn('⚠️ [REGISTRATION] Could not load fresh card data:', cardError);
            }

            console.log('🎉 [REGISTRATION] Fresh registration completed successfully with API data!');
            return true;
          }
        } catch (userError: any) {
          console.warn('⚠️ [REGISTRATION] Fresh API call failed, creating new profile:', userError.message);
        }
        
        // STEP 7: If user doesn't exist in API, create fresh profile with provided data (NO MOCK DATA)
        console.log('📝 [REGISTRATION] Creating fresh user profile with provided data...');
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

        // STEP 8: Store fresh auth data and new user data
        await storeAuthTokens(authResponse);
        await storageService.setItem(STORAGE_KEYS.USER_DATA, newUser);
        await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');
        await storageService.setItem(STORAGE_KEYS.REGISTRATION_COMPLETE, 'true');

        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          showWelcomePopup: true,
          isRegistering: false
        });

        // Load fresh card data after successful registration
        try {
          const { useCardStore } = await import('./cardStore');
          const cardStore = useCardStore.getState();
          await cardStore.refreshCardData();
        } catch (cardError) {
          console.warn('⚠️ [REGISTRATION] Could not load fresh card data:', cardError);
        }

        console.log('🎉 [REGISTRATION] Fresh registration completed successfully with new profile!');
        return true;
      } else {
        throw new Error('Unable to extract user information from fresh authentication token');
      }
    } catch (error: any) {
      console.error('❌ [REGISTRATION] Fresh registration failed:', error.message || error);
      set({
        isLoading: false,
        error: formatApiError(error, 'Registration failed'),
        isRegistering: false
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
        userType: (userResponse.userType?.toLowerCase() === 'public' ? 'public' : 
                  userResponse.userType?.toLowerCase() === 'private' ? 'private' : 'passenger') as 'passenger' | 'public' | 'private',
        isActive: true, // Assuming active if we got the data
        createdAt: user.createdAt, // Keep original creation date
        dateOfBirth: userResponse.dateOfBirth,
        address: userResponse.address,
        passengerId: userResponse.passengerId,
        organizationId: userResponse.organizationId,
        organization: typeof userResponse.organization === 'object' ? userResponse.organization?.name : userResponse.organization,
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

  refreshUserFromToken: async () => {
    try {
      // Get stored auth token
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return false;
      }

      // Import JWT utilities
      const { extractUserInfoFromJWT, getUserDisplayContext, isTokenExpired } = await import('../utils/jwt');
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        await get().handleUnauthorized();
        return false;
      }

      // Extract user info from token
      const userInfo = extractUserInfoFromJWT(token);
      const displayContext = getUserDisplayContext(token);
      
      if (!userInfo || !displayContext) {
        return false;
      }

      const { user: currentUser } = get();
      
      // If we have a user ID, try to get fresh data from API
      if (userInfo.userId) {
        try {
          const userResponse = await apiService.getUserById(userInfo.userId);
          
          if (userResponse) {
            // Create updated user object with fresh API data
            const updatedUser: User = {
              id: userResponse.id,
              name: userResponse.name,
              email: userResponse.emailAddress,
              emailAddress: userResponse.emailAddress,
              mobile: userResponse.mobileNumber,
              mobileNumber: userResponse.mobileNumber,
              sex: userResponse.gender?.toLowerCase() === 'female' ? 'female' : 'male',
              cardNumber: userResponse.cardNumber,
              profileImage: userResponse.imageUrl,
              imageUrl: userResponse.imageUrl,
              userType: (userResponse.userType?.toLowerCase() === 'public' ? 'public' : 
                        userResponse.userType?.toLowerCase() === 'private' ? 'private' : 'passenger') as 'passenger' | 'public' | 'private',
              isActive: true,
              createdAt: currentUser?.createdAt || new Date().toISOString(),
              dateOfBirth: userResponse.dateOfBirth,
              address: userResponse.address,
              passengerId: userResponse.passengerId,
              organizationId: userResponse.organizationId,
              organization: typeof userResponse.organization === 'object' ? userResponse.organization?.name : userResponse.organization,
              balance: userResponse.balance,
              gender: userResponse.gender
            };

            // Update storage and state
            await storageService.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
            await storageService.setItem(STORAGE_KEYS.USER_TYPE, updatedUser.userType);
            
            set({
              user: updatedUser,
              isAuthenticated: true,
              error: null
            });

            return true;
          }
        } catch (apiError: any) {
          // Silent fallback to token data
        }
      }

      // Fallback to token-based user data
      const tokenBasedUser: User = {
        id: userInfo.userId || currentUser?.id || Date.now(),
        name: userInfo.name,
        mobile: currentUser?.mobile || '',
        email: currentUser?.email,
        sex: currentUser?.sex || 'male',
        userType: userInfo.userType as 'passenger' | 'public' | 'private',
        isActive: true,
        createdAt: currentUser?.createdAt || new Date().toISOString(),
        profileImage: currentUser?.profileImage,
        organizationId: userInfo.organizationId,
        organization: userInfo.organizationName,
        cardNumber: currentUser?.cardNumber,
        balance: currentUser?.balance
      };

      // Update storage and state
      await storageService.setItem(STORAGE_KEYS.USER_DATA, tokenBasedUser);
      await storageService.setItem(STORAGE_KEYS.USER_TYPE, tokenBasedUser.userType);
      
      set({
        user: tokenBasedUser,
        isAuthenticated: true,
        error: null
      });

      return true;
      
    } catch (error: any) {
      set({
        error: null // Don't show error to user, just use cached data silently
      });
      
      return false;
    }
  },

  handleUnauthorized: async () => {
    console.log('🚫 [AUTH] Handling unauthorized access - clearing session...');
    
    try {
      // Clear all auth data
      await storageService.clearAuthData();
      await storageService.removeItem(STORAGE_KEYS.REGISTRATION_COMPLETE);
      
      // Reset auth state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
        showWelcomePopup: false,
        isRegistering: false
      });
      
      console.log('✅ [AUTH] Session cleared successfully');
    } catch (error) {
      console.error('❌ [AUTH] Error clearing session:', error);
      
      // Force reset state even if storage clearing fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
        showWelcomePopup: false,
        isRegistering: false
      });
    }
  },

  hideWelcomePopup: () => {
    set({ showWelcomePopup: false });
  }
}));