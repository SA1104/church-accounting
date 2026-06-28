/**
 * Booza Think Core SDK - AI Provider Abstraction (Phase 7)
 */

class AIProviderInterface {
  constructor(providerId) {
    this.providerId = providerId;
  }

  async generateText(prompt, options = {}) {
    throw new Error('generateText must be implemented by concrete AI provider');
  }

  async generateEmbedding(text) {
    throw new Error('generateEmbedding must be implemented by concrete AI provider');
  }
}

class OpenAIProvider extends AIProviderInterface {
  constructor() {
    super('OpenAI');
  }
  async generateText(prompt, options = {}) {
    console.log(`[AI SDK OpenAI] Requesting text generation: '${prompt.slice(0, 40)}...'`);
    return { provider: 'OpenAI', text: `[OpenAI Stub Response] Evaluated decision metrics.` };
  }
}

class GeminiProvider extends AIProviderInterface {
  constructor() {
    super('Gemini');
  }
  async generateText(prompt, options = {}) {
    console.log(`[AI SDK Gemini] Requesting text generation: '${prompt.slice(0, 40)}...'`);
    return { provider: 'Gemini', text: `[Gemini Stub Response] Analyzed transaction data.` };
  }
}

class ClaudeProvider extends AIProviderInterface {
  constructor() {
    super('Claude');
  }
  async generateText(prompt, options = {}) {
    console.log(`[AI SDK Claude] Requesting text generation: '${prompt.slice(0, 40)}...'`);
    return { provider: 'Claude', text: `[Claude Stub Response] Processed ontology entities.` };
  }
}

class LocalProvider extends AIProviderInterface {
  constructor() {
    super('Local');
  }
}

class MockProvider extends AIProviderInterface {
  constructor() {
    super('Mock');
  }
  async generateText(prompt) {
    return { provider: 'Mock', text: 'Stub response' };
  }
}

module.exports = {
  AIProviderInterface,
  OpenAIProvider,
  GeminiProvider,
  ClaudeProvider,
  LocalProvider,
  MockProvider
};
