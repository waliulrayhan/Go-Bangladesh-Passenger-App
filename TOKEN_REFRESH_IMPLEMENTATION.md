# Token-Based User Data Refresh Implementation

## Overview
This implementation adds comprehensive token-based user data refresh functionality to the Go Bangladesh Passenger App. The system can decode JWT tokens and automatically refresh user data based on the token information.

## Key Features

### 1. JWT Token Decoding
- **File**: `utils/jwt.ts`
- **Function**: `extractUserInfoFromJWT(token: string)`
- Handles both Private and Public user types
- Extracts organization information
- Validates token expiration

### 2. Token Information Structure
The JWT tokens contain the following user information:

#### Private User (Organization Member):
```typescript
{
  "unique_name": "Md. Waliul Islam Rayhan",
  "UserId": "585ce04804e64057a2dc6a0840c4f53e",
  "IsSuperAdmin": "False",
  "Name": "Md. Waliul Islam Rayhan",
  "UserType": "Private",
  "OrganizationId": "340e8264b0174e0c856f632423e40fd2",
  "OrganizationName": "Jagannath University",
  "nbf": 1752170575,
  "exp": 1752174175,
  "iat": 1752170575
}
```

#### Public User (Go Bangladesh):
```typescript
{
  "unique_name": "Test 1",
  "UserId": "ceaaccd872dd4a6da7cfa6dd77ad051a",
  "IsSuperAdmin": "False",
  "Name": "Test 1",
  "UserType": "Public",
  "OrganizationId": "1",
  "OrganizationName": "Go Bangladesh",
  "nbf": 1752170726,
  "exp": 1752174326,
  "iat": 1752170726
}
```

### 3. Auth Store Enhancement
- **File**: `stores/authStore.ts`
- **Function**: `refreshUserFromToken()`
- Automatically refreshes user data when app starts
- Handles token expiration
- Updates user profile based on token information

### 4. Session Management
- **File**: `utils/sessionManager.ts`
- **Functions**: 
  - `initializeSessionWithToken()`
  - `refreshAllDataFromToken()`
- Manages app session lifecycle
- Ensures fresh data loading

### 5. Custom Hooks
- **File**: `hooks/useTokenRefresh.ts`
- **Hooks**: 
  - `useTokenRefresh()` - For data refresh functionality
  - `useUserContext()` - For user context information
- Provides easy-to-use interface for components

### 6. UI Components
- **File**: `components/TokenInfoDemo.tsx`
- Demonstrates token information display
- Shows user type, organization, and available features
- Provides refresh button for manual data refresh

## Implementation Details

### 1. App Initialization
When the app starts (`app/_layout.tsx`):
```typescript
useEffect(() => {
  const initializeSession = async () => {
    await loadUserFromStorage();
    await SessionManager.initializeSessionWithToken();
  };
  initializeSession();
}, []);
```

### 2. Component Usage
Components can now use the token refresh functionality:
```typescript
const { isRefreshing, refreshAllData } = useTokenRefresh();
const { userContext } = useUserContext();

// Manual refresh
const handleRefresh = async () => {
  await refreshAllData();
};
```

### 3. User Context Display
The system automatically determines:
- User type (Private/Public)
- Organization information
- Available features
- Display context

### 4. Data Refresh Strategy
- **Automatic**: On app start and user authentication
- **Manual**: Via refresh buttons in UI
- **Periodic**: Can be configured for background refresh

## Files Modified

1. **`utils/jwt.ts`** - Enhanced JWT decoding
2. **`stores/authStore.ts`** - Added token-based refresh
3. **`utils/sessionManager.ts`** - Enhanced session management
4. **`hooks/useTokenRefresh.ts`** - New custom hooks
5. **`components/TokenInfoDemo.tsx`** - Demo component
6. **`app/_layout.tsx`** - App initialization
7. **`app/(tabs)/index.tsx`** - Dashboard updates
8. **`app/(tabs)/profile.tsx`** - Profile updates
9. **`app/(tabs)/history.tsx`** - History updates

## Usage Examples

### 1. Get User Information from Token
```typescript
import { extractUserInfoFromJWT } from '../utils/jwt';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const userInfo = extractUserInfoFromJWT(token);

console.log(userInfo);
// Output: { userId, name, userType, organizationId, organizationName, ... }
```

### 2. Refresh All Data
```typescript
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const { refreshAllData, isRefreshing } = useTokenRefresh();

const handleRefresh = async () => {
  const success = await refreshAllData();
  if (success) {
    console.log('Data refreshed successfully');
  }
};
```

### 3. Display User Context
```typescript
import { useUserContext } from '../hooks/useTokenRefresh';

const { userContext } = useUserContext();

if (userContext) {
  console.log(`User: ${userContext.displayName}`);
  console.log(`Type: ${userContext.userType}`);
  console.log(`Organization: ${userContext.organizationName}`);
}
```

## Benefits

1. **Fresh Data**: Always shows current user information
2. **Automatic Updates**: No manual intervention needed
3. **User Context**: Proper display based on user type
4. **Organization Support**: Handles both private and public users
5. **Error Handling**: Graceful fallbacks for token issues
6. **Performance**: Efficient token parsing and caching

## Testing

To test the functionality:
1. Login with a Private user (organization member)
2. Login with a Public user (Go Bangladesh)
3. Check the Profile page for token information
4. Use the refresh button to manually update data
5. Verify organization information is displayed correctly

The implementation ensures that all user data (recent activity, trip history, recharge history, and profile) is refreshed based on the decoded token information, providing a seamless and up-to-date user experience.
