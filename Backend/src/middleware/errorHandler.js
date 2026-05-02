const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
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

  res.status(status).json({
    success: false,
    message: status >= 500 && isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };
