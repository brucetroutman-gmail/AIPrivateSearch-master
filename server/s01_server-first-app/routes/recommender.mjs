// Recommender routes (step iii). Advisory reads plus a local-store write, all backed by the
// machine-local recommender store — never the remote DB (a testing sink only; unavailable in
// normal use). Origin + CSRF validation are applied at registration in server.mjs (CSRF
// skips GET).

import express from 'express';
import { adviseContext, recommendModels, recommendModelsForCollection } from '../lib/utils/modelRecommender.mjs';
import { recordRun, normalizeRun } from '../lib/utils/recommenderStore.mjs';
import { requireAuthWithRateLimit } from '../middleware/auth.mjs';

const router = express.Router();

// GET /api/recommender/context?model=gemma4:12b&requestedContext=32768
// Advise (and optionally clamp) a context size for a model against this machine's observed
// RAM headroom. Grounded in measured resident MB, never an estimate.
router.get('/context', async (req, res) => {
  try {
    const { model, requestedContext, ramBudgetMB } = req.query;
    if (!model) {
      return res.status(400).json({ error: 'model query parameter is required' });
    }
    const result = await adviseContext({
      model: String(model),
      requestedContext: requestedContext != null ? Number(requestedContext) : null,
      ramBudgetMB: ramBudgetMB != null ? Number(ramBudgetMB) : null
    });
    res.json(result);
  } catch (error) {
    console.error('[recommender] /context failed:', error);
    res.status(500).json({ error: 'failed to advise context', detail: error.message });
  }
});

// GET /api/recommender/models?collection=Sample_Medical-Practice&topN=2
// Recommend the best-N models for a collection (or all collections when omitted), ranked
// by observed weighted score and filtered to models with a proven-fit context.
router.get('/models', async (req, res) => {
  try {
    const { collection, ramBudgetMB, topN } = req.query;
    const n = topN != null ? Math.max(1, Number(topN) || 2) : 2;
    const budget = ramBudgetMB != null ? Number(ramBudgetMB) : null;
    // A specific collection uses the cold-start fallback (global ranking when the collection
    // has no eligible models yet); no collection returns the full per-collection list.
    const result = collection
      ? await recommendModelsForCollection({ collection: String(collection), ramBudgetMB: budget, topN: n })
      : await recommendModels({ collection: null, ramBudgetMB: budget, topN: n });
    res.json(result);
  } catch (error) {
    console.error('[recommender] /models failed:', error);
    res.status(500).json({ error: 'failed to recommend models', detail: error.message });
  }
});

// POST /api/recommender/record
// body: { model, collection?, digest?, loadedContext?, residentMB?, score? }
// Records one run into the local store (used by the Benchmark button and the legacy search
// page's "database" export). Every field is validated server-side; the client is not trusted.
router.post('/record', requireAuthWithRateLimit(120, 60000), async (req, res) => {
  try {
    const body = req.body || {};
    if (!normalizeRun(body)) {
      return res.status(400).json({ success: false, error: 'nothing usable to record (need a model plus resource data or a collection score)' });
    }
    const result = await recordRun(body);
    if (!result.recorded) {
      return res.status(500).json({ success: false, error: result.reason || 'record failed' });
    }
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[recommender] /record failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
