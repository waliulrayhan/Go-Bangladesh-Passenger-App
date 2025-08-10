import { BusInfo } from '../../../types';

interface MapHTMLParams {
  buses: BusInfo[];
  defaultLat: number;
  defaultLng: number;
}

export const generateMapHTML = ({ buses, defaultLat, defaultLng }: MapHTMLParams): string => {
  // Use first bus location if available, otherwise use default
  const centerLat = buses.length > 0 ? parseFloat(buses[0].presentLatitude) : defaultLat;
  const centerLng = buses.length > 0 ? parseFloat(buses[0].presentLongitude) : defaultLng;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bus Locations</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          ${getMapStyles()}
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          ${getMapScript(buses, centerLat, centerLng)}
        </script>
      </body>
    </html>
  `;
};

const getMapStyles = (): string => `
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
  
  /* Bus marker styling */
  .bus-marker {
    position: relative;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .bus-marker-inner {
    width: 24px;
    height: 24px;
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
    font-size: 12px;
    position: absolute;
  }
  
  .bus-marker-label {
    background: rgba(74, 144, 226, 0.95);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 4px;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.3);
    min-width: 60px;
    text-align: center;
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
  
  /* User location marker styling */
  .user-location-marker {
    position: relative;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-location-dot {
    width: 15px;
    height: 15px;
    background: #4285F4;
    border: 3px solid #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(66, 133, 244, 0.4);
    z-index: 2;
    position: relative;
  }
  
  .user-location-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: rgba(66, 133, 244, 0.2);
    border-radius: 50%;
    animation: userLocationPulse 2.5s infinite;
    z-index: 1;
  }
  
  @keyframes userLocationPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.8;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0.3;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.8);
      opacity: 0;
    }
  }
  
  /* Popup styling */
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
  
  /* Map controls styling */
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
  
  .leaflet-control-zoom {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid rgba(255,255,255,0.3);
  }
  
  .leaflet-control-zoom a {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    color: #4A90E2;
    font-weight: bold;
    border: none;
    transition: all 0.2s ease;
    width: 36px;
    height: 36px;
    line-height: 36px;
  }
  
  .leaflet-control-zoom a:hover {
    background: #4A90E2;
    color: white;
    transform: scale(1.05);
  }
  
  .leaflet-tile {
    filter: contrast(1.05) saturate(1.1) brightness(1.02);
  }
  
  .leaflet-control-attribution {
    background: rgba(0,0,0,0.7);
    color: white;
    font-size: 10px;
    border-radius: 8px 8px 0 0;
  }
  
  .leaflet-control-attribution a {
    color: #87CEEB;
  }
`;

const getMapScript = (buses: BusInfo[], centerLat: number, centerLng: number): string => `
  let map;
  let busMarkers = [];
  let userLocationMarker = null;
  
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
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      preferCanvas: false,
      renderer: L.svg({ padding: 0.5 })
    }).setView([${centerLat}, ${centerLng}], 13);
    
    // Track user interactions with map
    map.on('dragstart zoomstart', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('USER_INTERACTION');
      }
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20,
      minZoom: 8,
      tileSize: 256,
      zoomOffset: 0,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
    }).addTo(map);
    
    // Initial bus markers
    updateBusMarkers(${JSON.stringify(buses)}, false, false, null);
    
    // Send ready message to React Native
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('MAP_READY');
    }
  }
  
  // Create bus icon
  function createBusIcon(busName, busNumber) {
    const displayName = busNumber || busName || 'Bus';
    
    return L.divIcon({
      html: '<div class="bus-marker">' +
              '<div class="bus-marker-shadow"></div>' +
              '<div class="bus-marker-inner"></div>' +
              '<div class="bus-marker-label">' + displayName + '</div>' +
            '</div>',
      className: 'custom-bus-marker',
      iconSize: [Math.max(120, displayName.length * 8), 60],
      iconAnchor: [Math.max(60, displayName.length * 4), 30],
      popupAnchor: [0, -30]
    });
  }
  
  // Create user location icon
  function createUserLocationIcon() {
    return L.divIcon({
      html: '<div class="user-location-marker">' +
              '<div class="user-location-pulse"></div>' +
              '<div class="user-location-dot"></div>' +
            '</div>',
      className: 'custom-user-location-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }
  
  // Add user location to map
  function addUserLocation(latitude, longitude) {
    // Remove existing user location marker
    if (userLocationMarker) {
      map.removeLayer(userLocationMarker);
    }
    
    // Add new user location marker
    userLocationMarker = L.marker([latitude, longitude], { 
      icon: createUserLocationIcon() 
    })
      .bindPopup(
        '<div class="bus-popup">' +
          '<div class="bus-popup-header">' +
            '<span class="bus-popup-icon">📍</span>' +
            '<h3>Your Location</h3>' +
          '</div>' +
          '<div class="bus-popup-info">' +
            '<span class="bus-popup-label">Coordinates</span>' +
            '<span class="bus-popup-value">' + latitude.toFixed(6) + ', ' + longitude.toFixed(6) + '</span>' +
          '</div>' +
          '<div class="bus-popup-footer">' +
            '<div class="bus-popup-live">' +
              '<div class="live-dot"></div>' +
              'Current Location' +
            '</div>' +
          '</div>' +
        '</div>',
        {
          maxWidth: 300,
          className: 'custom-popup'
        }
      )
      .addTo(map);
    
    // Center map on user location
    map.setView([latitude, longitude], Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 1.0
    });
  }
  
  // Update bus markers function
  function updateBusMarkers(busData, isRefresh = false, userInteracted = false, currentUserLocation = null) {
    // Clear existing markers
    busMarkers.forEach(marker => map.removeLayer(marker));
    busMarkers = [];
    
    // Re-add user location if it exists
    if (currentUserLocation && userLocationMarker) {
      userLocationMarker.addTo(map);
    }
    
    // Add new markers
    busData.forEach((bus, index) => {
      const lat = parseFloat(bus.presentLatitude);
      const lng = parseFloat(bus.presentLongitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng], { 
          icon: createBusIcon(bus.busName, bus.busNumber) 
        })
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
        }, index * 100);
      }
    });
    
    // Only auto-fit map bounds on initial load AND if user hasn't interacted with map
    setTimeout(() => {
      if (!isRefresh && !userInteracted) {
        if (busMarkers.length > 1) {
          const group = new L.featureGroup(busMarkers);
          map.fitBounds(group.getBounds().pad(0.2), {
            maxZoom: 16,
            animate: true,
            duration: 1.0
          });
        } else if (busMarkers.length === 1) {
          map.setView(busMarkers[0].getLatLng(), 16, {
            animate: true,
            duration: 1.0
          });
        }
      }
    }, busData.length * 100 + 300);
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
`;
