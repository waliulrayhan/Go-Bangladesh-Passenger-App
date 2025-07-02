/**
 * Debug Logger Utility
 * Provides colored console logging for better terminal visibility
 */

export const DebugLogger = {
  auth: (message: string, data?: any) => {
    console.log(`🔐 [AUTH] ${message}`, data ? data : '');
  },

  user: (message: string, data?: any) => {
    console.log(`👤 [USER] ${message}`, data ? data : '');
  },

  api: (message: string, data?: any) => {
    console.log(`🌐 [API] ${message}`, data ? data : '');
  },

  profile: (message: string, data?: any) => {
    console.log(`📋 [PROFILE] ${message}`, data ? data : '');
  },

  success: (message: string, data?: any) => {
    console.log(`✅ [SUCCESS] ${message}`, data ? data : '');
  },

  error: (message: string, data?: any) => {
    console.log(`❌ [ERROR] ${message}`, data ? data : '');
  },

  warning: (message: string, data?: any) => {
    console.log(`⚠️ [WARNING] ${message}`, data ? data : '');
  },

  info: (message: string, data?: any) => {
    console.log(`ℹ️ [INFO] ${message}`, data ? data : '');
  },

  separator: () => {
    console.log('═'.repeat(80));
  },

  header: (title: string) => {
    console.log('═'.repeat(80));
    console.log(`🚀 ${title.toUpperCase()}`);
    console.log('═'.repeat(80));
  },

  footer: () => {
    console.log('═'.repeat(80));
    console.log('🎉 OPERATION COMPLETED');
    console.log('═'.repeat(80));
  },

  dataTable: (title: string, data: Record<string, any>) => {
    console.log(`📊 ${title}:`);
    console.table(data);
  }
};
