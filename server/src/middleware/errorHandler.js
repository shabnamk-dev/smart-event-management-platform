import { AppError } from '../utils/errors.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let error = err;

  // Handle SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    error = new AppError('A record with this unique value already exists.', 409);
  } else if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || (err.message && err.message.includes('FOREIGN KEY constraint failed'))) {
    error = new AppError('Referenced parent resource does not exist.', 400);
  } else if (err.code === 'SQLITE_CONSTRAINT_CHECK' || (err.message && err.message.includes('CHECK constraint failed'))) {
    error = new AppError('Constraint validation failed for this record.', 400);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token.', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token expired. Please log in again.', 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    status: error.status || 'error',
    message,
    ...(error.details ? { details: error.details } : {}),
    ...(config.NODE_ENV === 'development' && !error.isOperational ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(response);
}
