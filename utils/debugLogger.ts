/**
 * Debug Logger Utility
 * Provides controlled logging for better terminal visibility
 */

// Log levels: 0 = OFF, 1 = ERROR, 2 = WARN, 3 = INFO, 4 = DEBUG
const LOG_LEVEL = 3; // Set to 1 for production, 4 for full debugging

export const DebugLogger = {
  // Critical operations only
  auth: (message: string, data?: any) => {
    if (LOG_LEVEL >= 3) {
      console.log(`🔐 [AUTH] ${message}`, data ? data : '');
    }
  },

  // User operations
  user: (message: string, data?: any) => {
    if (LOG_LEVEL >= 3) {
      console.log(`👤 [USER] ${message}`, data ? data : '');
    }
  },

  // API operations - reduced verbosity
  api: (message: string, data?: any) => {
    if (LOG_LEVEL >= 4) {
      console.log(`🌐 [API] ${message}`, data ? data : '');
    }
  },

  // Profile operations
  profile: (message: string, data?: any) => {
    if (LOG_LEVEL >= 3) {
      console.log(`📋 [PROFILE] ${message}`, data ? data : '');
    }
  },

  // Success messages - essential only
  success: (message: string, data?: any) => {
    if (LOG_LEVEL >= 2) {
      console.log(`✅ ${message}`, data ? data : '');
    }
  },

  // Error messages - always show
  error: (message: string, data?: any) => {
    if (LOG_LEVEL >= 1) {
      console.log(`❌ [ERROR] ${message}`, data ? data : '');
    }
  },

  // Warning messages - show by default
  warning: (message: string, data?: any) => {
    if (LOG_LEVEL >= 2) {
      console.log(`⚠️ [WARNING] ${message}`, data ? data : '');
    }
  },

  // Info messages - controlled
  info: (message: string, data?: any) => {
    if (LOG_LEVEL >= 3) {
      console.log(`ℹ️ [INFO] ${message}`, data ? data : '');
    }
  },

  // Debug messages - only in debug mode
  debug: (message: string, data?: any) => {
    if (LOG_LEVEL >= 4) {
      console.log(`🔍 [DEBUG] ${message}`, data ? data : '');
    }
  },

  // Essential operation markers
  separator: () => {
    if (LOG_LEVEL >= 3) {
      console.log('═'.repeat(50));
    }
  },

  header: (title: string) => {
    if (LOG_LEVEL >= 2) {
      console.log('═'.repeat(50));
      console.log(`🚀 ${title.toUpperCase()}`);
      console.log('═'.repeat(50));
    }
  },

  footer: () => {
    if (LOG_LEVEL >= 2) {
      console.log('═'.repeat(50));
      console.log('🎉 OPERATION COMPLETED');
      console.log('═'.repeat(50));
    }
  },

  // Data table - debug only
  dataTable: (title: string, data: Record<string, any>) => {
    if (LOG_LEVEL >= 4) {
      console.log(`📊 ${title}:`);
      console.table(data);
    }
  }
};
