const http = require('http');

// First, login to get a token
const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const loginData = JSON.stringify({
  email: 'yerosang463@gmail.com',
  password: '@yero27101620'
});

const loginReq = http.request(loginOptions, (loginRes) => {
  console.log(`Login Status: ${loginRes.statusCode}`);
  
  let loginData = '';
  loginRes.on('data', (chunk) => {
    loginData += chunk;
  });
  
  loginRes.on('end', () => {
    console.log('Login Response:', loginData);
    try {
      const loginJson = JSON.parse(loginData);
      if (loginJson.success && loginJson.token) {
        console.log('\n=== Testing /api/admin/analytics with token ===');
        
        // Now test /api/admin/analytics with the token
        const analyticsOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/admin/analytics',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginJson.token}`,
          }
        };
        
        const analyticsReq = http.request(analyticsOptions, (analyticsRes) => {
          console.log(`Analytics Status: ${analyticsRes.statusCode}`);
          
          let analyticsData = '';
          analyticsRes.on('data', (chunk) => {
            analyticsData += chunk;
          });
          
          analyticsRes.on('end', () => {
            console.log('Analytics Response:', analyticsData);
            try {
              const analyticsJson = JSON.parse(analyticsData);
              console.log('\n=== Parsed Analytics Data ===');
              console.log('User Stats:', analyticsJson.data?.user_stats);
              console.log('Group Stats:', analyticsJson.data?.group_stats);
              console.log('Payment Stats:', analyticsJson.data?.payment_stats);
              console.log('\n=== Dashboard Values ===');
              console.log('Total Users:', analyticsJson.data?.user_stats?.total_users);
              console.log('Total Groups:', analyticsJson.data?.group_stats?.total_groups);
              console.log('Total Payments:', analyticsJson.data?.payment_stats?.total_payments);
              console.log('Total Revenue:', analyticsJson.data?.group_stats?.total_contribution_value);
            } catch (e) {
              console.log('Failed to parse JSON');
            }
          });
        });
        
        analyticsReq.on('error', (error) => {
          console.error('Analytics Error:', error.message);
        });
        
        analyticsReq.end();
      }
    } catch (e) {
      console.log('Failed to parse login JSON');
    }
  });
});

loginReq.on('error', (error) => {
  console.error('Login Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
