// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Custom components and hooks
import { useToast } from "../hooks/useToast";
import { TripTransaction } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { COLORS, SPACING } from "../utils/constants";
import { formatDate, TimeFormatter } from "../utils/dateTime";
import { downloadInvoiceAsText } from "../utils/invoiceTextGenerator";
import { downloadInvoicePDF } from "../utils/pdfGenerator";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";
import { Toast } from "./ui/Toast";

// UI text constants
const UI_TEXTS = {
  MODAL: {
    TITLE: "Trip Receipt",
    CLOSE: "Close",
  },
  SECTIONS: {
    USER_INFO: "User Information",
    TRIP_INFO: "Trip Information",
    FARE_DETAILS: "Fare Details",
    LOCATIONS: "Trip Locations",
    TIMING: "Trip Timing",
    VEHICLE_INFO: "Vehicle Information",
  },
  LABELS: {
    // User Information
    USER_NAME: "Name",
    CARD_NUMBER: "Card Number",
    USER_ORGANIZATION: "Organization",
    // Trip Information
    TRANSACTION_ID: "Transaction ID",
    BUS_NUMBER: "Bus Number",
    BUS_ROUTE: "Route",
    SESSION_CODE: "Session Code",
    ORGANIZATION: "Bus Organization",
    FARE_AMOUNT: "Fare Amount",
    DISTANCE: "Distance Traveled",
    TAP_IN_TIME: "Tap In Time",
    TAP_OUT_TIME: "Tap Out Time",
    TAP_IN_BY: "Tap In Method",
    TAP_OUT_BY: "Tap Out Method",
    TAP_IN_LOCATION: "Boarding Location",
    TAP_OUT_LOCATION: "Alighting Location",
    TRIP_DURATION: "Trip Duration",
    VIEW_ON_MAP: "View on Map",
    VIEW_ROUTE: "View Route",
  },
  FALLBACKS: {
    NOT_AVAILABLE: "N/A",
    ONGOING_TRIP: "Ongoing Trip",
    UNKNOWN: "Unknown",
  },
} as const;

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  tripTransaction: TripTransaction | null;
}

const openMapLocation = (latitude: number, longitude: number): void => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  Linking.openURL(url);
};

const openRouteMap = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): void => {
  const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
  Linking.openURL(url);
};

const getTapTypeColor = (tapType: string): string => {
  switch (tapType) {
    case "Card":
      return "#1976D2";
    case "Time-Out":
      return "#F57C00";
    case "Staff":
      return "#388E3C";
    case "Session-Out":
      return "#D32F2F";
    case "Mobile App":
      return "#7B1FA2";
    case "Penalty":
      return "#E65100";
    default:
      return COLORS.gray[500];
  }
};

const getTripDuration = (startTime: string, endTime?: string): string => {
  if (!endTime) return UI_TEXTS.FALLBACKS.ONGOING_TRIP;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  onClose,
  tripTransaction,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  // Get current user information
  const user = useAuthStore((state) => state.user);

  const handleDownloadPDF = async () => {
    if (!tripTransaction) return;
    
    setIsGeneratingPDF(true);
    
    try {
      console.log('Attempting PDF generation...');
      const success = await downloadInvoicePDF(tripTransaction);
      
      if (success) {
        showToast("Trip receipt has been saved successfully!", "success");
      } else {
        console.log('PDF generation failed, trying text fallback...');
        // Fallback to text file if PDF generation fails
        const textSuccess = await downloadInvoiceAsText(tripTransaction);
        
        if (textSuccess) {
          showToast("Trip receipt saved as text file (PDF generation failed)", "warning");
        } else {
          showToast("Failed to generate receipt. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      
      try {
        console.log('Attempting text fallback after error...');
        const textSuccess = await downloadInvoiceAsText(tripTransaction);
        
        if (textSuccess) {
          showToast("Trip receipt saved as text file (PDF error occurred)", "warning");
        } else {
          showToast("An error occurred while generating the receipt.", "error");
        }
      } catch (fallbackError) {
        console.error('Fallback text generation also failed:', fallbackError);
        showToast("An error occurred while generating the receipt.", "error");
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!tripTransaction || !tripTransaction.trip) {
    return null;
  }

  const trip = tripTransaction.trip;
  const bus = trip.session?.bus;
  const organization = bus?.organization;

  // Debug logging to understand available data (remove in production)
  console.log('TripTransaction Data:', {
    card: tripTransaction.card,
    trip: {
      distance: trip.distance,
      session: trip.session
    },
    bus: bus,
    user: user
  });
  
  // Get card number from multiple sources
  const getCardNumber = () => {
    return tripTransaction.card?.cardNumber || user?.cardNumber || 'Not Available';
  };
  
  // Try to get route information from different sources
  const getRouteInfo = () => {
    // Check if bus has route with start/end places
    if (bus?.route?.tripStartPlace && bus?.route?.tripEndPlace) {
      return `${bus.route.tripStartPlace} → ${bus.route.tripEndPlace}`;
    }
    // Fallback to bus name if available
    if (bus?.busName) {
      return bus.busName;
    }
    // Last fallback
    return 'Route information not available';
  };
  
  // Get distance with fallback
  const getDistance = () => {
    if (trip.distance !== undefined && trip.distance !== null) {
      return trip.distance > 0 ? `${trip.distance.toFixed(2)} km` : "0.00 km";
    }
    return "Distance not available";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h5" color={COLORS.white} style={styles.headerTitle}>
            {UI_TEXTS.MODAL.TITLE}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadPDF}
              disabled={isGeneratingPDF}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isGeneratingPDF ? "hourglass-outline" : "download-outline"} 
                size={20} 
                color={COLORS.white} 
              />
              <Text variant="bodySmall" color={COLORS.white} style={styles.downloadButtonText}>
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Information Section */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={COLORS.secondary} />
              <Text variant="h6" color={COLORS.secondary} style={styles.sectionTitle}>
                {UI_TEXTS.SECTIONS.USER_INFO}
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {user?.name && (
                <View style={styles.infoRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.USER_NAME}:
                  </Text>
                  <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                    {user.name}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.CARD_NUMBER}:
                </Text>
                <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                  {getCardNumber()}
                </Text>
              </View>
              {user?.organization && (
                <View style={styles.infoRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.USER_ORGANIZATION}:
                  </Text>
                  <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                    {typeof user.organization === 'string' ? user.organization : user.organization.name}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Trip Information Section */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.secondary} />
              <Text variant="h6" color={COLORS.secondary} style={styles.sectionTitle}>
                {UI_TEXTS.SECTIONS.TRIP_INFO}
              </Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.TRANSACTION_ID}:
                </Text>
                <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                  {tripTransaction.transactionId}
                </Text>
              </View>
              {bus?.busNumber && (
                <View style={styles.infoRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.BUS_NUMBER}:
                  </Text>
                  <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                    {bus.busNumber}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.BUS_ROUTE}:
                </Text>
                <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                  {getRouteInfo()}
                </Text>
              </View>
              {organization?.name && (
                <View style={styles.infoRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.ORGANIZATION}:
                  </Text>
                  <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                    {organization.name}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Fare Details Section */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={20} color={COLORS.secondary} />
              <Text variant="h6" color={COLORS.secondary} style={styles.sectionTitle}>
                {UI_TEXTS.SECTIONS.FARE_DETAILS}
              </Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.distanceRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.DISTANCE}:
                </Text>
                <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                  {getDistance()}
                </Text>
              </View>
              <View style={styles.fareRow}>
                <Text variant="h6" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.FARE_AMOUNT}:
                </Text>
                <Text variant="h5" color={COLORS.error} style={styles.fareAmount}>
                  ৳{tripTransaction.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Timing Section */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
              <Text variant="h6" color={COLORS.secondary} style={styles.sectionTitle}>
                {UI_TEXTS.SECTIONS.TIMING}
              </Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.TAP_IN_TIME}:
                </Text>
                <View style={styles.timeContainer}>
                  <Text variant="body" color={COLORS.success} style={styles.timeText}>
                    {trip.tripStartTime ? TimeFormatter.forHistory(trip.tripStartTime) : UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
                  </Text>
                  <Text variant="caption" color={COLORS.gray[500]} style={styles.dateText}>
                    {trip.tripStartTime ? formatDate(new Date(trip.tripStartTime)) : ""}
                  </Text>
                </View>
              </View>
              
              {trip.tripEndTime && (
                <View style={styles.infoRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.TAP_OUT_TIME}:
                  </Text>
                  <View style={styles.timeContainer}>
                    <Text variant="body" color={COLORS.error} style={styles.timeText}>
                      {TimeFormatter.forHistory(trip.tripEndTime)}
                    </Text>
                    <Text variant="caption" color={COLORS.gray[500]} style={styles.dateText}>
                      {formatDate(new Date(trip.tripEndTime))}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.TRIP_DURATION}:
                </Text>
                <Text variant="body" color={COLORS.gray[900]} style={styles.infoValue}>
                  {getTripDuration(trip.tripStartTime, trip.tripEndTime)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="body" color={COLORS.gray[600]}>
                  {UI_TEXTS.LABELS.TAP_IN_BY}:
                </Text>
                <View style={styles.tapMethodContainer}>
                  <View
                    style={[
                      styles.tapMethodBadge,
                      { backgroundColor: getTapTypeColor(trip.tapInType || "") + "20" },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      color={getTapTypeColor(trip.tapInType || "")}
                      style={styles.tapMethodText}
                    >
                      {trip.tapInType || UI_TEXTS.FALLBACKS.UNKNOWN}
                    </Text>
                  </View>
                </View>
              </View>

              {trip.tapOutStatus && (
                <View style={styles.infoRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.TAP_OUT_BY}:
                  </Text>
                  <View style={styles.tapMethodContainer}>
                    <View
                      style={[
                        styles.tapMethodBadge,
                        { backgroundColor: getTapTypeColor(trip.tapOutStatus) + "20" },
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        color={getTapTypeColor(trip.tapOutStatus)}
                        style={styles.tapMethodText}
                      >
                        {trip.tapOutStatus}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* Locations Section */}
          {/* {(trip.startingLatitude && trip.startingLongitude) && (
            <Card variant="elevated" style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={20} color={COLORS.secondary} />
                <Text variant="h6" color={COLORS.secondary} style={styles.sectionTitle}>
                  {UI_TEXTS.SECTIONS.LOCATIONS}
                </Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.locationRow}>
                  <Text variant="body" color={COLORS.gray[600]}>
                    {UI_TEXTS.LABELS.TAP_IN_LOCATION}:
                  </Text>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openMapLocation(+trip.startingLatitude!, +trip.startingLongitude!)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={16} color={COLORS.success} />
                    <Text variant="bodySmall" color={COLORS.success} style={styles.mapButtonText}>
                      {UI_TEXTS.LABELS.VIEW_ON_MAP}
                    </Text>
                  </TouchableOpacity>
                </View>

                {trip.endingLatitude && trip.endingLongitude && (
                  <View style={styles.locationRow}>
                    <Text variant="body" color={COLORS.gray[600]}>
                      {UI_TEXTS.LABELS.TAP_OUT_LOCATION}:
                    </Text>
                    <TouchableOpacity
                      style={styles.mapButton}
                      onPress={() => openMapLocation(+trip.endingLatitude!, +trip.endingLongitude!)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location" size={16} color={COLORS.error} />
                      <Text variant="bodySmall" color={COLORS.error} style={styles.mapButtonText}>
                        {UI_TEXTS.LABELS.VIEW_ON_MAP}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {trip.endingLatitude && trip.endingLongitude && trip.distance > 0 && (
                  <View style={styles.routeButtonContainer}>
                    <TouchableOpacity
                      style={styles.routeButton}
                      onPress={() => openRouteMap(
                        +trip.startingLatitude!,
                        +trip.startingLongitude!,
                        +trip.endingLatitude!,
                        +trip.endingLongitude!
                      )}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="map" size={16} color={COLORS.primary} />
                      <Text variant="body" color={COLORS.primary} style={styles.routeButtonText}>
                        {UI_TEXTS.LABELS.VIEW_ROUTE}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          )} */}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Toast notification */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white + "20",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.white + "40",
  },
  downloadButtonText: {
    fontWeight: "500",
    fontSize: 12,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: 20,
    // backgroundColor: COLORS.gray[100],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.sm,
  },
  section: {
    // marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionContent: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  fareAmount: {
    fontWeight: "600",
  },
  timeContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  timeText: {
    fontWeight: "500",
  },
  dateText: {
    fontSize: 11,
  },
  tapMethodContainer: {
    alignItems: "flex-end",
  },
  tapMethodBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  tapMethodText: {
    fontWeight: "500",
    fontSize: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  mapButtonText: {
    fontWeight: "500",
  },
  routeButtonContainer: {
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  routeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  routeButtonText: {
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 20,
  },
});