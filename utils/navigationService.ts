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
   * Force redirect to welcome screen with multiple fallback strategies
   * This is used when token expires and user needs to be logged out
   */
  public async forceRedirectToWelcome(): Promise<boolean> {
    if (this.isNavigating) {
      console.log('🔄 [NAV SERVICE] Already navigating, skipping...');
      return false;
    }

    if (this.redirectAttempts >= this.MAX_REDIRECT_ATTEMPTS) {
      console.log('🚫 [NAV SERVICE] Max redirect attempts reached, resetting...');
      this.redirectAttempts = 0;
      return false;
    }

    this.isNavigating = true;
    this.redirectAttempts++;

    console.log(`🔄 [NAV SERVICE] Attempting forced redirect (attempt ${this.redirectAttempts}/${this.MAX_REDIRECT_ATTEMPTS})...`);

    try {
      // Strategy 1: Dismiss all and replace
      console.log('🔄 [NAV SERVICE] Strategy 1: Dismiss all and replace');
      router.dismissAll();
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/');
      
      console.log('✅ [NAV SERVICE] Strategy 1 successful');
      this.resetState();
      return true;
    } catch (error1) {
      console.warn('⚠️ [NAV SERVICE] Strategy 1 failed:', error1);

      try {
        // Strategy 2: Direct push to root
        console.log('🔄 [NAV SERVICE] Strategy 2: Direct push to root');
        router.push('/');
        
        console.log('✅ [NAV SERVICE] Strategy 2 successful');
        this.resetState();
        return true;
      } catch (error2) {
        console.warn('⚠️ [NAV SERVICE] Strategy 2 failed:', error2);

        try {
          // Strategy 3: Navigate to specific auth screen
          console.log('🔄 [NAV SERVICE] Strategy 3: Navigate to auth screen');
          router.navigate('/(auth)/passenger-login');
          
          console.log('✅ [NAV SERVICE] Strategy 3 successful');
          this.resetState();
          return true;
        } catch (error3) {
          console.error('💥 [NAV SERVICE] All navigation strategies failed:', {
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
