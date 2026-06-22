 
 
export class OllamaService {
  constructor() {
    this.baseURL = 'http://localhost:11434';
  }

  async generateText(prompt, model = 'qwen2:1.5b') {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          think: false
        })
      });

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }
}