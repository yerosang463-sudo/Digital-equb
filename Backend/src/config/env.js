const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

[
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_IDS',
  'GOOGLE_CLIENT_SECRET',
  'FRONTEND_URL',
  'CORS_ORIGINS',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
].forEach((key) => {
  if (process.env[key]) {
    process.env[key] = process.env[key].trim();
  }
});

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Check Backend/.env');
}

if (!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_IDS) {
  console.warn('GOOGLE_CLIENT_ID is not set. Google login will be disabled.');
}

module.exports = process.env;
