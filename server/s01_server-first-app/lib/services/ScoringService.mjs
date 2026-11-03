 
 
import { Ollama } from 'ollama';
import { logger } from '../../../../shared/utils/logger.mjs';

class ScoringService {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async score(query, answer, scoreModel, temperature = 0.1, context = 2048, chunks = null) {
    try {
      logger.log('Starting scoring process');
      
      if (!scoreModel) {
        throw new Error('Score model is required for scoring');
      }

      // Fix A: show the judge the full retrieved chunk set (capped to protect context),
      // not just the first 5, so its "unavailable-but-present" rule can actually fire.
      const MAX_SCORING_CHUNKS = 12;
      const chunkText = (c) => (typeof c === 'string' ? c : c.excerpt || c.content || '');
      const sourceSection = chunks && chunks.length
        ? `\nSOURCE DOCUMENTS (retrieved chunks):\n${chunks.slice(0, MAX_SCORING_CHUNKS).map((c, i) => `[${i+1}] ${chunkText(c)}`.trim()).join('\n---\n')}\n`
        : '';

      const scoringPrompt = `Evaluate this answer using a 1-3 scale where:
1 = Poor/Incorrect
2 = Adequate/Mostly correct  
3 = Excellent/Completely correct

Query: ${query}
${sourceSection}
Answer: ${answer}

IMPORTANT RULES:
- If the answer is fewer than 15 words, or is a non-answer (e.g. "yes", "no", a single word, or clearly incomplete), score Accuracy=1 and Relevance=1.
- If source documents are provided, check whether the answer correctly reflects what is in those sources. An answer claiming information is unavailable when the sources clearly contain it must score Accuracy=1.${sourceSection ? '\n- Base your Accuracy score on whether the answer matches the source documents above.' : ''}

Rate each criterion (1-3):
Accuracy (factual correctness): 
Relevance (addresses the query): 
Organization (clear structure): 

Respond with only three numbers, one per line.`;

      const res = await this.ollama.chat({
        model: scoreModel,
        messages: [{ role: 'user', content: scoringPrompt }],
        stream: false,
        think: false,
        options: {
          temperature: temperature,
          num_ctx: chunks && chunks.length ? 8192 : context,
          num_predict: 200
        }
      });

      logger.log('Scoring model response received, parsing');
      const scores = this.parseScores(res.message?.content || '');

      // Fix B: deterministic refusal guard. The LLM judge has been observed to award a
      // perfect score to answers that claim "no information" even when the retrieved
      // chunks plainly contain the answer. This override does not trust the judge: if the
      // answer is a refusal AND the chunks contain the query's key terms, force A=1, R=1.
      this.applyRefusalGuard(scores, query, answer, chunks);

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

  /**
   * Deterministic override for refusal/"no information" answers.
   *
   * The LLM judge cannot be relied on to follow its own "unavailable-but-present"
   * rule, so this method enforces it with no model involvement:
   *   - If the answer is a refusal ("there is no information", "not in the provided
   *     sources", "cannot find", etc.), AND
   *   - the retrieved chunks contain the significant terms of the query,
   * then the answer is factually wrong (the data was there) and we clamp
   * Accuracy=1 and Relevance=1, recomputing the weighted total to match.
   *
   * Organization is left untouched — a well-formatted refusal is still well-formatted.
   * Mutates `scores` in place.
   */
  applyRefusalGuard(scores, query, answer, chunks) {
    try {
      if (!scores || scores.accuracy === null) return; // nothing parsed; leave as-is
      if (!chunks || !chunks.length) return;            // no sources to contradict a refusal

      // Strip the appended "--- Source Documents" footer before measuring the answer, so a
      // long source list can't inflate the length and the length gate reflects real content.
      const answerText = String(answer || '').split(/\n+---\n+\*\*Source Documents/i)[0];

      // Length gate: a genuine refusal is short ("there is no information ...").
      // A long answer that merely opens with a refusal-sounding hedge (e.g. "the documents
      // do not contain a single consolidated comparison, however ...") and then answers
      // correctly must NOT be clamped — let the judge score the substantive content.
      // Observed true refusals are <150 chars; false-positive hedges run into the thousands.
      const REFUSAL_MAX_LEN = 400;
      if (answerText.trim().length > REFUSAL_MAX_LEN) return;

      const refusalPatterns = [
        /there (?:is|are|was|were) no (?:information|data|mention|record|details?)/i,
        // "there are no <X> provided/found/available in the sources" — X is any noun phrase,
        // e.g. "there are no durable power of attorney documents provided in the given sources".
        /there (?:is|are|was|were) no\b[^.?!]*\b(?:provided|found|available|present|mentioned|listed|included)\b[^.?!]*\b(?:sources?|documents?|context|data|records?)\b/i,
        /\bno (?:information|data|mention|records?|details?)\b.*\b(?:available|found|provided|in the (?:sources?|documents?|context))/i,
        /(?:does|do|did) not (?:contain|include|have|mention|provide)/i,
        /(?:is|are) not (?:available|present|found|mentioned) in the (?:provided )?(?:sources?|documents?|context)/i,
        /(?:cannot|can't|could not|couldn't|unable to) (?:find|locate|determine|answer)/i,
        /\bnot (?:specified|stated|provided|mentioned)\b/i,
        /no (?:relevant )?(?:information|details?) (?:about|regarding|on)\b/i
      ];
      const isRefusal = refusalPatterns.some((re) => re.test(answerText));
      if (!isRefusal) return;

      // Build the combined chunk text to test whether the sources actually held the answer.
      const chunkText = (c) => (typeof c === 'string' ? c : c.excerpt || c.content || '');
      const haystack = chunks.map(chunkText).join(' \n ').toLowerCase();
      if (!haystack.trim()) return;

      // Significant query terms: drop stopwords and short tokens so we test real content words.
      const STOP = new Set(['the','a','an','and','or','of','to','in','on','for','is','are','was','were',
        'what','which','who','whom','whose','when','where','why','how','does','do','did','find','show',
        'list','about','with','that','this','these','those','from','by','at','as','it','its','their',
        'has','have','had','be','been','being','can','could','would','should','will','shall','may','might']);
      const terms = (query || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !STOP.has(t));

      if (terms.length === 0) return;

      const present = terms.filter((t) => haystack.includes(t));
      const coverage = present.length / terms.length;

      // Require that most of the meaningful query terms appear in the sources before
      // concluding the refusal is wrong. Threshold is conservative to avoid false clamps.
      if (coverage < 0.6) return;

      logger.log(`[RefusalGuard] Refusal answer contradicted by sources ` +
        `(term coverage ${present.length}/${terms.length}). Clamping Accuracy=1, Relevance=1.`);

      scores.accuracy = 1;
      scores.relevance = 1;
      const org = scores.organization || 1;
      const rawScore = (4 * 1) + (3 * 1) + (1 * org);
      scores.total = Math.round((rawScore / 24) * 100);
      scores.overallComments = (scores.overallComments ? scores.overallComments + ' | ' : '') +
        'RefusalGuard: answer claimed information was unavailable but sources contained the query terms.';
    } catch (error) {
      logger.error('[RefusalGuard] error (left judge scores unchanged):', error.message);
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

      // Extract the score for a labelled criterion line. The judge is asked to emit
      // "<Label>: <digit>", so the score is the FIRST 1-3 digit after the colon. Taking the
      // first (not last) digit after the colon avoids both failure modes: digits embedded in
      // the label before the colon ("Accuracy (1-3 scale): 3") and trailing scale references
      // after the score ("2 out of 3", "2/3"). When there is no colon we take the first 1-3
      // digit on the line, since the score trails the label word ("Accuracy 3").
      const extractScore = (line) => {
        const afterColon = line.includes(':') ? line.slice(line.lastIndexOf(':') + 1) : line;
        // Drop a trailing "out of N" / "/ N" so the denominator can't be read as the score.
        const cleaned = afterColon.replace(/\b(?:out\s+of|\/)\s*[0-9]+/g, ' ');
        const m = cleaned.match(/[1-3]/);
        return m ? Number(m[0]) : null;
      };

      // Look for lines with accuracy, relevance, organization and extract their scores.
      const lines = text.toLowerCase().split('\n');
      let accuracy = null, relevance = null, organization = null;

      for (const line of lines) {
        // Skip rubric/scale definition lines ("1 = Poor", "3 = Excellent") so the scale
        // legend is never mistaken for an actual score.
        if (/^\s*[1-3]\s*=/.test(line)) continue;

        if (line.includes('accuracy') && accuracy === null) {
          const s = extractScore(line);
          if (s !== null) accuracy = s;
        } else if (line.includes('relevance') && relevance === null) {
          const s = extractScore(line);
          if (s !== null) relevance = s;
        } else if (line.includes('organization') && organization === null) {
          const s = extractScore(line);
          if (s !== null) organization = s;
        }
      }

      // Fallback: the judge was asked for "three numbers, one per line" with no labels.
      // Collect at most one score digit from each non-scale line and use the first three,
      // rather than grabbing the first three digits from anywhere (which could pick up
      // digits inside prose or the scale legend).
      if (accuracy === null || relevance === null || organization === null) {
        const lineScores = lines
          .filter((line) => !/^\s*[1-3]\s*=/.test(line))
          .map((line) => {
            const m = line.match(/[1-3]/);
            return m ? Number(m[0]) : null;
          })
          .filter((n) => n !== null);
        logger.log('Fallback - per-line scores 1-3:', lineScores);
        if (lineScores.length >= 3) {
          accuracy = accuracy ?? lineScores[0];
          relevance = relevance ?? lineScores[1];
          organization = organization ?? lineScores[2];
        }
      }
      
      if (accuracy && relevance && organization) {
        scoreObj.accuracy = accuracy;
        scoreObj.relevance = relevance;
        scoreObj.organization = organization;
        
        // Calculate weighted score: Accuracy 4x, Relevance 3x, Organization 1x (max = 24)
        const rawScore = (4 * accuracy) + (3 * relevance) + (1 * organization);
        scoreObj.total = Math.round((rawScore / 24) * 100);
        
        logger.log(`Parsed scores: A=${accuracy}, R=${relevance}, O=${organization}`);
        logger.log(`Calculation: (4×${accuracy}) + (3×${relevance}) + (1×${organization}) = ${rawScore}`);
        logger.log(`Percentage: ${rawScore}/24 × 100 = ${scoreObj.total}%`);
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