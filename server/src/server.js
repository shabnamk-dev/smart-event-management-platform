import { createApp } from './app.js';
import { getDatabase } from './db/database.js';
import { config } from './config/env.js';

// Initialize database
try {
  const db = getDatabase();
  console.log('📦 Database initialized and ready at:', config.DATABASE_PATH);
} catch (err) {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
}

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Smart Event Management Platform Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  console.log(`📡 Health Check available at http://localhost:${config.PORT}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});
