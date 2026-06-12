import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled request error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && status === 500 
      ? 'An unexpected system error occurred' 
      : message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
