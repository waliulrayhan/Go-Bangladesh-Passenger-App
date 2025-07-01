export interface User {
  id: number;
  name: string;
  email?: string;
  mobile: string;
  sex: 'male' | 'female';
  userType: 'passenger';
  cardNumber?: string;
  isActive: boolean;
  createdAt: string;
  profileImage?: string;
}

export interface Card {
  id: number;
  cardNumber: string;
  userId: number;
  balance: number;
  isActive: boolean;
  lastTapTime?: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  cardId: number;
  transactionType: 'recharge' | 'fare_deduction' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  agentId?: number;
  tripId?: number;
  description?: string;
  createdAt: string;
}

export interface Trip {
  id: number;
  cardId: number;
  busId: number;
  tapInTime: string;
  tapInLocation?: {
    latitude: number;
    longitude: number;
  };
  tapOutTime?: string;
  tapOutLocation?: {
    latitude: number;
    longitude: number;
  };
  fareAmount?: number;
  distanceKm?: number;
  tripStatus: 'ongoing' | 'completed' | 'cancelled';
  busNumber: string;
  createdAt: string;
}

export interface Bus {
  id: number;
  busNumber: string;
  organizationId: number;
  capacity: number;
  route: string;
  currentDriverId?: number;
  currentHelperId?: number;
  isActive: boolean;
}

export interface Organization {
  id: number;
  name: string;
  type: 'institute' | 'company';
  isActive: boolean;
  logo?: string;
  createdAt: string;
}

export interface TapTransaction {
  id: number;
  cardId: number;
  cardNumber: string;
  busId: number;
  busNumber: string;
  type: 'tap_in' | 'tap_out';
  amount: number;
  balance: number;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  driverId?: number;
  helperId?: number;
  passengerName?: string;
}
