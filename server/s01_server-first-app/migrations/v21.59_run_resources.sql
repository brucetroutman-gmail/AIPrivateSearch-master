-- v21.59 — per-run resource capture columns on `searches`.
-- Adds the real resident footprint, the actually-loaded context window, and the model
-- digest for each run, captured from Ollama /api/ps after the search model runs. These
-- feed the PC/memory-aware recommender: "what did model X actually cost at context C on
-- this PcCode", replacing the analytical KV-cache estimate (measured wrong for gemma4 /
-- qwen3.5). Self-healing — new models accrue data on first use; a re-quantized model
-- gets a new digest so stale rows are not reused.
--
-- Safe to run once. MySQL < 8.0.29 does not support IF NOT EXISTS on ADD COLUMN; if your
-- server rejects it, drop the "IF NOT EXISTS" and run each ALTER once.
--
-- Run:
--   mysql -h 92.112.184.206 -P 3306 -u <rw-user> -p aiprivatesearch < v21.59_run_resources.sql

ALTER TABLE `searches`
  ADD COLUMN IF NOT EXISTS `ResidentMB-search`    INT          NULL COMMENT 'Resident model memory in MB from /api/ps after the search run',
  ADD COLUMN IF NOT EXISTS `LoadedContext-search` INT          NULL COMMENT 'Context window actually loaded by Ollama (post model-max clamp)',
  ADD COLUMN IF NOT EXISTS `ModelDigest-search`   VARCHAR(32)  NULL COMMENT 'Ollama model digest (first 32 chars); changes when the model is re-pulled/re-quantized';

-- Optional: index to speed up recommender lookups by PC + model + context.
-- Keyed on digest so a changed model does not inherit stale rows.
-- CREATE INDEX idx_run_resources ON `searches` (`PcCode`, `ModelName-search`, `ModelDigest-search`, `ModelContextSize-search`);
