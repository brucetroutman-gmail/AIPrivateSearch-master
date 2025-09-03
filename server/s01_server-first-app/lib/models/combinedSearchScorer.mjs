import { Ollama } from 'ollama';
import { execSync } from 'child_process';
import { logger } from '../../../../shared/utils/logger.mjs';
import fs from 'fs';
import path from 'path';

class CombinedSearchScorer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.searchModel = 'qwen2:0.5b';
    this.scoreSettings = this.#loadScoreSettings();
  }

  #loadScoreSettings() {
    const configPath = path.join(process.cwd(), '..', '..', 'client', 'c01_client-first-app', 'config', 'score-settings');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const settings = {};
    config['score-settings'].forEach(item => {
      Object.assign(settings, item);
    });
    return settings;
  }

  /* public */
  async process(query, enableScoring = true, model = null, temperature = 0.3, context = 0.3, systemPrompt = null, systemPromptName = null, tokenLimit = null, sourceType = null, testCode = null, scoreModel = null) {
    try {
      const searchModel = model || this.searchModel;
      const searchResponse = await this.#search(query, searchModel, temperature, context, systemPrompt, tokenLimit);
      searchResponse.systemPromptName = systemPromptName;
      searchResponse.sourceType = sourceType;
      searchResponse.tokenLimit = tokenLimit;
      const result = {
        query,
        response: searchResponse.response,
        systemPromptName: searchResponse.systemPromptName,
        sourceType: searchResponse.sourceType,
        tokenLimit: searchResponse.tokenLimit,
        testCode: testCode,
        createdAt: this.#formatCreatedAt(),
        pcCode: this.#generatePcCode(),
        systemInfo: this.#getSystemInfo(),
        scores: null,
        metrics: {
          search: searchResponse.metrics
        }
      };

      if (enableScoring) {
        const scoreResult = await this.#score(query, searchResponse.response, temperature, context, scoreModel);
        result.scores = scoreResult.scores;
        result.metrics.scoring = scoreResult.metrics;
        
        // Retry once if no scores were obtained
        if (result.scores && result.scores.accuracy === null && result.scores.relevance === null && result.scores.organization === null) {
          logger.log('No scores obtained, retrying once');
          const retryResult = await this.#score(query, searchResponse.response, temperature, context, scoreModel);
          result.scores = retryResult.scores;
          result.metrics.scoringRetry = retryResult.metrics;
          
          // If still no scores, set message
          if (result.scores.accuracy === null && result.scores.relevance === null && result.scores.organization === null) {
            result.scores.overallComments = 'No scores are available';
          }
        }
      }
      return result;
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error in process method:', error.message);
      return {
        query,
        response: 'Error occurred while processing the query',
        timestamp: new Date().toISOString(),
        scores: null,
        error: error.message
      };
    }
  }

  /* private */
  async #search(query, model = this.searchModel, temperature = 0.3, context = 0.3, systemPrompt = null, tokenLimit = null) {
    try {
      const finalPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${query}` : query;
      
      const options = {
        temperature: temperature,
        num_ctx: context
      };
      
      // Add token limit if specified
      if (tokenLimit !== null) {
        options.num_predict = tokenLimit;
      }
      
      const res = await this.ollama.generate({
        model: model,
        prompt: finalPrompt,
        stream: false,
        options: options
      });
      return {
        response: res.response,
        systemPromptName: null, // Will be set by caller
        metrics: {
          model: res.model,
          total_duration: res.total_duration,
          load_duration: res.load_duration,
          prompt_eval_count: res.prompt_eval_count,
          prompt_eval_duration: res.prompt_eval_duration,
          eval_count: res.eval_count,
          eval_duration: res.eval_duration,
          context_size: context,
          temperature: temperature,
          token_limit: tokenLimit
        }
      };
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error in search method:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async #score(query, answer, temperature = 0.3, context = 0.3, scoreModel = null) {
    try {
      logger.log('Starting scoring process');
      
      const scoringPrompt = `Rate this answer on a scale of 1-3 for each criterion:

Query: ${query}
Answer: ${answer}

Accurate: [1-3]
Relevant: [1-3] 
Organized: [1-3]

Provide ONLY the three numbers, one per line.`;

      const modelToUse = scoreModel || this.scoreSettings.model;
      
      const res = await this.ollama.generate({
        model: modelToUse,
        prompt: scoringPrompt,
        stream: false,
        options: {
          temperature: this.scoreSettings.temperature,
          num_ctx: this.scoreSettings.context,
          num_predict: this.scoreSettings.maxtokens
        }
      });

      logger.log('Scoring model response received, parsing');
      const scores = this.#parseScores(res.response);
      logger.log('Scoring completed successfully');
      
      return {
        scores,
        metrics: {
          model: res.model,
          total_duration: res.total_duration,
          load_duration: res.load_duration,
          prompt_eval_count: res.prompt_eval_count,
          prompt_eval_duration: res.prompt_eval_duration,
          eval_count: res.eval_count,
          eval_duration: res.eval_duration,
          context_size: this.scoreSettings.context,
          temperature: this.scoreSettings.temperature,
          max_tokens: this.scoreSettings.maxtokens
        }
      };
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error in scoring method:', error.message);
      logger.error('Query length:', query?.length || 0);
      logger.error('Answer length:', answer?.length || 0);
      
      // Return a default score structure instead of null
      return {
        scores: {
          accuracy: null,
          relevance: null,
          organization: null,
          total: null,
          justifications: { 
            accuracy: 'Scoring failed due to error', 
            relevance: 'Scoring failed due to error', 
            organization: 'Scoring failed due to error' 
          },
          overallComments: `Scoring error: ${error.message}`,
          error: error.message
        },
        metrics: null
      };
    }
  }

  #parseScores(text) {
    try {
      logger.log('Raw scoring text length:', text?.length || 0);
      
      const scoreObj = {
        accuracy: null,
        relevance: null,
        organization: null,
        total: null,
        justifications: { accuracy: 'Auto-generated', relevance: 'Auto-generated', organization: 'Auto-generated' },
        overallComments: 'Scores extracted from model response'
      };

      // Extract all numbers 1-3 from the response
      const numbers = text.match(/[1-3]/g);
      logger.log('Found numbers:', numbers);
      
      if (numbers && numbers.length >= 3) {
        scoreObj.accuracy = Number(numbers[0]);
        scoreObj.relevance = Number(numbers[1]);
        scoreObj.organization = Number(numbers[2]);
        
        // Calculate weighted score
        const rawScore = (3 * scoreObj.accuracy) + (2 * scoreObj.relevance) + (1 * scoreObj.organization);
        scoreObj.total = Math.round((rawScore / 18) * 100);
      }
      
      logger.log('Parsed scores successfully');
      return scoreObj;
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error parsing scores:', error.message);
      
      return {
        accuracy: null,
        relevance: null,
        organization: null,
        total: null,
        justifications: { accuracy: '', relevance: '', organization: '' },
        overallComments: 'Parsing failed',
        error: error.message
      };
    }
  }

  #extract(line) {
    const m = line.match(/\b([0-3])\b/);
    return m ? Number(m[1]) : null;
  }

  #generatePcCode() {
    try {
      const serial = execSync('system_profiler SPHardwareDataType 2>/dev/null | grep "Serial Number" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      if (serial && serial.length >= 6) {
        return serial.substring(0, 3) + serial.substring(serial.length - 3);
      }
      return 'UNKNOWN';
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error generating PcCode:', error.message);
      return 'ERROR';
    }
  }

  #getSystemInfo() {
    try {
      let chip = execSync('system_profiler SPHardwareDataType 2>/dev/null | grep "Chip" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      if (!chip) {
        chip = execSync('system_profiler SPHardwareDataType 2>/dev/null | grep "Processor" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      }
      const graphics = execSync('system_profiler SPDisplaysDataType 2>/dev/null | grep "Chipset Model" | head -1 | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      const ram = execSync('system_profiler SPHardwareDataType 2>/dev/null | grep "Memory" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      const os = execSync('sw_vers -productName && sw_vers -productVersion', { encoding: 'utf8' }).replace('\n', ' ').trim();
      
      return {
        chip: chip || 'Unknown',
        graphics: graphics || 'Unknown', 
        ram: ram || 'Unknown',
        os: os || 'Unknown'
      };
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error getting system info:', error.message);
      return {
        chip: 'Error',
        graphics: 'Error',
        ram: 'Error', 
        os: 'Error'
      };
    }
  }

  #formatCreatedAt() {
    return new Date().toISOString();
  }
}

export default CombinedSearchScorer;
