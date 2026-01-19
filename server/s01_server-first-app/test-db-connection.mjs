// test-db-connection.mjs - Test MySQL database connection
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env-aips from /Users/Shared/AIPrivateSearch/
const envPath = '/Users/Shared/AIPrivateSearch/.env-aips';
dotenv.config({ path: envPath, quiet: true, debug: false });

console.log('🔍 Testing database connection...');
console.log('📁 Environment file path:', envPath);

console.log('🔍 Raw env values:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('DB_DATABASE:', process.env.DB_DATABASE);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'aips-readwrite',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'aiprivatesearch',
  connectionLimit: 10,
  idleTimeout: 300000
};

console.log('⚙️  Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password ? `***${dbConfig.password.length} chars` : '(empty)',
  database: dbConfig.database
});

async function testConnection() {
  let connection;
  try {
    console.log('🔌 Attempting to connect...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!');
    
    console.log('📊 Testing query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);
    
    console.log('📋 Checking tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error code:', error.code);
    console.error('🔍 Error errno:', error.errno);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed');
    }
  }
}

testConnection();