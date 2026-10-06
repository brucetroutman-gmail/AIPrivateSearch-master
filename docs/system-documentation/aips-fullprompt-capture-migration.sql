-- =====================================================================
-- AIPrivateSearch — Full Prompt Capture: schema migration (REVIEW ONLY)
-- =====================================================================
-- Purpose: add the missing "full prompt" fields to the search record so the
--          DB captures what the model actually received, not just parameters.
--
-- New columns (added to BOTH tables):
--   SystemPromptText   - the resolved system-prompt STRING (not just its name)
--   OriginalPrompt     - the user's query BEFORE query-intelligence improvement
--   QueryWasImproved   - whether the intelligence layer rewrote the query
--   DetectedQueryType  - fact | analysis | creative (from the analyzer)
--   FullPrompt         - the exact assembled prompt string sent to the model
--
-- Already captured (do NOT duplicate):
--   Prompt         = the FINAL (improved) query actually sent
--   Chunks-search  = retrieved document context (JSON)
--   SystemPrompt   = the system-prompt NAME/label
--   Model* params  = temperature, context size, topK, token limit, model
--
-- ---------------------------------------------------------------------
-- IMPORTANT — column order must stay identical across the two tables.
-- The app's transfer-to-testresults route runs:
--     INSERT INTO `searches-testresults` SELECT * FROM `searches`
-- That positional SELECT * requires `searches` and `searches-testresults`
-- to have the SAME columns in the SAME order. Run BOTH ALTER blocks, in the
-- same order, so the two tables stay structurally identical.
--
-- Each new column is appended AFTER an existing column via AFTER <col> to
-- keep ordering deterministic and identical in both tables.
-- Place the prompt/query fields next to the existing Prompt column, and
-- FullPrompt next to the chunks/answer group.
--
-- Backup first:  mysqldump aiprivatesearch searches searches-testresults > backup.sql
-- Review all types/sizes below before running.
-- ---------------------------------------------------------------------

-- =====================================================================
-- Table 1: searches
-- =====================================================================
ALTER TABLE `searches`
  ADD COLUMN `SystemPromptText`  MEDIUMTEXT      NULL AFTER `SystemPrompt`,
  ADD COLUMN `OriginalPrompt`    TEXT            NULL AFTER `Prompt`,
  ADD COLUMN `QueryWasImproved`  TINYINT(1)      NULL AFTER `OriginalPrompt`,
  ADD COLUMN `DetectedQueryType` VARCHAR(32)     NULL AFTER `QueryWasImproved`,
  ADD COLUMN `FullPrompt`        MEDIUMTEXT      NULL AFTER `Answer-search`;

-- =====================================================================
-- Table 2: searches-testresults  (MUST mirror `searches` exactly)
-- =====================================================================
ALTER TABLE `searches-testresults`
  ADD COLUMN `SystemPromptText`  MEDIUMTEXT      NULL AFTER `SystemPrompt`,
  ADD COLUMN `OriginalPrompt`    TEXT            NULL AFTER `Prompt`,
  ADD COLUMN `QueryWasImproved`  TINYINT(1)      NULL AFTER `OriginalPrompt`,
  ADD COLUMN `DetectedQueryType` VARCHAR(32)     NULL AFTER `QueryWasImproved`,
  ADD COLUMN `FullPrompt`        MEDIUMTEXT      NULL AFTER `Answer-search`;

-- ---------------------------------------------------------------------
-- Verify both tables ended up structurally identical (column list + order):
--   SHOW COLUMNS FROM `searches`;
--   SHOW COLUMNS FROM `searches-testresults`;
-- A quick structural diff:
--   SELECT COLUMN_NAME, ORDINAL_POSITION, COLUMN_TYPE
--     FROM INFORMATION_SCHEMA.COLUMNS
--    WHERE TABLE_SCHEMA = 'aiprivatesearch'
--      AND TABLE_NAME IN ('searches','searches-testresults')
--    ORDER BY TABLE_NAME, ORDINAL_POSITION;
-- ---------------------------------------------------------------------

-- Notes on type choices (adjust to taste before running):
--   SystemPromptText / FullPrompt -> MEDIUMTEXT (up to 16 MB) to hold large
--       system prompts and full assembled prompts incl. injected context.
--   OriginalPrompt -> TEXT (query-length).
--   QueryWasImproved -> TINYINT(1) used as a boolean (0/1), NULL if layer not run.
--   DetectedQueryType -> VARCHAR(32) (values: fact | analysis | creative | null).
