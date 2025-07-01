# Go Bangladesh - Student Transport App

A mobile application built with React Native and Expo for Bangladeshi students to manage their transport card balance, track trips, and recharge their RFID cards.

## Features

- **Student Authentication**: OTP-based login system for students
- **Card Management**: View card balance and transaction history
- **Trip Tracking**: Track bus trips with tap-in/tap-out functionality
- **Mobile Recharge**: Add balance to transport cards
- **History**: View detailed transaction and trip history
- **Profile Management**: Update student profile information

## Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **UI Components**: Custom component library
- **Animations**: React Native Reanimated
- **NFC**: React Native NFC Manager
- **Storage**: Expo Secure Store & AsyncStorage
- **HTTP Client**: Axios

## Project Structure

```
app/
├── (auth)/           # Authentication screens
├── (tabs)/           # Main app tabs (Home, History, Profile)
├── _layout.tsx       # Root layout
└── index.tsx         # Welcome screen

components/
├── ui/               # Reusable UI components
└── ...               # Other components

services/
├── api.ts           # API service
├── mockData.ts      # Mock data for development
└── nfcService.ts    # NFC functionality

stores/
├── authStore.ts     # Authentication state
└── cardStore.ts     # Card and transaction state

utils/
├── constants.ts     # App constants
├── storage.ts       # Storage utilities
└── theme.ts         # Theme configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd go-bangladesh-passenger-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
```bash
npm run android  # For Android
npm run ios      # For iOS
```

## Configuration

### Environment Setup

1. Update API base URL in `utils/constants.ts`
2. Configure app.json for your specific requirements
3. Set up proper signing for production builds

### Backend Integration

Replace the mock API calls in `services/mockData.ts` with real API endpoints:

- Authentication endpoints
- Card management endpoints
- Transaction history endpoints
- Profile management endpoints

## Key Components

### Authentication Flow
- Welcome screen with student-focused messaging
- OTP-based login for security
- Automatic token refresh handling

### Student Dashboard
- Card balance display
- Recent transactions
- Quick actions (recharge, view history)

### Transaction History
- Detailed trip history
- Balance change tracking
- Search and filter capabilities

## NFC Integration

The app supports NFC functionality for:
- Reading RFID card data
- Processing tap-in/tap-out events
- Card validation

## Development

### Mock Data
For development, the app uses mock data defined in `services/mockData.ts`. This includes:
- Sample student profiles
- Mock transactions
- Simulated card data

### Testing
Run the app with mock data for testing before integrating with real backend services.

## Production Deployment

1. Update API URLs to production endpoints
2. Configure proper app signing
3. Build production bundles:
```bash
expo build:android
expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For support and questions, please contact [your contact information].
