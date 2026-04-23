const http = require('http');

// Test admin login
const loginData = JSON.stringify({
  email: 'yerosang463@gmail.com',
  password: '@yero27101620'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Login Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Login Response:', response.success ? 'SUCCESS' : 'FAILED');
      if (response.success) {
        console.log('Token received:', response.token ? 'YES' : 'NO');
        console.log('User isAdmin:', response.user?.isAdmin);
        
        // Now test admin analytics endpoint with the token
        testAdminAnalytics(response.token);
      } else {
        console.log('Error:', response.message);
        process.exit(1);
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
  process.exit(1);
});

req.write(loginData);
req.end();

function testAdminAnalytics(token) {
  console.log('\n--- Testing Admin Analytics Endpoint ---');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/analytics',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`Analytics Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Analytics Response:', response.success ? 'SUCCESS' : 'FAILED');
        if (response.success) {
          console.log('Data received:', Object.keys(response.data || {}).join(', '));
          console.log('User stats:', response.data?.user_stats?.length || 0, 'records');
          console.log('Group stats:', response.data?.group_stats ? 'YES' : 'NO');
          console.log('Payment stats:', response.data?.payment_stats?.length || 0, 'records');
        } else {
          console.log('Error:', response.message);
        }
      } catch (e) {
        console.error('Failed to parse analytics response:', e.message);
        console.log('Raw response:', data.substring(0, 200));
      }
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.error('Analytics request error:', error.message);
    process.exit(1);
  });
  
  req.end();
}