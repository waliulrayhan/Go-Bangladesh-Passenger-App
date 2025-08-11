import { router } from 'expo-router';

/**
 * Navigation Service for handling forced redirects and navigation issues
 * This service provides utilities for handling navigation when token expires
 */
class NavigationService {
  private static instance: NavigationService;
  private isNavigating = false;
  private redirectAttempts = 0;
  private readonly MAX_REDIRECT_ATTEMPTS = 3;

  private constructor() {}

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Safe logout redirect with minimal navigation conflicts
   * Designed specifically for logout scenarios to avoid POP_TO_TOP errors
   */
  public async safeLogoutRedirect(): Promise<boolean> {
    if (this.isNavigating) {
      console.log('🔄 [NAV] Already navigating during logout, skipping...');
      return false;
    }

    this.isNavigating = true;
    console.log('🔄 [NAV] Performing safe logout redirect...');

    try {
      // Strategy 1: Simple replace without dismissAll to avoid POP_TO_TOP
      console.log('🔄 [NAV] Logout Strategy 1: Direct replace');
      router.replace('/');
      
      console.log('✅ [NAV] Logout redirect successful');
      this.resetState();
      return true;
    } catch (error1) {
      console.warn('⚠️ [NAV] Logout Strategy 1 failed:', error1);

      try {
        // Strategy 2: Push to root (creates new stack)
        console.log('🔄 [NAV] Logout Strategy 2: Push to root');
        router.push('/');
        
        console.log('✅ [NAV] Logout Strategy 2 successful');
        this.resetState();
        return true;
      } catch (error2) {
        console.warn('⚠️ [NAV] Logout Strategy 2 failed:', error2);

        try {
          // Strategy 3: Navigate to login screen directly
          console.log('🔄 [NAV] Logout Strategy 3: Navigate to login');
          router.navigate('/(auth)/passenger-login');
          
          console.log('✅ [NAV] Logout Strategy 3 successful');
          this.resetState();
          return true;
        } catch (error3) {
          console.error('💥 [NAV] All logout navigation strategies failed:', {
            strategy1: error1,
            strategy2: error2,
            strategy3: error3
          });

          this.resetState();
          return false;
        }
      }
    }
  }

  /**
   * Force redirect to welcome screen with multiple fallback strategies
   * This is used when token expires and user needs to be logged out
   */
  public async forceRedirectToWelcome(): Promise<boolean> {
    if (this.isNavigating) {
      console.log('🔄 [NAV] Already navigating, skipping...');
      return false;
    }

    if (this.redirectAttempts >= this.MAX_REDIRECT_ATTEMPTS) {
      console.log('🚫 [NAV] Max redirect attempts reached, resetting...');
      this.redirectAttempts = 0;
      return false;
    }

    this.isNavigating = true;
    this.redirectAttempts++;

    console.log(`🔄 [NAV] Attempting forced redirect (attempt ${this.redirectAttempts}/${this.MAX_REDIRECT_ATTEMPTS})...`);

    try {
      // Strategy 1: Dismiss all and replace
      console.log('🔄 [NAV] Strategy 1: Dismiss all and replace');
      router.dismissAll();
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/');
      
      console.log('✅ [NAV] Strategy 1 successful');
      this.resetState();
      return true;
    } catch (error1) {
      console.warn('⚠️ [NAV] Strategy 1 failed:', error1);

      try {
        // Strategy 2: Direct push to root
        console.log('🔄 [NAV] Strategy 2: Direct push to root');
        router.push('/');
        
        console.log('✅ [NAV] Strategy 2 successful');
        this.resetState();
        return true;
      } catch (error2) {
        console.warn('⚠️ [NAV] Strategy 2 failed:', error2);

        try {
          // Strategy 3: Navigate to specific auth screen
          console.log('🔄 [NAV] Strategy 3: Navigate to auth screen');
          router.navigate('/(auth)/passenger-login');
          
          console.log('✅ [NAV] Strategy 3 successful');
          this.resetState();
          return true;
        } catch (error3) {
          console.error('💥 [NAV] All navigation strategies failed:', {
            strategy1: error1,
            strategy2: error2,
            strategy3: error3
          });

          this.resetState();
          return false;
        }
      }
    }
  }

  /**
   * Reset navigation state
   */
  private resetState(): void {
    this.isNavigating = false;
    this.redirectAttempts = 0;
  }

  /**
   * Check if navigation is currently in progress
   */
  public isNavigationInProgress(): boolean {
    return this.isNavigating;
  }

  /**
   * Reset redirect attempts (useful for testing or after successful login)
   */
  public resetRedirectAttempts(): void {
    this.redirectAttempts = 0;
  }
}

export const navigationService = NavigationService.getInstance();
