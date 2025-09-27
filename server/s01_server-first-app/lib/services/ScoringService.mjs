import { Ollama } from 'ollama';
import { logger } from '../../../../shared/utils/logger.mjs';
import fs from 'fs';
import path from 'path';

class ScoringService {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.scoreSettings = this.loadScoreSettings();
  }

  loadScoreSettings() {
    const configPath = path.join(process.cwd(), '..', '..', 'client', 'c01_client-first-app', 'config', 'score-settings');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const settings = {};
    config['score-settings'].forEach(item => {
      Object.assign(settings, item);
    });
    return settings;
  }

  async score(query, answer, scoreModel, temperature = 0.1, context = 2048) {
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

      const res = await this.ollama.generate({
        model: scoreModel,
        prompt: scoringPrompt,
        stream: false,
        options: {
          temperature: temperature,
          num_ctx: context,
          num_predict: 200
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
          context_size: context,
          temperature: temperature,
          max_tokens: 200
        }
      };
    } catch (error) {
      logger.error('Error in scoring method:', error.message);
      
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
      logger.log('Raw scoring text:', text);
      
      const scoreObj = {
        accuracy: null,
        relevance: null,
        organization: null,
        total: null,
        overallComments: 'Scores extracted from model response'
      };

      // Look for lines with accuracy, relevance, organization and extract numbers
      const lines = text.toLowerCase().split('\n');
      let accuracy = null, relevance = null, organization = null;
      
      for (const line of lines) {
        const num = line.match(/[1-3]/)?.[0];
        if (num) {
          if (line.includes('accuracy')) accuracy = Number(num);
          else if (line.includes('relevance')) relevance = Number(num);
          else if (line.includes('organization')) organization = Number(num);
        }
      }
      
      // Fallback: extract first 3 numbers if specific parsing failed
      if (accuracy === null || relevance === null || organization === null) {
        const allNumbers = text.match(/[1-3]/g);
        logger.log('Fallback - Found numbers 1-3:', allNumbers);
        if (allNumbers && allNumbers.length >= 3) {
          accuracy = accuracy || Number(allNumbers[0]);
          relevance = relevance || Number(allNumbers[1]);
          organization = organization || Number(allNumbers[2]);
        }
      }
      
      if (accuracy && relevance && organization) {
        scoreObj.accuracy = accuracy;
        scoreObj.relevance = relevance;
        scoreObj.organization = organization;
        
        // Calculate weighted score
        const rawScore = (3 * accuracy) + (2 * relevance) + (1 * organization);
        scoreObj.total = Math.round((rawScore / 18) * 100);
        
        logger.log(`Parsed scores: A=${accuracy}, R=${relevance}, O=${organization}`);
        logger.log(`Calculation: (3×${accuracy}) + (2×${relevance}) + (1×${organization}) = ${rawScore}`);
        logger.log(`Percentage: ${rawScore}/18 × 100 = ${scoreObj.total}%`);
      }
      
      return scoreObj;
    } catch (error) {
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
}

export default ScoringService;