import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';

export class StorageService {
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      // Ensure value is a string
      const stringValue = typeof value === 'string' ? value : String(value);
      if (!stringValue) {
        throw new Error('Cannot store empty or null value');
      }
      await SecureStore.setItemAsync(key, stringValue);
    } catch (error) {
      console.error('Error storing secure item:', error);
      // Fallback to AsyncStorage
      const stringValue = typeof value === 'string' ? value : String(value);
      await AsyncStorage.setItem(key, stringValue);
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      return await AsyncStorage.getItem(key);
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing secure item:', error);
      await AsyncStorage.removeItem(key);
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error('Error storing item:', error);
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  async storeAuthTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await this.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
    await this.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  async clearAuthData(): Promise<void> {
    await Promise.all([
      this.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN),
      this.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.removeItem(STORAGE_KEYS.USER_DATA),
      this.removeItem(STORAGE_KEYS.USER_TYPE),
      this.removeItem(STORAGE_KEYS.REGISTRATION_COMPLETE)
    ]);
  }

  async clearAllAppData(): Promise<void> {
    console.log('🧹 [STORAGE] Clearing all application data...');
    
    try {
      // Clear all auth-related data
      await this.clearAuthData();
      
      // Clear additional app-specific data
      const additionalKeys = [
        'temp_mobile',
        'temp_registration_data',
        'card_data',
        'trip_data',
        'transaction_cache',
        'history_cache',
        'bus_data_cache',
        'profile_cache'
      ];
      
      await Promise.all(
        additionalKeys.map(key => this.removeItem(key))
      );
      
      console.log('✅ [STORAGE] All application data cleared successfully');
    } catch (error) {
      console.error('❌ [STORAGE] Error clearing application data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
