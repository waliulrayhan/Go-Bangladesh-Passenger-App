/**
 * Session Manager - Handles fresh data loading and cache clearing
 * This utility ensures no mock data is used and all data is fresh from API calls
 */

import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';

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
    console.log('🔄 [SESSION] Refreshing all user data...');
    
    try {
      // Refresh auth store data
      const authStore = useAuthStore.getState();
      await authStore.refreshUserData();
      
      // Refresh card store data
      const cardStore = useCardStore.getState();
      await cardStore.refreshCardData();
      
      console.log('✅ [SESSION] All user data refreshed successfully');
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
    console.log('🚀 [SESSION] Initializing session with token-based refresh...');
    
    try {
      // Check if user is authenticated
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        console.log('ℹ️ [SESSION] No auth token found - user not authenticated');
        return false;
      }

      // Check token validity
      const { isTokenExpired } = await import('./jwt');
      
      if (isTokenExpired(token)) {
        console.warn('⚠️ [SESSION] Token is expired - clearing session');
        const authStore = useAuthStore.getState();
        await authStore.handleUnauthorized();
        return false;
      }

      // Refresh user data from token
      const authStore = useAuthStore.getState();
      const refreshSuccess = await authStore.refreshUserFromToken();
      
      if (refreshSuccess) {
        console.log('✅ [SESSION] User data refreshed successfully from token');
        
        // Load fresh card data
        try {
          const cardStore = useCardStore.getState();
          await cardStore.refreshCardData();
          console.log('✅ [SESSION] Card data refreshed successfully');
        } catch (cardError) {
          console.warn('⚠️ [SESSION] Could not refresh card data:', cardError);
        }
        
        return true;
      } else {
        console.warn('⚠️ [SESSION] Failed to refresh user data from token');
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
    console.log('🔄 [SESSION] Refreshing all data from token...');
    
    try {
      // Get current token and user info
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        console.warn('⚠️ [SESSION] No auth token found for refresh');
        return false;
      }

      // Get user context from token
      const { extractUserInfoFromJWT, getUserDisplayContext } = await import('./jwt');
      const userInfo = extractUserInfoFromJWT(token);
      const displayContext = getUserDisplayContext(token);
      
      if (!userInfo || !displayContext) {
        console.warn('⚠️ [SESSION] Failed to extract user info from token');
        return false;
      }

      console.log('🎯 [SESSION] Refreshing data for user type:', userInfo.userType);
      console.log('🏢 [SESSION] Organization:', userInfo.organizationName);
      
      // Refresh auth store data
      const authStore = useAuthStore.getState();
      const userRefreshSuccess = await authStore.refreshUserFromToken();
      
      if (!userRefreshSuccess) {
        console.warn('⚠️ [SESSION] Failed to refresh user data');
        return false;
      }

      // Refresh card store data
      try {
        const cardStore = useCardStore.getState();
        await cardStore.refreshCardData();
        console.log('✅ [SESSION] Card data refreshed');
      } catch (cardError) {
        console.warn('⚠️ [SESSION] Could not refresh card data:', cardError);
      }

      console.log('🎉 [SESSION] All data refreshed successfully from token');
      return true;
      
    } catch (error) {
      console.error('❌ [SESSION] Error refreshing all data from token:', error);
      return false;
    }
  }
}

export default SessionManager;
