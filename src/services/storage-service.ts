import { ApiConfig } from '../types/api-config';
import { PromptTemplate, UndoEntry } from '../types/storage';

export class StorageService {
  private static readonly KEYS = {
    API_CONFIG: 'apiConfig',
    TEMPLATES: 'templates',
    SELECTED_TEMPLATE_ID: 'selectedTemplateId',
    UNDO_HISTORY: 'undoHistory',
    CUSTOM_PROMPT: 'customPrompt',
  };

  async getApiConfig(): Promise<ApiConfig | null> {
    try {
      const result = await chrome.storage.sync.get(StorageService.KEYS.API_CONFIG);
      return result[StorageService.KEYS.API_CONFIG] || null;
    } catch (error) {
      return null;
    }
  }

  async setApiConfig(config: ApiConfig): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [StorageService.KEYS.API_CONFIG]: config,
      });
    } catch (error) {
      throw new Error('Failed to save API configuration');
    }
  }

  async getTemplates(): Promise<PromptTemplate[]> {
    try {
      const result = await chrome.storage.sync.get(StorageService.KEYS.TEMPLATES);
      return result[StorageService.KEYS.TEMPLATES] || [];
    } catch (error) {
      return [];
    }
  }

  async saveTemplates(templates: PromptTemplate[]): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [StorageService.KEYS.TEMPLATES]: templates,
      });
    } catch (error) {
      throw new Error('Failed to save templates');
    }
  }

  async getSelectedTemplateId(): Promise<string | null> {
    try {
      const result = await chrome.storage.sync.get(StorageService.KEYS.SELECTED_TEMPLATE_ID);
      return result[StorageService.KEYS.SELECTED_TEMPLATE_ID] || null;
    } catch (error) {
      return null;
    }
  }

  async setSelectedTemplateId(templateId: string): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [StorageService.KEYS.SELECTED_TEMPLATE_ID]: templateId,
      });
    } catch (error) {
      throw new Error('Failed to save selected template');
    }
  }

  async getUndoHistory(): Promise<UndoEntry[]> {
    try {
      const result = await chrome.storage.local.get(StorageService.KEYS.UNDO_HISTORY);
      return result[StorageService.KEYS.UNDO_HISTORY] || [];
    } catch (error) {
      return [];
    }
  }

  async saveUndoHistory(history: UndoEntry[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        [StorageService.KEYS.UNDO_HISTORY]: history,
      });
    } catch (error) {
      throw new Error('Failed to save undo history');
    }
  }

  async getCustomPrompt(): Promise<string | null> {
    try {
      const result = await chrome.storage.sync.get(StorageService.KEYS.CUSTOM_PROMPT);
      return result[StorageService.KEYS.CUSTOM_PROMPT] || null;
    } catch (error) {
      return null;
    }
  }

  async setCustomPrompt(prompt: string): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [StorageService.KEYS.CUSTOM_PROMPT]: prompt,
      });
    } catch (error) {
      throw new Error('Failed to save custom prompt');
    }
  }

  async clearAll(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
    } catch (error) {
      throw new Error('Failed to clear storage');
    }
  }
}
