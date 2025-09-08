import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { PulsingDot } from "../../components/PulsingDot";
import { Toast } from "../../components/ui/Toast";
import { useLocation } from "../../hooks/useLocation";
import { useToast } from "../../hooks/useToast";
import { ApiResponse, apiService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { BusInfo } from "../../types";
import { COLORS } from "../../utils/constants";
import { debugLocation } from "../../utils/debugLocation";
import { FONT_SIZES, FONT_WEIGHTS } from "../../utils/fonts";
import { generateMapHTML } from "./map/mapHTML";

// Constants
const REFRESH_INTERVAL = 10000; // 10 seconds
const DEFAULT_COORDINATES = {
  lat: 23.8103, // Dhaka, Bangladesh
  lng: 90.4125,
};

// Types
interface MapState {
  buses: BusInfo[];
  loading: boolean;
  refreshing: boolean;
  mapLoaded: boolean;
  isInitialLoad: boolean;
  userInteractedWithMap: boolean;
}

export default function MapViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);

  // Hooks
  const { user } = useAuthStore();
  const { toast, showError, showSuccess, showInfo, hideToast } = useToast();

  const {
    userLocation,
    gettingLocation,
    getUserLocation,
    checkLocationPermission,
  } = useLocation({
    onLocationSuccess: (location) => {
      const userName = user?.name || "You";
      showSuccess("Your location has been added to the map");
      setMapState((prev) => ({ ...prev, userInteractedWithMap: false })); // Reset to allow centering
      
      // Enhanced iOS handling for location success
      if (mapState.mapLoaded && webViewRef.current) {
        if (Platform.OS === 'ios') {
          // Add multiple attempts for iOS with increasing delays
          let attempts = 0;
          const maxAttempts = 3;
          const tryAddLocation = () => {
            attempts++;
            addUserLocationToMap(
              location.latitude,
              location.longitude,
              userName,
              false
            );
            
            // Retry if needed
            if (attempts < maxAttempts) {
              setTimeout(tryAddLocation, 300 * attempts);
            }
          };
          
          setTimeout(tryAddLocation, 100);
        } else {
          addUserLocationToMap(
            location.latitude,
            location.longitude,
            userName,
            false
          );
        }
      }
    },
    onLocationError: (error) => {
      showError(error);
      // On iOS, provide additional guidance for common issues
      if (Platform.OS === 'ios' && error.includes('Settings')) {
        setTimeout(() => {
          showInfo("Open Settings > Privacy & Security > Location Services > Go BD");
        }, 3000);
      }
    },
    onLocationInfo: (info) => showInfo(info),
  });

  // State
  const [mapState, setMapState] = useState<MapState>({
    buses: [],
    loading: true,
    refreshing: false,
    mapLoaded: false,
    isInitialLoad: true,
    userInteractedWithMap: false,
  });

  // Route params
  const organizationId = params.organizationId as string;
  const organizationName = params.organizationName as string;
  const routeId = params.routeId as string;
  const routeName = params.routeName as string;

  // Effects
  useEffect(() => {
    initializeMap();

    const interval = setInterval(() => {
      fetchBusData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [organizationId, routeId]);

  // Handle back button/gesture navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push("/(tabs)/map");
        return true; // Prevent default back action
      };

      // Add hardware back button handler for Android
      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
      }

      // For iOS, the gesture navigation is handled by the navigation system
      // but we can override it by preventing default navigation
      return () => {};
    }, [router])
  );

  // Initialization
  const initializeMap = async () => {
    // Always fetch bus data first
    await fetchBusData(false);
    
    // Check location permission but don't block the map loading
    try {
      await checkLocationPermission();
    } catch (error) {
      console.log('Initial location check failed:', error);
    }
  };

  // API Functions
  const fetchBusData = async (isRefresh = false) => {
    try {
      updateLoadingState(isRefresh, true);

      const apiUrl = buildApiUrl(organizationId, routeId);
      const response = await apiService.get<ApiResponse<BusInfo[]>>(apiUrl);

      if (response.data.data.isSuccess) {
        const busData = response.data.data.content;
        updateBusData(busData, isRefresh);
      }
    } catch (error) {
      handleFetchError(error, isRefresh);
    } finally {
      updateLoadingState(isRefresh, false);
    }
  };

  // Helper Functions
  const buildApiUrl = (organizationId: string, routeId?: string): string => {
    let url = `/api/bus/getAllBusMapData?organizationId=${organizationId}`;
    if (routeId) {
      url += `&routeId=${routeId}`;
    }
    return url;
  };

  const constructProfilePhotoUrl = (
    profilePhoto: string | undefined
  ): string | null => {
    if (!profilePhoto) return null;

    // Return full URL if it already has a protocol
    if (
      profilePhoto.startsWith("http://") ||
      profilePhoto.startsWith("https://")
    ) {
      return profilePhoto;
    }

    // Construct full URL for relative paths
    return `https://thegobd.com/${profilePhoto}`;
  };

  const updateLoadingState = (isRefresh: boolean, loading: boolean) => {
    setMapState((prev) => ({
      ...prev,
      [isRefresh ? "refreshing" : "loading"]: loading,
    }));
  };

  const updateBusData = (busData: BusInfo[], isRefresh: boolean) => {
    setMapState((prev) => ({
      ...prev,
      buses: busData,
      isInitialLoad: isRefresh ? prev.isInitialLoad : false,
    }));

    if (mapState.mapLoaded && webViewRef.current) {
      updateBusLocationsOnMap(busData, isRefresh);
    }
  };

  const handleFetchError = (error: unknown, isRefresh: boolean) => {
    console.error("Error fetching bus data:", error);
    if (!isRefresh) {
      showError("Failed to fetch bus locations");
    }
  };

  // Map Functions
  const updateBusLocationsOnMap = (busData: BusInfo[], isRefresh: boolean) => {
    if (!webViewRef.current) return;

    const updateScript = `
      if (typeof updateBusMarkers === 'function') {
        updateBusMarkers(
          ${JSON.stringify(busData)}, 
          ${isRefresh}, 
          ${mapState.userInteractedWithMap}, 
          ${JSON.stringify(userLocation)}
        );
      }
      true;
    `;
    webViewRef.current.postMessage(updateScript);
  };

  const addUserLocationToMap = (
    latitude: number,
    longitude: number,
    username: string = user?.name || "You",
    focusOnly: boolean = false
  ) => {
    if (!webViewRef.current) {
      debugLocation.warn('WebView ref not available for addUserLocationToMap');
      return;
    }

    debugLocation.log(`Adding user location to map: ${latitude}, ${longitude}, ${username}, focus: ${focusOnly}`);

    const profilePhotoUrl = constructProfilePhotoUrl(
      user?.profileImage || user?.imageUrl
    );
    const escapedProfilePhotoUrl =
      profilePhotoUrl?.replace(/"/g, '\\"').replace(/'/g, "\\'") || null;

    const locationScript = `
      try {
        if (typeof addUserLocation === 'function') {
          addUserLocation(${latitude}, ${longitude}, "${username}", ${focusOnly}, ${
      escapedProfilePhotoUrl ? `"${escapedProfilePhotoUrl}"` : "null"
    });
        } else {
          console.log('addUserLocation function not available yet');
        }
      } catch (error) {
        console.error('Error adding user location:', error);
      }
      true;
    `;
    
    debugLocation.log('Sending location script to WebView:', locationScript);
    
    // For iOS, add a small delay to ensure WebView is ready
    if (Platform.OS === 'ios') {
      setTimeout(() => {
        debugLocation.log('Posting message to WebView (iOS delayed)');
        webViewRef.current?.postMessage(locationScript);
      }, 100);
    } else {
      debugLocation.log('Posting message to WebView (Android immediate)');
      webViewRef.current.postMessage(locationScript);
    }
  };

  const fitAllMarkersInView = () => {
    if (!webViewRef.current) return;

    const fitScript = `
      if (typeof fitAllMarkersFromReactNative === 'function') {
        fitAllMarkersFromReactNative();
      }
      true;
    `;
    webViewRef.current.postMessage(fitScript);
  };

  const handleZoomIn = () => {
    if (!webViewRef.current) return;

    const zoomScript = `
      if (typeof zoomInFromReactNative === 'function') {
        zoomInFromReactNative();
      }
      true;
    `;
    webViewRef.current.postMessage(zoomScript);
  };

  const handleZoomOut = () => {
    if (!webViewRef.current) return;

    const zoomScript = `
      if (typeof zoomOutFromReactNative === 'function') {
        zoomOutFromReactNative();
      }
      true;
    `;
    webViewRef.current.postMessage(zoomScript);
  };

  // Event Handlers
  const handleMapMessage = (event: any) => {
    const { data } = event.nativeEvent;

    switch (data) {
      case "MAP_READY":
        handleMapReady();
        break;
      case "USER_INTERACTION":
        setMapState((prev) => ({ ...prev, userInteractedWithMap: true }));
        break;
      case "USER_LOCATION_ADDED":
        console.log("User location added successfully to map");
        break;
      case "USER_LOCATION_ERROR":
        console.error("Error adding user location to map");
        showError("Failed to display your location on the map");
        break;
    }
  };

  const handleMapReady = () => {
    setMapState((prev) => ({ ...prev, mapLoaded: true }));

    // Add user location if available with iOS-specific handling
    if (userLocation && webViewRef.current) {
      const userName = user?.name || "You";
      
      // For iOS, add additional delay and retry logic
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          addUserLocationToMap(
            userLocation.latitude,
            userLocation.longitude,
            userName,
            false
          );
        }, 200);
      } else {
        addUserLocationToMap(
          userLocation.latitude,
          userLocation.longitude,
          userName,
          false
        );
      }
    }
  };

  const handleMyLocationPress = () => {
    const userName = user?.name || "You";
    
    if (userLocation && mapState.mapLoaded) {
      // Focus only on user location if we already have it
      addUserLocationToMap(
        userLocation.latitude,
        userLocation.longitude,
        userName,
        true
      );
      showInfo("Focused on your location");
    } else {
      // Get new location with enhanced iOS feedback
      if (Platform.OS === 'ios') {
        showInfo("Requesting location permission...");
      }
      getUserLocation();
    }
  };

  const handleRefresh = () => {
    fetchBusData(true);
  };

  const handleGoBack = () => {
    router.push("/(tabs)/map/index");
  };

  const renderMapContainer = () => (
    <View style={styles.mapContainer}>
      {mapState.loading
        ? renderLoadingState()
        : mapState.buses.length === 0
        ? renderEmptyState()
        : renderMap()}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={COLORS.brand.blue} />
      <Text style={styles.loadingText}>Loading bus locations...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centeredContainer}>
      <Ionicons name="bus" size={64} color={COLORS.gray[400]} />
      <Text style={styles.emptyTitle}>No Active Buses</Text>
      <Text style={styles.emptyText}>
        No buses are currently active for {organizationName}
        {routeName && ` on route ${routeName}`}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMap = () => {
    const profilePhotoUrl = constructProfilePhotoUrl(
      user?.profileImage || user?.imageUrl
    );

    return (
      <WebView
        ref={webViewRef}
        source={{
          html: generateMapHTML({
            buses: mapState.buses,
            defaultLat: DEFAULT_COORDINATES.lat,
            defaultLng: DEFAULT_COORDINATES.lng,
            userName: user?.name || "You",
            userProfilePhoto: profilePhotoUrl || undefined,
          }),
        }}
        style={styles.webView}
        onMessage={handleMapMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // iOS-specific props for better compatibility
        allowsFullscreenVideo={false}
        bounces={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // Enhanced iOS settings
        {...(Platform.OS === 'ios' && {
          allowsBackForwardNavigationGestures: false,
          automaticallyAdjustContentInsets: false,
          contentInsetAdjustmentBehavior: 'never',
          decelerationRate: 'normal',
        })}
      />
    );
  };

  const renderTopInfoCards = () =>
    mapState.buses.length > 0 && (
      <View style={styles.topInfoContainer}>
        {/* Zoom Control Placeholder */}
        <View style={styles.zoomControlPlaceholder}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Ionicons name="add" size={12} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Ionicons name="remove" size={12} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        {/* Organization Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardTitle}>{organizationName}</Text>
            {routeName && (
              <Text style={styles.infoCardSubtitle}>
                {routeName.replace(" - ", " ⇄ ")}
              </Text>
            )}
          </View>
        </View>
      </View>
    );

  const renderMyLocationButton = () =>
    mapState.buses.length > 0 && (
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.centerAllButton}
          onPress={fitAllMarkersInView}
        >
          <Ionicons name="apps" size={20} color="#1A73E8" />
        </TouchableOpacity>

        {/* Real Time Indicator Card */}
        {/* <View style={styles.infoCard}>
          <PulsingDot color={COLORS.success} size={6} />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardText}>
              {mapState.buses.length} Bus
              {mapState.buses.length === 1 ? "" : "es"} Active
            </Text>
          </View>
        </View> */}

        <View style={styles.realTimeIndicator}>
          <PulsingDot color={COLORS.success} size={6} />
          <Text style={styles.realTimeText}>
            {mapState.buses.length === 0
              ? "No Buses Active"
              : `${mapState.buses.length} Bus${
                  mapState.buses.length === 1 ? "" : "es"
                } Active`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocationPress}
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#1A73E8" />
          ) : (
            <Ionicons name="locate" size={20} color="#1A73E8" />
          )}
        </TouchableOpacity>
      </View>
    );

  const renderToast = () => (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onHide={hideToast}
      position="bottom"
    />
  );

  // Main Render
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.brand.blue}
        translucent={Platform.OS === "android"}
      />

      {renderMapContainer()}
      {renderTopInfoCards()}
      {renderMyLocationButton()}
      {renderToast()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  busCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_WEIGHTS.bold,
    color: COLORS.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.brand.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  topInfoContainer: {
    position: "absolute",
    top: 10,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  zoomControlPlaceholder: {
    flexDirection: "column",
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 4,
    gap: 2,
  },
  zoomButton: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 1)",
    paddingHorizontal: 12,
    paddingBottom: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 6,
    minHeight: 30,
  },
  infoCardContent: {
    alignItems: "center",
  },
  infoCardTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
    textAlign: "center",
  },
  infoCardSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[700],
    textAlign: "center",
  },
  infoCardText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.gray[700],
    textAlign: "center",
  },
  infoCardCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.gray[600],
    textAlign: "center",
  },
  bottomControls: {
    position: "absolute",
    bottom: 10,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  myLocationButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  centerAllButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  realTimeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 6,
  },
  realTimeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.semiBold,
    fontWeight: "bold",
    color: COLORS.primary,
  },
});
