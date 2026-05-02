const jwt = require('jsonwebtoken');

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is not configured`);
  }

  return value.trim();
}

function getJwtSecret() {
  return getRequiredEnv('JWT_SECRET');
}

function getJwtExpiresIn() {
  return (process.env.JWT_EXPIRES_IN || '7d').trim();
}

function signAuthToken(user) {
  return jwt.sign(
    {
      id: Number(user.id),
      email: user.email,
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn(),
    }
  );
}

function getGoogleClientIds() {
  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    ...(process.env.GOOGLE_CLIENT_IDS || '').split(','),
  ]
    .map((id) => (id || '').trim())
    .filter(Boolean);

  return [...new Set(ids)];
}

module.exports = {
  getGoogleClientIds,
  getJwtSecret,
  signAuthToken,
};
