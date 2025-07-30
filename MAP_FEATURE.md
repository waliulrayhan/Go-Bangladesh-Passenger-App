# Map Feature - Real-time Bus Tracking

This feature implements a comprehensive map-based bus tracking system similar to Uber/Pathao apps, allowing users to find and track buses in real-time.

## Features Implemented

### 1. Map Tab (`app/(tabs)/map.tsx`)
- **Organization Dropdown**: Fetches available organizations based on user type
  - Public users see only public organizations + their own
  - Private users see all organizations
- **Route Dropdown**: Dynamic route selection based on selected organization
- **Smart Filtering**: Filters data based on JWT token user type
- **Interactive UI**: Modern dropdown components with loading states
- **Validation**: Ensures organization is selected before proceeding

### 2. Map View (`app/map-view.tsx`)
- **Real-time Bus Locations**: Displays live bus positions using Leaflet maps
- **Custom Markers**: Animated bus markers with pulsing effects
- **Enhanced Popups**: Rich information cards showing bus details
- **Auto-refresh**: Updates bus locations every 10 seconds
- **Responsive Design**: Works on all screen sizes
- **Live Indicator**: Animated indicator showing real-time updates

### 3. Component Library
- **PulsingDot** (`components/PulsingDot.tsx`): Animated live indicator
- **Skeleton** (`components/Skeleton.tsx`): Loading states for better UX

## API Integration

### Organization API
```
GET {{baseUrl}}/api/organization/getAllForMap
```
Filters organizations based on user type from JWT token.

### Route API
```
GET {{baseUrl}}/api/route/routeDropdown?organizationId={id}
```
Fetches routes for selected organization.

### Bus Location API
```
GET {{baseUrl}}/api/bus/getAllBusMapData?organizationId={id}&routeId={id}
```
Retrieves real-time bus locations with coordinates.

## User Experience Features

1. **Smart User Detection**: Automatically detects user type from JWT token
2. **Progressive Loading**: Skeleton screens while data loads
3. **Real-time Updates**: Live bus location updates every 10 seconds
4. **Interactive Maps**: Zoom, pan, and tap for detailed bus information
5. **Smooth Animations**: Pulsing markers and loading indicators
6. **Error Handling**: Graceful error states and retry options
7. **Offline-ready**: Handles network issues gracefully

## Map Styling

The map uses a custom Uber/Pathao-like design with:
- Animated bus markers with shadows
- Modern popup design with glassmorphism effects
- Custom color scheme matching app branding
- Smooth marker animations and transitions
- Professional typography and spacing

## Technical Implementation

- **Leaflet**: Open-source mapping library (not Google Maps)
- **WebView**: Renders HTML-based map for full control
- **Real-time Updates**: JavaScript message passing for live updates
- **TypeScript**: Full type safety for all components
- **Responsive**: Adapts to all screen sizes and orientations

## Navigation Flow

1. User opens Map tab
2. Selects organization (required)
3. Optionally selects route
4. Taps "Search Buses"
5. Views real-time bus locations on map
6. Can tap markers for detailed bus information
7. Automatic refresh every 10 seconds

This implementation provides a professional, scalable solution for real-time bus tracking that matches modern app standards.
