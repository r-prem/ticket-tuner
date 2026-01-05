# Ticket Tuner (for Jira) — Privacy Policy

Effective date: 2026-01-05

This Privacy Policy explains how the Chrome extension “Ticket Tuner (for Jira)” (the “Extension”) handles data. We designed the Extension to operate locally in your browser and to minimize data processing. It does not collect analytics, advertising identifiers, or other tracking data.

If you disagree with this policy, please do not use the Extension.

## Summary
- The Extension does not collect or send data to the developer.
- When you click “Improve with AI,” the content of your Jira description is sent to the AI endpoint that you configure (e.g., OpenAI, Azure OpenAI, or a compatible/local service). That transmission is between your browser and your chosen AI provider.
- Your API key and settings are stored in Chrome storage (sync/local) on your devices, not on our servers.
- No third‑party analytics or ads SDKs are used.

## What data is processed and when
The Extension only processes data when you explicitly use it.

- Jira issue content (user-provided content): When you click the “Improve with AI” button, the current Jira description text is sent in a request to your configured AI endpoint to generate an improved version. The Extension does not retain a copy of the content beyond what is needed for the operation.
- Configuration data: API endpoint URL, API key, model name, selected template(s), and optional custom instructions are stored in Chrome storage to provide the Extension’s functionality.

## Data sources
- User-provided content from the Jira page you are viewing/editing
- User-provided configuration inside the Extension’s popup settings

## Where data goes
- AI endpoint you configure: The Jira description and your instructions are sent to the API endpoint you specify. Examples include OpenAI’s API, Azure OpenAI, or a local/OpenAI-compatible server you control. This transmission is governed by your provider’s terms and privacy policy.
- Nowhere else: The Extension does not transmit data to the developer or any analytics/advertising service.

## Data storage and retention
- API keys and settings: Stored using Chrome’s extension storage (sync/local). Chrome may encrypt this storage at rest and sync across devices signed in with the same Google account (subject to your Chrome settings). You can remove this data by uninstalling the Extension or clearing the Extension’s storage.
- Jira content: Not persistently stored by the Extension. It is used transiently to make a request to your chosen AI endpoint when you explicitly trigger the feature.

## Permissions rationale (Manifest V3)
- storage: Save and retrieve your configuration (API key, endpoint, model, templates).
- activeTab: Enable the action on the currently active tab.
- host_permissions (https://*.atlassian.net/*): Allow the content script to run on Jira Cloud pages in order to detect and improve the description field.

## Children’s privacy
The Extension is not directed to children under 13. Do not use the Extension if you are under 13 or if applicable law in your region requires guardian consent.

## Security
- Transport security: The Extension uses your browser’s network stack. We recommend configuring only HTTPS endpoints for your AI provider.
- Storage: Chrome extension storage is managed by Chrome and may be encrypted. We never store your API key on developer servers.
- Principle of minimization: The Extension processes only the data necessary to fulfill your request and does not collect telemetry.

## Your choices and controls
- Use of AI provider: You control which provider and endpoint to use. Review and accept that provider’s terms and privacy policy.
- View/clear configuration: You can remove the API key and settings in the Extension’s popup or by clearing extension data in Chrome.
- Uninstall: You can uninstall the Extension at any time from chrome://extensions.

## Data sharing and selling
- The Extension does not sell personal information.
- The Extension does not share data with third parties beyond the AI endpoint you explicitly configure.

## International transfers
Your data may be processed wherever your chosen AI provider operates or hosts its services. Review your provider’s documentation for details.

## Policy updates
We may update this policy from time to time. Material changes will be reflected in this document with a new effective date.

## Non‑affiliation
This Extension is an independent tool and is not affiliated with, endorsed, or sponsored by Atlassian. “Jira” is a trademark of Atlassian. All product names and trademarks are the property of their respective owners.

## Contact
For privacy questions or requests, please open an issue in the project repository or contact the developer/maintainer. If you operate this extension internally, provide an organization contact here:
- Maintainer: Raffael Prem
- Contact: raffaelprem@gmail.com


