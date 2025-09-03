/**
 * Centralized Date and Time Utility
 * 
 * This module provides a centralized system for all date and time operations
 * throughout the Go Bangladesh Passenger App. It includes formatting, parsing,
 * timezone handling, and utility functions.
 * 
 * Features:
 * - Dynamic timezone detection based on device settings
 * - Consistent date/time formatting across the app
 * - UTC to local time conversion
 * - Bangladesh-style date formatting (3-Sep-2025)
 */

// Dynamic timezone detection
const getDeviceTimezoneOffset = (): number => {
  const now = new Date();
  // Get timezone offset in minutes, convert to milliseconds
  // Note: getTimezoneOffset() returns offset in minutes, negative for ahead of UTC
  return -now.getTimezoneOffset() * 60 * 1000;
};

// Constants
export const DEVICE_TIMEZONE_OFFSET = getDeviceTimezoneOffset();

// Keep the Bangladesh timezone as backup/reference
export const BANGLADESH_TIMEZONE_OFFSET = 6 * 60 * 60 * 1000; // +6 hours for Bangladesh (BST)

// Use device timezone by default, but allow override
export const TIMEZONE_OFFSET = DEVICE_TIMEZONE_OFFSET;

export const MONTH_NAMES = {
  SHORT: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],
  LONG: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
} as const;

export const DAY_NAMES = {
  SHORT: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  LONG: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
} as const;

// Types
export interface DateTimeOptions {
  includeTime?: boolean;
  use24Hour?: boolean;
  includeSeconds?: boolean;
  useShortMonth?: boolean;
  includeYear?: boolean;
  includeDay?: boolean;
  timezone?: 'local' | 'utc' | 'bst'; // BST = Bangladesh Standard Time
}

export interface TimeFormatOptions {
  use24Hour?: boolean;
  includeSeconds?: boolean;
  includePeriod?: boolean; // AM/PM
}

/**
 * Core date/time creation functions
 */
export class DateTime {
  
  /**
   * Get current date and time
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Get current timestamp in milliseconds
   */
  static timestamp(): number {
    return Date.now();
  }

  /**
   * Get current date as ISO string
   */
  static nowISO(): string {
    return new Date().toISOString();
  }

  /**
   * Get current date with device timezone offset
   */
  static nowLocal(): Date {
    return new Date(Date.now() + TIMEZONE_OFFSET);
  }

  /**
   * Get current date with Bangladesh timezone offset (legacy)
   */
  static nowBST(): Date {
    return new Date(Date.now() + BANGLADESH_TIMEZONE_OFFSET);
  }

  /**
   * Get device timezone information
   */
  static getTimezoneInfo(): {
    offset: number;
    offsetHours: number;
    offsetMinutes: number;
    name: string;
  } {
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = Math.floor(offsetMinutes / 60);
    const remainingMinutes = offsetMinutes % 60;
    
    return {
      offset: DEVICE_TIMEZONE_OFFSET,
      offsetHours,
      offsetMinutes: remainingMinutes,
      name: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
    };
  }

  /**
   * Create date from various inputs
   */
  static from(input: string | number | Date): Date {
    return new Date(input);
  }

  /**
   * Parse date string and apply timezone if needed
   * @param dateString - UTC date string from API
   * @param applyLocalOffset - Apply device timezone offset (recommended)
   * @param forceBST - Force Bangladesh timezone (legacy)
   */
  static parse(dateString: string, applyLocalOffset: boolean = false, forceBST: boolean = false): Date {
    const date = new Date(dateString);
    if (forceBST) {
      return new Date(date.getTime() + BANGLADESH_TIMEZONE_OFFSET);
    }
    return applyLocalOffset ? new Date(date.getTime() + TIMEZONE_OFFSET) : date;
  }

  /**
   * Parse UTC date string to local time (most common use case)
   */
  static parseUTCToLocal(dateString: string): Date {
    return DateTime.parse(dateString, true);
  }

  /**
   * Check if a date is valid
   */
  static isValid(date: Date | string | number): boolean {
    const d = date instanceof Date ? date : new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }
}

/**
 * Date formatting functions
 */
export class DateFormatter {
  
  /**
   * Format date in the app's standard format: "DD-MMM-YYYY"
   * Example: "15-Jan-2024"
   */
  static standard(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    const day = d.getDate();
    const month = MONTH_NAMES.SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Format date with custom options
   */
  static custom(date: Date | string, options: DateTimeOptions = {}): string {
    const d = date instanceof Date ? date : new Date(date);
    const {
      includeTime = false,
      use24Hour = false,
      includeSeconds = false,
      useShortMonth = true,
      includeYear = true,
      includeDay = false
    } = options;

    let result = '';

    // Add day name if requested
    if (includeDay) {
      result += `${DAY_NAMES.LONG[d.getDay()]}, `;
    }

    // Add date part
    const day = d.getDate();
    const monthNames = useShortMonth ? MONTH_NAMES.SHORT : MONTH_NAMES.LONG;
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    result += `${day} ${month}`;
    if (includeYear) {
      result += ` ${year}`;
    }

    // Add time part if requested
    if (includeTime) {
      result += `, ${TimeFormatter.format(d, { use24Hour, includeSeconds })}`;
    }

    return result;
  }

  /**
   * Format date for ISO string (for API calls)
   */
  static toISO(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
  }

  /**
   * Format date for date input fields (YYYY-MM-DD)
   */
  static toDateInput(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Format date for display in history/transactions
   */
  static forHistory(date: Date | string): string {
    return DateFormatter.standard(date);
  }

  /**
   * Format date with locale-specific format
   */
  static locale(date: Date | string, locale: string = 'en-US'): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Time formatting functions
 */
export class TimeFormatter {
  
  /**
   * Format time in 12-hour format with AM/PM
   * Example: "2:30 PM"
   */
  static format12Hour(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Format time in 24-hour format
   * Example: "14:30"
   */
  static format24Hour(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Format time with custom options
   */
  static format(date: Date | string, options: TimeFormatOptions = {}): string {
    const d = date instanceof Date ? date : new Date(date);
    const {
      use24Hour = false,
      includeSeconds = false,
      includePeriod = !use24Hour
    } = options;

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    };

    if (includeSeconds) {
      timeOptions.second = '2-digit';
    }

    let timeString = d.toLocaleTimeString('en-US', timeOptions);

    // Remove AM/PM if not wanted
    if (!includePeriod && !use24Hour) {
      timeString = timeString.replace(/\s?(AM|PM)$/i, '');
    }

    return timeString;
  }

  /**
   * Format time for history with device timezone adjustment
   */
  static forHistory(dateString: string): string {
    const adjustedDate = DateTime.parseUTCToLocal(dateString);
    return TimeFormatter.format12Hour(adjustedDate);
  }
}

/**
 * Date/Time utility functions
 */
export class DateTimeUtils {
  
  /**
   * Calculate difference between two dates
   */
  static diff(date1: Date | string, date2: Date | string, unit: 'ms' | 's' | 'm' | 'h' | 'd' = 'ms'): number {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());

    switch (unit) {
      case 's': return Math.floor(diffMs / 1000);
      case 'm': return Math.floor(diffMs / (1000 * 60));
      case 'h': return Math.floor(diffMs / (1000 * 60 * 60));
      case 'd': return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      default: return diffMs;
    }
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date | string): boolean {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  /**
   * Check if date is yesterday
   */
  static isYesterday(date: Date | string): boolean {
    const d = date instanceof Date ? date : new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  }

  /**
   * Check if date is in current week
   */
  static isThisWeek(date: Date | string): boolean {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return d >= startOfWeek && d <= endOfWeek;
  }

  /**
   * Get relative time string (e.g., "2 hours ago", "yesterday")
   */
  static relative(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return DateFormatter.standard(d);
  }

  /**
   * Add time to date
   */
  static add(date: Date | string, amount: number, unit: 'ms' | 's' | 'm' | 'h' | 'd'): Date {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    
    switch (unit) {
      case 'ms': return new Date(d.getTime() + amount);
      case 's': return new Date(d.getTime() + (amount * 1000));
      case 'm': return new Date(d.getTime() + (amount * 1000 * 60));
      case 'h': return new Date(d.getTime() + (amount * 1000 * 60 * 60));
      case 'd': return new Date(d.getTime() + (amount * 1000 * 60 * 60 * 24));
      default: return d;
    }
  }

  /**
   * Start of day
   */
  static startOfDay(date: Date | string): Date {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * End of day
   */
  static endOfDay(date: Date | string): Date {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Generate filename with timestamp
   */
  static generateTimestampedFilename(prefix: string = 'file', extension: string = 'jpg'): string {
    const timestamp = DateTime.timestamp();
    return `${prefix}-${timestamp}.${extension}`;
  }
}

/**
 * Convenience functions for common use cases
 */

// Quick access to commonly used formatters
export const formatDate = DateFormatter.standard;
export const formatTime = TimeFormatter.format12Hour;
export const formatDateTime = (date: Date | string) => 
  DateFormatter.custom(date, { includeTime: true });

// Quick access to current date/time
export const now = DateTime.now;
export const nowISO = DateTime.nowISO;
export const timestamp = DateTime.timestamp;

// Timezone utilities
export const parseUTCToLocal = DateTime.parseUTCToLocal;
export const getTimezoneInfo = DateTime.getTimezoneInfo;

/**
 * Debug function to show timezone information
 */
export const debugTimezone = () => {
  const info = DateTime.getTimezoneInfo();
  const offsetSign = info.offsetHours >= 0 ? '+' : '-';
  const hours = Math.abs(info.offsetHours).toString().padStart(2, '0');
  const minutes = Math.abs(info.offsetMinutes).toString().padStart(2, '0');
  
  console.log('🌍 Timezone Debug Info:');
  console.log(`📍 Timezone: ${info.name}`);
  console.log(`⏰ UTC Offset: GMT${offsetSign}${hours}:${minutes}`);
  console.log(`📱 Device Offset (ms): ${info.offset}`);
  console.log(`🇧🇩 Bangladesh Offset (ms): ${BANGLADESH_TIMEZONE_OFFSET}`);
  console.log(`🕐 Current Local Time: ${DateTime.nowLocal().toLocaleString()}`);
  console.log(`🌐 Current UTC Time: ${DateTime.nowISO()}`);
  
  return info;
};

// Default export with all classes
export default {
  DateTime,
  DateFormatter,
  TimeFormatter,
  DateTimeUtils,
  formatDate,
  formatTime,
  formatDateTime,
  now,
  nowISO,
  timestamp,
  parseUTCToLocal,
  getTimezoneInfo,
  debugTimezone,
  TIMEZONE_OFFSET,
  DEVICE_TIMEZONE_OFFSET,
  BANGLADESH_TIMEZONE_OFFSET,
  MONTH_NAMES,
  DAY_NAMES
};
