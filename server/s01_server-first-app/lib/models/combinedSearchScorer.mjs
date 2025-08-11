import { Ollama } from 'ollama';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class CombinedSearchScorer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.searchModel = 'qwen2:0.5b';
    this.scoreSettings = this.#loadScoreSettings();
  }

  #loadScoreSettings() {
    try {
      const configPath = path.join(process.cwd(), '..', '..', 'client', 'c01_client-first-app', 'config', 'score-settings');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const settings = {};
      config['score-settings'].forEach(item => {
        Object.assign(settings, item);
      });
      return settings;
    } catch (error) {
      console.error('Error loading score settings:', error);
      return {
        model: 'gemma2:2b-instruct-q4_0',
        temperature: 0.3,
        context: 4096,
        maxtokens: 500
      };
    }
  }

  /* public */
  async process(query, enableScoring = true, model = null, temperature = 0.3, context = 0.3, systemPrompt = null, systemPromptName = null, tokenLimit = null, sourceType = null, testCode = null) {
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
        const scoreResult = await this.#score(query, searchResponse.response, temperature, context);
        result.scores = scoreResult.scores;
        result.metrics.scoring = scoreResult.metrics;
        
        // Retry once if no scores were obtained
        if (result.scores && result.scores.accuracy === null && result.scores.relevance === null && result.scores.organization === null) {
          console.log('No scores obtained, retrying once...');
          const retryResult = await this.#score(query, searchResponse.response, temperature, context);
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
      console.error('Error in process method:', error);
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
          temperature: temperature
        }
      };
    } catch (error) {
      console.error('Error in search method:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async #score(query, answer, temperature = 0.3, context = 0.3) {
    try {
      console.log('Starting scoring process...');
      
      const scoringPrompt = `### Scoring Criteria Definitions
-##Accurate (1-5)
The degree to which the response contains correct, verifiable information supported by evidence or widely accepted knowledge.

Score 5: Entirely accurate with no errors. All information is verifiable and precisely addresses requirements.
Score 4: Highly accurate with minimal errors that don't impact overall value.
Score 3: Generally accurate with a few minor errors or slightly unsupported assertions.
Score 2: Mixed accuracy with noticeable errors or unverifiable claims alongside correct information.
Score 1: Predominantly inaccurate with major factual errors or fabrications.

-##Relevant (1-5)
The extent to which the response directly addresses the prompt and includes necessary information.

Score 5: Answer fully addresses the prompt, is concise, with minimal unnecessary information.
Score 4: Response addresses the core of the prompt with little tangential information.
Score 3: Response mostly addresses the prompt but includes some unnecessary information.
Score 2: Response partially addresses the prompt with significant omissions or irrelevant content.
Score 1: Response barely addresses or misses the prompt entirely.

-##Organized (1-5)
The logical structure, organization, and flow of the response.

Score 5: Exceptionally clear, logically organized, with perfect flow between ideas.
Score 4: Very clear structure with strong logical flow throughout.
Score 3: Generally clear organization with a few awkward transitions or minor issues.
Score 2: Somewhat organized but with noticeable logical gaps or confusing structure.
Score 1: Disorganized, incoherent, or lacks any clear structure.

### Instructions
1. Evaluate the response based on the three criteria.
2. Assign a score from 1 to 5 for each criterion.
3. Provide a brief justification for each score.
4. If a criterion is not applicable, state this and assign 0.
5. Use EXACTLY the following format (single line **Accurate** etc.).

### Evaluation for Response

Original Query: "${query}"

Response to Evaluate: "${answer}"

**Accurate**: [Score]
Justification: [Your reasoning]

**Relevant**: [Score]
Justification: [Your reasoning]

**Organized**: [Score]
Justification: [Your reasoning]

**Total Score**: [Total Score]
Overall Comments: [Optional brief summary or additional notes]

Please provide the evaluation in this exact format.`;

      const res = await this.ollama.generate({
        model: this.scoreSettings.model,
        prompt: scoringPrompt,
        stream: false,
        options: {
          temperature: this.scoreSettings.temperature,
          num_ctx: this.scoreSettings.context,
          num_predict: this.scoreSettings.maxtokens
        }
      });

      console.log('Scoring model response received, parsing...');
      const scores = this.#parseScores(res.response);
      console.log('Scoring completed successfully:', scores);
      
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
      console.error('Error in scoring method:', error);
      console.error('Query:', query);
      console.error('Answer length:', answer?.length || 'undefined');
      
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
      const scoreObj = {
        accuracy: null,
        relevance: null,
        organization: null,
        total: null,
        justifications: { accuracy: '', relevance: '', organization: '' },
        overallComments: ''
      };

      const lines = text.split('\n').map(l => l.trim());

      let current = null;
      for (const line of lines) {
        if (line.startsWith('**Accurate**')) {
          scoreObj.accuracy = this.#extract(line);
          current = 'accuracy';
        } else if (line.startsWith('**Relevant**')) {
          scoreObj.relevance = this.#extract(line);
          current = 'relevance';
        } else if (line.startsWith('**Organized**')) {
          scoreObj.organization = this.#extract(line);
          current = 'organization';
        } else if (line.startsWith('**Total Score**')) {
          scoreObj.total = this.#extract(line);
          current = null;
        } else if (line.startsWith('Overall Comments:')) {
          scoreObj.overallComments = line.replace('Overall Comments:', '').trim();
          current = null;
        } else if (line.startsWith('Justification:') && current) {
          scoreObj.justifications[current] = line.replace('Justification:', '').trim();
        }
      }

      if (scoreObj.total === null &&
          scoreObj.accuracy && scoreObj.relevance && scoreObj.organization) {
        const rawScore = (3 * scoreObj.accuracy) + (2 * scoreObj.relevance) + (1 * scoreObj.organization);
        scoreObj.total = Math.round((rawScore / 30) * 100);
      }
      
      return scoreObj;
    } catch (error) {
      console.error('Error parsing scores:', error);
      console.error('Raw text to parse:', text);
      
      return {
        accuracy: null,
        relevance: null,
        organization: null,
        total: null,
        justifications: { accuracy: '', relevance: '', organization: '' },
        overallComments: `Parse error: ${error.message}`,
        error: error.message
      };
    }
  }

  #extract(line) {
    const m = line.match(/\b([0-5])\b/);
    return m ? Number(m[1]) : null;
  }

  #generatePcCode() {
    try {
      const serial = execSync('system_profiler SPHardwareDataType | grep "Serial Number" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      if (serial && serial.length >= 6) {
        return serial.substring(0, 3) + serial.substring(serial.length - 3);
      }
      return 'UNKNOWN';
    } catch (error) {
      console.error('Error generating PcCode:', error.message);
      return 'ERROR';
    }
  }

  #getSystemInfo() {
    try {
      let chip = execSync('system_profiler SPHardwareDataType | grep "Chip" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      if (!chip) {
        chip = execSync('system_profiler SPHardwareDataType | grep "Processor" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      }
      const graphics = execSync('system_profiler SPDisplaysDataType | grep "Chipset Model" | head -1 | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      const ram = execSync('system_profiler SPHardwareDataType | grep "Memory" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      const os = execSync('sw_vers -productName && sw_vers -productVersion', { encoding: 'utf8' }).replace('\n', ' ').trim();
      
      return {
        chip: chip || 'Unknown',
        graphics: graphics || 'Unknown', 
        ram: ram || 'Unknown',
        os: os || 'Unknown'
      };
    } catch (error) {
      console.error('Error getting system info:', error.message);
      return {
        chip: 'Error',
        graphics: 'Error',
        ram: 'Error', 
        os: 'Error'
      };
    }
  }

  #formatCreatedAt() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  }
}

export default CombinedSearchScorer;
