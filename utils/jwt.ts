// Import Buffer from the buffer package for React Native compatibility
import { Buffer } from 'buffer';

export interface JWTPayload {
  userId?: number;
  id?: number;
  sub?: string;
  mobile?: string;
  exp?: number;
  iat?: number;
  // API-specific fields
  UserId?: string;
  Name?: string;
  UserType?: string;
  unique_name?: string;
  IsSuperAdmin?: string;
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
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
}
