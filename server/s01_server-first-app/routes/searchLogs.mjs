import express from 'express';
import { SearchLogger } from '../lib/utils/searchLogger.mjs';

const router = express.Router();

// Get recent search logs
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await SearchLogger.getRecentLogs(limit);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get logs by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'startDate and endDate parameters are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format' 
      });
    }

    const logs = await SearchLogger.getLogsByDateRange(start, end);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching logs by date range:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get logs by user
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const logs = await SearchLogger.getLogsByUser(email);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching logs by user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get log statistics
router.get('/stats', async (req, res) => {
  try {
    const logs = await SearchLogger.getRecentLogs(1000);
    
    const stats = {
      totalSearches: logs.length,
      uniqueUsers: new Set(logs.map(log => log.userEmail).filter(Boolean)).size,
      searchTypes: {},
      sourceTypes: {},
      collections: {},
      models: {},
      averageSearchDuration: 0,
      averageScores: {
        accuracy: 0,
        relevance: 0,
        organization: 0,
        weighted: 0
      }
    };

    let totalDuration = 0;
    let durationCount = 0;
    let totalAccuracy = 0;
    let totalRelevance = 0;
    let totalOrganization = 0;
    let totalWeighted = 0;
    let scoreCount = 0;

    logs.forEach(log => {
      // Count search types
      if (log.searchType) {
        stats.searchTypes[log.searchType] = (stats.searchTypes[log.searchType] || 0) + 1;
      }
      
      // Count source types
      if (log.sourceType) {
        stats.sourceTypes[log.sourceType] = (stats.sourceTypes[log.sourceType] || 0) + 1;
      }
      
      // Count collections
      if (log.collectionName) {
        stats.collections[log.collectionName] = (stats.collections[log.collectionName] || 0) + 1;
      }
      
      // Count models
      if (log.searchModel) {
        stats.models[log.searchModel] = (stats.models[log.searchModel] || 0) + 1;
      }
      
      // Calculate average duration
      if (log.searchDurationSeconds) {
        totalDuration += log.searchDurationSeconds;
        durationCount++;
      }
      
      // Calculate average scores
      if (log.accuracyScore !== null) {
        totalAccuracy += log.accuracyScore;
        totalRelevance += log.relevanceScore || 0;
        totalOrganization += log.organizationScore || 0;
        totalWeighted += log.weightedScorePercent || 0;
        scoreCount++;
      }
    });

    if (durationCount > 0) {
      stats.averageSearchDuration = Math.round((totalDuration / durationCount) * 100) / 100;
    }

    if (scoreCount > 0) {
      stats.averageScores.accuracy = Math.round((totalAccuracy / scoreCount) * 100) / 100;
      stats.averageScores.relevance = Math.round((totalRelevance / scoreCount) * 100) / 100;
      stats.averageScores.organization = Math.round((totalOrganization / scoreCount) * 100) / 100;
      stats.averageScores.weighted = Math.round((totalWeighted / scoreCount) * 100) / 100;
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error generating log statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;