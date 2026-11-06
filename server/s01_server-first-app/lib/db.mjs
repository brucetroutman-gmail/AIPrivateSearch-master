import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

// The remote MySQL DB is a TESTING sink only (written/read by the two test-harness pages and
// their analysis tooling). In normal use it is not configured and not available, so the app
// must start and run fine without it: this module never throws at import, and the pool is
// created lazily on first use.
//
// Loading .env-aips here is deliberately kept at import time. It is harmless (never fails)
// and other modules depend on it: ES imports are hoisted above server.mjs's own dotenv call,
// and e.g. routes/auth.mjs reads DEFAULT_ADMIN_EMAIL/PASSWORD at its top level. Moving this
// into getPool() would silently break those.
dotenv.config({ path: '/Users/Shared/AIPrivateSearch/.env-aips', quiet: true });

const REQUIRED_DB_VARS = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];

let pool = null;
let initialized = false;

// Names of required DB settings that are not set (empty when fully configured).
export function getMissingDbVars() {
  return REQUIRED_DB_VARS.filter(v => !process.env[v]);
}

export function isDbConfigured() {
  return getMissingDbVars().length === 0;
}

// The shared pool, created on first call. Returns null (never throws) when the DB is not
// configured, so callers must handle null — e.g. respond "Database not configured".
// No credential defaults are ever substituted: missing config means no pool.
export function getPool() {
  if (initialized) return pool;
  initialized = true;

  const missing = getMissingDbVars();
  if (missing.length > 0) {
    logger.log(`Remote database not configured (missing: ${missing.join(', ')}); database-backed test endpoints are disabled.`);
    return null;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    idleTimeout: 300000,
    typeCast: (field, next) => field.type === 'BLOB' || field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'LONG_BLOB' || field.type === 'MEDIUM_BLOB' ? field.string() : next()
  });
  logger.log('Shared DB pool created');
  return pool;
}
