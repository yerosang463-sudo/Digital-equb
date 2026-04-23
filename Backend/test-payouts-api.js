const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/payouts?page=1&limit=10',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6Inllcm9zYW5nNDYzQGdtYWlsLmNvbSIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTcxNDM3NDYwMCwiZXhwIjoxNzE0OTc5NDAwfQ.test' // This is a test token - will need real auth
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
