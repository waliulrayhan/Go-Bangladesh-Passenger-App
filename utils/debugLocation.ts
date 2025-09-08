import { Platform } from 'react-native';

export const debugLocation = {
  log: (message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[LocationDebug${Platform.OS === 'ios' ? ' iOS' : ' Android'}] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (__DEV__) {
      console.error(`[LocationDebug${Platform.OS === 'ios' ? ' iOS' : ' Android'}] ${message}`, error);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[LocationDebug${Platform.OS === 'ios' ? ' iOS' : ' Android'}] ${message}`, data);
    }
  }
};
