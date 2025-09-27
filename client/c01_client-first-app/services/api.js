import { logger } from '../shared/logger.js';

const API_ROOT = 'http://localhost:3001';

// Helper function for API response handling
async function handleApiResponse(res) {
  if (!res.ok) {
    const errorText = await res.text();
    // logger sanitizes all inputs to prevent log injection
    logger.error(`Server returned ${res.status}:`, errorText);
    throw new Error(`Server error: ${res.status} - ${errorText}`);
  }
  return res.json();
}

export async function search(query, score = false, model = null, temperature = 0.3, context = 0.3, systemPrompt = null, systemPromptName = null, tokenLimit = null, sourceType = null, testCode = null, collection = null, showChunks = false, scoreModel = null, addMetaPrompt = false, searchType = null) {
  const res = await window.csrfManager.fetch(`${API_ROOT}/api/search`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, collection, showChunks, scoreModel, addMetaPrompt, searchType })
  });
  
  return handleApiResponse(res);
}

export async function getModels() {
  const res = await window.csrfManager.fetch(`${API_ROOT}/api/models`);
  return handleApiResponse(res);
}
