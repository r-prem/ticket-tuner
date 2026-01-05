# Ticket Tuner (for Jira) - Chrome Extension

A Chrome extension that uses AI to improve Jira ticket descriptions. The extension detects when you're editing a Jira description field and offers an "Improve with AI" button that uses OpenAI-compatible APIs to enhance the content. It also provides a lightweight text-selection popup on Jira pages, so you can Translate, Fix Grammar, or Rewrite any selected text inline without opening the full editor.

## ⚠️ Important Security & Cost Information

### 🔒 Security Considerations

**API Key Security:**
- Your API key is stored locally in Chrome's storage and is never sent to the extension developer
- **Keep your API key confidential** - treat it like a password
- Never share screenshots or logs that may contain your API key
- Chrome's storage sync will sync your API key across devices signed in to your Google account
- To revoke access: regenerate your API key at your AI provider's dashboard

**Data Privacy:**
- When you click "Improve with AI", the Jira description content is sent to your configured AI endpoint
- The extension does not collect, store, or transmit any data to third parties except your chosen AI service
- All data processing is subject to your AI provider's privacy policy and terms of service
- **Sensitive Information**: Be cautious when improving descriptions containing confidential, proprietary, or personally identifiable information

**Recommended Best Practices:**
- Use API keys with restricted permissions when possible
- Regularly rotate your API keys
- Review your AI provider's data retention and privacy policies
- Consider using a dedicated API key for this extension
- For highly sensitive projects, consider using a local AI model instead of cloud services

### 💰 API Usage Costs

**You Need Your Own API Key:**
- This extension requires you to provide your own OpenAI API key (or compatible service)
- **All API usage costs are your responsibility**
- Costs are charged directly by your AI provider (OpenAI, Azure, etc.)

**Cost Estimates (OpenAI pricing as of Dec 2024):**
- **gpt-4o-mini** (Recommended): ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
  - Typical cost per improvement: **$0.001 - $0.003** (0.1 to 0.3 cents)
  - 1000 improvements: ~$1-3
- **gpt-4o**: ~$2.50 per 1M input tokens, ~$10.00 per 1M output tokens
  - Typical cost per improvement: **$0.01 - $0.03** (1 to 3 cents)
  - 1000 improvements: ~$10-30

**Cost Management Tips:**
- Start with `gpt-4o-mini` for cost-effective results
- Monitor your API usage in your provider's dashboard
- Set up billing alerts in your AI provider account
- Consider using local models (free) for high-volume usage

**Free Alternatives:**
- Use local AI models (LM Studio, Ollama) - completely free but requires local setup
- Some providers offer free trial credits for new accounts

## Features

- Fully configurable API endpoint, API key, and model name
- Detects Jira Cloud description fields in edit mode
- Injects "Improve with AI" button into Jira UI
- 4 default prompt templates (General, Bug Report, Feature Request, Technical Details)
- Template selection in popup
- Loading states and error handling
- Chrome storage for configuration (synced across devices)
- Test configuration feature
- Custom prompt support for additional AI instructions
- Description length control (concise, standard, detailed)
- PNG icons at all required sizes (16x16, 48x48, 128x128)
- Inline Text Selection popup on Jira pages
  - Actions: Rewrite, Translate (with language dropdown), Fix Grammar
  - Supported languages in dropdown: German, English, Spanish, French, Italian, Portuguese, Dutch, Polish
  - Replaces the selected text inline after processing

## Installation

### 1. Build the Extension

```bash
# Install dependencies (already done)
npm install

# Build for production
npm run build

# Or for development with watch mode
npm run dev
```

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list

## Configuration

### 1. Configure API Settings

1. Click the extension icon in Chrome toolbar
2. Fill in the configuration form:
   - **API Endpoint**: Full URL to your OpenAI-compatible API
     - Default: `https://api.openai.com/v1/chat/completions`
     - Works with: OpenAI, Azure OpenAI, local models, custom endpoints
   - **API Key**: Your API key (stored securely in Chrome)
   - **Model**: Model name to use
     - Recommended: `gpt-4o-mini` (cost-effective)
     - Alternatives: `gpt-4o`, `gpt-4`, `gpt-3.5-turbo`, or custom model names
3. Click "Test Connection" to verify your configuration
4. Click "Save Configuration"

### 2. Select Template

Choose from the default templates:
- **General Improvement**: Improves clarity, structure, and completeness
- **Bug Report Enhancement**: Structures as proper bug report with steps to reproduce
- **Feature Request**: Adds user story and acceptance criteria
- **Add Technical Details**: Enhances with implementation details

## Usage

### Basic Workflow

1. Navigate to a Jira Cloud issue (e.g., `https://your-org.atlassian.net/browse/PROJ-123`)
2. Click "Edit" on the description field
3. An "Improve with AI" button will appear near the description editor
4. Click the button to send the current description to the AI
5. The improved version will be automatically inserted into the description field
6. Review and edit the improved text as needed before saving the Jira issue

### Current Behavior

- The extension sends your description to the configured AI endpoint
- The improved text is automatically pasted into the description field
- Loading states show progress during the API call
- Error messages appear if the API call fails

### Text Selection Actions (Translate, Fix Grammar, Rewrite)

Use quick inline actions without opening the full editor.

1. Select any text inside a Jira issue (e.g., description, comment, or any rich-text area on Jira Cloud)
2. A small popup appears next to your selection with three actions:
   - Rewrite
   - Translate (hover to choose a language)
   - Fix Grammar
3. Click an action (or select a target language under Translate)
4. The selected text is sent to your configured AI endpoint
5. The processed result replaces the selected text inline

Notes:
- Supported Translate languages in the dropdown: German, English, Spanish, French, Italian, Portuguese, Dutch, Polish
- Works on Jira Cloud pages (*.atlassian.net) where content editing is allowed
- Very large selections may be shortened by your model’s token limits
- Be careful with sensitive information; selected text is sent to your AI endpoint when you use an action

## API Compatibility

This extension works with any OpenAI-compatible API that supports the Chat Completions format:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Supported Providers

- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **Azure OpenAI**: `https://<your-resource>.openai.azure.com/openai/deployments/<deployment-name>/chat/completions?api-version=2023-05-15`
- **Local models**: Any local server implementing OpenAI API (e.g., LM Studio, Ollama with OpenAI compatibility)
- **Custom endpoints**: Any compatible API

## Development

### Project Structure

```
./
├── src/
│   ├── background/
│   │   └── service-worker.ts      # API calls, message handling
│   ├── content/
│   │   ├── content-script.ts      # Main orchestrator
│   │   ├── dom-detector.ts        # Jira field detection
│   │   └── ui-injector.ts         # Button/UI injection
│   ├── popup/
│   │   ├── popup.html             # Settings UI
│   │   ├── popup.ts               # Settings logic
│   │   └── popup.css              # Settings styles
│   ├── services/
│   │   ├── storage-service.ts     # Chrome storage wrapper
│   │   ├── ai-service.ts          # AI API client
│   │   └── template-service.ts    # Prompt templates
│   └── types/                     # TypeScript definitions
├── dist/                          # Build output
├── webpack/                       # Build configuration
├── package.json
└── tsconfig.json
```

### Scripts

```bash
# Development (watch mode with source maps)
npm run dev

# Production build (minified)
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Key Technologies

- **TypeScript** for type safety
- **Webpack** for bundling
- **Chrome Extensions Manifest V3**
- **Chrome Storage API** for configuration
- **Fetch API** for AI requests


## Troubleshooting

### Button Doesn't Appear

- Ensure you're on Jira Cloud (*.atlassian.net)
- Make sure you're in edit mode (click "Edit" on the description)
- Check browser console for errors (F12)
- Try refreshing the page

### API Errors

- Verify API endpoint URL is correct
- Check API key is valid
- Test configuration using "Test Connection" button
- Ensure model name is supported by your endpoint
- Check browser console for detailed error messages

### Configuration Not Saving

- Ensure Chrome sync is enabled
- Check Chrome extension permissions
- Try clearing extension storage and reconfiguring

## Security Notes

- API keys are stored using `chrome.storage.sync` (encrypted by Chrome)
- Never share your API keys
- Be aware that API calls will incur costs based on your provider's pricing
- The extension only accesses Jira pages (*.atlassian.net)

## License

MIT

## Support

For issues, please check:
1. Browser console (F12) for error messages
2. Extension service worker console (chrome://extensions → Details → Inspect views: service worker)
3. Configuration in popup (ensure all fields are filled)
