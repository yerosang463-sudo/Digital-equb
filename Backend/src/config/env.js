const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Check Backend/.env');
}

module.exports = process.env;
