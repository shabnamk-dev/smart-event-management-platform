import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export function setupSecurityMiddleware(app) {
  // 1. Helmet for secure HTTP response headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible dev environment, customize for prod
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration
  const allowedOrigins = [config.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS blocked: Origin not allowed'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. API Rate Limiting to prevent brute force & DoS attacks
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      status: 'fail',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });

  app.use('/api', limiter);
}
