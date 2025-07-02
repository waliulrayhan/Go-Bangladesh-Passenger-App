import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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
  organization?: string;
  cardNumber: string;
  balance: number;
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await storageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              await storageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            await storageService.clearAuthData();
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
        imageUrl: userData.imageUrl?.substring(0, 50) + '...' || 'None'
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
