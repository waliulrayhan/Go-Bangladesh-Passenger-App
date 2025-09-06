// Environment configuration for the app
// This file contains environment-specific constants and should be replaced
// with proper environment variable management in production
export const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thegobd.com',
  // Timeouts
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  // Features
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true' || __DEV__,
  // App Configuration
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
} as const;
// Type definitions for environment
export type AppEnvironment = 'development' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'dev';
