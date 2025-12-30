import { StorageService } from './storage-service';
import { PromptTemplate } from '../types/storage';

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general-improve',
    name: 'General Improvement',
    description: 'Improve clarity, structure, and completeness',
    isDefault: true,
    category: 'general',
    prompt: `Improve the following Jira ticket description by:
1. Making it clearer and more concise
2. Adding proper structure (problem, solution, acceptance criteria)
3. Fixing grammar and spelling
4. Ensuring it's actionable

Original description:
{{DESCRIPTION}}

IMPORTANT: Format your response as HTML suitable for a rich text editor. Use <p> tags for paragraphs, <strong> for bold, <em> for italic, <ul>/<li> for lists, <table>/<tr>/<td> for tables, etc. Do not use markdown. Provide only the improved description HTML, no explanations or code blocks.`,
  },
  {
    id: 'bug-report',
    name: 'Bug Report Enhancement',
    description: 'Structure as a proper bug report',
    isDefault: false,
    category: 'bug',
    prompt: `Transform this into a well-structured bug report with:
- Summary: Brief description of the bug
- Steps to Reproduce: Numbered steps
- Expected Behavior: What should happen
- Actual Behavior: What actually happens
- Additional Context: Any relevant details

Original:
{{DESCRIPTION}}

IMPORTANT: Format your response as HTML suitable for a rich text editor and jira. Use <p> tags for paragraphs, <strong> for bold headings, <ol>/<li> for numbered lists, <table>/<tr>/<td> for tables, etc. Do not use markdown. Provide only the improved description HTML.`,
  },
  {
    id: 'feature-request',
    name: 'Feature Request',
    description: 'Structure as a feature request with user story',
    isDefault: false,
    category: 'feature',
    prompt: `Improve this feature request by:
- Adding a user story (As a... I want... So that...)
- Clarifying the problem being solved
- Suggesting edge cases to consider

Original:
{{DESCRIPTION}}

IMPORTANT: Format your response as HTML suitable for a rich text editor. Use <p> tags for paragraphs, <strong> for bold, <ul>/<li> for bullet lists, <table>/<tr>/<td> for tables, etc. Do not use markdown. Provide only the improved description HTML.`,
  },
  {
    id: 'technical-detail',
    name: 'Add Technical Details',
    description: 'Enhance with technical specifics',
    isDefault: false,
    category: 'task',
    prompt: `Enhance this technical description by:
- Breaking down implementation steps
- Identifying technical dependencies
- Adding relevant technical context
- Suggesting testing approach

Original:
{{DESCRIPTION}}

IMPORTANT: Format your response as HTML suitable for a rich text editor. Use <p> tags for paragraphs, <strong> for bold, <ul>/<li> for lists, <table>/<tr>/<td> for tables, <code> for code snippets. Do not use markdown. Provide only the improved description HTML.`,
  },
];

export class TemplateService {
  private storage: StorageService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  async getTemplates(): Promise<PromptTemplate[]> {
    const custom = await this.storage.getTemplates();
    return [...DEFAULT_TEMPLATES, ...custom];
  }

  async getTemplate(id?: string): Promise<PromptTemplate> {
    const templates = await this.getTemplates();

    if (id) {
      const template = templates.find((t) => t.id === id);
      if (template) return template;
    }

    const selectedId = await this.storage.getSelectedTemplateId();
    if (selectedId) {
      const template = templates.find((t) => t.id === selectedId);
      if (template) return template;
    }

    return templates.find((t) => t.isDefault) || templates[0];
  }

  async saveCustomTemplate(template: Omit<PromptTemplate, 'id'>): Promise<string> {
    const id = `custom-${Date.now()}`;
    const newTemplate: PromptTemplate = { ...template, id };

    const existing = await this.storage.getTemplates();
    await this.storage.saveTemplates([...existing, newTemplate]);

    return id;
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.storage.getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    await this.storage.saveTemplates(filtered);
  }
}
