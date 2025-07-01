// Development utility to reset statistics for testing
import { STORAGE_KEYS } from './constants';
import { storageService } from './storage';

export const resetAllStatistics = async () => {
  try {
    await storageService.removeItem(`${STORAGE_KEYS.DRIVER_HELPER_SESSION}_stats`);
    await storageService.removeItem(`${STORAGE_KEYS.DRIVER_HELPER_SESSION}_alltime_stats`);
    console.log('All statistics have been reset');
  } catch (error) {
    console.error('Error resetting statistics:', error);
  }
};

export const debugStatistics = async () => {
  try {
    const todayStats = await storageService.getItem(`${STORAGE_KEYS.DRIVER_HELPER_SESSION}_stats`);
    const allTimeStats = await storageService.getItem(`${STORAGE_KEYS.DRIVER_HELPER_SESSION}_alltime_stats`);
    
    console.log('=== STATISTICS DEBUG ===');
    console.log('Today Stats:', todayStats);
    console.log('All-Time Stats:', allTimeStats);
    console.log('========================');
  } catch (error) {
    console.error('Error debugging statistics:', error);
  }
};
