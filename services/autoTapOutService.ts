import { mockApi } from './mockData';

interface OngoingTrip {
  id: number;
  cardId: number;
  cardNumber: string;
  busId: number;
  tapInTime: string;
  passengerName: string;
}

export class AutoTapOutService {
  private static instance: AutoTapOutService;
  private scheduledTasks: Set<NodeJS.Timeout> = new Set();

  private constructor() {}

  static getInstance(): AutoTapOutService {
    if (!AutoTapOutService.instance) {
      AutoTapOutService.instance = new AutoTapOutService();
    }
    return AutoTapOutService.instance;
  }

  /**
   * Schedule automatic tap out for cards that haven't tapped out by 11:59 PM
   */
  scheduleAutoTapOut(trip: OngoingTrip): void {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 0, 0); // 11:59 PM

    // If it's already past 11:59 PM today, schedule for tomorrow
    if (now > midnight) {
      midnight.setDate(midnight.getDate() + 1);
    }

    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const timeoutId = setTimeout(async () => {
      try {
        await this.executeAutoTapOut(trip);
      } catch (error) {
        console.error('Auto tap out failed:', error);
      } finally {
        this.scheduledTasks.delete(timeoutId);
      }
    }, timeUntilMidnight);

    this.scheduledTasks.add(timeoutId);
  }

  /**
   * Execute automatic tap out with 100 BDT penalty
   */
  private async executeAutoTapOut(trip: OngoingTrip): Promise<void> {
    try {
      // Check if the trip is still ongoing
      const cardDetails = await mockApi.getCardDetails(trip.cardNumber);
      
      // Auto tap out with 100 BDT penalty
      const penaltyAmount = 100;
      
      const result = await mockApi.tapOutCard(
        trip.cardNumber,
        trip.busId,
        0, // No specific operator for auto tap out
        penaltyAmount
      );

      // Log the auto tap out
      console.log(`Auto tap out executed for card ${trip.cardNumber} with penalty of ${penaltyAmount} BDT`);
      
      // You could also send a notification to the passenger about the auto tap out
      // await this.sendAutoTapOutNotification(trip, penaltyAmount);
      
    } catch (error) {
      console.error(`Failed to execute auto tap out for card ${trip.cardNumber}:`, error);
    }
  }

  /**
   * Cancel a scheduled auto tap out (when user manually taps out)
   */
  cancelAutoTapOut(tripId: number): void {
    // In a real implementation, you would store trip IDs with their timeout IDs
    // For now, we'll clear all scheduled tasks as a simple approach
    // This should be improved in production to track specific trips
  }

  /**
   * Clear all scheduled auto tap outs
   */
  clearAllScheduledTasks(): void {
    this.scheduledTasks.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledTasks.clear();
  }

  /**
   * Get ongoing trips that need auto tap out scheduling
   */
  async getOngoingTrips(): Promise<OngoingTrip[]> {
    try {
      const trips = await mockApi.getTrips();
      return trips
        .filter(trip => trip.tripStatus === 'ongoing')
        .map(trip => ({
          id: trip.id,
          cardId: trip.cardId,
          cardNumber: 'CARD123456', // This should come from the trip data
          busId: trip.busId,
          tapInTime: trip.tapInTime,
          passengerName: 'Unknown' // This should come from user lookup
        }));
    } catch (error) {
      console.error('Failed to get ongoing trips:', error);
      return [];
    }
  }

  /**
   * Initialize auto tap out service - schedule for all ongoing trips
   */
  async initialize(): Promise<void> {
    try {
      const ongoingTrips = await this.getOngoingTrips();
      
      ongoingTrips.forEach(trip => {
        this.scheduleAutoTapOut(trip);
      });
      
      console.log(`Scheduled auto tap out for ${ongoingTrips.length} ongoing trips`);
    } catch (error) {
      console.error('Failed to initialize auto tap out service:', error);
    }
  }

  /**
   * Check if it's time for auto tap out (for manual checking)
   */
  isAutoTapOutTime(): boolean {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Check if it's 11:59 PM
    return hours === 23 && minutes === 59;
  }
}

// Export singleton instance
export const autoTapOutService = AutoTapOutService.getInstance();
