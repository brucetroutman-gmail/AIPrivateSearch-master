import { Ollama } from 'ollama';
import { execSync } from 'child_process';
import { logger } from '../../../../shared/utils/logger.mjs';
import fs from 'fs';
import path from 'path';

class CombinedSearchScorer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.searchModel = 'qwen2:0.5b';
    this.scoreSettings = this.loadScoreSettings();
    this.cachedSystemInfo = null;
    this.cachedPcCode = null;
  }

  loadScoreSettings() {
    const configPath = path.join(process.cwd(), '..', '..', 'client', 'c01_client-first-app', 'config', 'score-settings');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const settings = {};
    config['score-settings'].forEach(item => {
      Object.assign(settings, item);
    });
    return settings;
  }

  /* public */
  async processWithRetry(query, enableScoring = true, model = null, temperature = 0.3, context = 0.3, systemPrompt = null, systemPromptName = null, tokenLimit = null, sourceType = null, testCode = null, scoreModel = null) {
    let attempt = 1;
    const maxAttempts = 2;
    
    while (attempt <= maxAttempts) {
      try {
        const result = await this.process(query, enableScoring, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel);
        
        // If successful, return result with database save flag
        result.shouldSaveToDatabase = true;
        return result;
        
      } catch (error) {
        logger.error(`Test execution failed (attempt ${attempt}/${maxAttempts}) - TestCode: ${testCode || 'N/A'}`);
        logger.error(`Error: ${error.message}`);
        
        if (attempt === maxAttempts) {
          // Final failure - return error result without database save
          logger.error(`Final failure for TestCode: ${testCode || 'N/A'} - will not save to database`);
          return {
            query,
            response: `Test failed after ${maxAttempts} attempts: ${error.message}`,
            timestamp: new Date().toISOString(),
            testCode: testCode,
            scores: null,
            error: error.message,
            shouldSaveToDatabase: false
          };
        }
        
        attempt++;
        logger.log(`Retrying TestCode: ${testCode || 'N/A'} (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
      }
    }
  }

  async process(query, enableScoring = true, model = null, temperature = 0.3, context = 0.3, systemPrompt = null, systemPromptName = null, tokenLimit = null, sourceType = null, testCode = null, scoreModel = null) {
    try {
      const processStart = Date.now();
      logger.log('Starting process method');
      
      // Check if Ollama is working before proceeding
      await this.checkOllamaHealth();
      
      const searchModel = model || this.searchModel;
      const searchStart = Date.now();
      const searchResponse = await this.search(query, searchModel, temperature, context, systemPrompt, tokenLimit);
      logger.log(`Search completed in ${Date.now() - searchStart}ms`);
      searchResponse.systemPromptName = systemPromptName;
      searchResponse.sourceType = sourceType;
      searchResponse.tokenLimit = tokenLimit;
      
      const sysInfoStart = Date.now();
      const systemInfo = this.getSystemInfo();
      const pcCode = this.generatePcCode();
      logger.log(`System info collected in ${Date.now() - sysInfoStart}ms`);
      
      const result = {
        query,
        response: searchResponse.response,
        systemPromptName: searchResponse.systemPromptName,
        sourceType: searchResponse.sourceType,
        tokenLimit: searchResponse.tokenLimit,
        testCode: testCode,
        createdAt: this.formatCreatedAt(),
        pcCode: pcCode,
        systemInfo: systemInfo,
        scores: null,
        metrics: {
          search: searchResponse.metrics
        }
      };

      if (enableScoring) {
        const scoreStart = Date.now();
        const scoreResult = await this.score(query, searchResponse.response, temperature, context, scoreModel);
        logger.log(`Scoring completed in ${Date.now() - scoreStart}ms`);
        result.scores = scoreResult.scores;
        result.metrics.scoring = scoreResult.metrics;
        
        // Retry once if no scores were obtained
        if (result.scores && result.scores.accuracy === null && result.scores.relevance === null && result.scores.organization === null) {
          logger.log('No scores obtained, retrying once');
          const retryResult = await this.score(query, searchResponse.response, temperature, context, scoreModel);
          result.scores = retryResult.scores;
          result.metrics.scoringRetry = retryResult.metrics;
          
          // If still no scores, set message
          if (result.scores.accuracy === null && result.scores.relevance === null && result.scores.organization === null) {
            result.scores.overallComments = 'No scores are available';
          }
        }
      }
      
      logger.log(`Total process method completed in ${Date.now() - processStart}ms`);
      return result;
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error in process method:', error.message);
      throw error; // Re-throw for retry logic to handle
    }
  }

  /* private */
  async search(query, model = this.searchModel, temperature = 0.3, context = 0.3, systemPrompt = null, tokenLimit = null) {
    try {
      logger.log(`Starting search with model: ${model}`);
      const finalPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${query}` : query;
      
      const options = {
        temperature: temperature,
        num_ctx: typeof context === 'number' && context > 1 ? context : 2048
      };
      
      // Add token limit if specified
      if (tokenLimit !== null) {
        options.num_predict = tokenLimit;
      }
      
      // Set timeout based on model size
      const getTimeoutForModel = (modelName) => {
        const name = modelName.toLowerCase();
        if (name.includes('9b') || name.includes('7b') || name.includes('13b')) {
          return 300000; // 5 minutes for larger models
        }
        if (name.includes('3b') || name.includes('1.5b')) {
          return 180000; // 3 minutes for medium models
        }
        return 120000; // 2 minutes for small models
      };
      
      const timeout = getTimeoutForModel(model);
      logger.log(`Calling Ollama generate with ${timeout/1000}s timeout...`);
      
      const res = await Promise.race([
        this.ollama.generate({
          model: model,
          prompt: finalPrompt,
          stream: false,
          options: options
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Ollama request timeout after ${timeout/1000} seconds`)), timeout)
        )
      ]);
      
      logger.log('Ollama generate completed');
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

  // eslint-disable-next-line no-unused-vars
  async score(query, answer, temperature = 0.3, context = 0.3, scoreModel = null) {
    try {
      logger.log('Starting scoring process');
      
      if (!scoreModel) {
        throw new Error('Score model is required for scoring');
      }
      
      const scoringPrompt = `Evaluate this answer using a 1-3 scale where:
1 = Poor/Incorrect
2 = Adequate/Mostly correct  
3 = Excellent/Completely correct

Query: ${query}
Answer: ${answer}

Rate each criterion (1-3):
Accuracy (factual correctness): 
Relevance (addresses the query): 
Organization (clear structure): 

Respond with only three numbers, one per line.`;

      const modelToUse = scoreModel;
      
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
      const scores = this.parseScores(res.response);
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

          overallComments: `Scoring error: ${error.message}`,
          error: error.message
        },
        metrics: null
      };
    }
  }

  parseScores(text) {
    try {
      logger.log('Raw scoring text length:', text?.length || 0);
      
      const scoreObj = {
        accuracy: null,
        relevance: null,
        organization: null,
        total: null,

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

        overallComments: 'Parsing failed',
        error: error.message
      };
    }
  }

   
  extract(line) {
    const m = line.match(/\b([0-3])\b/);
    return m ? Number(m[1]) : null;
  }

  generatePcCode() {
    // Cache PC code since it doesn't change
    if (this.cachedPcCode) {
      return this.cachedPcCode;
    }
    
    try {
      // Try ioreg first (faster)
      try {
        const output = execSync('ioreg -l | grep IOPlatformSerialNumber', { encoding: 'utf8', timeout: 2000 }).trim();
        const match = output.match(/"IOPlatformSerialNumber" = "([^"]+)"/);
        if (match && match[1] && match[1].length >= 6) {
          const serial = match[1].trim();
          this.cachedPcCode = serial.substring(0, 3) + serial.substring(serial.length - 3);
          return this.cachedPcCode;
        }
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Continue to system_profiler fallback
      }
      
      // Fallback to system_profiler with longer timeout
      try {
        const output = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { encoding: 'utf8', timeout: 10000 }).trim();
        const match = output.match(/Serial Number \(system\): (.+)/);
        if (match && match[1] && match[1].length >= 6) {
          const serial = match[1].trim();
          this.cachedPcCode = serial.substring(0, 3) + serial.substring(serial.length - 3);
          return this.cachedPcCode;
        }
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Continue to hostname fallback
      }
      
      // Fallback to hostname
      const hostname = execSync('hostname', { encoding: 'utf8', timeout: 1000 }).trim();
      this.cachedPcCode = hostname ? hostname.substring(0, 6).toUpperCase() : 'MAC001';
      return this.cachedPcCode;
      
    } catch (error) {
      logger.error('Error generating PcCode:', error.message);
      // Use timestamp-based fallback
      this.cachedPcCode = 'T' + Date.now().toString().slice(-5);
      return this.cachedPcCode;
    }
  }

  getSystemInfo() {
    // Cache system info since it doesn't change during runtime
    if (this.cachedSystemInfo) {
      return this.cachedSystemInfo;
    }
    
    try {
      // Use faster, simpler commands
      let chip = 'Unknown';
      let ram = 'Unknown';
      let os = 'Unknown';
      
      try {
        // Try to get chip info
        const chipInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8', timeout: 2000 }).trim();
        if (chipInfo) chip = chipInfo;
      } catch (e) {
        // Fallback to system_profiler for chip
        try {
          const hwInfo = execSync('system_profiler SPHardwareDataType | grep -E "(Chip|Processor)"', { encoding: 'utf8', timeout: 3000 });
          const match = hwInfo.match(/(Chip|Processor Name): (.+)/);
          if (match) chip = match[2].trim();
        } catch (e2) { /* ignore */ }
      }
      
      try {
        // Get RAM info
        const ramBytes = execSync('sysctl -n hw.memsize', { encoding: 'utf8', timeout: 1000 }).trim();
        if (ramBytes) {
          const ramGB = Math.round(parseInt(ramBytes) / (1024 * 1024 * 1024));
          ram = `${ramGB} GB`;
        }
      } catch (e) { /* ignore */ }
      
      try {
        // Get OS info
        const osInfo = execSync('sw_vers -productName && sw_vers -productVersion', { encoding: 'utf8', timeout: 2000 });
        os = osInfo.replace('\n', ' ').trim();
      } catch (e) { /* ignore */ }
      
      this.cachedSystemInfo = {
        chip,
        graphics: 'Integrated',
        ram,
        os
      };
      
      return this.cachedSystemInfo;
    } catch (error) {
      logger.error('Error getting system info:', error.message);
      this.cachedSystemInfo = {
        chip: 'Unknown',
        graphics: 'Unknown',
        ram: 'Unknown', 
        os: 'Unknown'
      };
      return this.cachedSystemInfo;
    }
  }

  formatCreatedAt() {
    return new Date().toISOString();
  }

  async checkOllamaHealth() {
    try {
      logger.log('Checking Ollama health...');
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}`);
      }
      
      logger.log('Ollama health check passed');
    } catch (error) {
      logger.error('Ollama health check failed:', error.message);
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new Error('Ollama service is not responding. Please restart Ollama with: sudo pkill -9 ollama && ollama serve &');
      } else if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Ollama service is not running. Please start Ollama with: ollama serve &');
      } else {
        throw new Error(`Ollama service error: ${error.message}. Try restarting Ollama.`);
      }
    }
  }
}

export default CombinedSearchScorer;
