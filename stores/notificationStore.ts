import { create } from 'zustand';
import { apiService } from '../services/api';
import { Notification } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { storageService } from '../utils/storage';
import { useCardStore } from './cardStore';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  totalCount: number;

  // Actions
  loadNotifications: (pageNo?: number, reset?: boolean) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  checkUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
  clearAllNotifications: () => void;
}

const formatError = (error: any): string => {
  if (error.response?.data?.data?.message) {
    return error.response.data.data.message;
  }
  return error.message || 'An error occurred';
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  hasMore: true,
  totalCount: 0,

  // Load notifications with pagination
  loadNotifications: async (pageNo = 1, reset = false) => {
    const { isLoading, pageSize } = get();
    
    // Prevent concurrent requests
    if (isLoading) {
      console.log('🔔 [NOTIFICATION STORE] Already loading, skipping...');
      return;
    }

    const { card } = useCardStore.getState();
    const cardNumber = card?.cardNumber;

    if (!cardNumber) {
      console.log('🔔 [NOTIFICATION STORE] No card number available');
      set({ error: 'Card number not available' });
      return;
    }

    console.log(`🔔 [NOTIFICATION STORE] Loading notifications page ${pageNo}${reset ? ' (reset)' : ''}`);

    set({ isLoading: true, error: null });

    try {
      const response = await apiService.getCardNotifications(cardNumber, pageNo, pageSize);

      if (response.data.isSuccess) {
        const newNotifications = response.data.content || [];
        const totalCount = newNotifications.length;

        // Calculate unread count
        const unreadCount = newNotifications.filter((n: Notification) => !n.isRead).length;

        set((state) => ({
          notifications: reset ? newNotifications : [...state.notifications, ...newNotifications],
          unreadCount: reset ? unreadCount : state.unreadCount + unreadCount,
          currentPage: pageNo,
          hasMore: newNotifications.length === pageSize,
          totalCount: reset ? totalCount : state.totalCount + totalCount,
          isLoading: false,
          error: null,
        }));

        console.log(`🔔 [NOTIFICATION STORE] Loaded ${newNotifications.length} notifications (unread: ${unreadCount})`);
      } else {
        throw new Error(response.data.message || 'Failed to load notifications');
      }
    } catch (error: any) {
      const errorMessage = formatError(error);
      console.error('🔔 [NOTIFICATION STORE] Load error:', errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Load more notifications (pagination)
  loadMoreNotifications: async () => {
    const { currentPage, hasMore, isLoading } = get();
    
    if (!hasMore || isLoading) {
      console.log('🔔 [NOTIFICATION STORE] No more notifications or already loading');
      return;
    }

    const nextPage = currentPage + 1;
    console.log(`🔔 [NOTIFICATION STORE] Loading more notifications (page ${nextPage})`);
    
    await get().loadNotifications(nextPage, false);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    console.log(`🔔 [NOTIFICATION STORE] Marking notification as read: ${notificationId}`);

    try {
      const response = await apiService.markNotificationAsRead(notificationId);

      if (response.data.isSuccess) {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          );

          const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });

        console.log(`🔔 [NOTIFICATION STORE] Notification marked as read: ${notificationId}`);
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      const errorMessage = formatError(error);
      console.error('🔔 [NOTIFICATION STORE] Mark as read error:', errorMessage);
      set({ error: errorMessage });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    console.log('🔔 [NOTIFICATION STORE] Marking all notifications as read');

    try {
      // Get userId from storage
      const userData = await storageService.getItem<{ id: string }>(STORAGE_KEYS.USER_DATA);
      const userId = userData?.id;

      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await apiService.markAllNotificationsAsRead(userId.toString());

      if (response.data.isSuccess) {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString()
          }));

          return {
            notifications: updatedNotifications,
            unreadCount: 0,
          };
        });

        console.log('🔔 [NOTIFICATION STORE] All notifications marked as read');
      } else {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
    } catch (error: any) {
      const errorMessage = formatError(error);
      console.error('🔔 [NOTIFICATION STORE] Mark all as read error:', errorMessage);
      set({ error: errorMessage });
    }
  },

  // Check for unread notifications (lightweight check)
  checkUnreadCount: async () => {
    const { card } = useCardStore.getState();
    const cardNumber = card?.cardNumber;

    if (!cardNumber) {
      return;
    }

    try {
      // Fetch only the first page to check unread count
      const response = await apiService.getCardNotifications(cardNumber, 1, 10);

      if (response.data.isSuccess) {
        const notifications = response.data.content || [];
        const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

        set({ unreadCount });
        console.log(`🔔 [NOTIFICATION STORE] Unread count updated: ${unreadCount}`);
      }
    } catch (error: any) {
      const errorMessage = formatError(error);
      console.error('🔔 [NOTIFICATION STORE] Check unread count error:', errorMessage);
    }
  },

  // Refresh notifications
  refreshNotifications: async () => {
    console.log('🔔 [NOTIFICATION STORE] Refreshing notifications');
    set({ isRefreshing: true });
    
    await get().loadNotifications(1, true);
    
    set({ isRefreshing: false });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear all notification data
  clearAllNotifications: () => {
    console.log('🔔 [NOTIFICATION STORE] Clearing all notification data');
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isRefreshing: false,
      error: null,
      currentPage: 1,
      hasMore: true,
      totalCount: 0,
    });
  },
}));
