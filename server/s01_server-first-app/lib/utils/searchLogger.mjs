import fs from 'fs';
import path from 'path';
import { AppConfig } from './appConfig.mjs';

export class SearchLogger {
  static getLogPath() {
    const logsDir = '/Users/Shared/AIPrivateSearch/logs';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(logsDir, `${today}-log.json`);
  }

  static ensureLogsDirectory() {
    const logsDir = '/Users/Shared/AIPrivateSearch/logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  static async logSearch(searchData) {
    try {
      this.ensureLogsDirectory();
      const logPath = this.getLogPath();
      const logEntry = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...this.formatSearchData(searchData)
      };

      // Read existing log or create new array
      let logs = [];
      if (fs.existsSync(logPath)) {
        try {
          const existingData = fs.readFileSync(logPath, 'utf-8');
          logs = JSON.parse(existingData);
        } catch (error) {
          console.warn('[SearchLogger] Failed to parse existing log, creating new log');
          logs = [];
        }
      }

      // Add new entry
      logs.push(logEntry);

      // Write back to file
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
      
      return logEntry.id;
    } catch (error) {
      console.error('[SearchLogger] Failed to log search:', error);
      return null;
    }
  }

  static formatSearchData(data) {
    return {
      // Basic search info
      testCode: data.testCode || null,
      testCategory: data.testCategory || null,
      testDescription: data.testDescription || null,
      userEmail: data.userEmail || null,
      
      // System info
      pcCode: data.pcCode || null,
      pcCPU: data.systemInfo?.chip || null,
      pcGraphics: data.systemInfo?.graphics || null,
      pcRAM: data.systemInfo?.ram || null,
      pcOS: data.systemInfo?.os || null,
      
      // Search parameters
      sourceType: data.sourceType || null,
      collectionName: data.collectionName || null,
      searchMethodType: data.searchType || null,
      systemPrompt: data.systemPromptName || null,
      prompt: data.query || null,
      
      // Search model info
      searchModel: data.metrics?.search?.model || null,
      searchContextSize: data.metrics?.search?.context_size || null,
      searchTemperature: data.metrics?.search?.temperature || null,
      searchTokenLimit: data.metrics?.search?.token_limit || null,
      searchDurationSeconds: data.metrics?.search ? (data.metrics.search.total_duration / 1000000000) : null,
      searchLoadMs: data.metrics?.search ? Math.round(data.metrics.search.load_duration / 1000000) : null,
      searchTokensPerSecond: this.calculateTokensPerSecond(data.metrics?.search),
      searchAnswer: data.response || null,
      
      // Score model info (if scoring was performed)
      scoreModel: data.metrics?.scoring?.model || null,
      scoreContextSize: data.metrics?.scoring?.context_size || null,
      scoreTemperature: data.metrics?.scoring?.temperature || null,
      scoreTokenLimit: data.metrics?.scoring?.max_tokens || null,
      scoreDurationSeconds: data.metrics?.scoring ? (data.metrics.scoring.total_duration / 1000000000) : null,
      scoreLoadMs: data.metrics?.scoring ? Math.round(data.metrics.scoring.load_duration / 1000000) : null,
      scoreTokensPerSecond: this.calculateTokensPerSecond(data.metrics?.scoring),
      
      // Scores
      accuracyScore: data.scores?.accuracy || null,
      relevanceScore: data.scores?.relevance || null,
      organizationScore: data.scores?.organization || null,
      weightedScorePercent: data.scores?.total || null,
      
      // Document search specific
      documentsFound: data.documentsFound || null,
      documentsSearched: data.documentsSearched || null,
      searchMethod: data.searchMethod || null,
      
      // Additional metadata
      sessionId: data.sessionId || null,
      ipAddress: data.ipAddress || null
    };
  }

  static calculateTokensPerSecond(metrics) {
    if (!metrics || !metrics.eval_count || !metrics.eval_duration || metrics.eval_duration === 0) {
      return null;
    }
    const tokensPerSec = metrics.eval_count / (metrics.eval_duration / 1000000000);
    return isFinite(tokensPerSec) ? Math.round(tokensPerSec * 100) / 100 : null;
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  static async getRecentLogs(limit = 100) {
    try {
      const logsDir = '/Users/Shared/AIPrivateSearch/logs';
      if (!fs.existsSync(logsDir)) {
        return [];
      }

      // Get all log files sorted by date (newest first)
      const logFiles = fs.readdirSync(logsDir)
        .filter(file => file.endsWith('-log.json'))
        .sort().reverse();

      let allLogs = [];
      
      // Read files until we have enough logs
      for (const file of logFiles) {
        if (allLogs.length >= limit) break;
        
        try {
          const filePath = path.join(logsDir, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          const logs = JSON.parse(data);
          allLogs.push(...logs.reverse()); // Add newest first
        } catch (error) {
          console.warn(`[SearchLogger] Failed to read ${file}:`, error.message);
        }
      }
      
      return allLogs.slice(0, limit);
    } catch (error) {
      console.error('[SearchLogger] Failed to read logs:', error);
      return [];
    }
  }

  static async getLogsByDateRange(startDate, endDate) {
    try {
      const logsDir = '/Users/Shared/AIPrivateSearch/logs';
      if (!fs.existsSync(logsDir)) {
        return [];
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get log files within date range
      const logFiles = fs.readdirSync(logsDir)
        .filter(file => {
          const match = file.match(/^(\d{4}-\d{2}-\d{2})-log\.json$/);
          if (!match) return false;
          const fileDate = match[1];
          return fileDate >= startDateStr && fileDate <= endDateStr;
        })
        .sort();

      let allLogs = [];
      
      for (const file of logFiles) {
        try {
          const filePath = path.join(logsDir, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          const logs = JSON.parse(data);
          allLogs.push(...logs);
        } catch (error) {
          console.warn(`[SearchLogger] Failed to read ${file}:`, error.message);
        }
      }
      
      // Additional timestamp filtering for precision
      return allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      }).reverse(); // Most recent first
    } catch (error) {
      console.error('[SearchLogger] Failed to filter logs by date:', error);
      return [];
    }
  }

  static async getLogsByUser(userEmail) {
    try {
      const logs = await this.getRecentLogs(1000);
      return logs.filter(log => log.userEmail === userEmail);
    } catch (error) {
      console.error('[SearchLogger] Failed to filter logs by user:', error);
      return [];
    }
  }
}