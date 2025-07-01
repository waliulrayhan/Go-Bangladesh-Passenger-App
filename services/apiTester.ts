// Test script for API endpoints
// This can be used for debugging API calls

import { apiService } from './api';

export async function testAuthAPI(mobile: string, password: string = '123456') {
  try {
    console.log('Testing Auth API with mobile:', mobile, 'password:', password);
    const response = await apiService.getAuthToken(mobile, password);
    console.log('Auth API Response:', response);
    return response;
  } catch (error) {
    console.error('Auth API Error:', error);
    throw error;
  }
}

export async function testUserAPI(userId: number) {
  try {
    console.log('Testing User API with userId:', userId);
    const response = await apiService.getUserById(userId);
    console.log('User API Response:', response);
    return response;
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

export async function testFullLoginFlow(mobile: string, password: string = '123456') {
  try {
    console.log('Starting full login flow test for mobile:', mobile);
    
    // Step 1: Get auth token
    const authResponse = await testAuthAPI(mobile, password);
    
    // Step 2: Extract user ID from token (if possible)
    const { extractUserIdFromToken } = await import('../utils/jwt');
    const userId = extractUserIdFromToken(authResponse.token);
    console.log('Extracted user ID:', userId);
    
    // Step 3: Get user details (if user ID available)
    if (userId) {
      const userResponse = await testUserAPI(userId);
      return {
        auth: authResponse,
        user: userResponse,
        userId
      };
    }
    
    return {
      auth: authResponse,
      user: null,
      userId: null
    };
  } catch (error) {
    console.error('Full login flow error:', error);
    throw error;
  }
}
