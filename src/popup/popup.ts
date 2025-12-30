import { StorageService } from '../services/storage-service';
import { DEFAULT_TEMPLATES, TemplateService } from '../services/template-service';
import { ApiConfig } from '../types/api-config';

const storage = new StorageService();
const templateService = new TemplateService(storage);

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfiguration();
  await loadTemplates();
  await loadCustomTemplatesList();
  await loadCustomPrompt();
  setupEventListeners();
  setupCollapsibleSections();
});

async function loadConfiguration(): Promise<void> {
  const config = await storage.getApiConfig();

  const endpointInput = document.getElementById('api-endpoint') as HTMLInputElement;
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const modelInput = document.getElementById('model-name') as HTMLInputElement;

  if (config) {
    endpointInput.value = config.endpoint;
    apiKeyInput.value = config.apiKey;
    modelInput.value = config.model;
    updateStatus('connected', 'Configured');
  } else {
    endpointInput.value = DEFAULT_ENDPOINT;
    modelInput.value = DEFAULT_MODEL;
    updateStatus('not-configured', 'Not configured');
  }
}

async function loadTemplates(): Promise<void> {
  const customTemplates = await storage.getTemplates();
  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];
  const selectedId = await storage.getSelectedTemplateId();
  const select = document.getElementById('template-select') as HTMLSelectElement;

  select.innerHTML = '';

  if (allTemplates.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No templates available (will use default)';
    select.appendChild(option);
    return;
  }

  allTemplates.forEach((template) => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = `${template.name} - ${template.description}`;
    if (template.id === selectedId || (template.isDefault && !selectedId)) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

async function loadCustomPrompt(): Promise<void> {
  const customPrompt = await storage.getCustomPrompt();
  const textarea = document.getElementById('custom-prompt') as HTMLTextAreaElement;

  if (customPrompt) {
    textarea.value = customPrompt;
  }
}

function setupEventListeners(): void {
  const saveButton = document.getElementById('save-config') as HTMLButtonElement;
  const testButton = document.getElementById('test-config') as HTMLButtonElement;
  const toggleButton = document.getElementById('toggle-key-visibility') as HTMLButtonElement;
  const templateSelect = document.getElementById('template-select') as HTMLSelectElement;
  const saveCustomPromptButton = document.getElementById('save-custom-prompt') as HTMLButtonElement;
  const saveTemplateButton = document.getElementById('save-template') as HTMLButtonElement;

  if (saveButton) saveButton.addEventListener('click', handleSaveConfiguration);
  if (testButton) testButton.addEventListener('click', handleTestConfiguration);
  if (toggleButton) toggleButton.addEventListener('click', handleToggleKeyVisibility);
  if (templateSelect) templateSelect.addEventListener('change', handleTemplateChange);
  if (saveCustomPromptButton)
    saveCustomPromptButton.addEventListener('click', handleSaveCustomPrompt);
  if (saveTemplateButton) saveTemplateButton.addEventListener('click', handleSaveTemplate);
}

async function handleSaveConfiguration(): Promise<void> {
  const endpointInput = document.getElementById('api-endpoint') as HTMLInputElement;
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const modelInput = document.getElementById('model-name') as HTMLInputElement;
  const saveButton = document.getElementById('save-config') as HTMLButtonElement;

  const endpoint = endpointInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim();

  if (!endpoint || !apiKey || !model) {
    showTestResult('error', 'Please fill in all fields');
    return;
  }

  try {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    const config: ApiConfig = { endpoint, apiKey, model };
    await storage.setApiConfig(config);

    updateStatus('connected', 'Configured');
    showTestResult('success', 'Configuration saved successfully');
  } catch (error) {
    showTestResult('error', 'Failed to save configuration');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save Configuration';
  }
}

async function handleTestConfiguration(): Promise<void> {
  const endpointInput = document.getElementById('api-endpoint') as HTMLInputElement;
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const modelInput = document.getElementById('model-name') as HTMLInputElement;
  const testButton = document.getElementById('test-config') as HTMLButtonElement;

  const endpoint = endpointInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim();

  if (!endpoint || !apiKey || !model) {
    showTestResult('error', 'Please fill in all fields');
    return;
  }

  try {
    testButton.disabled = true;
    testButton.textContent = 'Testing...';

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: endpoint.replace('/chat/completions', ''),
      timeout: 10000,
      dangerouslyAllowBrowser: true,
    });

    // Make a simple test request
    await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 10,
    });

    showTestResult('success', 'Connection successful! API is working.');
    updateStatus('connected', 'Connected');
  } catch (error) {
    // Import OpenAI type for error checking
    const { default: OpenAI } = await import('openai');

    if (error instanceof OpenAI.APIError) {
      showTestResult('error', `API Error: ${error.message} (Status: ${error.status})`);
    } else if (error instanceof Error) {
      showTestResult('error', `Error: ${error.message}`);
    } else {
      showTestResult('error', 'Unknown error occurred');
    }

    updateStatus('error', 'Connection failed');
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test Connection';
  }
}

function handleToggleKeyVisibility(): void {
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const toggleButton = document.getElementById('toggle-key-visibility') as HTMLButtonElement;

  if (!apiKeyInput || !toggleButton) {
    return;
  }

  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleButton.textContent = 'Hide';
  } else {
    apiKeyInput.type = 'password';
    toggleButton.textContent = 'Show';
  }
}

async function handleTemplateChange(): Promise<void> {
  const select = document.getElementById('template-select') as HTMLSelectElement;
  const templateId = select.value;

  if (templateId) {
    try {
      await storage.setSelectedTemplateId(templateId);
      showTestResult('success', 'Template selection saved');
      setTimeout(() => hideTestResult(), 2000);
    } catch (error) {
      showTestResult('error', 'Failed to save template selection');
    }
  }
}

async function handleSaveCustomPrompt(): Promise<void> {
  const textarea = document.getElementById('custom-prompt') as HTMLTextAreaElement;
  const saveButton = document.getElementById('save-custom-prompt') as HTMLButtonElement;
  const resultDiv = document.getElementById('custom-prompt-result');

  const customPrompt = textarea.value.trim();

  try {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    await storage.setCustomPrompt(customPrompt);

    if (resultDiv) {
      resultDiv.className = 'test-result success';
      resultDiv.textContent = 'Custom prompt saved successfully';
      setTimeout(() => {
        resultDiv.className = 'test-result hidden';
      }, 2000);
    }
  } catch (error) {
    if (resultDiv) {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = 'Failed to save custom prompt';
    }
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save Custom Prompt';
  }
}

function updateStatus(status: string, text: string): void {
  const indicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  if (indicator && statusText) {
    indicator.className = 'status-indicator';
    if (status === 'connected') {
      indicator.classList.add('connected');
    } else if (status === 'error') {
      indicator.classList.add('error');
    }
    statusText.textContent = text;
  }
}

function showTestResult(type: 'success' | 'error', message: string): void {
  const resultDiv = document.getElementById('test-result');
  if (resultDiv) {
    resultDiv.className = `test-result ${type}`;
    resultDiv.textContent = message;
  }
}

function hideTestResult(): void {
  const resultDiv = document.getElementById('test-result');
  if (resultDiv) {
    resultDiv.className = 'test-result hidden';
  }
}

async function loadCustomTemplatesList(): Promise<void> {
  const customTemplates = await storage.getTemplates();
  const listContainer = document.getElementById('custom-templates-list');

  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (customTemplates.length === 0) {
    listContainer.innerHTML =
      '<div class="empty-state">No custom templates yet. Create one below!</div>';
    return;
  }

  customTemplates.forEach((template) => {
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `
      <div class="template-info">
        <div class="template-name">${template.name}</div>
        <div class="template-desc">${template.description}</div>
      </div>
      <button class="btn-delete" data-template-id="${template.id}">Delete</button>
    `;

    const deleteButton = item.querySelector('.btn-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => handleDeleteTemplate(template.id));
    }

    listContainer.appendChild(item);
  });
}

async function handleSaveTemplate(): Promise<void> {
  const nameInput = document.getElementById('template-name') as HTMLInputElement;
  const descInput = document.getElementById('template-description') as HTMLInputElement;
  const categorySelect = document.getElementById('template-category') as HTMLSelectElement;
  const promptTextarea = document.getElementById('template-prompt') as HTMLTextAreaElement;
  const saveButton = document.getElementById('save-template') as HTMLButtonElement;
  const resultDiv = document.getElementById('template-result');

  const name = nameInput.value.trim();
  const description = descInput.value.trim();
  const category = categorySelect.value as 'general' | 'bug' | 'feature' | 'task';
  const prompt = promptTextarea.value.trim();

  if (!name || !description || !prompt) {
    if (resultDiv) {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = 'Please fill in all fields';
      setTimeout(() => {
        resultDiv.className = 'test-result hidden';
      }, 3000);
    }
    return;
  }

  if (!prompt.includes('{{DESCRIPTION}}')) {
    if (resultDiv) {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = 'Prompt must include {{DESCRIPTION}} placeholder';
      setTimeout(() => {
        resultDiv.className = 'test-result hidden';
      }, 3000);
    }
    return;
  }

  try {
    saveButton.disabled = true;
    saveButton.textContent = 'Creating...';

    await templateService.saveCustomTemplate({
      name,
      description,
      category,
      prompt,
      isDefault: false,
    });

    // Clear form
    nameInput.value = '';
    descInput.value = '';
    promptTextarea.value = '';
    categorySelect.value = 'general';

    // Reload templates
    await loadTemplates();
    await loadCustomTemplatesList();

    if (resultDiv) {
      resultDiv.className = 'test-result success';
      resultDiv.textContent = 'Template created successfully!';
      setTimeout(() => {
        resultDiv.className = 'test-result hidden';
      }, 3000);
    }
  } catch (error) {
    if (resultDiv) {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = 'Failed to create template';
      setTimeout(() => {
        resultDiv.className = 'test-result hidden';
      }, 3000);
    }
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Create Template';
  }
}

async function handleDeleteTemplate(templateId: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this template?')) {
    return;
  }

  try {
    await templateService.deleteTemplate(templateId);

    // Reload templates
    await loadTemplates();
    await loadCustomTemplatesList();
  } catch (error) {
    alert('Failed to delete template');
  }
}

function setupCollapsibleSections(): void {
  const headers = document.querySelectorAll('h2[data-section]');

  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const sectionName = header.getAttribute('data-section');
      const content = document.getElementById(`${sectionName}-content`);

      if (content && header instanceof HTMLElement) {
        const isCollapsed = content.classList.contains('collapsed');

        if (isCollapsed) {
          content.classList.remove('collapsed');
          header.classList.remove('collapsed');
        } else {
          content.classList.add('collapsed');
          header.classList.add('collapsed');
        }
      }
    });
  });
}
