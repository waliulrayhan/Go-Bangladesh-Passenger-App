export interface User {
  id: number | string;
  name: string;
  email?: string;
  emailAddress?: string; // API field
  mobile: string;
  mobileNumber?: string; // API field
  sex: 'male' | 'female';
  gender?: string; // API field
  userType: 'passenger' | 'public' | 'private';
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

export interface Organization {
  name: string;
  code: string;
  focalPerson: string;
  designation: string;
  email: string;
  mobileNumber: string;
  organizationType: string;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Agent {
  isSuperAdmin: boolean;
  name: string;
  emailAddress: string;
  passwordHash: string;
  imageUrl: string;
  isApproved: boolean;
  isActive: boolean;
  roleId?: string;
  dateOfBirth: string;
  mobileNumber: string;
  address: string;
  gender: string;
  userType: string;
  passengerId?: string;
  organizationId: string;
  organization: Organization;
  serial: number;
  code: string;
  cardNumber?: string;
  designation?: string;
  balance: number;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface BusInfo {
  busNumber: string;
  busName: string;
  routeId: string;
  route?: any;
  organizationId: string;
  organization: Organization;
  presentLatitude: string;
  presentLongitude: string;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Session {
  busId: string;
  userId: string;
  startTime: string;
  endTime: string;
  isRunning: boolean;
  serial: number;
  sessionCode: string;
  user?: any;
  bus: BusInfo;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface TripDetails {
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
  session: Session;
  passenger?: any;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Transaction {
  transactionType: 'BusFare' | 'Recharge';
  amount: number;
  passengerId: string;
  agentId?: string;
  tripId?: string;
  passenger?: any;
  agent?: Agent;
  trip?: TripDetails;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Trip {
  tripId: string;
  cardId: string;
  sessionId: string;
  startingLatitude: string;
  startingLongitude: string;
  tripStartTime: string;
  isRunning: boolean;
  busNumber: string;
  busName: string;
  tripStartPlace: string;
  tripEndPlace: string;
  penaltyAmount: number;
}

// Legacy Trip interface for backward compatibility
export interface LegacyTrip {
  id: string;
  passengerId: string;
  sessionId: string;
  startingLatitude: string;
  startingLongitude: string;
  endingLatitude: string | null;
  endingLongitude: string | null;
  tripStartTime: string;
  tripEndTime: string | null;
  amount: number;
  isRunning: boolean;
  distance: number;
  session?: Session;
  passenger?: any;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Bus {
  id: string;
  busNumber: string;
  organizationId: string;
  capacity?: number;
  route: string;
  currentDriverId?: number;
  currentHelperId?: number;
  isActive: boolean;
}

// Removed duplicate Organization interface

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
  totalCount?: number;
}
