/**
 * Timezone Test Utility
 * 
 * This file demonstrates the new dynamic timezone handling.
 * You can import and use this in your app to test the functionality.
 */

import { debugTimezone, formatDate, formatTime, getTimezoneInfo, parseUTCToLocal } from './dateTime';

/**
 * Test the new timezone functionality
 * Call this function to see how dates are formatted with device timezone
 */
export const testTimezoneFeatures = () => {
  console.log('🧪 Testing New Timezone Features');
  console.log('================================');
  
  // Show timezone debug info
  debugTimezone();
  
  console.log('\n📅 Date Formatting Tests:');
  console.log('========================');
  
  // Test current date formatting
  const now = new Date();
  console.log(`📍 Current Date (Old format): ${now.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getFullYear()}`);
  console.log(`🆕 Current Date (New format): ${formatDate(now)}`);
  
  // Test with sample UTC date
  const sampleUTCDate = "2025-09-03T10:30:00Z"; // UTC time
  console.log(`\n⏰ UTC Date from API: ${sampleUTCDate}`);
  console.log(`🌍 Converted to Local: ${formatDate(parseUTCToLocal(sampleUTCDate))} ${formatTime(parseUTCToLocal(sampleUTCDate))}`);
  
  console.log('\n🔍 Comparison:');
  console.log('=============');
  const utcDate = new Date(sampleUTCDate);
  const localDate = parseUTCToLocal(sampleUTCDate);
  
  console.log(`UTC Time: ${utcDate.toISOString()}`);
  console.log(`Local Time: ${localDate.toISOString()}`);
  console.log(`Difference (hours): ${(localDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)}`);
  
  return {
    timezone: getTimezoneInfo(),
    utcExample: sampleUTCDate,
    localExample: formatDate(parseUTCToLocal(sampleUTCDate)) + ' ' + formatTime(parseUTCToLocal(sampleUTCDate))
  };
};

/**
 * Format examples for documentation
 */
export const getFormattingExamples = () => {
  const sampleDate = new Date('2025-09-03T14:30:00');
  
  return {
    oldFormat: `${sampleDate.getDate()} ${'Sep'} ${sampleDate.getFullYear()}`, // "3 Sep 2025"
    newFormat: formatDate(sampleDate), // "3-Sep-2025"
    timeFormat: formatTime(sampleDate), // "2:30 PM" (device timezone)
  };
};

export default {
  testTimezoneFeatures,
  getFormattingExamples
};
