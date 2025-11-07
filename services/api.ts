import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BusInfo, Organization, Transaction as TransactionType } from '../types';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { storageService } from '../utils/storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuthTokenResponse {
  token: string;
  refreshToken?: string;
}

export interface ApiResponse<T> {
  data: {
    isSuccess: boolean;
    content: T;
    timeStamp: string;
    payloadType: string;
    message: string;
  };
}

export interface PaginatedApiResponse<T> {
  data: {
    isSuccess: boolean;
    content: {
      data: T[];
      rowCount: number;
    };
    timeStamp: string;
    payloadType: string;
    message: string;
  };
}

export interface CardValidationResponse {
  isSuccess: boolean;
  content: {
    cardNumber: string;
    status: string;
    balance: number;
    organizationId: string;
    organization: Organization;
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string;
    isDeleted: boolean;
  } | null;
  timeStamp: string;
  payloadType: string;
  message: string;
}

export interface RegistrationData {
  Name: string;
  MobileNumber: string;
  EmailAddress?: string;
  Gender?: string;
  Address?: string;
  DateOfBirth?: string;
  Password: string;
  UserType?: string;
  OrganizationId?: string;
  CardNumber: string;
  PassengerId?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  dateOfBirth: string;
  mobileNumber: string;
  emailAddress: string;
  address: string;
  gender: string;
  userType: string;
  imageUrl?: string;
  passengerId: string;
  organizationId?: string;
  organization?: Organization;
  cardNumber: string;
  balance: number;
}

export interface Trip {
  tripId: string;
  cardId: string;
  cardNumber: string;
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

export interface RouteInfo {
  tripStartPlace: string;
  tripEndPlace: string;
  organizationId: string;
  perKmFare: number;
  baseFare: number;
  minimumBalance: number;
  penaltyAmount: number;
  organization: any;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface SessionInfo {
  busId: string;
  userId: string;
  startTime: string;
  endTime: string;
  isRunning: boolean;
  serial: number;
  sessionCode: string;
  startingLatitude: string | null;
  startingLongitude: string | null;
  endingLatitude: string | null;
  endingLongitude: string | null;
  user: any;
  bus: BusInfo;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface PassengerInfo {
  isSuperAdmin: boolean;
  name: string;
  emailAddress: string;
  passwordHash: string;
  imageUrl: string;
  isApproved: boolean;
  isActive: boolean;
  roleId: string | null;
  dateOfBirth: string;
  mobileNumber: string;
  address: string;
  gender: string;
  userType: string;
  passengerId: string;
  organizationId: string;
  organization: any;
  serial: number;
  code: string | null;
  cardNumber: string;
  designation: string | null;
  balance: number;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface LegacyTrip {
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
  session: SessionInfo;
  passenger: PassengerInfo;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface Transaction {
  id: string;
  passengerId: string;
  tripId: string;
  amount: number;
  transactionTime: string;
  status: string;
}

export interface TripTransaction {
  transactionType: 'BusFare' | 'Recharge' | 'Return';
  amount: number;
  cardId: string;
  agentId: string | null;
  tripId: string | null;
  transactionId: string;
  card: {
    cardNumber: string;
    status: string;
    balance: number;
    organizationId: string;
    organization: any;
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string;
    isDeleted: boolean;
  } | null;
  agent: AgentInfo | null;
  trip: {
    cardId: string;
    sessionId: string;
    startingLatitude: string;
    startingLongitude: string;
    endingLatitude: string | null;
    endingLongitude: string | null;
    tripStartTime: string;
    tripEndTime: string;
    amount: number;
    isRunning: boolean;
    distance: number;
    tapInType: string | null;
    tapOutStatus: string | null;
    session: SessionInfo;
    card: any | null;
    passenger: any | null;
    passengerId: string | null;
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string | null;
    isDeleted: boolean;
  } | null;
  passenger: any | null;
  passengerId: string | null;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string | null;
  lastModifiedBy: string | null;
  isDeleted: boolean;
}

export interface AgentInfo {
  isSuperAdmin: boolean;
  name: string;
  emailAddress: string | null;
  passwordHash: string;
  imageUrl: string | null;
  isApproved: boolean;
  isActive: boolean;
  roleId: null;
  dateOfBirth: string | null;
  mobileNumber: string;
  address: string | null;
  gender: string;
  userType: string;
  passengerId: null;
  organizationId: string;
  organization: Organization;
  serial: number;
  code: string;
  designation: string | null;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface RechargeTransaction {
  transactionType: 'Recharge' | 'Return';
  amount: number;
  cardId: string;
  agentId: string;
  tripId: null;
  medium: null;
  transactionId: string;
  card: null;
  agent: AgentInfo;
  trip: null;
  passenger: null;
  passengerId: null;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  isSuccess: boolean;
  content: null;
  timeStamp: string;
  payloadType: string | null;
  message: string;
}

export interface UpdateCardNumberRequest {
  userId: string;
  cardNumber: string;
}

export interface UpdateCardNumberResponse {
  isSuccess: boolean;
  content: null;
  timeStamp: string;
  payloadType: string;
  message: string;
}

export interface ProfileUpdateData {
  Id: string;
  Name?: string;
  MobileNumber?: string;
  EmailAddress?: string;
  Gender?: string;
  Address?: string;
  DateOfBirth?: string;
  UserType?: string;
  OrganizationId?: string;
  PassengerId?: string;
  ProfilePicture?: File;
}

export interface ApiError {
  status?: number;
  message: string;
  data?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_TIMEOUT = 10000;
const REFRESH_TIMEOUT = 8000;
const UNAUTHORIZED_RETRY_DELAY = 2000;

// ============================================================================
// UTILITIES
// ============================================================================

class ApiLogger {
  static log(context: string, message: string, data?: any): void {
    console.log(`🔧 [${context}] ${message}`, data ? data : '');
  }

  static error(context: string, message: string, error?: any): void {
    console.error(`💥 [${context}] ${message}`, error ? error : '');
  }

  static success(context: string, message: string, data?: any): void {
    console.log(`✅ [${context}] ${message}`, data ? data : '');
  }

  static warn(context: string, message: string, data?: any): void {
    console.warn(`⚠️ [${context}] ${message}`, data ? data : '');
  }

  static info(context: string, message: string, data?: any): void {
    console.log(`ℹ️ [${context}] ${message}`, data ? data : '');
  }
}

class ApiErrorHandler {
  static createError(message: string, status?: number, data?: any): ApiError {
    return { message, status, data };
  }

  static extractErrorMessage(error: any): string {
    if (error.response?.data?.data?.message) {
      return error.response.data.data.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  static isUnauthorized(error: any): boolean {
    return error.response?.status === 401;
  }

  static isNotFound(error: any): boolean {
    return error.response?.status === 404;
  }

  static isTimeout(error: any): boolean {
    return error.code === 'ECONNABORTED';
  }
}

class FormDataBuilder {
  private formData: FormData;

  constructor() {
    this.formData = new FormData();
  }

  append(key: string, value: string | File): FormDataBuilder {
    this.formData.append(key, value);
    return this;
  }

  appendIfExists(key: string, value: string | File | undefined): FormDataBuilder {
    if (value !== undefined && value !== null) {
      this.formData.append(key, value);
    }
    return this;
  }

  build(): FormData {
    return this.formData;
  }
}

// ============================================================================
// API SERVICE
// ============================================================================

class ApiService {
  private api: AxiosInstance;
  private isHandlingUnauthorized = false;

  constructor() {
    this.api = this.createAxiosInstance();
    this.setupInterceptors();
  }

  // ========================================================================
  // PRIVATE METHODS - Setup & Configuration
  // ========================================================================

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.api.interceptors.request.use(
      async (config) => {
        const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private setupResponseInterceptor(): void {
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => this.handleResponseError(error)
    );
  }

  // ========================================================================
  // PRIVATE METHODS - Error Handling
  // ========================================================================

  private async handleResponseError(error: any): Promise<any> {
    const originalRequest = error.config;

    if (ApiErrorHandler.isUnauthorized(error)) {
      return this.handleUnauthorizedError(error, originalRequest);
    }

    return Promise.reject(error);
  }

  private async handleUnauthorizedError(error: any, originalRequest: any): Promise<any> {
    ApiLogger.error('AUTH', '401 Unauthorized response received', {
      url: originalRequest?.url,
      hasRetry: !!originalRequest._retry
    });

    if (!originalRequest._retry) {
      originalRequest._retry = true;

      const refreshSuccess = await this.attemptTokenRefresh();
      if (refreshSuccess) {
        const newToken = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return this.api(originalRequest);
      }
    }

    await this.handleCompleteUnauthorized(error);
    return Promise.reject(error);
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = await storageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        ApiLogger.warn('AUTH', 'No refresh token available');
        return false;
      }

      ApiLogger.log('AUTH', 'Attempting token refresh...');
      const response = await this.refreshTokenRequest(refreshToken);

      if (response.data.token) {
        await storageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        ApiLogger.success('AUTH', 'Token refreshed successfully');
        return true;
      }

      return false;
    } catch (refreshError) {
      ApiLogger.error('AUTH', 'Token refresh failed', refreshError);
      return false;
    }
  }

  private async refreshTokenRequest(refreshToken: string) {
    return this.api.post('/api/Auth/refresh-token', { refreshToken });
  }

  private async handleCompleteUnauthorized(error: any): Promise<void> {
    if (this.isHandlingUnauthorized) {
      ApiLogger.log('AUTH', 'Already handling unauthorized response, skipping...');
      return;
    }

    this.isHandlingUnauthorized = true;
    ApiLogger.error('AUTH', 'Token completely invalid - triggering session cleanup');

    try {
      const { useAuthStore } = await import('../stores/authStore');
      const authStore = useAuthStore.getState();

      await authStore.handleUnauthorized();

      setTimeout(async () => {
        await this.redirectToLogin();
      }, 100);

    } catch (logoutError) {
      ApiLogger.error('AUTH', 'Error during forced logout', logoutError);
      await this.fallbackStorageCleanup();
    } finally {
      setTimeout(() => {
        this.isHandlingUnauthorized = false;
      }, UNAUTHORIZED_RETRY_DELAY);
    }
  }

  private async redirectToLogin(): Promise<void> {
    try {
      const { router } = await import('expo-router');
      ApiLogger.log('AUTH', 'Redirecting to login screen...');
      router.dismissAll();
      router.replace('/');
    } catch (navError) {
      ApiLogger.warn('AUTH', 'Navigation error during unauthorized redirect', navError);
    }
  }

  private async fallbackStorageCleanup(): Promise<void> {
    try {
      await storageService.clearAllAppData();
      ApiLogger.success('AUTH', 'Manual storage cleanup completed');
    } catch (storageError) {
      ApiLogger.error('AUTH', 'Failed to clear storage manually', storageError);
    }
  }

  private async checkUnauthorizedResponse(response: any, methodName: string): Promise<boolean> {
    try {
      if (response?.status === 401) {
        ApiLogger.error(methodName, 'Direct 401 response detected');
        await this.handleCompleteUnauthorized(response);
        return true;
      }

      const message = response?.data?.data?.message || response?.data?.message || '';
      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('token')) {
        ApiLogger.error(methodName, 'Unauthorized message in response', message);
        await this.handleCompleteUnauthorized(response);
        return true;
      }

      return false;
    } catch (error) {
      ApiLogger.error(methodName, 'Error checking unauthorized response', error);
      return false;
    }
  }

  // ========================================================================
  // PRIVATE METHODS - Validation & Utilities
  // ========================================================================

  private validateApiResponse<T>(response: any, context: string): T | null {
    if (!response.data?.data?.isSuccess) {
      ApiLogger.warn(context, 'API returned unsuccessful response', response.data?.data?.message);
      return null;
    }

    if (!response.data.data.content) {
      ApiLogger.warn(context, 'No content in response');
      return null;
    }

    return response.data.data.content;
  }

  private createFormData(data: RegistrationData | ProfileUpdateData): FormData {
    const builder = new FormDataBuilder();

    if ('Name' in data) {
      // Registration data
      const regData = data as RegistrationData;
      builder
        .append('Name', regData.Name)
        .append('MobileNumber', regData.MobileNumber)
        .append('Password', regData.Password)
        .append('CardNumber', regData.CardNumber)
        .appendIfExists('EmailAddress', regData.EmailAddress)
        .appendIfExists('Gender', regData.Gender)
        .appendIfExists('Address', regData.Address)
        .appendIfExists('DateOfBirth', regData.DateOfBirth)
        .appendIfExists('UserType', regData.UserType)
        .appendIfExists('OrganizationId', regData.OrganizationId)
        .appendIfExists('PassengerId', regData.PassengerId);
    } else {
      // Profile update data
      const profileData = data as ProfileUpdateData;
      builder
        .append('Id', profileData.Id)
        .appendIfExists('Name', profileData.Name)
        .appendIfExists('MobileNumber', profileData.MobileNumber)
        .appendIfExists('EmailAddress', profileData.EmailAddress)
        .appendIfExists('Gender', profileData.Gender)
        .appendIfExists('Address', profileData.Address)
        .appendIfExists('DateOfBirth', profileData.DateOfBirth)
        .appendIfExists('UserType', profileData.UserType)
        .appendIfExists('OrganizationId', profileData.OrganizationId)
        .appendIfExists('PassengerId', profileData.PassengerId);

      if (profileData.ProfilePicture) {
        builder.append('ProfilePicture', profileData.ProfilePicture);
      }
    }

    return builder.build();
  }

  private getEmailPayload(identifier: string, password: string) {
    return { email: identifier, password };
  }

  private getMobilePayload(identifier: string, password: string) {
    return { mobileNumber: identifier, password };
  }

  private isEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  // ========================================================================
  // PUBLIC METHODS - Authentication
  // ========================================================================

  async getAuthToken(identifier: string, password: string = '123456'): Promise<AuthTokenResponse> {
    ApiLogger.log('AUTH', 'Starting authentication request', {
      identifier,
      hasPassword: !!password
    });

    try {
      const isEmail = this.isEmail(identifier);
      const payload = isEmail
        ? this.getEmailPayload(identifier, password)
        : this.getMobilePayload(identifier, password);

      ApiLogger.log('AUTH', 'Request payload', {
        type: isEmail ? 'email' : 'mobile',
        identifier
      });

      const response = await this.api.post<ApiResponse<AuthTokenResponse>>('/api/Auth/token', payload);

      ApiLogger.log('AUTH', 'Response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        hasToken: !!response.data.data.content?.token
      });

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Authentication failed'
        );
      }

      if (!response.data.data.content) {
        throw ApiErrorHandler.createError('No authentication token received');
      }

      ApiLogger.success('AUTH', 'Authentication successful');
      return response.data.data.content;
    } catch (error: any) {
      ApiLogger.error('AUTH', 'Authentication error', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================================================
  // PUBLIC METHODS - User Management
  // ========================================================================

  async getUserById(userId: string): Promise<UserResponse | null> {
    ApiLogger.log('USER', 'Fetching user details', { userId });

    try {
      const response = await this.api.get<ApiResponse<UserResponse>>(
        `/api/passenger/getById?id=${userId}`
      );

      if (await this.checkUnauthorizedResponse(response, 'USER')) {
        return null;
      }

      const userData = this.validateApiResponse<UserResponse>(response, 'USER');

      if (userData) {
        ApiLogger.success('USER', 'User data retrieved successfully', {
          id: userData.id,
          name: userData.name,
          cardNumber: userData.cardNumber,
          balance: userData.balance
        });
      }

      return userData;
    } catch (error: any) {
      if (ApiErrorHandler.isUnauthorized(error)) {
        await this.handleCompleteUnauthorized(error);
        return null;
      }

      if (ApiErrorHandler.isNotFound(error)) {
        ApiLogger.warn('USER', 'User not found (404)');
        return null;
      }

      ApiLogger.error('USER', 'Error fetching user details', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });

      return null;
    }
  }

  async registerPassenger(registrationData: RegistrationData): Promise<boolean> {
    ApiLogger.log('REGISTRATION', 'Registering passenger', { name: registrationData.Name });

    try {
      const formData = this.createFormData(registrationData);

      const response = await this.api.post<ApiResponse<null>>(
        '/api/passenger/registration',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      ApiLogger.log('REGISTRATION', 'Response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Registration failed'
        );
      }

      ApiLogger.success('REGISTRATION', 'Registration successful');
      return true;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('REGISTRATION', 'Registration error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  async updatePassengerProfile(updateData: FormData | ProfileUpdateData): Promise<{ isSuccess: boolean; message: string }> {
    ApiLogger.log('UPDATE PROFILE', 'Updating passenger profile');

    try {
      let formData: FormData;

      if (updateData instanceof FormData) {
        formData = updateData;
        ApiLogger.log('UPDATE PROFILE', 'Using provided FormData directly');
      } else {
        formData = this.createFormData(updateData);
      }

      const response = await this.api.put<ApiResponse<null>>(
        '/api/passenger/update',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      ApiLogger.log('UPDATE PROFILE', 'Response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      return {
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message || 'Profile updated successfully!'
      };
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('UPDATE PROFILE', 'Update profile error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  async deactivateAccount(userId: string): Promise<{ isSuccess: boolean; message: string }> {
    ApiLogger.log('DEACTIVATE ACCOUNT', 'Deactivating user account', { userId });

    try {
      const response = await this.api.post<ApiResponse<null>>(
        '/api/user/DeactivateAccount',
        { userId },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      ApiLogger.log('DEACTIVATE ACCOUNT', 'Response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Account deactivation failed'
        );
      }

      ApiLogger.success('DEACTIVATE ACCOUNT', 'Account deactivated successfully');
      return {
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message || 'User account has been deactivated successfully!'
      };
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('DEACTIVATE ACCOUNT', 'Account deactivation error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  // ========================================================================
  // PUBLIC METHODS - Trip Management
  // ========================================================================

  async getOnGoingTrip(): Promise<Trip | null> {
    ApiLogger.log('TRIP', 'Fetching ongoing trip');

    try {
      const response = await this.api.get<ApiResponse<Trip>>('/api/passenger/getOnGoingTrip', {
        timeout: REFRESH_TIMEOUT,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const tripData = this.validateApiResponse<Trip>(response, 'TRIP');

      if (tripData) {
        ApiLogger.success('TRIP', 'Ongoing trip found', {
          tripId: tripData.tripId,
          busName: tripData.busName,
          route: `${tripData.tripStartPlace} → ${tripData.tripEndPlace}`
        });
      } else {
        ApiLogger.info('TRIP', 'No ongoing trip found');
      }

      return tripData;
    } catch (error: any) {
      if (ApiErrorHandler.isNotFound(error)) {
        ApiLogger.info('TRIP', 'No ongoing trip found (404)');
        return null;
      }

      if (ApiErrorHandler.isTimeout(error)) {
        ApiLogger.warn('TRIP', 'Request timed out');
        return null;
      }

      ApiLogger.error('TRIP', 'Error fetching ongoing trip', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });

      return null;
    }
  }

  async tapOutTrip(): Promise<boolean> {
    ApiLogger.log('TRIP', 'Attempting to tap out');

    try {
      const response = await this.api.post('/api/passenger/tapOut');

      ApiLogger.log('TRIP', 'Tap out response received', {
        status: response.status,
        isSuccess: response.data.data?.isSuccess,
        message: response.data.data?.message
      });

      if (response.data.data?.isSuccess) {
        ApiLogger.success('TRIP', 'Tap out successful');
        return true;
      } else {
        ApiLogger.error('TRIP', 'Tap out failed', response.data.data?.message);
        return false;
      }
    } catch (error: any) {
      ApiLogger.error('TRIP', 'Error during tap out', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });
      return false;
    }
  }

  async forceTripStop(cardId: string, tripId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    ApiLogger.log('FORCE TAP OUT', 'Attempting force trip stop', { cardId, tripId, sessionId });

    try {
      const payload = { cardId, tripId, sessionId };

      const response = await this.api.post<ApiResponse<null>>('/api/transaction/ForceTripStop', payload);

      ApiLogger.log('FORCE TAP OUT', 'Response received', {
        status: response.status,
        isSuccess: response.data.data?.isSuccess,
        message: response.data.data?.message
      });

      if (response.data.data?.isSuccess) {
        ApiLogger.success('FORCE TAP OUT', 'Force trip stop successful');
        return {
          success: true,
          message: response.data.data.message || 'Bus fare deduction has been successful!'
        };
      } else {
        return {
          success: false,
          message: response.data.data?.message || 'Force trip stop failed'
        };
      }
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('FORCE TAP OUT', 'Error during force trip stop', errorMessage);

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // ========================================================================
  // PUBLIC METHODS - OTP Management
  // ========================================================================

  async sendOTP(mobileNumber: string): Promise<boolean> {
    ApiLogger.log('OTP', 'Sending OTP', { mobileNumber });

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/otp/SendOtp?mobileNumber=${mobileNumber}`
      );

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Failed to send OTP'
        );
      }

      ApiLogger.success('OTP', 'OTP sent successfully');
      return true;
    } catch (error: any) {
      ApiLogger.error('OTP', 'Send OTP error', error.response?.data || error.message);
      throw error;
    }
  }

  async sendOTPForForgotPassword(mobileNumber: string): Promise<boolean> {
    ApiLogger.log('OTP', 'Sending OTP for forgot password', { mobileNumber });

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/otp/SendOtpForForgotPassword?mobileNumber=${mobileNumber}`
      );

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Failed to send OTP'
        );
      }

      ApiLogger.success('OTP', 'OTP sent successfully');
      return true;
    } catch (error: any) {
      ApiLogger.error('OTP', 'Send OTP error', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyOTP(mobileNumber: string, otp: string): Promise<boolean> {
    ApiLogger.log('OTP', 'Verifying OTP', { mobileNumber });

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/otp/VerifyOtp?mobileNumber=${mobileNumber}&otp=${otp}`
      );

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'OTP verification failed'
        );
      }

      ApiLogger.success('OTP', 'OTP verified successfully');
      return true;
    } catch (error: any) {
      ApiLogger.error('OTP', 'Verify OTP error', error.response?.data || error.message);
      throw error;
    }
  }

  async resetPassword(mobileNumber: string, newPassword: string, confirmNewPassword: string): Promise<boolean> {
    ApiLogger.log('PASSWORD', 'Resetting password', { mobileNumber });

    try {
      const payload = { mobileNumber, newPassword, confirmNewPassword };

      const response = await this.api.post<ApiResponse<null>>('/api/user/ForgotPassword', payload);

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Password reset failed'
        );
      }

      ApiLogger.success('PASSWORD', 'Password reset successfully');
      return true;
    } catch (error: any) {
      ApiLogger.error('PASSWORD', 'Reset password error', error.response?.data || error.message);
      throw error;
    }
  }

  async changePassword(changePasswordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    ApiLogger.log('PASSWORD', 'Attempting to change password');

    try {
      const response = await this.api.post<ApiResponse<null>>('/api/user/changePassword', changePasswordData);

      ApiLogger.log('PASSWORD', 'Change password response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      return response.data.data;
    } catch (error: any) {
      ApiLogger.error('PASSWORD', 'Error changing password', {
        status: error.response?.status,
        message: error.response?.data?.data?.message || error.message
      });

      if (error.response?.data?.data) {
        return error.response.data.data;
      }

      throw error;
    }
  }

  // ========================================================================
  // PUBLIC METHODS - Card Management
  // ========================================================================

  async checkCardValidity(cardNumber: string): Promise<CardValidationResponse> {
    ApiLogger.log('CARD', 'Checking card validity', { cardNumber });

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/card/CheckCardValidity?cardNumber=${cardNumber}`
      );

      ApiLogger.log('CARD', 'Validation response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      return response.data.data;
    } catch (error: any) {
      ApiLogger.error('CARD', 'Card validation error', error.response?.data || error.message);
      throw error;
    }
  }

  async checkCardValidityRegistration(cardNumber: string): Promise<CardValidationResponse> {
    ApiLogger.log('CARD', 'Checking card validity for registration', { cardNumber });

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/card/CheckCardValidityForRegistration?cardNumber=${cardNumber}`
      );

      ApiLogger.log('CARD', 'Validation response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      return response.data.data;
    } catch (error: any) {
      ApiLogger.error('CARD', 'Card validation error', error.response?.data || error.message);
      throw error;
    }
  }

  async updateCardNumber(userId: string, cardNumber: string): Promise<UpdateCardNumberResponse> {
    ApiLogger.log('UPDATE CARD', 'Updating card number', { userId, cardNumber });

    try {
      const requestData: UpdateCardNumberRequest = { userId, cardNumber };

      const response = await this.api.put<ApiResponse<null>>(
        '/api/passenger/updateCardNumber',
        requestData
      );

      ApiLogger.log('UPDATE CARD', 'Response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      return {
        isSuccess: response.data.data.isSuccess,
        content: null,
        timeStamp: response.data.data.timeStamp,
        payloadType: response.data.data.payloadType || 'Card Number changer for passenger',
        message: response.data.data.message
      };
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('UPDATE CARD', 'Update card number error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  // ========================================================================
  // PUBLIC METHODS - History Management
  // ========================================================================

  async getRecentActivity(): Promise<any[]> {
    ApiLogger.log('RECENT_ACTIVITY', 'Fetching recent activity');

    try {
      const response = await this.api.get<ApiResponse<any[]>>('/api/passenger/recentActivity');

      ApiLogger.log('RECENT_ACTIVITY', 'Response received', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        itemCount: response.data.data.content?.length || 0
      });

      if (await this.checkUnauthorizedResponse(response, 'RECENT_ACTIVITY')) {
        return [];
      }

      const activityData = this.validateApiResponse<any[]>(response, 'RECENT_ACTIVITY');
      
      if (activityData) {
        ApiLogger.success('RECENT_ACTIVITY', `Recent activity loaded: ${activityData.length} items`);
        return activityData;
      }

      return [];
    } catch (error: any) {
      if (ApiErrorHandler.isUnauthorized(error)) {
        ApiLogger.warn('RECENT_ACTIVITY', 'Unauthorized access - token may be expired');
        return [];
      }

      if (ApiErrorHandler.isNotFound(error)) {
        ApiLogger.log('RECENT_ACTIVITY', 'No recent activity found');
        return [];
      }

      if (ApiErrorHandler.isTimeout(error)) {
        ApiLogger.warn('RECENT_ACTIVITY', 'Request timeout while fetching recent activity');
        return [];
      }

      ApiLogger.error('RECENT_ACTIVITY', 'Error fetching recent activity', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });

      return [];
    }
  }  async getPassengerTripHistory(passengerId: string, pageNo: number = 1, pageSize: number = 10): Promise<{ data: TripTransaction[]; rowCount: number }> {
    ApiLogger.log('HISTORY', 'Fetching trip history', { passengerId, pageNo, pageSize });

    try {
      const response = await this.api.get<PaginatedApiResponse<TripTransaction>>(
        `/api/history/passengerTrip?id=${passengerId}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Failed to fetch trip history'
        );
      }

      const result = {
        data: response.data.data.content.data || [],
        rowCount: response.data.data.content.rowCount || 0
      };

      ApiLogger.success('HISTORY', 'Trip history loaded', {
        count: result.data.length,
        total: result.rowCount
      });

      return result;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('HISTORY', 'Trip history error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  async getPassengerRechargeHistory(passengerId: string, pageNo: number = 1, pageSize: number = 10): Promise<{ data: RechargeTransaction[]; rowCount: number }> {
    ApiLogger.log('HISTORY', 'Fetching recharge history', { passengerId, pageNo, pageSize });

    try {
      const response = await this.api.get<PaginatedApiResponse<RechargeTransaction>>(
        `/api/history/passengerRecharge?id=${passengerId}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      if (!response.data.data.isSuccess) {
        throw ApiErrorHandler.createError(
          response.data.data.message || 'Failed to fetch recharge history'
        );
      }

      const result = {
        data: response.data.data.content.data || [],
        rowCount: response.data.data.content.rowCount || 0
      };

      ApiLogger.success('HISTORY', 'Recharge history loaded', {
        count: result.data.length,
        total: result.rowCount
      });

      return result;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('HISTORY', 'Recharge history error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  /**
   * @deprecated Use getPassengerTripHistory and getPassengerRechargeHistory instead
   */
  async getPassengerHistory(passengerId: string, pageNo: number = 1, pageSize: number = 100): Promise<ApiResponse<TransactionType[]>> {
    ApiLogger.warn('HISTORY', 'Using deprecated getPassengerHistory method');

    try {
      const response = await this.api.get<ApiResponse<TransactionType[]>>(
        `/api/history/passenger?id=${passengerId}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      ApiLogger.success('HISTORY', 'Legacy history loaded', {
        count: response.data?.data?.content?.length || 0
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('HISTORY', 'Legacy history error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  // ========================================================================
  // PROMO METHODS
  // ========================================================================

  /**
   * Get user promos by status with pagination
   */
  async getUserPromos(status: string, pageNo: number = 1, pageSize: number = 10): Promise<ApiResponse<any>> {
    ApiLogger.log('PROMO', 'Fetching user promos', { status, pageNo, pageSize });

    try {
      const response = await this.api.get<ApiResponse<any>>(
        `/api/promo/getUserPromo?status=${encodeURIComponent(status)}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      ApiLogger.success('PROMO', 'User promos loaded', {
        status,
        count: response.data.data.content?.length || 0
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('PROMO', 'User promos error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  /**
   * Apply a promo code to a card
   */
  async applyPromo(data: { promoId: string; cardNumber: string }): Promise<ApiResponse<any>> {
    ApiLogger.log('PROMO', 'Applying promo', { promoId: data.promoId, cardNumber: data.cardNumber });

    try {
      const response = await this.api.post<ApiResponse<any>>(
        '/api/promo/applyPromo',
        data
      );

      if (response.data.data.isSuccess) {
        ApiLogger.success('PROMO', 'Promo applied successfully', { promoId: data.promoId });
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('PROMO', 'Apply promo error', errorMessage);
      throw error;
    }
  }

  // ========================================================================
  // NOTIFICATION METHODS
  // ========================================================================

  /**
   * Get card notifications with pagination
   */
  async getCardNotifications(cardNumber: string, pageNo: number = 1, pageSize: number = 10): Promise<ApiResponse<any>> {
    ApiLogger.log('NOTIFICATION', 'Fetching card notifications', { cardNumber, pageNo, pageSize });

    try {
      const response = await this.api.get<ApiResponse<any>>(
        `/api/Notification/getCardNotifications?cardNumber=${encodeURIComponent(cardNumber)}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      ApiLogger.success('NOTIFICATION', 'Notifications loaded', {
        count: response.data.data.content?.length || 0,
        pageNo
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('NOTIFICATION', 'Fetch notifications error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(userNotificationId: string): Promise<ApiResponse<any>> {
    ApiLogger.log('NOTIFICATION', 'Marking notification as read', { userNotificationId });

    try {
      const response = await this.api.post<ApiResponse<any>>(
        '/api/Notification/markAsRead',
        { userNotificationId }
      );

      if (response.data.data.isSuccess) {
        ApiLogger.success('NOTIFICATION', 'Notification marked as read', { userNotificationId });
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.extractErrorMessage(error);
      ApiLogger.error('NOTIFICATION', 'Mark as read error', errorMessage);
      throw ApiErrorHandler.createError(errorMessage);
    }
  }

  // ========================================================================
  // PUBLIC METHODS - Generic HTTP Methods
  // ========================================================================

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const apiService = new ApiService();
export { ApiErrorHandler, ApiLogger, FormDataBuilder };

