import express from 'express';
import { setupSecurityMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import judgeRoutes from './routes/judge.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import testRbacRoutes from './routes/testRbac.routes.js';

export function createApp() {
  const app = express();

  // Basic body parser with payload size limit
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));

  // Security headers, CORS, rate-limiting
  setupSecurityMiddleware(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      service: 'Smart Event Management Platform API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/organizer', organizerRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/judge', judgeRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/test-rbac', testRbacRoutes);

  // 404 handler for undefined routes
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found on this server`));
  });

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
}

export default createApp;
