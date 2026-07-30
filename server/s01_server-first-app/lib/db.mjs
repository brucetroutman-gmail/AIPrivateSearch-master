import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

dotenv.config({ path: '/Users/Shared/AIPrivateSearch/.env-aips', quiet: true });

let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'aips-readwrite',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'aiprivatesearch',
    connectionLimit: 10,
    idleTimeout: 300000,
    typeCast: (field, next) => field.type === 'BLOB' || field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'LONG_BLOB' || field.type === 'MEDIUM_BLOB' ? field.string() : next()
  });
  logger.log('Shared DB pool created');
} catch (error) {
  logger.error('Shared DB pool creation failed:', error.message);
}

export default pool;
