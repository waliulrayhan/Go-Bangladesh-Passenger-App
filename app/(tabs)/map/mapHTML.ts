import { BusInfo } from '../../../types';

interface MapHTMLParams {
  buses: BusInfo[];
  defaultLat: number;
  defaultLng: number;
  userName?: string;
  userProfilePhoto?: string;
}

export const generateMapHTML = ({ buses, defaultLat, defaultLng, userName = 'You', userProfilePhoto }: MapHTMLParams): string => {
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
          ${getMapScript(buses, centerLat, centerLng, userName, userProfilePhoto)}
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
    line-height: 1.2;
  }
  
  .bus-number {
    font-weight: 600;
    font-size: 11px;
  }
  
  .bus-passengers {
    font-weight: 500;
    font-size: 10px;
    opacity: 0.9;
    margin-top: 2px;
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
    flex-direction: column;
    align-items: center;
  }
  
  .user-location-marker-inner {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #4285F4 0%, #1A73E8 100%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
    animation: userLocationPulse 2s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  
  .user-location-marker-inner::before {
    content: '👤';
    font-size: 16px;
    position: absolute;
    z-index: 1;
  }
  
  .user-location-marker-inner.has-photo::before {
    display: none;
  }
  
  .user-location-marker-inner.has-photo {
    background: none;
    padding: 0;
  }
  
  .user-location-marker-inner.photo-error {
    background: linear-gradient(135deg, #4285F4 0%, #1A73E8 100%);
  }
  
  .user-location-marker-inner.photo-error::before {
    display: block !important;
  }
  
  .user-profile-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }
  
  .user-location-label {
    background: rgba(66, 133, 244, 0.95);
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
  
  .user-location-shadow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    background: rgba(66, 133, 244, 0.2);
    border-radius: 50%;
    animation: userLocationShadow 2s infinite;
    z-index: -1;
  }
  
  @keyframes userLocationPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
    }
    50% {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(66, 133, 244, 0.6);
    }
  }
  
  @keyframes userLocationShadow {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.2;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 0.1;
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

const getMapScript = (buses: BusInfo[], centerLat: number, centerLng: number, userName: string = 'You', userProfilePhoto?: string): string => {
  // Escape the profile photo URL for safe JavaScript embedding
  const escapedProfilePhoto = userProfilePhoto ? userProfilePhoto.replace(/"/g, '\\"').replace(/'/g, "\\'") : null;
  
  return `
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
  
  // Helper function to format passenger count
  function formatPassengerCount(count) {
    if (count === undefined || count === null || count === 0) {
      return 'No Passengers';
    } else if (count === 1) {
      return '1 Passenger';
    } else {
      return count + ' Passengers';
    }
  }
  
  // Create bus icon
  function createBusIcon(busName, busNumber, runningTrips) {
    const displayName = busNumber || busName || 'Bus';
    const passengersText = runningTrips !== undefined && runningTrips !== null ? formatPassengerCount(runningTrips) : '';
    
    const labelContent = passengersText 
      ? '<div class="bus-number">' + displayName + '</div><div class="bus-passengers">' + passengersText + '</div>'
      : displayName;
    
    return L.divIcon({
      html: '<div class="bus-marker">' +
              '<div class="bus-marker-shadow"></div>' +
              '<div class="bus-marker-inner"></div>' +
              '<div class="bus-marker-label">' + labelContent + '</div>' +
            '</div>',
      className: 'custom-bus-marker',
      iconSize: [Math.max(120, displayName.length * 8), passengersText ? 75 : 60],
      iconAnchor: [Math.max(60, displayName.length * 4), passengersText ? 37.5 : 30],
      popupAnchor: [0, passengersText ? -37.5 : -30]
    });
  }
  
  // Create user location icon
  function createUserLocationIcon(username = 'You', profilePhotoUrl = null) {
    const hasPhoto = profilePhotoUrl && profilePhotoUrl.trim() !== '' && profilePhotoUrl !== 'null';
    const markerClass = hasPhoto ? 'user-location-marker-inner has-photo' : 'user-location-marker-inner';
    const innerContent = hasPhoto 
      ? '<img src="' + profilePhotoUrl + '" class="user-profile-photo" alt="Profile" onerror="this.style.display=\\'none\\'; this.parentElement.classList.remove(\\'has-photo\\'); this.parentElement.classList.add(\\'photo-error\\');" />'
      : '';
    
    return L.divIcon({
      html: '<div class="user-location-marker">' +
              '<div class="user-location-shadow"></div>' +
              '<div class="' + markerClass + '">' + innerContent + '</div>' +
              '<div class="user-location-label">' + username + '</div>' +
            '</div>',
      className: 'custom-user-location-marker',
      iconSize: [Math.max(120, username.length * 8), 70],
      iconAnchor: [Math.max(60, username.length * 4), 35],
      popupAnchor: [0, -35]
    });
  }
  
  // Add user location to map
  function addUserLocation(latitude, longitude, username = '${userName}', focusOnly = false, profilePhotoUrl = ${escapedProfilePhoto ? `'${escapedProfilePhoto}'` : 'null'}) {
    // Remove existing user location marker
    if (userLocationMarker) {
      map.removeLayer(userLocationMarker);
    }
    
    // Add new user location marker
    userLocationMarker = L.marker([latitude, longitude], { 
      icon: createUserLocationIcon(username, profilePhotoUrl) 
    })
      // .bindPopup(
      //   '<div class="bus-popup">' +
      //     '<div class="bus-popup-header">' +
      //       '<span class="bus-popup-icon">📍</span>' +
      //       '<h3>' + username + '</h3>' +
      //     '</div>' +
      //     '<div class="bus-popup-info">' +
      //       '<span class="bus-popup-label">Coordinates</span>' +
      //       '<span class="bus-popup-value">' + latitude.toFixed(6) + ', ' + longitude.toFixed(6) + '</span>' +
      //     '</div>' +
      //     '<div class="bus-popup-footer">' +
      //       '<div class="bus-popup-live">' +
      //         '<div class="live-dot"></div>' +
      //         'Current Location' +
      //       '</div>' +
      //     '</div>' +
      //   '</div>',
      //   {
      //     maxWidth: 300,
      //     className: 'custom-popup'
      //   }
      // )
      .addTo(map);
    
    if (focusOnly) {
      // Focus only on user location
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16), {
        animate: true,
        duration: 1.0
      });
    } else {
      // Include everything in view (user location + buses)
      fitAllMarkersInView();
    }
  }
  
  // Fit all markers (buses + user location) in view
  function fitAllMarkersInView() {
    const allMarkers = [...busMarkers];
    if (userLocationMarker) {
      allMarkers.push(userLocationMarker);
    }
    
    if (allMarkers.length > 1) {
      const group = new L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(0.2), {
        maxZoom: 16,
        animate: true,
        duration: 1.0
      });
    } else if (allMarkers.length === 1) {
      map.setView(allMarkers[0].getLatLng(), 16, {
        animate: true,
        duration: 1.0
      });
    }
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
          icon: createBusIcon(bus.busName, bus.busNumber, bus.runningTrips) 
        })
          // .bindPopup(
          //   '<div class="bus-popup">' +
          //     '<div class="bus-popup-header">' +
          //       '<span class="bus-popup-icon">🚌</span>' +
          //       '<h3>' + (bus.busName || 'Bus') + '</h3>' +
          //     '</div>' +
          //     '<div class="bus-popup-info">' +
          //       '<span class="bus-popup-label">Number</span>' +
          //       '<span class="bus-popup-value bus-popup-number">' + bus.busNumber + '</span>' +
          //       (bus.organizationName ? 
          //         '<span class="bus-popup-label">Organization</span>' +
          //         '<span class="bus-popup-value">' + bus.organizationName + '</span>' 
          //         : '') +
          //       '<span class="bus-popup-label">Coordinates</span>' +
          //       '<span class="bus-popup-value">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span>' +
          //     '</div>' +
          //     '<div class="bus-popup-footer">' +
          //       '<div class="bus-popup-live">' +
          //         '<div class="live-dot"></div>' +
          //         'Live Location' +
          //       '</div>' +
          //     '</div>' +
          //   '</div>',
          //   {
          //     maxWidth: 300,
          //     className: 'custom-popup'
          //   }
          // );
        
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
        fitAllMarkersInView();
      }
    }, busData.length * 100 + 300);
  }
  
  // Handle messages from React Native
  function fitAllMarkersFromReactNative() {
    fitAllMarkersInView();
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
};
