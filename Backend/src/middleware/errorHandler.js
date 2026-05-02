const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource not found',
    });
  }

  // Handle specific JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    });
  }

  res.status(status).json({
    success: false,
    message: status >= 500 && isProduction
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Internal server error',
    ...(isProduction ? {} : { stack: err.stack, details: err })
  });
};

module.exports = { errorHandler };
