export interface LingoConfig {
  apiKey: string;
  projectId?: string;
}

export type LingoStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

export interface TranslationMap {
  [langCode: string]: string;
}

export class LingoMCP {
  private status: LingoStatus = 'disconnected';
  private config: LingoConfig;

  constructor(config: LingoConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    console.log('[LingoMCP] Connecting with key:', this.config.apiKey);
    this.status = 'connecting';
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.config.apiKey) {
          this.status = 'connected';
          console.log('[LingoMCP] Connected');
          resolve();
        } else {
          this.status = 'error';
          reject(new Error('Missing API Key'));
        }
      }, 500);
    });
  }

  translate(text: string, sourceLang: string, targetLangs: string[]): Promise<TranslationMap> {
    // Mock translation logic
    const result: TranslationMap = {};
    targetLangs.forEach(lang => {
      result[lang] = `[${lang}] ${text}`; // Simulated translation
    });
    return Promise.resolve(result);
  }
}

// Client-side dummy functions for the "t" function
export function t(key: string, params?: Record<string, any>): string {
  return `[${key}]`; // In real app, this reads from compiled JSON
}

export const lingo = {
  extract: async () => console.log('Simulating extraction...'),
  compile: async () => console.log('Simulating compilation...')
};
