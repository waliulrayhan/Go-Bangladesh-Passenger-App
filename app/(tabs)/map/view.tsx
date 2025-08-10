import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { PulsingDot } from '../../../components/PulsingDot';
import { Toast } from '../../../components/ui/Toast';
import { useLocation } from '../../../hooks/useLocation';
import { useToast } from '../../../hooks/useToast';
import { ApiResponse, apiService } from '../../../services/api';
import { BusInfo } from '../../../types';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../utils/fonts';
import { generateMapHTML } from './mapHTML';

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
  const { toast, showError, showSuccess, showInfo, hideToast } = useToast();
  const {
    userLocation,
    gettingLocation,
    getUserLocation,
    checkLocationPermission,
  } = useLocation({
    onLocationSuccess: (location) => {
      showSuccess('Your location has been added to the map');
      setMapState(prev => ({ ...prev, userInteractedWithMap: false })); // Reset to allow centering
      if (mapState.mapLoaded && webViewRef.current) {
        addUserLocationToMap(location.latitude, location.longitude);
      }
    },
    onLocationError: (error) => showError(error),
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

  // Initialization
  const initializeMap = async () => {
    await Promise.all([
      fetchBusData(false),
      checkLocationPermission(),
    ]);
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

  const updateLoadingState = (isRefresh: boolean, loading: boolean) => {
    setMapState(prev => ({
      ...prev,
      [isRefresh ? 'refreshing' : 'loading']: loading,
    }));
  };

  const updateBusData = (busData: BusInfo[], isRefresh: boolean) => {
    setMapState(prev => ({
      ...prev,
      buses: busData,
      isInitialLoad: isRefresh ? prev.isInitialLoad : false,
    }));

    if (mapState.mapLoaded && webViewRef.current) {
      updateBusLocationsOnMap(busData, isRefresh);
    }
  };

  const handleFetchError = (error: unknown, isRefresh: boolean) => {
    console.error('Error fetching bus data:', error);
    if (!isRefresh) {
      showError('Failed to fetch bus locations');
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

  const addUserLocationToMap = (latitude: number, longitude: number) => {
    if (!webViewRef.current) return;

    const locationScript = `
      if (typeof addUserLocation === 'function') {
        addUserLocation(${latitude}, ${longitude});
      }
      true;
    `;
    webViewRef.current.postMessage(locationScript);
  };

  // Event Handlers
  const handleMapMessage = (event: any) => {
    const { data } = event.nativeEvent;
    
    switch (data) {
      case 'MAP_READY':
        handleMapReady();
        break;
      case 'USER_INTERACTION':
        setMapState(prev => ({ ...prev, userInteractedWithMap: true }));
        break;
    }
  };

  const handleMapReady = () => {
    setMapState(prev => ({ ...prev, mapLoaded: true }));
    
    // Add user location if available
    if (userLocation && webViewRef.current) {
      addUserLocationToMap(userLocation.latitude, userLocation.longitude);
    }
  };

  const handleMyLocationPress = () => {
    getUserLocation();
  };

  const handleRefresh = () => {
    fetchBusData(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  // Render Functions
  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.brand.blue, COLORS.brand.blue_dark]}
      style={styles.header}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{organizationName}</Text>
        {routeName && (
          <Text style={styles.headerSubtitle}>{routeName}</Text>
        )}
        <Text style={styles.busCount}>
          {mapState.buses.length} bus{mapState.buses.length !== 1 ? 'es' : ''} active
        </Text>
      </View>
    </LinearGradient>
  );

  const renderMapContainer = () => (
    <View style={styles.mapContainer}>
      {mapState.loading ? (
        renderLoadingState()
      ) : mapState.buses.length === 0 ? (
        renderEmptyState()
      ) : (
        renderMap()
      )}
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

  const renderMap = () => (
    <WebView
      ref={webViewRef}
      source={{ 
        html: generateMapHTML({
          buses: mapState.buses,
          defaultLat: DEFAULT_COORDINATES.lat,
          defaultLng: DEFAULT_COORDINATES.lng,
        })
      }}
      style={styles.webView}
      onMessage={handleMapMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={false}
      scalesPageToFit={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
    />
  );

  const renderRealTimeIndicator = () => (
    mapState.buses.length > 0 && (
      <View style={styles.realTimeIndicator}>
        <PulsingDot color={COLORS.success} size={6} />
        <Text style={styles.realTimeText}>Live Updates</Text>
      </View>
    )
  );

  const renderMyLocationButton = () => (
    mapState.buses.length > 0 && (
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
    )
  );

  const renderToast = () => (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onHide={hideToast}
      position="top"
    />
  );

  // Main Render
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand.blue} />
      
      {renderHeader()}
      {renderMapContainer()}
      {renderRealTimeIndicator()}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
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
  realTimeIndicator: {
    position: 'absolute',
    top: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 6,
  },
  realTimeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.gray[700],
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});