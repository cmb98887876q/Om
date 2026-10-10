const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Never leak stack traces in production
  const responsePayload = {
    error: true,
    message: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
