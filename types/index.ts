export interface User {
  id: number | string;
  name: string;
  email?: string;
  emailAddress?: string; // API field
  mobile: string;
  mobileNumber?: string; // API field
  sex: 'male' | 'female';
  gender?: string; // API field
  userType: 'passenger';
  cardNumber?: string;
  isActive: boolean;
  createdAt: string;
  profileImage?: string;
  imageUrl?: string; // API field
  updatedAt?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  studentId?: string;
  institution?: string;
  // New fields from API
  passengerId?: string;
  organizationId?: string;
  organization?: string | {
    name: string;
    code: string;
    focalPerson: string;
    email: string;
    mobileNumber: string;
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string;
    isDeleted: boolean;
  };
  balance?: number;
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
  adminName?: string;
  adminPhone?: string;
  adminEmail?: string;
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
