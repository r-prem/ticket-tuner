export class UIInjector {
  private improveButtonContainer: HTMLDivElement | null = null;
  private improveButton: HTMLButtonElement | null = null;
  private undoButton: HTMLButtonElement | null = null;
  private loadingOverlay: HTMLDivElement | null = null;
  private dropdownMenu: HTMLDivElement | null = null;
  private previewDialog: HTMLDivElement | null = null;

  injectImproveButton(
    descriptionField: HTMLElement,
    onClick: (length: 'concise' | 'standard' | 'detailed') => void,
    toolbar?: HTMLElement | null,
  ): HTMLDivElement {
    if (this.improveButtonContainer && document.contains(this.improveButtonContainer)) {
      return this.improveButtonContainer;
    }

    this.improveButtonContainer = this.createImproveButtonWithDropdown(onClick);

    if (toolbar) {
      // Find the inner container with buttons
      const buttonContainer = toolbar.querySelector('.css-n48rgu') || toolbar;
      buttonContainer.appendChild(this.improveButtonContainer);
    } else {
      // Fallback: floating button
      const container = this.createFloatingButtonContainer();
      container.appendChild(this.improveButtonContainer);
      const parent =
        descriptionField.closest('[data-testid*="description"]') || descriptionField.parentElement;
      if (parent) {
        (parent as HTMLElement).style.position = 'relative';
        parent.appendChild(container);
      }
    }

    return this.improveButtonContainer;
  }

  injectUndoButton(
    _descriptionField: HTMLElement,
    onClick: () => void,
    toolbar?: HTMLElement | null,
  ): HTMLButtonElement {
    if (this.undoButton && document.contains(this.undoButton)) {
      return this.undoButton;
    }

    this.undoButton = this.createUndoButton(onClick);

    if (this.improveButton && this.improveButton.parentElement) {
      this.improveButton.parentElement.appendChild(this.undoButton);
    } else if (toolbar) {
      const buttonContainer = toolbar.querySelector('.css-n48rgu') || toolbar;
      buttonContainer.appendChild(this.undoButton);
    }

    return this.undoButton;
  }

  showLoading(descriptionField: HTMLElement, message: string = 'Improving description...'): void {
    this.hideLoading();

    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'jira-improver-loading';
    this.loadingOverlay.innerHTML = `
      <div class="spinner"></div>
      <div class="message">${message}</div>
    `;

    this.applyLoadingStyles(this.loadingOverlay);

    const parent =
      descriptionField.closest('[data-testid*="description"]') || descriptionField.parentElement;
    if (parent) {
      (parent as HTMLElement).style.position = 'relative';
      parent.appendChild(this.loadingOverlay);
    }

    if (this.improveButton) {
      this.improveButton.disabled = true;
    }
  }

  hideLoading(): void {
    if (this.loadingOverlay && document.contains(this.loadingOverlay)) {
      this.loadingOverlay.remove();
      this.loadingOverlay = null;
    }

    if (this.improveButton) {
      this.improveButton.disabled = false;
    }
  }

  removeImproveButton(): void {
    if (this.improveButtonContainer && document.contains(this.improveButtonContainer)) {
      this.improveButtonContainer.remove();
      this.improveButtonContainer = null;
      this.improveButton = null;
      this.dropdownMenu = null;
    }
  }

  removeUndoButton(): void {
    if (this.undoButton && document.contains(this.undoButton)) {
      this.undoButton.remove();
      this.undoButton = null;
    }
  }

  private createImproveButtonWithDropdown(
    onClick: (length: 'concise' | 'standard' | 'detailed') => void,
  ): HTMLDivElement {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const container = document.createElement('div');
    container.className = 'jira-improver-dropdown-container';
    container.style.cssText = `
      position: relative;
      display: inline-block;
      margin-left: 8px;
      margin-top: 8px;
    `;

    const button = document.createElement('button');
    button.className = 'jira-improver-button';
    button.type = 'button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
      </svg>
      <span>Improve with AI</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style="margin-left: 4px;">
        <path d="M6 9L2 5h8z"/>
      </svg>
    `;

    this.improveButton = button;
    this.applyImproveButtonStyles(button);

    // Create dropdown menu
    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className = 'jira-improver-dropdown-menu';

    const dropdownBg = isDarkMode ? '#2d2d2d' : 'white';
    const dropdownBorder = isDarkMode ? '#404040' : '#DFE1E6';
    const dropdownShadow = isDarkMode ? '0 4px 8px rgba(0, 0, 0, 0.5)' : '0 4px 8px rgba(0, 0, 0, 0.15)';

    this.dropdownMenu.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: ${dropdownBg};
      border: 1px solid ${dropdownBorder};
      border-radius: 3px;
      box-shadow: ${dropdownShadow};
      z-index: 10001;
      min-width: 160px;
      display: none;
    `;

    const options = [
      { label: 'Concise', value: 'concise' as const, description: 'Short and to the point' },
      { label: 'Standard', value: 'standard' as const, description: 'Balanced length' },
      { label: 'Detailed', value: 'detailed' as const, description: 'Comprehensive description' },
    ];

    const textColor = isDarkMode ? '#e0e0e0' : '#42526E';
    const descColor = isDarkMode ? '#a0a0a0' : '#6B778C';
    const hoverBg = isDarkMode ? '#404040' : '#EBECF0';

    options.forEach((option) => {
      const item = document.createElement('div');
      item.className = 'jira-improver-dropdown-item';
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        color: ${textColor};
        transition: background 0.1s;
      `;
      item.innerHTML = `
        <div style="font-weight: 500; color: ${textColor};">${option.label}</div>
        <div style="font-size: 12px; color: ${descColor}; margin-top: 2px;">${option.description}</div>
      `;

      item.addEventListener('mouseenter', () => {
        item.style.background = hoverBg;
      });

      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });

      item.addEventListener('click', () => {
        this.hideDropdown();
        onClick(option.value);
      });

      this.dropdownMenu!.appendChild(item);
    });

    // Toggle dropdown on button click
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.hideDropdown();
    });

    container.appendChild(button);
    container.appendChild(this.dropdownMenu);

    return container;
  }

  private toggleDropdown(): void {
    if (this.dropdownMenu) {
      const isVisible = this.dropdownMenu.style.display === 'block';
      this.dropdownMenu.style.display = isVisible ? 'none' : 'block';
    }
  }

  private hideDropdown(): void {
    if (this.dropdownMenu) {
      this.dropdownMenu.style.display = 'none';
    }
  }

  private createUndoButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'jira-improver-undo-button';
    button.type = 'button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 8C3 5.24 5.24 3 8 3C9.52 3 10.87 3.67 11.79 4.73L10 6.5H15V1.5L13.35 3.15C12.07 1.84 10.16 1 8 1C4.13 1 1 4.13 1 8H3Z"/>
      </svg>
      <span>Undo AI</span>
    `;

    this.applyUndoButtonStyles(button);
    button.addEventListener('click', onClick);

    return button;
  }

  private createFloatingButtonContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'jira-improver-floating';
    container.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      gap: 8px;
    `;
    return container;
  }

  private applyImproveButtonStyles(button: HTMLButtonElement): void {
    button.style.cssText = `
      background: #1458bc;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: -8px;
      transition: background 0.2s;
      margin-top: 2px;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#1353af';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#1458bc';
    });

    button.addEventListener('mouseover', () => {
      button.style.background = '#1353af';
    });

    button.addEventListener('mouseout', () => {
      button.style.background = '#1458bc';
    });
  }

  private applyUndoButtonStyles(button: HTMLButtonElement): void {
    button.style.cssText = `
      background: #FAFBFC;
      color: #42526E;
      border: 2px solid #DFE1E6;
      border-radius: 3px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
      transition: background 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#EBECF0';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#FAFBFC';
    });
  }

  private applyLoadingStyles(overlay: HTMLDivElement): void {
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 10000;
      border-radius: 3px;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .jira-improver-loading .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #DFE1E6;
        border-top-color: #0052CC;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .jira-improver-loading .message {
        font-size: 14px;
        color: #42526E;
        font-weight: 500;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    if (!document.querySelector('style[data-jira-improver-styles]')) {
      style.setAttribute('data-jira-improver-styles', 'true');
      document.head.appendChild(style);
    }
  }

  showPreviewDialog(
    originalText: string,
    improvedHtml: string,
    onAccept: () => void,
    onReject: () => void,
    onRegenerate?: () => void,
  ): void {
    this.hidePreviewDialog();

    this.previewDialog = document.createElement('div');
    this.previewDialog.className = 'jira-improver-preview-dialog';
    this.previewDialog.innerHTML = `
      <div class="jira-improver-preview-overlay"></div>
      <div class="jira-improver-preview-content">
        <div class="jira-improver-preview-header">
          <h3>Review AI Improvements</h3>
          <button class="jira-improver-preview-close" type="button">×</button>
        </div>
        <div class="jira-improver-preview-body">
          <div class="jira-improver-preview-section">
            <h4>Original</h4>
            <div class="jira-improver-preview-text jira-improver-preview-original">${this.escapeHtml(originalText)}</div>
          </div>
          <div class="jira-improver-preview-section">
            <h4>Improved</h4>
            <div class="jira-improver-preview-text jira-improver-preview-improved">${improvedHtml}</div>
          </div>
        </div>
        <div class="jira-improver-preview-footer">
          <button class="jira-improver-preview-btn jira-improver-preview-reject" type="button">Reject</button>
          ${onRegenerate ? '<button class="jira-improver-preview-btn jira-improver-preview-regenerate" type="button">Regenerate</button>' : ''}
          <button class="jira-improver-preview-btn jira-improver-preview-accept" type="button">Accept & Apply</button>
        </div>
      </div>
    `;

    this.applyPreviewDialogStyles();

    const acceptBtn = this.previewDialog.querySelector('.jira-improver-preview-accept');
    const rejectBtn = this.previewDialog.querySelector('.jira-improver-preview-reject');
    const regenerateBtn = this.previewDialog.querySelector('.jira-improver-preview-regenerate');
    const closeBtn = this.previewDialog.querySelector('.jira-improver-preview-close');

    const handleAccept = () => {
      this.hidePreviewDialog();
      onAccept();
    };

    const handleReject = () => {
      this.hidePreviewDialog();
      onReject();
    };

    const handleRegenerate = () => {
      this.hidePreviewDialog();
      if (onRegenerate) onRegenerate();
    };

    if (acceptBtn) acceptBtn.addEventListener('click', handleAccept);
    if (rejectBtn) rejectBtn.addEventListener('click', handleReject);
    if (regenerateBtn) regenerateBtn.addEventListener('click', handleRegenerate);
    if (closeBtn) closeBtn.addEventListener('click', handleReject);

    // Close on overlay click
    const overlay = this.previewDialog.querySelector('.jira-improver-preview-overlay');
    if (overlay) overlay.addEventListener('click', handleReject);

    document.body.appendChild(this.previewDialog);
  }

  hidePreviewDialog(): void {
    if (this.previewDialog && document.contains(this.previewDialog)) {
      this.previewDialog.remove();
      this.previewDialog = null;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private applyPreviewDialogStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .jira-improver-preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 100000;
        transition: background-color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-overlay {
          background: rgba(0, 0, 0, 0.7);
        }
      }

      .jira-improver-preview-content {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 100001;
        width: 90%;
        max-width: 900px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        transition: background-color 0.3s, color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-content {
          background: #2d2d2d;
          color: #e0e0e0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
      }

      .jira-improver-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #DFE1E6;
        transition: border-color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-header {
          border-bottom-color: #404040;
        }
      }

      .jira-improver-preview-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #172B4D;
        transition: color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-header h3 {
          color: #e0e0e0;
        }
      }

      .jira-improver-preview-close {
        background: none;
        border: none;
        font-size: 28px;
        color: #6B778C;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        transition: background 0.2s, color 0.3s;
      }

      .jira-improver-preview-close:hover {
        background: #EBECF0;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-close {
          color: #a0a0a0;
        }

        .jira-improver-preview-close:hover {
          background: #404040;
        }
      }

      .jira-improver-preview-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .jira-improver-preview-section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #42526E;
        transition: color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-section h4 {
          color: #b8b8b8;
        }
      }

      .jira-improver-preview-text {
        background: #F4F5F7;
        border: 1px solid #DFE1E6;
        border-radius: 3px;
        padding: 12px;
        font-size: 14px;
        line-height: 1.6;
        color: #172B4D;
        min-height: 200px;
        max-height: 400px;
        overflow-y: auto;
        transition: background-color 0.3s, color 0.3s, border-color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-text {
          background: #1a1a1a;
          border-color: #404040;
          color: #e0e0e0;
        }
      }

      .jira-improver-preview-original {
        white-space: pre-wrap;
        font-family: monospace;
      }

      .jira-improver-preview-improved {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      }

      .jira-improver-preview-footer {
        padding: 16px 20px;
        border-top: 1px solid #DFE1E6;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        transition: border-color 0.3s;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-footer {
          border-top-color: #404040;
        }
      }

      .jira-improver-preview-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 3px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .jira-improver-preview-accept {
        background: #0052CC;
        color: white;
      }

      .jira-improver-preview-accept:hover {
        background: #0065FF;
      }

      .jira-improver-preview-reject {
        background: #FAFBFC;
        color: #42526E;
        border: 2px solid #DFE1E6;
      }

      .jira-improver-preview-reject:hover {
        background: #EBECF0;
      }

      .jira-improver-preview-regenerate {
        background: #F4F5F7;
        color: #42526E;
        border: 2px solid #DFE1E6;
        margin-right: auto;
      }

      .jira-improver-preview-regenerate:hover {
        background: #0052CC;
        color: white;
        border-color: #0052CC;
      }

      @media (prefers-color-scheme: dark) {
        .jira-improver-preview-reject {
          background: #1a1a1a;
          color: #e0e0e0;
          border-color: #404040;
        }

        .jira-improver-preview-reject:hover {
          background: #404040;
        }

        .jira-improver-preview-regenerate {
          background: #1a1a1a;
          color: #e0e0e0;
          border-color: #404040;
        }

        .jira-improver-preview-regenerate:hover {
          background: #0052CC;
          border-color: #0052CC;
        }
      }

      @media (max-width: 768px) {
        .jira-improver-preview-body {
          grid-template-columns: 1fr;
        }
      }
    `;

    if (!document.querySelector('style[data-jira-improver-preview-styles]')) {
      style.setAttribute('data-jira-improver-preview-styles', 'true');
      document.head.appendChild(style);
    }
  }
}
