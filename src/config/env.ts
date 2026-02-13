import dotenv from 'dotenv';
import path from 'path';

// process.cwd() = the folder where you ran "npm run dev"
// That's your project root, where .env lives
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  // ─── APP ───────────────────────────────
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // ─── MYSQL (not postgres!) ─────────────
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),       // MySQL = 3306, not 5432
  DB_NAME: process.env.DB_NAME || 'work_management',
  DB_USER: process.env.DB_USER || 'root',                     // MySQL default = root
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),

  // ─── REDIS ─────────────────────────────
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // ─── JWT ───────────────────────────────
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access-secret-change-me',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-me',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // ─── BCRYPT ────────────────────────────
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
} as const ;