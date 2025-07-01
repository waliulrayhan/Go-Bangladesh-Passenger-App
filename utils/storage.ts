import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';

export class StorageService {
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error storing secure item:', error);
      await AsyncStorage.setItem(key, value);
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
      this.removeItem(STORAGE_KEYS.USER_TYPE)
    ]);
  }
}

export const storageService = new StorageService();
