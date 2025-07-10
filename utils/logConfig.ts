/**
 * Logging Configuration
 * Control the verbosity of console logs throughout the app
 */

// Log levels: 0 = OFF, 1 = ERROR, 2 = WARN, 3 = INFO, 4 = DEBUG
export const LOG_CONFIG = {
  // Global log level - set to 1 for production, 4 for full debugging
  GLOBAL_LEVEL: 3,
  
  // Module-specific log levels (override global if needed)
  AUTH: 3,          // Authentication operations
  API: 2,           // API calls (reduced by default)
  TOKEN_REFRESH: 2, // Token refresh operations (reduced)
  HISTORY: 2,       // History component operations (reduced)
  CARD: 2,          // Card operations (reduced)
  SESSION: 2,       // Session management (reduced)
  TRIP: 3,          // Trip operations
  NFC: 3,           // NFC operations
  STORAGE: 4,       // Storage operations (debug only)
  NAVIGATION: 4,    // Navigation operations (debug only)
};

/**
 * Check if logging is enabled for a specific module and level
 */
export function shouldLog(module: keyof typeof LOG_CONFIG, level: number): boolean {
  const moduleLevel = LOG_CONFIG[module] ?? LOG_CONFIG.GLOBAL_LEVEL;
  return level <= moduleLevel;
}

/**
 * Centralized logging utility with level control
 */
export const Logger = {
  error: (module: keyof typeof LOG_CONFIG, message: string, data?: any) => {
    if (shouldLog(module, 1)) {
      console.log(`❌ [${module}] ${message}`, data || '');
    }
  },
  
  warn: (module: keyof typeof LOG_CONFIG, message: string, data?: any) => {
    if (shouldLog(module, 2)) {
      console.log(`⚠️ [${module}] ${message}`, data || '');
    }
  },
  
  info: (module: keyof typeof LOG_CONFIG, message: string, data?: any) => {
    if (shouldLog(module, 3)) {
      console.log(`ℹ️ [${module}] ${message}`, data || '');
    }
  },
  
  debug: (module: keyof typeof LOG_CONFIG, message: string, data?: any) => {
    if (shouldLog(module, 4)) {
      console.log(`🔍 [${module}] ${message}`, data || '');
    }
  },
  
  success: (module: keyof typeof LOG_CONFIG, message: string, data?: any) => {
    if (shouldLog(module, 2)) {
      console.log(`✅ [${module}] ${message}`, data || '');
    }
  }
};
