import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Type definitions
export type DateFilter = "all" | "today" | "week" | "month" | "custom";
export type SortOrder = "newest" | "oldest" | "amount_high" | "amount_low";

export interface FilterOptions {
  dateFilter: DateFilter;
  sortOrder: SortOrder;
  customStartDate?: Date;
  customEndDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

interface FilterModalProps {
  visible: boolean;
  filters: FilterOptions;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
}) => {
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);
  const [isApplying, setIsApplying] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Update temp filters when modal opens
  useEffect(() => {
    if (visible) {
      setTempFilters(filters);
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, filters]);

  const handleBackdropPress = useCallback(() => {
    if (!isApplying) {
      onClose();
    }
  }, [onClose, isApplying]);

  const handleApply = useCallback(async () => {
    if (isApplying) return;
    
    setIsApplying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
      onApply(tempFilters);
      onClose();
    } finally {
      setIsApplying(false);
    }
  }, [tempFilters, onApply, onClose, isApplying]);

  const handleReset = useCallback(() => {
    const defaultFilters: FilterOptions = {
      dateFilter: "all",
      sortOrder: "newest",
    };
    setTempFilters(defaultFilters);
  }, []);

  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      default: return "All Time";
    }
  };

  const getSortOrderLabel = (sort: SortOrder): string => {
    switch (sort) {
      case "oldest": return "Oldest First";
      case "amount_high": return "Amount: High to Low";
      case "amount_low": return "Amount: Low to High";
      default: return "Newest First";
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleBackdropPress}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Options</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleBackdropPress}
                  disabled={isApplying}
                >
                  <Ionicons name="close" size={24} color={COLORS.gray[600]} />
                </TouchableOpacity>
              </View>

              {/* Date Filter Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Time Period</Text>
                <View style={styles.optionsGrid}>
                  {(['all', 'today', 'week', 'month'] as DateFilter[]).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        tempFilters.dateFilter === option && styles.optionButtonActive,
                      ]}
                      onPress={() => setTempFilters(prev => ({ ...prev, dateFilter: option }))}
                      disabled={isApplying}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.dateFilter === option && styles.optionTextActive,
                        ]}
                      >
                        {getDateFilterLabel(option)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Order Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sort Order</Text>
                <View style={styles.optionsGrid}>
                  {(['newest', 'oldest', 'amount_high', 'amount_low'] as SortOrder[]).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        tempFilters.sortOrder === option && styles.optionButtonActive,
                      ]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortOrder: option }))}
                      disabled={isApplying}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.sortOrder === option && styles.optionTextActive,
                        ]}
                      >
                        {getSortOrderLabel(option)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={handleReset}
                  disabled={isApplying}
                >
                  <Ionicons name="refresh-outline" size={16} color={COLORS.gray[600]} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.applyButton,
                    isApplying && styles.buttonDisabled,
                  ]}
                  onPress={handleApply}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      <Text style={styles.applyButtonText}>Apply</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    minWidth: 80,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  optionTextActive: {
    color: COLORS.white,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  resetButton: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default FilterModal;

