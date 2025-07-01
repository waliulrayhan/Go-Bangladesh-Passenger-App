// Decode the JWT token to see user information
const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6Ik1kLiBXYWxpdWwgSXNsYW0gUmF5aGFuIiwiVXNlcklkIjoiNTg1Y2UwNDgwNGU2NDA1N2EyZGM2YTA4NDBjNGY1M2UiLCJJc1N1cGVyQWRtaW4iOiJGYWxzZSIsIk5hbWUiOiJNZC4gV2FsaXVsIElzbGFtIFJheWhhbiIsIlVzZXJUeXBlIjoiUGFzc2VuZ2VyIiwibmJmIjoxNzUxNDA0MDg4LCJleHAiOjE3NTE0MDc2ODgsImlhdCI6MTc1MTQwNDA4OH0.3--ROoOfGdbBmyoltEPEH0Nv-BK_zjbML4yDwM9EuEI";

try {
  // Decode JWT payload
  const base64Url = jwt.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  
  const decoded = JSON.parse(jsonPayload);
  console.log('🔍 JWT Payload:', JSON.stringify(decoded, null, 2));
  
  // Extract user information
  console.log('\n👤 User Information:');
  console.log('Name:', decoded.Name || decoded.unique_name);
  console.log('User ID:', decoded.UserId);
  console.log('User Type:', decoded.UserType);
  console.log('Is Super Admin:', decoded.IsSuperAdmin);
  console.log('Expiry:', new Date(decoded.exp * 1000).toLocaleString());
  
} catch (error) {
  console.error('Error decoding JWT:', error);
}
