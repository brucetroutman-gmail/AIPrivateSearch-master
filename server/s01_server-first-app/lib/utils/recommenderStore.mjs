// Machine-local store for the model/PC-aware recommender.
//
// Data-source policy: the remote MySQL DB is a TESTING sink only (written by the two test
// harness pages). End-user activity — interactive searches, the per-collection Benchmark
// button, and the recommender itself — reads and writes THIS local file and never touches
// the remote DB. In normal use the remote DB is unavailable, so nothing here may depend on it.
//
// What is stored: small running aggregates, not raw rows (no prompts, answers or chunks):
//   resource[model|digest|context] -> runs, max/sum resident MB, lastSeen
//   scores[collection|model]       -> runs, sum/min/max weighted score
// Resource entries are keyed on the model DIGEST so a re-quantized or updated model starts
// fresh instead of inheriting its predecessor's footprint. A model that is deleted simply
// stops being seen; the recommender additionally filters to models Ollama still has.
//
// One file per machine (PcCode in the name) under a dedicated directory that is outside the
// git-tracked data/ tree and outside the release rsync. Writes are serialized in-process and
// atomic (temp file + rename), and an unreadable file is moved aside rather than overwritten.

import path from 'path';
import { secureFs } from './secureFileOps.mjs';
import { DeviceLicenseClient } from '../licensing/device-license-client.mjs';

const STORE_DIR = '/Users/Shared/AIPrivateSearch/recommender';
const SCHEMA_VERSION = 1;

// Sanity bounds for values that arrive from the client. The record endpoint is reachable by
// any authenticated user, so nothing is trusted: out-of-range values are rejected.
const MAX_NAME_LEN = 200;
const MAX_RESIDENT_MB = 1024 * 1024;      // 1 TB, far above any real model footprint
const MAX_CONTEXT = 16 * 1024 * 1024;     // 16M tokens

// Parse a PcRAM string such as "16 GB" / "16GB" / "16384 MB" into megabytes. Returns null
// when it cannot be parsed, so callers fall back rather than trust a bad budget.
export function parseRamToMB(pcRam) {
  if (pcRam == null) return null;
  const match = String(pcRam).trim().match(/([\d.]+)\s*(gb|mb|g|m)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = (match[2] || 'gb').toLowerCase();
  if (unit === 'mb' || unit === 'm') return Math.round(value);
  return Math.round(value * 1024);
}

// ── machine identity ─────────────────────────────────────────────────────────
let machineCache = null;

// This machine's PcCode + RAM, resolved locally (no DB). Only successful lookups are
// cached; the 'Unknown' sentinel is retried next time.
async function getLocalMachine() {
  if (machineCache) return machineCache;
  let pcCode = null;
  let ramMB = null;
  try {
    const info = await new DeviceLicenseClient().getSystemInfo();
    if (info && info.pcCode && info.pcCode !== 'Unknown') pcCode = String(info.pcCode);
    ramMB = parseRamToMB(info && info.systemInfo && info.systemInfo.ram);
  } catch {
    // fall through to the generic 'local' identity
  }
  const machine = { pcCode: pcCode || 'local', ramMB };
  if (pcCode) machineCache = machine;
  return machine;
}

// Filename-safe PcCode: strip everything but [A-Za-z0-9_-] so it can never traverse paths.
function storeFileFor(pcCode) {
  const safe = String(pcCode).replace(/[^A-Za-z0-9_-]/g, '') || 'local';
  return path.join(STORE_DIR, `recommender-${safe}.json`);
}

function emptyStore(pcCode, ramMB) {
  return { schemaVersion: SCHEMA_VERSION, pcCode, pcRamMB: ramMB, updatedAt: null, resource: {}, scores: {} };
}

// ── persistence ──────────────────────────────────────────────────────────────
async function loadStore(machine) {
  const file = storeFileFor(machine.pcCode);
  let raw;
  try {
    raw = await secureFs.readFile(file, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return emptyStore(machine.pcCode, machine.ramMB);
    throw error;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== SCHEMA_VERSION
        || typeof parsed.resource !== 'object' || typeof parsed.scores !== 'object') {
      throw new Error('unexpected store shape');
    }
    return parsed;
  } catch (error) {
    // Never silently overwrite data we could not read: move it aside, start fresh.
    const aside = `${file}.corrupt-${Date.now()}`;
    console.warn(`[recommenderStore] unreadable store (${error.message}); moving to ${path.basename(aside)}`);
    try { await secureFs.rename(file, aside); } catch { /* best effort */ }
    return emptyStore(machine.pcCode, machine.ramMB);
  }
}

async function saveStore(machine, store) {
  const file = storeFileFor(machine.pcCode);
  await secureFs.mkdir(STORE_DIR, { recursive: true });
  const tmp = `${file}.tmp`;
  await secureFs.writeFile(tmp, JSON.stringify(store, null, 2), 'utf8');
  await secureFs.rename(tmp, file); // atomic replace: readers never see a half-written file
}

// Serialize every read-modify-write in this process so concurrent searches cannot interleave
// and lose updates. The chain swallows rejections so one failure never blocks later writes.
let writeChain = Promise.resolve();

function updateStore(mutator) {
  const run = writeChain.then(async () => {
    const machine = await getLocalMachine();
    const store = await loadStore(machine);
    mutator(store);
    store.pcCode = machine.pcCode;
    if (machine.ramMB) store.pcRamMB = machine.ramMB;
    store.updatedAt = new Date().toISOString();
    await saveStore(machine, store);
  });
  writeChain = run.catch(() => {});
  return run;
}

// ── validation ───────────────────────────────────────────────────────────────
function cleanName(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s && s.length <= MAX_NAME_LEN ? s : null;
}

function cleanNumber(value, min, max) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// Validate and normalise one run. Returns null when there is nothing usable to record.
export function normalizeRun(run) {
  const model = cleanName(run && run.model);
  if (!model) return null;
  const collection = cleanName(run.collection);
  const digest = cleanName(run.digest) ? String(run.digest).trim().slice(0, 64) : null;
  const loadedContext = cleanNumber(run.loadedContext, 1, MAX_CONTEXT);
  const residentMB = cleanNumber(run.residentMB, 1, MAX_RESIDENT_MB);
  const score = cleanNumber(run.score, 0, 100);

  const hasResource = residentMB != null && loadedContext != null;
  const hasScore = score != null && collection != null;
  if (!hasResource && !hasScore) return null;
  return { model, collection, digest, loadedContext: Math.round(loadedContext || 0) || null, residentMB: residentMB != null ? Math.round(residentMB) : null, score, hasResource, hasScore };
}

// ── recording ────────────────────────────────────────────────────────────────
// Record one run: a resource observation (always, when captured) and a score observation
// (only for scored runs, i.e. the Benchmark). Best-effort: returns {recorded:false} instead
// of throwing, so persistence can never fail a search.
export async function recordRun(run) {
  const r = normalizeRun(run);
  if (!r) return { recorded: false, reason: 'nothing usable to record' };
  try {
    await updateStore(store => {
      const now = new Date().toISOString();
      if (r.hasResource) {
        const key = `${r.model}|${r.digest || 'nodigest'}|${r.loadedContext}`;
        const e = store.resource[key] || { model: r.model, digest: r.digest, context: r.loadedContext, runs: 0, sumResidentMB: 0, maxResidentMB: 0, lastSeen: null };
        e.runs += 1;
        e.sumResidentMB += r.residentMB;
        e.maxResidentMB = Math.max(e.maxResidentMB, r.residentMB);
        e.lastSeen = now;
        store.resource[key] = e;
      }
      if (r.hasScore) {
        const key = `${r.collection}|${r.model}`;
        const e = store.scores[key] || { collection: r.collection, model: r.model, runs: 0, sumScore: 0, minScore: r.score, maxScore: r.score };
        e.runs += 1;
        e.sumScore += r.score;
        e.minScore = Math.min(e.minScore, r.score);
        e.maxScore = Math.max(e.maxScore, r.score);
        store.scores[key] = e;
      }
    });
    return { recorded: true, resource: r.hasResource, score: r.hasScore };
  } catch (error) {
    console.warn(`[recommenderStore] could not record run: ${error.message}`);
    return { recorded: false, reason: error.message };
  }
}

// ── reading ──────────────────────────────────────────────────────────────────
// Observations shaped for the recommender: the same row shapes the SQL used to return, so
// the ranking/fit logic is unchanged. For each model only its MOST RECENTLY SEEN digest is
// used, so a re-quantized model's old footprint is ignored.
export async function getObservations() {
  const machine = await getLocalMachine();
  let store;
  try {
    store = await loadStore(machine);
  } catch (error) {
    console.warn(`[recommenderStore] could not read store: ${error.message}`);
    store = emptyStore(machine.pcCode, machine.ramMB);
  }

  const latestDigest = new Map(); // model -> { digest, lastSeen }
  for (const e of Object.values(store.resource)) {
    const cur = latestDigest.get(e.model);
    if (!cur || String(e.lastSeen) > String(cur.lastSeen)) latestDigest.set(e.model, { digest: e.digest, lastSeen: e.lastSeen });
  }

  const resourceRows = Object.values(store.resource)
    .filter(e => latestDigest.get(e.model).digest === e.digest)
    .map(e => ({
      model: e.model,
      ctx: e.context,
      runs: e.runs,
      maxResidentMB: e.maxResidentMB,
      avgResidentMB: Math.round(e.sumResidentMB / e.runs),
      digest: e.digest
    }))
    .sort((a, b) => a.model.localeCompare(b.model) || a.ctx - b.ctx);

  const scoreRows = Object.values(store.scores)
    .map(e => ({
      collection: e.collection,
      model: e.model,
      runs: e.runs,
      avgScore: Math.round((e.sumScore / e.runs) * 10) / 10,
      minScore: e.minScore,
      maxScore: e.maxScore
    }))
    .sort((a, b) => a.collection.localeCompare(b.collection) || b.avgScore - a.avgScore);

  return { pcCode: machine.pcCode, pcRamMB: store.pcRamMB || machine.ramMB || null, resourceRows, scoreRows };
}
