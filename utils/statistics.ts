import { storageService } from './storage';

export interface SessionStats {
  totalTapIns: number;
  totalTapOuts: number;
  totalRevenue: number;
  lastUpdated: string;
}

export interface StoredStats {
  date: string;
  stats: SessionStats;
}

/**
 * Generate realistic statistics based on session time, current time, and bus operations
 */
export const generateRealisticStats = (sessionStartTime: Date): SessionStats => {
  const now = new Date();
  const sessionDurationHours = Math.max(0.25, (now.getTime() - sessionStartTime.getTime()) / (1000 * 60 * 60));
  
  // Base statistics on time of day and session duration
  const currentHour = now.getHours();
  let basePassengersPerHour = 15; // Default base
  
  // Rush hours have more passengers
  if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
    basePassengersPerHour = 35; // Morning/evening rush
  } else if (currentHour >= 10 && currentHour <= 16) {
    basePassengersPerHour = 20; // Day time
  } else if (currentHour >= 20 || currentHour <= 6) {
    basePassengersPerHour = 8; // Night time
  }
  
  // Calculate realistic tap ins based on session duration
  const estimatedTapIns = Math.floor(sessionDurationHours * basePassengersPerHour * (0.8 + Math.random() * 0.4));
  const totalTapIns = Math.max(estimatedTapIns, Math.floor(sessionDurationHours * 5)); // Minimum 5 per hour
  
  // Tap outs are typically 70-85% of tap ins (some passengers forget to tap out)
  const tapOutRate = 0.70 + Math.random() * 0.15;
  const totalTapOuts = Math.floor(totalTapIns * tapOutRate);
  
  // Revenue calculation based on realistic fare structure
  // Base fare: 20 BDT, average journey: 25-45 BDT
  const avgFarePerTrip = 20 + Math.random() * 25;
  const totalRevenue = Math.floor(totalTapOuts * avgFarePerTrip);
  
  return {
    totalTapIns,
    totalTapOuts,
    totalRevenue,
    lastUpdated: now.toISOString()
  };
};

/**
 * Generate immediate realistic data for testing (shows data right away)
 */
export const generateImmediateRealisticStats = (): SessionStats => {
  // Generate data as if the person has been working for 2-4 hours
  const hoursWorked = 2 + Math.random() * 2; // 2-4 hours
  const currentHour = new Date().getHours();
  
  let basePassengersPerHour = 15;
  if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
    basePassengersPerHour = 35;
  } else if (currentHour >= 10 && currentHour <= 16) {
    basePassengersPerHour = 20;
  } else if (currentHour >= 20 || currentHour <= 6) {
    basePassengersPerHour = 8;
  }
  
  const totalTapIns = Math.floor(hoursWorked * basePassengersPerHour * (0.8 + Math.random() * 0.4));
  const tapOutRate = 0.70 + Math.random() * 0.15;
  const totalTapOuts = Math.floor(totalTapIns * tapOutRate);
  const avgFarePerTrip = 25 + Math.random() * 20;
  const totalRevenue = Math.floor(totalTapOuts * avgFarePerTrip);
  
  return {
    totalTapIns,
    totalTapOuts,
    totalRevenue,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Load session statistics from storage or generate new ones
 */
export const loadSessionStats = async (sessionKey: string, sessionStartTime?: Date): Promise<SessionStats> => {
  try {
    const existingStats = await storageService.getItem<StoredStats>(`${sessionKey}_stats`);
    
    if (existingStats) {
      // Check if it's the same day
      const statsDate = new Date(existingStats.date).toDateString();
      const today = new Date().toDateString();
      
      if (statsDate === today) {
        console.log('Found existing today stats:', existingStats.stats);
        return existingStats.stats;
      }
    }
    
    // Generate new stats if no existing data or different day
    if (sessionStartTime) {
      console.log('Generating new today stats for session start:', sessionStartTime);
      const newStats = generateImmediateRealisticStats(); // Use immediate data for better demo
      
      // Save the new stats immediately
      await saveSessionStats(sessionKey, newStats);
      
      return newStats;
    }
    
    // Fallback to empty stats
    console.log('Using fallback empty stats');
    return {
      totalTapIns: 0,
      totalTapOuts: 0,
      totalRevenue: 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading session stats:', error);
    return {
      totalTapIns: 0,
      totalTapOuts: 0,
      totalRevenue: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Load all-time statistics (accumulated across all sessions)
 */
export const loadAllTimeStats = async (sessionKey: string, sessionStartTime?: Date): Promise<SessionStats> => {
  try {
    // Load all-time stats
    const allTimeStats = await storageService.getItem<SessionStats>(`${sessionKey}_alltime_stats`);
    
    if (allTimeStats) {
      console.log('Found existing all-time stats:', allTimeStats);
      return allTimeStats;
    }
    
    // If no all-time stats exist, generate some realistic historical data
    if (sessionStartTime) {
      console.log('Generating new all-time stats');
      // Generate realistic historical data (simulate previous sessions)
      const daysWorked = 15 + Math.floor(Math.random() * 45); // 15-60 days
      const avgTapInsPerDay = 120 + Math.floor(Math.random() * 80); // 120-200 per day
      const totalTapIns = daysWorked * avgTapInsPerDay;
      const totalTapOuts = Math.floor(totalTapIns * (0.75 + Math.random() * 0.15)); // 75-90%
      const avgFare = 28 + Math.random() * 22; // 28-50 BDT average
      const totalRevenue = Math.floor(totalTapOuts * avgFare);
      
      const historicalStats = {
        totalTapIns,
        totalTapOuts,
        totalRevenue,
        lastUpdated: new Date().toISOString()
      };
      
      // Save the generated historical data
      await storageService.setItem(`${sessionKey}_alltime_stats`, historicalStats);
      console.log('Generated and saved all-time stats:', historicalStats);
      return historicalStats;
    }
    
    // Fallback to empty stats
    console.log('Using fallback empty all-time stats');
    return {
      totalTapIns: 0,
      totalTapOuts: 0,
      totalRevenue: 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading all-time stats:', error);
    return {
      totalTapIns: 0,
      totalTapOuts: 0,
      totalRevenue: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Save session statistics to storage
 */
export const saveSessionStats = async (sessionKey: string, stats: SessionStats): Promise<void> => {
  try {
    const storedStats: StoredStats = {
      date: new Date().toISOString(),
      stats: {
        ...stats,
        lastUpdated: new Date().toISOString()
      }
    };
    
    await storageService.setItem(`${sessionKey}_stats`, storedStats);
  } catch (error) {
    console.error('Error saving session stats:', error);
  }
};

/**
 * Update statistics when a tap in occurs
 */
export const updateStatsForTapIn = async (sessionKey: string, currentStats: SessionStats): Promise<SessionStats> => {
  const newStats = {
    ...currentStats,
    totalTapIns: currentStats.totalTapIns + 1,
    lastUpdated: new Date().toISOString()
  };
  
  await saveSessionStats(sessionKey, newStats);
  
  // Also update all-time stats
  await updateAllTimeStatsForTapIn(sessionKey);
  
  return newStats;
};

/**
 * Update statistics when a tap out occurs
 */
export const updateStatsForTapOut = async (
  sessionKey: string, 
  currentStats: SessionStats, 
  fareAmount: number
): Promise<SessionStats> => {
  const newStats = {
    ...currentStats,
    totalTapOuts: currentStats.totalTapOuts + 1,
    totalRevenue: currentStats.totalRevenue + fareAmount,
    lastUpdated: new Date().toISOString()
  };
  
  await saveSessionStats(sessionKey, newStats);
  
  // Also update all-time stats
  await updateAllTimeStatsForTapOut(sessionKey, fareAmount);
  
  return newStats;
};

/**
 * Update all-time statistics for tap in
 */
export const updateAllTimeStatsForTapIn = async (sessionKey: string): Promise<void> => {
  try {
    const currentAllTimeStats = await storageService.getItem<SessionStats>(`${sessionKey}_alltime_stats`);
    
    if (currentAllTimeStats) {
      const updatedStats = {
        ...currentAllTimeStats,
        totalTapIns: currentAllTimeStats.totalTapIns + 1,
        lastUpdated: new Date().toISOString()
      };
      
      await storageService.setItem(`${sessionKey}_alltime_stats`, updatedStats);
    }
  } catch (error) {
    console.error('Error updating all-time tap in stats:', error);
  }
};

/**
 * Update all-time statistics for tap out
 */
export const updateAllTimeStatsForTapOut = async (sessionKey: string, fareAmount: number): Promise<void> => {
  try {
    const currentAllTimeStats = await storageService.getItem<SessionStats>(`${sessionKey}_alltime_stats`);
    
    if (currentAllTimeStats) {
      const updatedStats = {
        ...currentAllTimeStats,
        totalTapOuts: currentAllTimeStats.totalTapOuts + 1,
        totalRevenue: currentAllTimeStats.totalRevenue + fareAmount,
        lastUpdated: new Date().toISOString()
      };
      
      await storageService.setItem(`${sessionKey}_alltime_stats`, updatedStats);
    }
  } catch (error) {
    console.error('Error updating all-time tap out stats:', error);
  }
};

/**
 * Calculate realistic fare based on time of day and other factors
 */
export const calculateRealisticFare = (): number => {
  const now = new Date();
  const currentHour = now.getHours();
  let baseFare = 20; // Base fare in BDT
  
  // Peak hour surcharge
  if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
    baseFare += 5;
  }
  
  // Random distance factor (short to medium distance)
  const distanceFactor = 1 + Math.random() * 1.5; // 1x to 2.5x base fare
  return Math.floor(baseFare * distanceFactor);
};

/**
 * Get session duration in hours (for calculations)
 */
export const getSessionDurationInHours = (startTime: string): number => {
  const sessionStartTime = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - sessionStartTime.getTime();
  return Math.max(0.25, diffMs / (1000 * 60 * 60)); // Minimum 15 minutes
};

/**
 * Get formatted session duration string
 */
export const getFormattedSessionDuration = (startTime: string): string => {
  const sessionStartTime = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - sessionStartTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

/**
 * Calculate passengers per hour rate
 */
export const calculatePassengersPerHour = (totalTapIns: number, startTime: string): number => {
  const sessionDurationHours = getSessionDurationInHours(startTime);
  return Math.round(totalTapIns / sessionDurationHours);
};

/**
 * Calculate completion rate (tap outs / tap ins)
 */
export const calculateCompletionRate = (totalTapIns: number, totalTapOuts: number): number => {
  if (totalTapIns === 0) return 0;
  return Math.round((totalTapOuts / totalTapIns) * 100);
};

/**
 * Calculate average fare
 */
export const calculateAverageFare = (totalRevenue: number, totalTapOuts: number): number => {
  if (totalTapOuts === 0) return 0;
  return Math.round(totalRevenue / totalTapOuts);
};
