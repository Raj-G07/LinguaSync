import dotenv from 'dotenv';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

dotenv.config({ path: '../.env' }); 

export class LingoMCP {
  private apiKey: string;
  private isConnected: boolean = false;
  private engine: LingoDotDevEngine | null = null;

  constructor() {
    this.apiKey = process.env.LINGODOTDEV_API_KEY || '';
  }

  /**
   * Strictly enforces connection to Lingo.dev.
   * Initializes the real Lingo.dev translation engine.
   */
  async connect(): Promise<void> {
    console.log('[LingoMCP] Initializing connection handshake...');
    
    if (!this.apiKey) {
      throw new Error('FATAL: LINGODOTDEV_API_KEY is missing. Startup aborted.');
    }

    // Initialize real Lingo.dev engine
    try {
      this.engine = new LingoDotDevEngine({ apiKey: this.apiKey });
      this.isConnected = true;
      console.log('[LingoMCP] Secure Link Established. Ready for traffic.');
      console.log('[LingoMCP] Using REAL Lingo.dev runtime translation API');
    } catch (error) {
      throw new Error(`FATAL: Failed to initialize Lingo.dev engine: ${error}`);
    }
  }

  /**
   * Translate text using REAL Lingo.dev runtime translation API
   * Supports arbitrary user input, not limited to dictionary phrases
   */
  async routeText(text: string, sourceLang: string, targetLangs: string[]): Promise<Record<string, string>> {
     if (!this.isConnected || !this.engine) {
       throw new Error('MCP Offline - Lingo.dev engine not initialized');
     }
     
     const results: Record<string, string> = {};
     
     for (const targetLang of targetLangs) {
       console.log(`[Lingo.dev] Runtime translation invoked`);
       console.log(`  sourceLang=${sourceLang}`);
       console.log(`  targetLang=${targetLang}`);
       console.log(`  Input="${text}"`);

       let translatedText: string;

       // Same language - no translation needed
       if (sourceLang === targetLang) {
         translatedText = text;
         console.log(`[Lingo.dev] Same language, returning original`);
       } else {
         try {
           // REAL LINGO.DEV API CALL
           const result = await this.engine.localizeText(text, {
             sourceLocale: sourceLang,
             targetLocale: targetLang
           });

           translatedText = result;
           console.log(`[Lingo.dev] Output="${translatedText}"`);

           // STRICT VALIDATION: Ensure translation actually occurred
           if (translatedText === text) {
             console.error(`[Lingo.dev] ✗✗✗ FALLBACK DETECTED ✗✗✗`);
             console.error(`  Translation output matches input for different languages`);
             console.error(`  sourceLang=${sourceLang}, targetLang=${targetLang}`);
             console.error(`  Input: "${text}"`);
             console.error(`  Output: "${translatedText}"`);
             
             throw new Error(
               `Lingo.dev fallback detected — real translation not executed. ` +
               `Input and output are identical for different languages.`
             );
           }

           // STRICT VALIDATION: Ensure no fallback markers
           if (translatedText.includes('[Translated to') || translatedText.includes('[ERROR')) {
             console.error(`[Lingo.dev] ✗✗✗ FALLBACK MARKER DETECTED ✗✗✗`);
             console.error(`  Output contains fallback markers`);
             console.error(`  Output: "${translatedText}"`);
             
             throw new Error(
               `Lingo.dev fallback detected — output contains placeholder text.`
             );
           }

         } catch (error) {
           console.error(`[Lingo.dev] ✗✗✗ TRANSLATION API ERROR ✗✗✗`);
           console.error(`  Error: ${error}`);
           console.error(`  sourceLang=${sourceLang}, targetLang=${targetLang}`);
           console.error(`  Input: "${text}"`);
           
           // FAIL CLOSED: Do not allow message to be sent with failed translation
           throw new Error(
             `Lingo.dev translation failed: ${error}. ` +
             `System is fail-closed - message will not be delivered.`
           );
         }
       }

       results[targetLang] = translatedText;
     }
     
     return results;
  }
}
