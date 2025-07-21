import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';
import { STORAGE_KEYS } from '../utils/constants';
import { storageService } from '../utils/storage';

/**
 * Custom hook to handle token-based data refresh
 * This should be used in components that need to show fresh data
 */
export const useTokenRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const { user, isAuthenticated } = useAuthStore();
  const { card, transactions, trips } = useCardStore();

  /**
   * Manually trigger a refresh of all user data based on token
   */
  const refreshAllData = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      console.warn('⚠️ [TOKEN-REFRESH] User not authenticated, skipping refresh');
      return false;
    }

    setIsRefreshing(true);
    
    try {
      // Refresh auth data
      const authStore = useAuthStore.getState();
      const authSuccess = await authStore.refreshUserFromToken();
      
      // Refresh card data
      const cardStore = useCardStore.getState();
      await cardStore.refreshCardData();
      
      if (authSuccess) {
        setLastRefreshTime(new Date());
      }
      
      return authSuccess;
    } catch (error) {
      console.error('❌ [TOKEN-REFRESH] Error during manual refresh:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Get user display context based on current token
   */
  const getUserContext = async () => {
    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return null;
      }

      const { getUserDisplayContext } = await import('../utils/jwt');
      return getUserDisplayContext(token);
    } catch (error) {
      console.error('❌ [TOKEN-REFRESH] Error getting user context:', error);
      return null;
    }
  };

  /**
   * Check if data should be refreshed (e.g., on app focus or periodically)
   */
  const shouldRefreshData = async (): Promise<boolean> => {
    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return false;
      }

      const { shouldRefreshUserData } = await import('../utils/jwt');
      return shouldRefreshUserData(token);
    } catch (error) {
      console.error('❌ [TOKEN-REFRESH] Error checking refresh need:', error);
      return false;
    }
  };

  /**
   * Auto-refresh data when component mounts or user changes
   */
  useEffect(() => {
    const autoRefresh = async () => {
      if (!isAuthenticated || !user) {
        return;
      }

      const shouldRefresh = await shouldRefreshData();
      
      if (shouldRefresh) {
        await refreshAllData();
      }
    };

    autoRefresh();
  }, [isAuthenticated, user?.id]); // Trigger when auth state or user ID changes

  return {
    isRefreshing,
    lastRefreshTime,
    refreshAllData,
    getUserContext,
    shouldRefreshData,
    // Expose current state for components to use
    user,
    card,
    transactions,
    trips,
    isAuthenticated
  };
};

/**
 * Hook specifically for getting user display context
 */
export const useUserContext = () => {
  const [userContext, setUserContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const loadUserContext = async () => {
      if (!isAuthenticated) {
        setUserContext(null);
        setIsLoading(false);
        return;
      }

      try {
        const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
        
        if (!token) {
          setUserContext(null);
          setIsLoading(false);
          return;
        }

        const { getUserDisplayContext } = await import('../utils/jwt');
        const context = getUserDisplayContext(token);
        
        setUserContext(context);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ [USER-CONTEXT] Error loading user context:', error);
        setUserContext(null);
        setIsLoading(false);
      }
    };

    loadUserContext();
  }, [isAuthenticated, user?.id]);

  return {
    userContext,
    isLoading,
    isAuthenticated,
    user
  };
};
