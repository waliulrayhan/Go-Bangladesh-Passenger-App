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
  id: number | string;
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
    try {
      // Determine if identifier is email or mobile and format payload accordingly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(identifier);
      
      const payload = isEmail 
        ? { email: identifier, password: password }
        : { mobileNumber: identifier, password: password };
      
      const response = await this.api.post<ApiResponse<AuthTokenResponse>>('/api/Auth/token', payload);
      
      // Check if the API response indicates success
      if (!response.data.data.isSuccess) {
        throw new Error(response.data.data.message || 'Authentication failed');
      }
      
      // Return the content if successful
      if (!response.data.data.content) {
        throw new Error('No authentication token received');
      }
      
      return response.data.data.content;
    } catch (error: any) {
      console.error('API: Auth token error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const response = await this.api.get<ApiResponse<UserResponse>>(`/api/passenger/getById/${userId}`);
      
      // Check if the API response indicates success
      if (!response.data.data.isSuccess) {
        throw new Error(response.data.data.message || 'Failed to get user details');
      }
      
      // Return the content if successful
      if (!response.data.data.content) {
        throw new Error('No user data received');
      }
      
      return response.data.data.content;
    } catch (error: any) {
      console.error('API: User details error:', error.response?.data || error.message);
      throw error;
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
