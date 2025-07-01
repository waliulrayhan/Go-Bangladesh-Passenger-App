# Go Bangladesh - Fare Collection App 🚌

A comprehensive mobile application for fare collection, card recharge, and transit management built with React Native and Expo.

## Brand Identity

### Logo & Colors
- **Primary Blue**: `#4A90E2` - Used for main UI elements, headers, and primary actions
- **Secondary Orange**: `#FF8C42` - Used for accent colors, secondary actions, and highlights
- **Background**: `#F8FAFC` - Light background for better readability
- **Surface**: `#FFFFFF` - Card and container backgrounds

The app features the official Go Bangladesh logo with a distinctive blue and orange color scheme that represents trust, reliability, and energy in public transportation.

## Features

### 🎓 Student/Passenger Module
- Registration and login with OTP verification
- RFID card management and balance tracking
- Trip history with location mapping
- Real-time fare deductions
- Recharge history and transaction tracking

### 🚗 Driver/Helper Module
- Organization and bus selection
- Driver/Helper authentication with OTP
- POS terminal for card scanning (tap in/out)
- Automatic tap-out at 11:59 PM with penalty
- Real-time transaction processing
- Session management and statistics

### 🏪 Recharge Agent Module
- Organization-based agent selection
- Agent authentication with OTP verification
- Card recharge with RFID simulation
- Transaction history grouped by date
- Real-time statistics and reporting

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Animation**: React Native Reanimated
- **Icons**: Expo Vector Icons
- **Styling**: Custom design system with TypeScript

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Choose your platform:
   - [development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)

## Demo Credentials

### For Testing:
- **OTP**: 123456 (works for all user types)
- **Demo Card**: CARD123456
- **Mobile Numbers**: 01712345001-008 (various roles)

### Organizations:
1. Dhaka University
2. BUET  
3. Green Line Paribahan

## Documentation

- [Driver/Helper Features](./DRIVER_HELPER_FEATURES.md) - Complete guide to driver/helper functionality
- [Recharge Agent Features](./RECHARGE_AGENT_FEATURES.md) - Complete guide to recharge agent functionality
- [Design Updates Summary](./DESIGN_UPDATES_SUMMARY.md) - UI/UX improvements and changes

## Project Structure

```
app/
├── (auth)/                 # Authentication screens
├── (tabs)/                 # Student/Passenger screens
├── (driver-tabs)/          # Driver/Helper screens
├── (agent-tabs)/           # Recharge Agent screens
├── _layout.tsx            # Root layout
└── index.tsx              # User type selection

components/
├── ui/                    # Reusable UI components
└── ...                    # Other components

services/
├── api.ts                 # API service
├── mockData.ts            # Mock data and API
└── autoTapOutService.ts   # Auto tap-out logic

stores/
├── authStore.ts           # Authentication state
└── cardStore.ts           # Card and transaction state

types/
└── index.ts               # TypeScript definitions

utils/
├── constants.ts           # App constants
└── storage.ts             # Local storage utility
```

## Features Overview

### Multi-User Support
- **Students/Passengers**: Card management and trip tracking
- **Drivers/Helpers**: POS operations and fare collection
- **Recharge Agents**: Card recharge services

### Smart Features
- Automatic tap-out with penalty system
- RFID card simulation
- Real-time balance updates
- Location-based trip tracking
- Session persistence

### UI/UX
- Modern card-based design
- Smooth animations and transitions
- Consistent design language
- Responsive mobile layout
- Accessible interface elements

## Development

The project uses file-based routing with Expo Router. Each user type has its own tab group:

- `(tabs)` - Student/Passenger interface
- `(driver-tabs)` - Driver/Helper interface  
- `(agent-tabs)` - Recharge Agent interface

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
