import { ApiConfig } from './api-config';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isDefault: boolean;
  category: 'general' | 'bug' | 'feature' | 'task';
}

export interface UndoEntry {
  id: string;
  timestamp: number;
  issueKey: string;
  fieldType: 'description';
  originalText: string;
  improvedText: string;
  isReverted: boolean;
}

export interface StorageSchema {
  apiConfig?: ApiConfig;
  templates?: PromptTemplate[];
  selectedTemplateId?: string;
  undoHistory?: UndoEntry[];
  customPrompt?: string;
}
