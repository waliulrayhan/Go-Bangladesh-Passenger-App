import { ENV_CONFIG, LogLevel } from './environment';
/**
 * Secure logging service that can be disabled in production
 * and provides different log levels
 */
class LoggerService {
  private isLoggingEnabled: boolean;
  constructor() {
    this.isLoggingEnabled = ENV_CONFIG.ENABLE_LOGGING;
  }
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`;
  }
  debug(message: string, context?: string, data?: any): void {
    if (!this.isLoggingEnabled) return;
    console.log(this.formatMessage('debug', message, context), data || '');
  }
  info(message: string, context?: string, data?: any): void {
    if (!this.isLoggingEnabled) return;
    console.log(this.formatMessage('info', message, context), data || '');
  }
  warn(message: string, context?: string, data?: any): void {
    if (!this.isLoggingEnabled) return;
    console.warn(this.formatMessage('warn', message, context), data || '');
  }
  error(message: string, context?: string, error?: any): void {
    if (!this.isLoggingEnabled) return;
    console.error(this.formatMessage('error', message, context), error || '');
  }
  /**
   * Log only in development mode
   */
  dev(message: string, context?: string, data?: any): void {
    if (!__DEV__ || !this.isLoggingEnabled) return;
    console.log(this.formatMessage('dev', message, context), data || '');
  }
}
export const logger = new LoggerService();
