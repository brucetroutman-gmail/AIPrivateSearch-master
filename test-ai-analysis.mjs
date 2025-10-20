// Test AI analysis
import { OllamaService } from './server/s01_server-first-app/lib/services/OllamaService.mjs';
import fs from 'fs';

async function testAI() {
  try {
    const ollamaService = new OllamaService();
    const content = fs.readFileSync('/Users/Shared/AIPrivateSearch/sources/local-documents/USA-History/Declaration of Independence.md', 'utf-8');
    
    const aiPrompt = `Analyze this document and extract specific information. Respond with ONLY the requested information, no extra text:

Document: Declaration of Independence.md
Content: ${content.substring(0, 3000)}

Extract:
1. Author or creator:
2. Key people/organizations mentioned:
3. Important dates mentioned:
4. Key phrases (2-3 most important):
5. Main action items or requirements:
6. Brief summary (1-2 sentences):`;
    
    console.log('Sending prompt to AI...\n');
    const aiResponse = await ollamaService.generateText(aiPrompt, 'llama3.2:3b');
    console.log('AI Response:');
    console.log('=' * 50);
    console.log(aiResponse);
    console.log('=' * 50);
    
    // Test parsing
    const lines = aiResponse.split('\n').filter(line => line.trim());
    console.log('\nParsed lines:');
    lines.forEach((line, i) => {
      console.log(`${i}: "${line}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAI();