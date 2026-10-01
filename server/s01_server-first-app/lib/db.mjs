import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

dotenv.config({ path: '/Users/Shared/AIPrivateSearch/.env-aips', quiet: true });

// Fail-fast: the database is required. Missing configuration must stop the app
// immediately rather than silently connecting to localhost with blank credentials.
const REQUIRED_DB_VARS = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
const missingDbVars = REQUIRED_DB_VARS.filter(v => !process.env[v]);
if (missingDbVars.length > 0) {
  const message = `CRITICAL: Missing required database configuration: ${missingDbVars.join(', ')}. `
    + `Set these in /Users/Shared/AIPrivateSearch/.env-aips. AIPrivateSearch cannot start without a configured database.`;
  logger.error(message);
  throw new Error(message);
}

const pool = mysql.createPool({
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

export default pool;
