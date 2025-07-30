import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { PulsingDot } from '../../../components/PulsingDot';
import { ApiResponse, apiService } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../utils/fonts';

const { width, height } = Dimensions.get('window');

interface Bus {
  id: string;
  busNumber: string;
  busName: string;
  organizationName: string | null;
  presentLatitude: string;
  presentLongitude: string;
}

export default function MapViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);
  
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const organizationId = params.organizationId as string;
  const organizationName = params.organizationName as string;
  const routeId = params.routeId as string;
  const routeName = params.routeName as string;

  useEffect(() => {
    fetchBusData();
    
    // Set up interval for real-time updates every 10 seconds
    const interval = setInterval(() => {
      fetchBusData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [organizationId, routeId]);

  const fetchBusData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let apiUrl = `/api/bus/getAllBusMapData?organizationId=${organizationId}`;
      if (routeId) {
        apiUrl += `&routeId=${routeId}`;
      }

      const response = await apiService.get<ApiResponse<Bus[]>>(apiUrl);
      
      if (response.data.data.isSuccess) {
        const busData = response.data.data.content;
        setBuses(busData);
        
        // Update map with new bus locations
        if (mapLoaded && webViewRef.current) {
          updateBusLocations(busData);
        }
      }
    } catch (error) {
      console.error('Error fetching bus data:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to fetch bus locations');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateBusLocations = (busData: Bus[]) => {
    if (webViewRef.current) {
      const updateScript = `
        if (typeof updateBusMarkers === 'function') {
          updateBusMarkers(${JSON.stringify(busData)});
        }
        true; // Prevent console warnings
      `;
      webViewRef.current.postMessage(updateScript);
    }
  };

  const generateMapHTML = () => {
    // Default center coordinates (Dhaka, Bangladesh)
    const defaultLat = buses.length > 0 ? parseFloat(buses[0].presentLatitude) : 23.8103;
    const defaultLng = buses.length > 0 ? parseFloat(buses[0].presentLongitude) : 90.4125;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Bus Locations</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              overflow: hidden;
            }
            #map { 
              height: 100vh; 
              width: 100vw; 
              background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
            }
            
            /* Custom bus marker styling */
            .bus-marker {
              position: relative;
              z-index: 1000;
            }
            
            .bus-marker-inner {
              width: 20px;
              height: 20px;
              background: linear-gradient(135deg, #4A90E2 0%, #2E5C8A 100%);
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
              animation: busMarkerPulse 2s infinite;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            
            .bus-marker-inner::before {
              content: '🚌';
              font-size: 10px;
              position: absolute;
            }
            
            .bus-marker-shadow {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 30px;
              height: 30px;
              background: rgba(74, 144, 226, 0.2);
              border-radius: 50%;
              animation: busMarkerShadow 2s infinite;
              z-index: -1;
            }
            
            @keyframes busMarkerPulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
              }
              50% {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(74, 144, 226, 0.6);
              }
            }
            
            @keyframes busMarkerShadow {
              0%, 100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.2;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.3);
                opacity: 0.1;
              }
            }
            
            /* Enhanced popup styling */
            .bus-popup {
              font-size: 14px;
              line-height: 1.5;
              min-width: 240px;
              max-width: 300px;
              padding: 4px 0;
            }
            
            .bus-popup-header {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .bus-popup-icon {
              font-size: 20px;
              margin-right: 8px;
            }
            
            .bus-popup h3 {
              margin: 0;
              color: #4A90E2;
              font-size: 16px;
              font-weight: 600;
              flex: 1;
            }
            
            .bus-popup-info {
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 8px 12px;
              margin-bottom: 12px;
            }
            
            .bus-popup-label {
              font-weight: 600;
              color: #64748b;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .bus-popup-value {
              color: #1e293b;
              font-weight: 500;
            }
            
            .bus-popup-number {
              color: #FF8A00;
              font-weight: 600;
              font-family: monospace;
            }
            
            .bus-popup-footer {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 8px 12px;
              background: linear-gradient(90deg, #00C851, #00a642);
              border-radius: 20px;
              margin-top: 8px;
            }
            
            .bus-popup-live {
              color: white;
              font-size: 12px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            .live-dot {
              width: 6px;
              height: 6px;
              background: white;
              border-radius: 50%;
              animation: liveDotPulse 1.5s infinite;
            }
            
            @keyframes liveDotPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.2); }
            }
            
            .leaflet-popup-content-wrapper {
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.12);
              border: 1px solid rgba(255,255,255,0.2);
              backdrop-filter: blur(10px);
              background: rgba(255,255,255,0.95);
            }
            
            .leaflet-popup-tip {
              background: rgba(255,255,255,0.95);
              border: 1px solid rgba(255,255,255,0.2);
            }
            
            .leaflet-popup-tip-container {
              margin-top: -1px;
            }
            
            /* Map controls styling */
            .leaflet-control-zoom {
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .leaflet-control-zoom a {
              background: rgba(255,255,255,0.95);
              backdrop-filter: blur(10px);
              color: #4A90E2;
              font-weight: bold;
              border: none;
              transition: all 0.2s ease;
            }
            
            .leaflet-control-zoom a:hover {
              background: #4A90E2;
              color: white;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            let map;
            let busMarkers = [];
            
            // Initialize map
            function initMap() {
              map = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true,
                touchZoom: true,
              }).setView([${defaultLat}, ${defaultLng}], 12);
              
              // Add tile layer with custom styling
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                tileSize: 256,
                zoomOffset: 0,
              }).addTo(map);
              
              // Initial bus markers
              updateBusMarkers(${JSON.stringify(buses)});
              
              // Send ready message to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('MAP_READY');
              }
            }
            
            // Enhanced custom bus icon
            function createBusIcon() {
              return L.divIcon({
                html: '<div class="bus-marker"><div class="bus-marker-shadow"></div><div class="bus-marker-inner"></div></div>',
                className: 'custom-bus-marker',
                iconSize: [26, 26],
                iconAnchor: [13, 13],
                popupAnchor: [0, -13]
              });
            }
            
            // Update bus markers function
            function updateBusMarkers(busData) {
              // Clear existing markers
              busMarkers.forEach(marker => map.removeLayer(marker));
              busMarkers = [];
              
              // Add new markers
              busData.forEach((bus, index) => {
                const lat = parseFloat(bus.presentLatitude);
                const lng = parseFloat(bus.presentLongitude);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  const marker = L.marker([lat, lng], { icon: createBusIcon() })
                    .bindPopup(
                      '<div class="bus-popup">' +
                        '<div class="bus-popup-header">' +
                          '<span class="bus-popup-icon">🚌</span>' +
                          '<h3>' + (bus.busName || 'Bus') + '</h3>' +
                        '</div>' +
                        '<div class="bus-popup-info">' +
                          '<span class="bus-popup-label">Number</span>' +
                          '<span class="bus-popup-value bus-popup-number">' + bus.busNumber + '</span>' +
                          (bus.organizationName ? 
                            '<span class="bus-popup-label">Organization</span>' +
                            '<span class="bus-popup-value">' + bus.organizationName + '</span>' 
                            : '') +
                          '<span class="bus-popup-label">Coordinates</span>' +
                          '<span class="bus-popup-value">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span>' +
                        '</div>' +
                        '<div class="bus-popup-footer">' +
                          '<div class="bus-popup-live">' +
                            '<div class="live-dot"></div>' +
                            'Live Location' +
                          '</div>' +
                        '</div>' +
                      '</div>',
                      {
                        maxWidth: 300,
                        className: 'custom-popup'
                      }
                    );
                  
                  // Add smooth animation on marker add
                  setTimeout(() => {
                    marker.addTo(map);
                    busMarkers.push(marker);
                  }, index * 100); // Stagger animations
                }
              });
              
              // Fit map to show all buses if there are multiple
              setTimeout(() => {
                if (busMarkers.length > 1) {
                  const group = new L.featureGroup(busMarkers);
                  map.fitBounds(group.getBounds().pad(0.15));
                } else if (busMarkers.length === 1) {
                  map.setView(busMarkers[0].getLatLng(), 15);
                }
              }, busData.length * 100 + 200);
            }
            
            // Handle messages from React Native
            document.addEventListener('message', function(event) {
              try {
                eval(event.data);
              } catch (e) {
                console.error('Error executing script:', e);
              }
            });
            
            // Initialize when page loads
            document.addEventListener('DOMContentLoaded', initMap);
          </script>
        </body>
      </html>
    `;
  };

  const handleMapMessage = (event: any) => {
    const { data } = event.nativeEvent;
    if (data === 'MAP_READY') {
      setMapLoaded(true);
    }
  };

  const handleRefresh = () => {
    fetchBusData(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand.blue} />
      
      {/* Header */}
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
            {buses.length} bus{buses.length !== 1 ? 'es' : ''} active
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="refresh" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brand.blue} />
            <Text style={styles.loadingText}>Loading bus locations...</Text>
          </View>
        ) : buses.length === 0 ? (
          <View style={styles.noBusesContainer}>
            <Ionicons name="bus" size={64} color={COLORS.gray[400]} />
            <Text style={styles.noBusesTitle}>No Active Buses</Text>
            <Text style={styles.noBusesText}>
              No buses are currently active for {organizationName}
              {routeName && ` on route ${routeName}`}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: generateMapHTML() }}
            style={styles.webView}
            onMessage={handleMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>

      {/* Real-time indicator */}
      {buses.length > 0 && (
        <View style={styles.realTimeIndicator}>
          <PulsingDot color={COLORS.success} size={6} />
          <Text style={styles.realTimeText}>Live Updates</Text>
        </View>
      )}
    </View>
  );
}

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
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
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
  noBusesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noBusesTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_WEIGHTS.bold,
    color: COLORS.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  noBusesText: {
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
    top: 120,
    left: 16,
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
});
