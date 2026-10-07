/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs';
import path from 'path';
import { sanitizeLogInput } from '../../../../shared/utils/logger.mjs';

/**
 * ErrorLogger — centralized, file-based error log for the whole app.
 *
 * Appends structured error entries to a single rolling file:
 *   /Users/Shared/AIPrivateSearch/logs/error-log.json
 *
 * Each entry is one JSON object per line (JSON Lines format) so the file
 * can be appended to cheaply and tailed without parsing the whole file.
 */
export class ErrorLogger {
  static LOGS_DIR = '/Users/Shared/AIPrivateSearch/logs';
  static LOG_FILE = path.join(ErrorLogger.LOGS_DIR, 'error-log.json');
  static MAX_LINES = 5000;

  static ensureLogsDirectory() {
    if (!fs.existsSync(ErrorLogger.LOGS_DIR)) {
      fs.mkdirSync(ErrorLogger.LOGS_DIR, { recursive: true });
    }
  }

  /**
   * Log an error to the central error file.
   * @param {Error|string} error - the error object or message
   * @param {object} context - optional metadata (source, route, method, url, user, extra)
   */
  static log(error, context = {}) {
    try {
      ErrorLogger.ensureLogsDirectory();

      const isErr = error instanceof Error;
      const entry = {
        timestamp: new Date().toISOString(),
        source: sanitizeLogInput(context.source || 'app'),
        message: sanitizeLogInput(isErr ? error.message : String(error)),
        name: isErr ? sanitizeLogInput(error.name) : null,
        stack: isErr && error.stack ? sanitizeLogInput(error.stack) : null,
        method: context.method ? sanitizeLogInput(context.method) : null,
        url: context.url ? sanitizeLogInput(context.url) : null,
        statusCode: context.statusCode || null,
        user: context.user ? sanitizeLogInput(context.user) : null,
        extra: context.extra ? sanitizeLogInput(JSON.stringify(context.extra)) : null
      };

      fs.appendFileSync(ErrorLogger.LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
      ErrorLogger.trim();
    } catch (e) {
      // Never let logging crash the app
      console.error('[ErrorLogger] Failed to write error log:', e.message);
    }
  }

  /** Keep the file from growing unbounded. */
  static trim() {
    try {
      const content = fs.readFileSync(ErrorLogger.LOG_FILE, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      if (lines.length > ErrorLogger.MAX_LINES) {
        fs.writeFileSync(
          ErrorLogger.LOG_FILE,
          lines.slice(-ErrorLogger.MAX_LINES).join('\n') + '\n',
          'utf8'
        );
      }
    } catch {
      // ignore trim failures
    }
  }

  /** Read recent error entries (newest first). */
  static getRecent(limit = 200) {
    try {
      if (!fs.existsSync(ErrorLogger.LOG_FILE)) return [];
      const content = fs.readFileSync(ErrorLogger.LOG_FILE, 'utf8');
      const entries = content
        .split('\n')
        .filter(Boolean)
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);
      return entries.reverse().slice(0, limit);
    } catch (e) {
      console.error('[ErrorLogger] Failed to read error log:', e.message);
      return [];
    }
  }

  static clear() {
    try {
      ErrorLogger.ensureLogsDirectory();
      fs.writeFileSync(ErrorLogger.LOG_FILE, '', 'utf8');
      return true;
    } catch (e) {
      console.error('[ErrorLogger] Failed to clear error log:', e.message);
      return false;
    }
  }
}

export default ErrorLogger;
