// Test other API endpoints to see what's available
const axios = require('axios');

async function testEndpoint(endpoint, method = 'GET', data = null) {
  const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';
  
  try {
    console.log(`\nTesting ${method} ${endpoint}`);
    
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
    
    if (data && method !== 'GET') {
      config.data = data;
    }
    
    const response = await axios(config);
    
    console.log('✅ Success:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.log('❌ Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
    return false;
  }
}

async function exploreAPI() {
  console.log('Exploring API endpoints...\n');
  
  const endpoints = [
    '/api/passenger',
    '/api/passenger/getAll',
    '/api/passenger/list',
    '/api/Auth',
    '/api/Auth/register',
    '/api/users',
    '/api/health',
    '/api/status',
    '/',
    '/api'
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

exploreAPI();
