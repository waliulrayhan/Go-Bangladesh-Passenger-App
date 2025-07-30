import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Transaction as TransactionType } from '../types';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { storageService } from '../utils/storage';

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

export interface CardValidationResponse {
  isSuccess: boolean;
  content: {
    cardNumber: string;
    status: string;
    balance: number;
    organizationId: string;
    organization: {
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
    };
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
  DateOfBirth?: string; // Format: 2001-11-03 00:00:00.0000000
  Password: string;
  UserType?: string; // Made optional
  OrganizationId?: string; // Made optional
  CardNumber: string;
  PassengerId?: string; // For private organizations (educational institutes)
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
  organization?: {
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
  cardNumber: string;
  balance: number;
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
  session: {
    busId: string;
    userId: string;
    startTime: string;
    endTime: string;
    isRunning: boolean;
    serial: number;
    sessionCode: string;
    user: any;
    bus: {
      busNumber: string;
      busName: string;
      routeId: string;
      route: {
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
      };
      organizationId: string;
      organization: any;
      presentLatitude: string;
      presentLongitude: string;
      id: string;
      createTime: string;
      lastModifiedTime: string;
      createdBy: string;
      lastModifiedBy: string;
      isDeleted: boolean;
    };
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string;
    isDeleted: boolean;
  };
  passenger: {
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
  };
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
  transactionType: 'BusFare';
  amount: number;
  cardId: string;
  agentId: null;
  tripId: string;
  card: null;
  agent: null;
  trip: {
    cardId: string;
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
    tapInType: string | null;
    tapOutStatus: string | null;
    session: {
      busId: string;
      userId: string;
      startTime: string;
      endTime: string;
      isRunning: boolean;
      serial: number;
      sessionCode: string;
      user: null;
      bus: {
        busNumber: string;
        busName: string;
        routeId: string;
        route: null;
        organizationId: string;
        organization: null;
        presentLatitude: string;
        presentLongitude: string;
        id: string;
        createTime: string;
        lastModifiedTime: string;
        createdBy: string;
        lastModifiedBy: string;
        isDeleted: boolean;
      };
      id: string;
      createTime: string;
      lastModifiedTime: string;
      createdBy: string;
      lastModifiedBy: string;
      isDeleted: boolean;
    };
    card: null;
    passenger: null;
    passengerId: null;
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string;
    isDeleted: boolean;
  };
  passenger: null;
  passengerId: null;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface RechargeTransaction {
  transactionType: 'Recharge';
  amount: number;
  cardId: string;
  agentId: string;
  tripId: null;
  transactionId: string;
  card: null;
  agent: {
    isSuperAdmin: boolean;
    name: string;
    emailAddress: string;
    passwordHash: string;
    imageUrl: string | null;
    isApproved: boolean;
    isActive: boolean;
    roleId: null;
    dateOfBirth: null;
    mobileNumber: string;
    address: null;
    gender: string;
    userType: string;
    passengerId: null;
    organizationId: string;
    organization: {
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
    };
    serial: number;
    code: string;
    designation: null;
    id: string;
    createTime: string;
    lastModifiedTime: string;
    createdBy: string;
    lastModifiedBy: string;
    isDeleted: boolean;
  };
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

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
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

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401) {
          console.log('🚫 [API] 401 Unauthorized response received');

          if (!originalRequest._retry) {
            originalRequest._retry = true;

            try {
              const refreshToken = await storageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
              if (refreshToken) {
                console.log('🔄 [API] Attempting token refresh...');
                const response = await this.refreshToken(refreshToken);
                await storageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
                console.log('✅ [API] Token refreshed successfully');
                return this.api(originalRequest);
              }
            } catch (refreshError) {
              console.log('❌ [API] Token refresh failed');
            }
          }

          // If we reach here, token refresh failed or wasn't possible
          console.log('🔓 [API] Clearing auth data and triggering logout...');

          // Trigger logout by calling the auth store method
          const { useAuthStore } = await import('../stores/authStore');
          const authStore = useAuthStore.getState();

          console.log('🔓 [API] Triggering automatic logout due to 401...');
          await authStore.handleUnauthorized();

          // Redirect to login screen with proper navigation handling
          const { router } = await import('expo-router');
          try {
            router.dismissAll();
            router.replace('/');
          } catch (navError) {
            console.warn('⚠️ [API] Navigation error during unauthorized redirect:', navError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(refreshToken: string) {
    return this.api.post('/api/Auth/refresh-token', { refreshToken });
  }

  // Auth API methods
  async getAuthToken(identifier: string, password: string = '123456'): Promise<AuthTokenResponse> {
    console.log('🔐 [AUTH] Starting authentication request...');
    console.log('📱 [AUTH] Identifier:', identifier);
    console.log('🔑 [AUTH] Password:', password ? '***' : 'No password');

    try {
      // Determine if identifier is email or mobile and format payload accordingly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(identifier);

      const payload = isEmail
        ? { email: identifier, password: password }
        : { mobileNumber: identifier, password: password };

      console.log('📤 [AUTH] Request payload:', {
        type: isEmail ? 'email' : 'mobile',
        identifier: identifier,
        hasPassword: !!password
      });

      const response = await this.api.post<ApiResponse<AuthTokenResponse>>('/api/Auth/token', payload);

      console.log('📥 [AUTH] Response received:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message,
        hasToken: !!response.data.data.content?.token
      });

      // Check if the API response indicates success
      if (!response.data.data.isSuccess) {
        console.error('❌ [AUTH] Authentication failed:', response.data.data.message);
        throw new Error(response.data.data.message || 'Authentication failed');
      }

      // Return the content if successful
      if (!response.data.data.content) {
        console.error('❌ [AUTH] No token content received');
        throw new Error('No authentication token received');
      }

      console.log('✅ [AUTH] Authentication successful! Token received.');
      return response.data.data.content;
    } catch (error: any) {
      console.error('💥 [AUTH] Authentication error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    console.log('👤 [USER] Fetching user details...');
    console.log('🆔 [USER] User ID:', userId);
    console.log('🌐 [USER] API URL:', `${API_BASE_URL}/api/passenger/getById?id=${userId}`);

    try {
      const response = await this.api.get<ApiResponse<UserResponse>>(`/api/passenger/getById?id=${userId}`);

      console.log('📥 [USER] Response received:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message,
        hasContent: !!response.data.data.content
      });

      console.log('📊 [USER] Full response data:', JSON.stringify(response.data, null, 2));

      // Check if the API response indicates success
      if (!response.data.data.isSuccess) {
        console.warn('⚠️ [USER] API returned unsuccessful response:', response.data.data.message);
        return null; // API returned unsuccessful response
      }

      // Return the content if successful
      if (!response.data.data.content) {
        console.warn('⚠️ [USER] No user data in response content');
        return null; // No user data received
      }

      const userData = response.data.data.content;
      console.log('✅ [USER] User data retrieved successfully:');
      console.log('📋 [USER] User Details:', {
        id: userData.id,
        name: userData.name,
        mobileNumber: userData.mobileNumber,
        emailAddress: userData.emailAddress,
        address: userData.address,
        gender: userData.gender,
        passengerId: userData.passengerId,
        cardNumber: userData.cardNumber,
        balance: userData.balance,
        hasImageUrl: !!userData.imageUrl,
        imageUrl: userData.imageUrl?.substring(0, 50) + '...' || 'None',
        organizationId: userData.organizationId,
        organizationName: userData.organization?.name || 'None',
        userType: userData.userType
      });

      return userData;
    } catch (error: any) {
      console.error('💥 [USER] API call failed with error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });

      // Handle 404 errors silently as this endpoint may not be available
      if (error.response?.status === 404) {
        console.warn('⚠️ [USER] User not found (404) - endpoint may not be available');
        return null;
      }

      // Only log non-404 errors to avoid spam in production
      if (error.response?.status !== 404) {
        console.error('💥 [USER] Error fetching user details:', {
          status: error.response?.status,
          message: error.response?.data || error.message
        });
      }

      return null; // Return null instead of throwing for graceful degradation
    }
  }

  async getOnGoingTrip(): Promise<Trip | null> {
    console.log('🚌 [TRIP] Fetching ongoing trip...');

    try {
      const response = await this.api.get<ApiResponse<Trip>>('/api/passenger/getOnGoingTrip', {
        // Add a shorter timeout for real-time checks
        timeout: 8000,
        // Add cache control headers to ensure fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('📥 [TRIP] Response received:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        hasContent: !!response.data.data.content
      });

      // Check if the API response indicates success
      if (!response.data.data.isSuccess) {
        console.log('ℹ️ [TRIP] No ongoing trip found:', response.data.data.message);
        return null;
      }

      // Return the content if successful
      if (!response.data.data.content) {
        console.log('ℹ️ [TRIP] No ongoing trip data in response');
        return null;
      }

      const tripData = response.data.data.content;
      console.log('✅ [TRIP] Ongoing trip found:', {
        tripId: tripData.tripId,
        busName: tripData.busName,
        route: `${tripData.tripStartPlace} → ${tripData.tripEndPlace}`
      });

      return tripData;
    } catch (error: any) {
      console.error('💥 [TRIP] Error fetching ongoing trip:', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });

      // Handle specific error cases silently
      if (error.response?.status === 404) {
        console.log('ℹ️ [TRIP] No ongoing trip found (404)');
        return null;
      }

      // Handle timeout errors specifically for real-time polling
      if (error.code === 'ECONNABORTED') {
        console.log('⏱️ [TRIP] Request timed out');
        return null;
      }

      return null;
    }
  }

  async tapOutTrip(): Promise<boolean> {
    console.log('🚌 [TRIP] Attempting to tap out...');

    try {
      const response = await this.api.post('/api/passenger/tapOut');

      console.log('📥 [TRIP] Tap out response received:', {
        status: response.status,
        isSuccess: response.data.data?.isSuccess,
        message: response.data.data?.message
      });

      // Check if the API response indicates success
      if (response.data.data?.isSuccess) {
        console.log('✅ [TRIP] Tap out successful');
        return true;
      } else {
        console.log('❌ [TRIP] Tap out failed:', response.data.data?.message);
        return false;
      }
    } catch (error: any) {
      console.error('💥 [TRIP] Error during tap out:', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });
      return false;
    }
  }

  async forceTripStop(cardNumber: string, tripId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    console.log('🚌 [FORCE TAP OUT] Attempting force trip stop...');
    console.log('📋 [FORCE TAP OUT] Request payload:', { cardNumber, tripId, sessionId });

    try {
      const payload = {
        cardNumber,
        tripId,
        sessionId
      };

      console.log('🌐 [FORCE TAP OUT] Sending request to: /api/transaction/ForceTripStop');
      console.log('📤 [FORCE TAP OUT] Full payload:', JSON.stringify(payload, null, 2));

      const response = await this.api.post<ApiResponse<null>>('/api/transaction/ForceTripStop', payload);

      console.log('📥 [FORCE TAP OUT] Force trip stop response received:', {
        status: response.status,
        isSuccess: response.data.data?.isSuccess,
        message: response.data.data?.message,
        fullResponse: JSON.stringify(response.data, null, 2)
      });

      // Check if the API response indicates success
      if (response.data.data?.isSuccess) {
        console.log('✅ [FORCE TAP OUT] Force trip stop successful');
        return {
          success: true,
          message: response.data.data.message || 'Bus fare deduction has been successful!'
        };
      } else {
        console.log('❌ [FORCE TAP OUT] Force trip stop failed:', response.data.data?.message);
        return {
          success: false,
          message: response.data.data?.message || 'Force trip stop failed'
        };
      }
    } catch (error: any) {
      console.error('💥 [FORCE TAP OUT] Error during force trip stop:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Check if there's a specific error message from the API
      let errorMessage = 'Network error occurred';

      if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // OTP API methods
  async sendOTP(mobileNumber: string): Promise<boolean> {
    console.log('📱 [OTP] Sending OTP to:', mobileNumber);

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/otp/SendOtpForForgotPassword?mobileNumber=${mobileNumber}`
      );

      console.log('📥 [OTP] Send response:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      if (!response.data.data.isSuccess) {
        console.error('❌ [OTP] Send failed:', response.data.data.message);
        throw new Error(response.data.data.message || 'Failed to send OTP');
      }

      console.log('✅ [OTP] OTP sent successfully');
      return true;
    } catch (error: any) {
      console.error('💥 [OTP] Send error:', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyOTP(mobileNumber: string, otp: string): Promise<boolean> {
    console.log('🔐 [OTP] Verifying OTP for:', mobileNumber);

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/otp/VerifyOtp?mobileNumber=${mobileNumber}&otp=${otp}`
      );

      console.log('📥 [OTP] Verify response:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      if (!response.data.data.isSuccess) {
        console.error('❌ [OTP] Verification failed:', response.data.data.message);
        throw new Error(response.data.data.message || 'OTP verification failed');
      }

      console.log('✅ [OTP] OTP verified successfully');
      return true;
    } catch (error: any) {
      console.error('💥 [OTP] Verify error:', error.response?.data || error.message);
      throw error;
    }
  }

  async resetPassword(mobileNumber: string, newPassword: string, confirmNewPassword: string): Promise<boolean> {
    console.log('🔑 [PASSWORD] Resetting password for:', mobileNumber);

    try {
      const payload = {
        mobileNumber,
        newPassword,
        confirmNewPassword
      };

      const response = await this.api.post<ApiResponse<null>>(
        '/api/user/ForgotPassword',
        payload
      );

      console.log('📥 [PASSWORD] Reset response:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      if (!response.data.data.isSuccess) {
        console.error('❌ [PASSWORD] Reset failed:', response.data.data.message);
        throw new Error(response.data.data.message || 'Password reset failed');
      }

      console.log('✅ [PASSWORD] Password reset successfully');
      return true;
    } catch (error: any) {
      console.error('💥 [PASSWORD] Reset error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Card validation API methods
  async checkCardValidity(cardNumber: string): Promise<CardValidationResponse> {
    console.log('🃏 [CARD] Checking card validity for:', cardNumber);

    try {
      const response = await this.api.get<ApiResponse<null>>(
        `/api/card/CheckCardValidity?cardNumber=${cardNumber}`
      );

      console.log('📥 [CARD] Validation response:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      return response.data.data;
    } catch (error: any) {
      console.error('💥 [CARD] Validation error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Registration API methods
  async registerPassenger(registrationData: RegistrationData): Promise<boolean> {
    console.log('👤 [REGISTRATION] Registering passenger:', registrationData.Name);
    console.log('📋 [REGISTRATION] Full payload:', JSON.stringify(registrationData, null, 2));

    try {
      // Create FormData to match Postman's form-data format
      const formData = new FormData();

      // Add all fields to FormData
      formData.append('Name', registrationData.Name);
      formData.append('MobileNumber', registrationData.MobileNumber);
      if (registrationData.EmailAddress) {
        formData.append('EmailAddress', registrationData.EmailAddress);
      }
      if (registrationData.Gender) {
        formData.append('Gender', registrationData.Gender);
      }
      if (registrationData.Address) {
        formData.append('Address', registrationData.Address);
      }
      if (registrationData.DateOfBirth) {
        formData.append('DateOfBirth', registrationData.DateOfBirth);
      }
      formData.append('Password', registrationData.Password);
      if (registrationData.UserType) {
        formData.append('UserType', registrationData.UserType);
      }
      if (registrationData.OrganizationId) {
        formData.append('OrganizationId', registrationData.OrganizationId);
      }
      formData.append('CardNumber', registrationData.CardNumber);
      if (registrationData.PassengerId) {
        formData.append('PassengerId', registrationData.PassengerId);
      }

      console.log('📤 [REGISTRATION] Sending as FormData...');

      const response = await this.api.post<ApiResponse<null>>(
        '/api/passenger/registration',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('📥 [REGISTRATION] Response:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message,
        fullResponse: response.data
      });

      if (!response.data.data.isSuccess) {
        console.error('❌ [REGISTRATION] Failed:', response.data.data.message);
        throw new Error(response.data.data.message || 'Registration failed');
      }

      console.log('✅ [REGISTRATION] Registration successful');
      return true;
    } catch (error: any) {
      console.error('💥 [REGISTRATION] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific error cases
      if (error.response?.data?.data?.message) {
        throw new Error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  }

  /**
   * Fetch passenger trip history
   */
  async getPassengerTripHistory(passengerId: string, pageNo: number = 1, pageSize: number = 10): Promise<ApiResponse<TripTransaction[]>> {
    try {
      console.log(`🚌 [API] Fetching trip history for: ${passengerId}`);

      const response = await this.api.get<ApiResponse<TripTransaction[]>>(
        `/api/history/passengerTrip?id=${passengerId}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      console.log('✅ [API] Trip history loaded:', response.data?.data?.content?.length || 0, 'trips');
      return response.data;
    } catch (error: any) {
      console.error('❌ [API] Trip history error:', error.response?.status || error.message);

      if (error.response?.data?.data?.message) {
        throw new Error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch trip history. Please try again.');
      }
    }
  }

  /**
   * Fetch passenger recharge history
   */
  async getPassengerRechargeHistory(passengerId: string, pageNo: number = 1, pageSize: number = 10): Promise<ApiResponse<RechargeTransaction[]>> {
    try {
      console.log(`💳 [API] Fetching recharge history for: ${passengerId}`);

      const response = await this.api.get<ApiResponse<RechargeTransaction[]>>(
        `/api/history/passengerRecharge?id=${passengerId}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      console.log('✅ [API] Recharge history loaded:', response.data?.data?.content?.length || 0, 'recharges');
      return response.data;
    } catch (error: any) {
      console.error('❌ [API] Recharge history error:', error.response?.status || error.message);

      if (error.response?.data?.data?.message) {
        throw new Error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch recharge history. Please try again.');
      }
    }
  }

  /**
   * Fetch passenger transaction history (legacy - kept for backward compatibility)
   * @deprecated Use getPassengerTripHistory and getPassengerRechargeHistory instead
   */
  async getPassengerHistory(passengerId: string, pageNo: number = 1, pageSize: number = 100): Promise<ApiResponse<TransactionType[]>> {
    try {
      console.log(`🔄 [API] Fetching legacy history for: ${passengerId}`);

      const response = await this.api.get<ApiResponse<TransactionType[]>>(
        `/api/history/passenger?id=${passengerId}&pageNo=${pageNo}&pageSize=${pageSize}`
      );

      console.log('✅ [API] Legacy history loaded:', response.data?.data?.content?.length || 0, 'items');
      return response.data;
    } catch (error: any) {
      console.error('❌ [API] Legacy history error:', error.response?.status || error.message);

      // Handle specific error cases
      if (error.response?.data?.data?.message) {
        throw new Error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch history. Please try again.');
      }
    }
  }

  async changePassword(changePasswordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    console.log('🔑 [PASSWORD] Attempting to change password...');

    try {
      const response = await this.api.post<ApiResponse<null>>('/api/user/changePassword', changePasswordData);

      console.log('📥 [PASSWORD] Change password response received:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message
      });

      // Return the API response data
      return response.data.data;
    } catch (error: any) {
      console.error('💥 [PASSWORD] Error changing password:', {
        status: error.response?.status,
        message: error.response?.data?.data?.message || error.message
      });

      // If the API returned an error response with data, return it
      if (error.response?.data?.data) {
        return error.response.data.data;
      }

      // Otherwise, throw the error
      throw error;
    }
  }

  /**
   * Update card number for public users
   */
  async updateCardNumber(userId: string, cardNumber: string): Promise<UpdateCardNumberResponse> {
    console.log('🔄 [UPDATE CARD] Updating card number for user:', userId);
    console.log('🆔 [UPDATE CARD] New card number:', cardNumber);

    try {
      const requestData: UpdateCardNumberRequest = {
        userId,
        cardNumber
      };

      console.log('📤 [UPDATE CARD] Sending request:', requestData);
      console.log('🌐 [UPDATE CARD] API URL:', `${API_BASE_URL}/api/passenger/updateCardNumber`);

      const response = await this.api.put<ApiResponse<null>>(
        '/api/passenger/updateCardNumber',
        requestData
      );

      console.log('📥 [UPDATE CARD] Response received:', {
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
      console.error('💥 [UPDATE CARD] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific error cases
      if (error.response?.data?.data?.message) {
        throw new Error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to update card number. Please try again.');
      }
    }
  }

  /**
   * Update passenger profile information
   */
  async updatePassengerProfile(updateData: FormData | {
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
  }): Promise<{ isSuccess: boolean; message: string }> {
    console.log('🔄 [UPDATE PROFILE] Updating passenger profile...');

    try {
      let formData: FormData;

      // If already FormData, use it directly. Otherwise, create FormData from object
      if (updateData instanceof FormData) {
        formData = updateData;
        console.log('📤 [UPDATE PROFILE] Using provided FormData directly');
      } else {
        console.log('🔄 [UPDATE PROFILE] Creating FormData from object for user:', updateData.Id);

        // Create FormData to match the API's multipart/form-data requirement
        formData = new FormData();

        // Add all fields to FormData
        formData.append('Id', updateData.Id);

        if (updateData.Name) {
          formData.append('Name', updateData.Name);
        }
        if (updateData.MobileNumber) {
          formData.append('MobileNumber', updateData.MobileNumber);
        }
        if (updateData.EmailAddress) {
          formData.append('EmailAddress', updateData.EmailAddress);
        }
        if (updateData.Gender) {
          formData.append('Gender', updateData.Gender);
        }
        if (updateData.Address) {
          formData.append('Address', updateData.Address);
        }
        if (updateData.DateOfBirth) {
          formData.append('DateOfBirth', updateData.DateOfBirth);
        }
        if (updateData.UserType) {
          formData.append('UserType', updateData.UserType);
        }
        if (updateData.OrganizationId) {
          formData.append('OrganizationId', updateData.OrganizationId);
        }
        if (updateData.PassengerId) {
          formData.append('PassengerId', updateData.PassengerId);
        }
        if (updateData.ProfilePicture) {
          formData.append('ProfilePicture', updateData.ProfilePicture);
        }
      }

      console.log('📤 [UPDATE PROFILE] Sending as FormData...');

      const response = await this.api.put<ApiResponse<null>>(
        '/api/passenger/update',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('📥 [UPDATE PROFILE] Response:', {
        status: response.status,
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message,
        fullResponse: response.data
      });

      return {
        isSuccess: response.data.data.isSuccess,
        message: response.data.data.message || 'Profile updated successfully!'
      };
    } catch (error: any) {
      console.error('💥 [UPDATE PROFILE] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific error cases
      if (error.response?.data?.data?.message) {
        throw new Error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to update profile. Please try again.');
      }
    }
  }

  // Generic HTTP methods
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

export const apiService = new ApiService();
