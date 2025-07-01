// Auto tap-out service
// TODO: Replace with real API calls when endpoints are available

interface AutoTapOutState {
  isEnabled: boolean;
  isTracking: boolean;
}

class AutoTapOutService {
  private state: AutoTapOutState = {
    isEnabled: false,
    isTracking: false
  };

  async startAutoTapOut(): Promise<boolean> {
    console.log('Auto tap-out service: Disabled (waiting for real API endpoints)');
    return false;
  }

  async stopAutoTapOut(): Promise<void> {
    console.log('Auto tap-out service: Stopped');
    this.state.isTracking = false;
  }

  async enableAutoTapOut(): Promise<void> {
    console.log('Auto tap-out service: Enabled but not functional (waiting for real API)');
    this.state.isEnabled = true;
  }

  async disableAutoTapOut(): Promise<void> {
    console.log('Auto tap-out service: Disabled');
    this.state.isEnabled = false;
    await this.stopAutoTapOut();
  }

  isAutoTapOutEnabled(): boolean {
    return this.state.isEnabled;
  }

  isTrackingActive(): boolean {
    return this.state.isTracking;
  }

  getOngoingTripsCount(): number {
    return 0;
  }

  async addTripForTracking(cardNumber: string, latitude: number, longitude: number): Promise<void> {
    console.log('Auto tap-out service: Trip tracking disabled (waiting for real API)');
  }

  async loadOngoingTrips(): Promise<void> {
    console.log('Auto tap-out service: Loading trips disabled (waiting for real API)');
  }
}

export const autoTapOutService = new AutoTapOutService();
