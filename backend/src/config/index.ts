import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'garaa_super_secret_jwt_key_2026_enterprise_production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || './uploads/private'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  webhookTimeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  databasePasswordPin: process.env.DATABASE_PASSWORD_PIN || '9160'
};
