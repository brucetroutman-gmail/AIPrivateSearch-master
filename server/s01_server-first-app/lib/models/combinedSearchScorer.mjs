import { Ollama } from 'ollama';
import { execSync } from 'child_process';

class CombinedSearchScorer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.searchModel = 'qwen2:0.5b';
    this.scoreModel  = 'gemma2:2b-instruct-q4_0';
  }

  /* public */
  async process(query, enableScoring = true, model = null) {
    try {
      const searchModel = model || this.searchModel;
      const searchResponse = await this.#search(query, searchModel);
      const result = {
        query,
        response: searchResponse.response,
        timestamp: new Date().toISOString(),
        pcCode: this.#generatePcCode(),
        scores: null,
        metrics: {
          search: searchResponse.metrics
        }
      };

      if (enableScoring) {
        const scoreResult = await this.#score(query, searchResponse.response);
        result.scores = scoreResult.scores;
        result.metrics.scoring = scoreResult.metrics;
        
        // Retry once if no scores were obtained
        if (result.scores && result.scores.accuracy === null && result.scores.relevance === null && result.scores.organization === null) {
          console.log('No scores obtained, retrying once...');
          const retryResult = await this.#score(query, searchResponse.response);
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
  async #search(query, model = this.searchModel) {
    try {
      const res = await this.ollama.generate({
        model: model,
        prompt: query,
        stream: false
      });
      return {
        response: res.response,
        metrics: {
          model: res.model,
          total_duration: res.total_duration,
          load_duration: res.load_duration,
          prompt_eval_count: res.prompt_eval_count,
          prompt_eval_duration: res.prompt_eval_duration,
          eval_count: res.eval_count,
          eval_duration: res.eval_duration
        }
      };
    } catch (error) {
      console.error('Error in search method:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async #score(query, answer) {
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
        model: this.scoreModel,
        prompt: scoringPrompt,
        stream: false
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
          eval_duration: res.eval_duration
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
        scoreObj.total = (3 * scoreObj.accuracy) + (2 * scoreObj.relevance) + (1 * scoreObj.organization);
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
      console.log('Attempting to get Mac serial number...');
      
      const rawOutput = execSync('system_profiler SPHardwareDataType', { encoding: 'utf8' });
      console.log('Raw system_profiler output:', rawOutput.substring(0, 500));
      
      const serial = execSync('system_profiler SPHardwareDataType | grep "Serial Number" | sed "s/.*: //"', { encoding: 'utf8' }).trim();
      console.log('Extracted serial:', serial, 'Length:', serial.length);
      
      if (serial && serial.length >= 6) {
        const pcCode = serial.substring(0, 3) + serial.substring(serial.length - 3);
        console.log('Generated PcCode:', pcCode);
        return pcCode;
      }
      console.log('Serial too short or empty, returning UNKNOWN');
      return 'UNKNOWN';
    } catch (error) {
      console.error('Error generating PcCode:', error.message);
      console.error('Error stack:', error.stack);
      return 'ERROR';
    }
  }
}

export default CombinedSearchScorer;
