#!/usr/bin/env node
// test-fabric.mjs - Test Fabric prompt enhancement + Ollama answer
// Usage: node test-fabric.mjs "prompt" [ollama-model] [collection-name]
// Example: node test-fabric.mjs "find insurance details" qwen2:1.5b Family-Documents

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { execFile } from 'child_process';

// Load .env-aips from known locations
const macEnv = '/Users/Shared/AIPrivateSearch/.env-aips';
const ubuntuEnv = '/webs/AIPrivateSearch/.env-aips';
if (existsSync(macEnv)) {
  dotenv.config({ path: macEnv });
} else if (existsSync(ubuntuEnv)) {
  dotenv.config({ path: ubuntuEnv });
}

const FABRIC_URL = process.env.FABRIC_URL;
const FABRIC_API_KEY = process.env.FABRIC_API_KEY;
const ENHANCE_MODEL = 'claude-haiku-4-5';
const OLLAMA_PATH = '/Users/Shared/AIPrivateSearch/ollama';
const OLLAMA_URL = 'http://localhost:11434';

const rawPrompt = process.argv[2];
const ollamaModel = process.argv[3] || 'qwen2:1.5b';
const collectionArg = process.argv[4];
const collection = (collectionArg && collectionArg !== 'null') ? collectionArg : null;
const patternName = collection ? `enhance_${collection}` : 'improve_prompt';

if (!rawPrompt) {
  console.error('Usage: node test-fabric.mjs "your prompt" [collection-name] [ollama-model]');
  process.exit(1);
}

if (!FABRIC_URL || !FABRIC_API_KEY) {
  console.error('Missing FABRIC_URL or FABRIC_API_KEY in .env-aips');
  process.exit(1);
}

console.log(`\nFabric URL:    ${FABRIC_URL}`);
console.log(`Pattern:       ${patternName}`);
console.log(`Enhance Model: ${ENHANCE_MODEL}`);
console.log(`Ollama Model:  ${ollamaModel}`);
console.log(`Raw prompt:    ${rawPrompt}\n`);

// Check pattern exists
console.log('Checking pattern exists...');
const existsRes = await fetch(`${FABRIC_URL}/patterns/exists/${patternName}`, {
  headers: { 'X-API-Key': FABRIC_API_KEY }
});

if (!existsRes.ok) {
  console.warn(`Pattern "${patternName}" not found — using improve_prompt fallback`);
}

// Collect SSE response
async function collectSSE(res) {
  let result = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    const lines = text.split('\n').filter(Boolean);
    for (const line of lines) {
      const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === 'content' && parsed.content) result += parsed.content;
        if (parsed.type === 'error') throw new Error(parsed.content);
      } catch {
        // skip non-JSON lines
      }
    }
  }
  return result;
}

// Step 1: Fabric enhancement
console.log('Step 1: Sending to Fabric...\n');
const fabricStart = Date.now();

const chatRes = await fetch(`${FABRIC_URL}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': FABRIC_API_KEY
  },
  body: JSON.stringify({
    prompts: [{
      userInput: rawPrompt,
      patternName: existsRes.ok ? patternName : 'improve_prompt',
      vendor: 'Anthropic',
      model: ENHANCE_MODEL,
      temperature: 0.7
    }]
  })
});

if (!chatRes.ok) {
  console.error(`Fabric error: ${chatRes.status} ${await chatRes.text()}`);
  process.exit(1);
}

const enhanced = await collectSSE(chatRes);
const fabricElapsed = ((Date.now() - fabricStart) / 1000).toFixed(2);

console.log('Enhanced prompt:');
console.log('─'.repeat(60));
console.log(enhanced);
console.log('─'.repeat(60));
console.log(`Fabric time: ${fabricElapsed}s\n`);

if (!enhanced.trim()) {
  console.error('Empty enhanced prompt — skipping Ollama step');
  process.exit(1);
}

// Step 2: Ollama answer
console.log(`Step 2: Sending enhanced prompt to Ollama (${ollamaModel})...\n`);
const ollamaStart = Date.now();

const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: ollamaModel, prompt: enhanced, stream: false })
});

if (!ollamaRes.ok) {
  console.warn(`Ollama API returned ${ollamaRes.status} — trying direct execution`);
  const answer = await new Promise((resolve, reject) => {
    const proc = execFile(OLLAMA_PATH, ['run', ollamaModel], (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
    proc.stdin.write(enhanced);
    proc.stdin.end();
  });
  const ollamaElapsed = ((Date.now() - ollamaStart) / 1000).toFixed(2);
  console.log('Ollama answer:');
  console.log('─'.repeat(60));
  console.log(answer);
  console.log('─'.repeat(60));
  console.log(`Ollama time: ${ollamaElapsed}s`);
  console.log(`Total time:  ${(parseFloat(fabricElapsed) + parseFloat(ollamaElapsed)).toFixed(2)}s`);
} else {
  const ollamaData = await ollamaRes.json();
  const ollamaElapsed = ((Date.now() - ollamaStart) / 1000).toFixed(2);

  console.log('Ollama answer:');
  console.log('─'.repeat(60));
  console.log(ollamaData.response);
  console.log('─'.repeat(60));
  console.log(`Ollama time: ${ollamaElapsed}s`);
  console.log(`Total time:  ${((parseFloat(fabricElapsed) + parseFloat(ollamaElapsed))).toFixed(2)}s`);
}

