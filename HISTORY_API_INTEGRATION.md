# History API Integration

This document describes the changes made to integrate the passenger history API into the Go-Bangladesh Passenger App.

## API Endpoint

```
GET https://mhmahi-001-site1.qtempurl.com/api/history/passenger?id={passengerId}&pageNo={pageNo}&pageSize={pageSize}
```

## Response Structure

The API returns a paginated list of transactions with the following structure:

```typescript
{
  "data": {
    "isSuccess": boolean,
    "content": Transaction[],
    "timeStamp": string,
    "payloadType": string,
    "message": string | null
  }
}
```

### Transaction Types

1. **BusFare** - Bus trip transactions with detailed trip information
2. **Recharge** - Money top-up transactions with agent information

## Files Modified

### 1. Types (`types/index.ts`)
- Updated `Transaction` interface to match API response structure
- Added new interfaces:
  - `Organization` - Organization/institution details
  - `Agent` - Agent information for recharges
  - `BusInfo` - Enhanced bus information
  - `Session` - Bus session details
  - `TripDetails` - Complete trip information

### 2. API Service (`services/api.ts`)
- Added `getPassengerHistory()` method
- Proper error handling and logging
- TypeScript support for response types

### 3. Card Store (`stores/cardStore.ts`)
- Updated `loadHistory()` method to use new API service
- Enhanced error handling and logging
- Proper pagination support

### 4. History Screen (`app/(tabs)/history.tsx`)
- Enhanced `renderTripItem()` to show:
  - Organization details
  - Session information
  - Bus route information
- Enhanced `renderRechargeItem()` to show:
  - Agent contact information
  - Organization details
  - Transaction details

### 5. Test Component (`components/TestHistoryAPI.tsx`)
- Added comprehensive testing component
- Tests both direct API calls and store integration
- Displays detailed response information

## New Features

### Trip Cards Now Show:
- Bus name and number
- Organization name and code
- Session code
- Tap in/out times with map links
- Distance traveled with route map
- Organization type (Private/Public)

### Recharge Cards Now Show:
- Agent name and code
- Agent contact information
- Agent address
- Organization details
- Transaction timestamps

## Usage

### Testing the Integration

1. Import the test component:
```typescript
import TestHistoryAPI from '../components/TestHistoryAPI';
```

2. Use in your screen:
```typescript
<TestHistoryAPI />
```

### Direct API Usage

```typescript
import { apiService } from '../services/api';

// Fetch history
const response = await apiService.getPassengerHistory(passengerId, 1, 20);
```

### Store Usage

```typescript
import { useCardStore } from '../stores/cardStore';

const { loadHistory, transactions, isLoading, error } = useCardStore();

// Load first page
await loadHistory(1, true);

// Load more pages
await loadHistory(2, false);
```

## Error Handling

- Network errors are properly caught and displayed
- Invalid passenger IDs show appropriate error messages
- Loading states are managed for better UX
- API errors are logged for debugging

## Pagination

- Configurable page size (default: 20)
- Automatic load more functionality
- Proper state management for pagination
- Loading indicators for additional pages

## Data Structure Examples

### BusFare Transaction
```typescript
{
  "transactionType": "BusFare",
  "amount": 10.00,
  "trip": {
    "session": {
      "bus": {
        "busName": "Balaka",
        "busNumber": "FENI-KA-10-7328",
        "organization": {
          "name": "Jagannath University",
          "code": "JnU"
        }
      },
      "sessionCode": "SSN-000022"
    },
    "startingLatitude": "23.7117894",
    "startingLongitude": "90.4183506",
    "distance": 0.00
  }
}
```

### Recharge Transaction
```typescript
{
  "transactionType": "Recharge",
  "amount": 25.00,
  "agent": {
    "name": "Md. Nahid Hasan",
    "code": "AGT-000003",
    "mobileNumber": "01726542368",
    "address": "9-10 Chittaranjan Ave, Dhaka-1100",
    "organization": {
      "name": "Jagannath University",
      "code": "JnU",
      "organizationType": "Private"
    }
  }
}
```

## Development Notes

- All API calls include proper authentication headers
- Error messages are user-friendly
- Console logging is comprehensive for debugging
- TypeScript provides full type safety
- Components are responsive and follow design system
