import { create } from 'zustand';
import { apiService } from '../services/api';

interface ForgotPasswordState {
  isLoading: boolean;
  error: string | null;
  
  sendOTPForForgotPassword: (mobile: string) => Promise<boolean>;
  verifyOTP: (mobile: string, otp: string) => Promise<boolean>;
  resetPassword: (mobile: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  clearError: () => void;
}

const formatError = (error: any): string => {
  if (error.response?.data?.data?.message) {
    return error.response.data.data.message;
  }
  return error.message || 'An error occurred';
};

export const useForgotPasswordStore = create<ForgotPasswordState>((set) => ({
  isLoading: false,
  error: null,

  sendOTPForForgotPassword: async (mobile: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.sendOTPForForgotPassword(mobile);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  verifyOTP: async (mobile: string, otp: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.verifyOTP(mobile, otp);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  resetPassword: async (mobile: string, newPassword: string, confirmPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.resetPassword(mobile, newPassword, confirmPassword);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: formatError(error)
      });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
