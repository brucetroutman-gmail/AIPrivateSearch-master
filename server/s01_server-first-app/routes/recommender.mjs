// Recommender routes (step iii). Read-only advisory endpoints over the observational
// resource + score data captured per run. No writes, so no CSRF requirement; origin
// validation is applied at registration in server.mjs.

import express from 'express';
import { adviseContext, recommendModels, recommendModelsForCollection } from '../lib/utils/modelRecommender.mjs';

const router = express.Router();

// GET /api/recommender/context?model=gemma4:12b&requestedContext=32768&pcCode=G934T7
// Advise (and optionally clamp) a context size for a model against the machine's observed
// RAM headroom. Grounded in measured resident MB, never an estimate.
router.get('/context', async (req, res) => {
  try {
    const { model, requestedContext, pcCode, ramBudgetMB } = req.query;
    if (!model) {
      return res.status(400).json({ error: 'model query parameter is required' });
    }
    const result = await adviseContext({
      model,
      requestedContext: requestedContext != null ? Number(requestedContext) : null,
      pcCode: pcCode || null,
      ramBudgetMB: ramBudgetMB != null ? Number(ramBudgetMB) : null
    });
    res.json(result);
  } catch (error) {
    console.error('[recommender] /context failed:', error);
    res.status(500).json({ error: 'failed to advise context', detail: error.message });
  }
});

// GET /api/recommender/models?collection=Sample_Medical-Practice&pcCode=G934T7&topN=2
// Recommend the best-N models for a collection (or all collections when omitted), ranked
// by observed weighted score and filtered to models with a proven-fit context.
router.get('/models', async (req, res) => {
  try {
    const { collection, pcCode, ramBudgetMB, topN } = req.query;
    const n = topN != null ? Math.max(1, Number(topN)) : 2;
    // A specific collection uses the cold-start fallback (global ranking when the
    // collection has no eligible models yet); no collection returns the full per-collection
    // list unchanged.
    const result = collection
      ? await recommendModelsForCollection({
          collection,
          pcCode: pcCode || null,
          ramBudgetMB: ramBudgetMB != null ? Number(ramBudgetMB) : null,
          topN: n
        })
      : await recommendModels({
          collection: null,
          pcCode: pcCode || null,
          ramBudgetMB: ramBudgetMB != null ? Number(ramBudgetMB) : null,
          topN: n
        });
    res.json(result);
  } catch (error) {
    console.error('[recommender] /models failed:', error);
    res.status(500).json({ error: 'failed to recommend models', detail: error.message });
  }
});

export default router;
