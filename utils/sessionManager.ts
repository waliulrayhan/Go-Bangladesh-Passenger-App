/**
 * Session Manager - Handles fresh data loading and cache clearing
 * This utility ensures no mock data is used and all data is fresh from API calls
 */

import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';
import { STORAGE_KEYS } from './constants';
import { storageService } from './storage';

export class SessionManager {
  /**
   * Clear all app data for fresh login/registration
   * This ensures no cached or mock data persists
   */
  static async clearAllAppData(): Promise<void> {
    console.log('🧹 [SESSION] Starting complete app data clearance...');
    
    try {
      // Clear all storage keys
      const keysToRemove = [
        'user_data',
        'auth_token',
        'refresh_token',
        'user_type',
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
      
      // Clear auth store
      const authStore = useAuthStore.getState();
      authStore.logout();
      
      // Clear card store
      const cardStore = useCardStore.getState();
      await cardStore.clearAllCardData();
      
      console.log('✅ [SESSION] Complete app data clearance successful');
    } catch (error) {
      console.error('❌ [SESSION] Error during app data clearance:', error);
      throw error;
    }
  }

  /**
   * Initialize fresh session after successful login/registration
   * This loads all fresh data from APIs with no cache or mock data
   */
  static async initializeFreshSession(user: any): Promise<void> {
    console.log('🚀 [SESSION] Initializing fresh session...');
    
    try {
      // Load fresh card data
      const cardStore = useCardStore.getState();
      await cardStore.refreshCardData();
      
      console.log('✅ [SESSION] Fresh session initialization completed');
    } catch (error) {
      console.warn('⚠️ [SESSION] Some fresh data could not be loaded:', error);
      // Don't throw error - app should still work even if some data fails to load
    }
  }

  /**
   * Refresh all user data with fresh API calls
   * This ensures the UI shows the most up-to-date information
   */
  static async refreshAllUserData(): Promise<void> {
    try {
      // Refresh auth store data
      const authStore = useAuthStore.getState();
      await authStore.refreshUserData();
      
      // Refresh card store data
      const cardStore = useCardStore.getState();
      await cardStore.refreshCardData();
    } catch (error) {
      console.error('❌ [SESSION] Error refreshing user data:', error);
      throw error;
    }
  }

  /**
   * Check if session is valid and data is fresh
   */
  static async validateSession(): Promise<boolean> {
    console.log('🔍 [SESSION] Validating session...');
    
    try {
      const authStore = useAuthStore.getState();
      
      // Check if user is authenticated
      if (!authStore.isAuthenticated || !authStore.user) {
        console.log('❌ [SESSION] No valid authentication found');
        return false;
      }
      
      // Check if token exists and is valid
      const token = await storageService.getSecureItem('auth_token');
      if (!token) {
        console.log('❌ [SESSION] No auth token found');
        return false;
      }
      
      console.log('✅ [SESSION] Session validation successful');
      return true;
    } catch (error) {
      console.error('❌ [SESSION] Session validation failed:', error);
      return false;
    }
  }

  /**
   * Force logout and clear all data
   */
  static async forceLogout(): Promise<void> {
    console.log('🚪 [SESSION] Forcing logout...');
    
    try {
      await SessionManager.clearAllAppData();
      console.log('✅ [SESSION] Force logout completed');
    } catch (error) {
      console.error('❌ [SESSION] Force logout failed:', error);
      throw error;
    }
  }

  /**
   * Initialize session with token-based refresh
   * This should be called when app starts or when returning to app
   */
  static async initializeSessionWithToken(): Promise<boolean> {
    try {
      // Check if user is authenticated
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return false;
      }

      // Check token validity
      const { isTokenExpired } = await import('./jwt');
      
      if (isTokenExpired(token)) {
        const authStore = useAuthStore.getState();
        await authStore.handleUnauthorized();
        return false;
      }

      // Refresh user data from token
      const authStore = useAuthStore.getState();
      const refreshSuccess = await authStore.refreshUserFromToken();
      
      if (refreshSuccess) {
        // Load fresh card data
        try {
          const cardStore = useCardStore.getState();
          await cardStore.refreshCardData();
        } catch (cardError) {
          // Silent failure for card data
        }
        
        return true;
      } else {
        return false;
      }
      
    } catch (error) {
      console.error('❌ [SESSION] Error initializing session with token:', error);
      return false;
    }
  }

  /**
   * Refresh all user data based on token information
   * This ensures the UI shows fresh data for the current user type
   */
  static async refreshAllDataFromToken(): Promise<boolean> {
    try {
      // Get current token and user info
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return false;
      }

      // Get user context from token
      const { extractUserInfoFromJWT, getUserDisplayContext } = await import('./jwt');
      const userInfo = extractUserInfoFromJWT(token);
      const displayContext = getUserDisplayContext(token);
      
      if (!userInfo || !displayContext) {
        return false;
      }
      
      // Refresh auth store data
      const authStore = useAuthStore.getState();
      const userRefreshSuccess = await authStore.refreshUserFromToken();
      
      if (!userRefreshSuccess) {
        return false;
      }

      // Refresh card store data
      try {
        const cardStore = useCardStore.getState();
        await cardStore.refreshCardData();
      } catch (cardError) {
        // Silent failure for card data
      }

      return true;
      
    } catch (error) {
      console.error('❌ [SESSION] Error refreshing data from token:', error);
      return false;
    }
  }
}

export default SessionManager;
