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
        console.log('\n=== Testing /api/auth/me with token ===');
        
        // Now test /api/auth/me with the token
        const meOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/me',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginJson.token}`,
          }
        };
        
        const meReq = http.request(meOptions, (meRes) => {
          console.log(`Auth/me Status: ${meRes.statusCode}`);
          
          let meData = '';
          meRes.on('data', (chunk) => {
            meData += chunk;
          });
          
          meRes.on('end', () => {
            console.log('Auth/me Response:', meData);
            try {
              const meJson = JSON.parse(meData);
              console.log('Parsed JSON:', JSON.stringify(meJson, null, 2));
            } catch (e) {
              console.log('Failed to parse JSON');
            }
          });
        });
        
        meReq.on('error', (error) => {
          console.error('Auth/me Error:', error.message);
        });
        
        meReq.end();
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
