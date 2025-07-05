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
  id: string;
  transactionType: 'BusFare' | 'Recharge';
  amount: number;
  passengerId: string;
  agentId?: string;
  tripId?: string;
  passenger?: any;
  agent?: {
    id: string;
    name: string;
    emailAddress: string;
    mobileNumber: string;
    address: string;
    userType: string;
    code: string;
    balance: number;
    isActive: boolean;
    createTime: string;
    lastModifiedTime: string;
  };
  trip?: {
    id: string;
    passengerId: string;
    sessionId: string;
    startingLatitude: string;
    startingLongitude: string;
    endingLatitude: string;
    endingLongitude: string;
    tripStartTime: string;
    tripEndTime: string;
    amount: number;
    isRunning: boolean;
    distance: number;
    createTime: string;
    lastModifiedTime: string;
  };
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Trip {
  id: string;
  passengerId: string;
  sessionId: string;
  startingLatitude: string;
  startingLongitude: string;
  endingLatitude: string;
  endingLongitude: string;
  tripStartTime: string;
  tripEndTime: string;
  amount: number;
  isRunning: boolean;
  distance: number;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
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

// API Response Types
export interface ApiResponse<T> {
  data: {
    isSuccess: boolean;
    content: T[];
    timeStamp: string;
    payloadType: string;
    message: string | null;
  };
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalLoaded: number;
}
