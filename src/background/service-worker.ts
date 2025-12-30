import { StorageService } from '../services/storage-service';
import { AIService } from '../services/ai-service';
import { TemplateService } from '../services/template-service';

const storage = new StorageService();
const templateService = new TemplateService(storage);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'IMPROVE_DESCRIPTION') {
    handleImproveDescription(message.payload, sendResponse);
    return true;
  }

  if (message.type === 'PROCESS_SELECTION') {
    handleProcessSelection(message.payload, sendResponse);
    return true;
  }

  return false;
});

async function handleImproveDescription(
  payload: { text: string; templateId?: string; length?: 'concise' | 'standard' | 'detailed' },
  sendResponse: (response: { success?: boolean; improvedText?: string; error?: string }) => void,
): Promise<void> {
  try {
    const apiConfig = await storage.getApiConfig();

    if (!apiConfig) {
      sendResponse({
        error: 'API not configured. Please configure the API in the extension popup.',
      });
      return;
    }

    const { endpoint, apiKey, model } = apiConfig;

    if (!endpoint || !apiKey || !model) {
      sendResponse({ error: 'API configuration incomplete. Please check all fields in settings.' });
      return;
    }

    const template = await templateService.getTemplate(payload.templateId);
    const customPrompt = await storage.getCustomPrompt();

    const aiService = new AIService(endpoint, apiKey, model);

    const improvedText = await aiService.improveDescription(
      payload.text,
      template.prompt,
      payload.length || 'standard',
      customPrompt || undefined,
    );

    sendResponse({ success: true, improvedText });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    sendResponse({ error: errorMessage });
  }
}

async function handleProcessSelection(
  payload: { text: string; action: 'rewrite' | 'translate' | 'fix-grammar'; language?: string },
  sendResponse: (response: { success?: boolean; processedText?: string; error?: string }) => void,
): Promise<void> {
  try {
    const apiConfig = await storage.getApiConfig();

    if (!apiConfig) {
      sendResponse({
        error: 'API not configured. Please configure the API in the extension popup.',
      });
      return;
    }

    const { endpoint, apiKey, model } = apiConfig;

    if (!endpoint || !apiKey || !model) {
      sendResponse({ error: 'API configuration incomplete. Please check all fields in settings.' });
      return;
    }

    const aiService = new AIService(endpoint, apiKey, model);

    // Define prompts based on action
    let prompt: string;

    if (payload.action === 'translate' && payload.language) {
      prompt = `Translate the following text to ${payload.language}. Provide only the translated text without any explanations:\n\n{{DESCRIPTION}}`;
    } else {
      const prompts = {
        rewrite:
          'Rewrite the following text to make it clearer, more concise, and professional while preserving the original meaning. If the text is already clear and concise (especially single words or very short phrases), return it unchanged:\n\n{{DESCRIPTION}}',
        translate:
          'Translate the following text to English. If it is already in English, translate it to German. Provide only the translated text without any explanations:\n\n{{DESCRIPTION}}',
        'fix-grammar':
          'Fix any grammar, spelling, and punctuation errors in the following text. Preserve the original meaning and tone. If there are no errors, return the text unchanged. Return only the corrected text:\n\n{{DESCRIPTION}}',
      };
      prompt = prompts[payload.action];
    }

    const systemPrompt =
      'You are a helpful writing assistant. Provide clear, accurate results without additional commentary. Never ask for clarification or more context. If the input is a single word or very short text that does not need improvement, return it exactly as provided.';

    const processedText = await aiService.processText(payload.text, prompt, systemPrompt);

    sendResponse({ success: true, processedText });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    sendResponse({ error: errorMessage });
  }
}
