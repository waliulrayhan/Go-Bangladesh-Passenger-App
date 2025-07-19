// Import Buffer from the buffer package for React Native compatibility
import { Buffer } from 'buffer';

export interface JWTPayload {
  userId?: number;
  id?: number;
  sub?: string;
  mobile?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  // API-specific fields
  UserId?: string;
  Name?: string;
  UserType?: string;
  unique_name?: string;
  IsSuperAdmin?: string;
  OrganizationId?: string;
  OrganizationName?: string;
  [key: string]: any;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64 using buffer
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function extractUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  
  if (!payload) return null;
  
  // Try different common field names for user ID
  // The API uses 'UserId' field which is a string, convert others to string
  if (payload.UserId) return payload.UserId;
  if (payload.userId) return String(payload.userId);
  if (payload.id) return String(payload.id);
  if (payload.sub) return payload.sub;
  
  return null;
}

export function isTokenExpired(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('⚠️ [JWT] Invalid token format');
      return true;
    }

    const payload = decodeJWT(token);
    if (!payload) {
      console.warn('⚠️ [JWT] Could not decode token payload');
      return true;
    }

    if (!payload.exp) {
      console.warn('⚠️ [JWT] Token missing expiration time');
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    if (isExpired) {
      const expiredTime = new Date(payload.exp * 1000);
      console.log(`⏰ [JWT] Token expired at: ${expiredTime.toISOString()}`);
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ [JWT] Error checking token expiration:', error);
    return true; // Consider expired if we can't validate
  }
}

/**
 * Extract comprehensive user information from JWT token
 * Handles both Private (organization) and Public (Go Bangladesh) user types
 */
export function extractUserInfoFromJWT(token: string) {
  const payload = decodeJWT(token);
  
  if (!payload) {
    console.error('❌ [JWT] Failed to decode token');
    return null;
  }

  // Determine user type and organization info
  const userType = payload.UserType || 'passenger';
  const isPrivateUser = userType?.toLowerCase() === 'private';
  const isPublicUser = userType?.toLowerCase() === 'public';
  const isSuperAdmin = payload.IsSuperAdmin === 'True';

  // Extract organization information
  const organizationId = payload.OrganizationId;
  const organizationName = payload.OrganizationName;

  // Create user info object
  const userInfo = {
    // Basic user information
    userId: payload.UserId,
    name: payload.Name || payload.unique_name || 'User',
    uniqueName: payload.unique_name,
    userType: userType,
    isSuperAdmin: isSuperAdmin,
    
    // Organization information
    organizationId: organizationId,
    organizationName: organizationName,
    isPrivateUser: isPrivateUser,
    isPublicUser: isPublicUser,
    
    // Token timing information
    issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
    notBefore: payload.nbf ? new Date(payload.nbf * 1000) : null,
    
    // Additional metadata
    tokenValid: !isTokenExpired(token),
    extractedAt: new Date()
  };

  return userInfo;
}

/**
 * Check if user should have access to fresh data based on token
 */
export function shouldRefreshUserData(token: string): boolean {
  const userInfo = extractUserInfoFromJWT(token);
  
  if (!userInfo) return false;
  
  // Always refresh for valid tokens
  return userInfo.tokenValid;
}

/**
 * Get user display context for UI based on token
 */
export function getUserDisplayContext(token: string) {
  const userInfo = extractUserInfoFromJWT(token);
  
  if (!userInfo) return null;
  
  return {
    displayName: userInfo.name,
    userType: userInfo.userType,
    organizationName: userInfo.organizationName,
    isPrivateUser: userInfo.isPrivateUser,
    isPublicUser: userInfo.isPublicUser,
    showOrganizationInfo: userInfo.isPrivateUser && userInfo.organizationName !== 'Go Bangladesh',
    contextTitle: userInfo.isPrivateUser ? 
      `${userInfo.organizationName} Member` : 
      'Public User',
    shouldShowRecentActivity: true,
    shouldShowTripHistory: true,
    shouldShowRechargeHistory: true,
    shouldShowProfile: true
  };
}
