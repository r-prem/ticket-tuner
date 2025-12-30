export class TextSelectionPopup {
  private popup: HTMLDivElement | null = null;
  private selectedText: string = '';
  private selectionRange: Range | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for text selection
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));

    // Close popup when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (this.popup && !this.popup.contains(e.target as Node)) {
        this.hidePopup();
      }
    });
  }

  private handleMouseUp(event: MouseEvent): void {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        this.hidePopup();
        return;
      }

      const text = selection.toString().trim();

      if (text.length === 0) {
        this.hidePopup();
        return;
      }

      this.selectedText = text;
      this.selectionRange = selection.getRangeAt(0).cloneRange();

      // Show popup near the selection
      this.showPopup(event.clientX, event.clientY);
    }, 10);
  }

  private handleSelectionChange(): void {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      // Don't hide immediately - wait for mouseup
      return;
    }
  }

  private showPopup(x: number, y: number): void {
    this.hidePopup();

    this.popup = document.createElement('div');
    this.popup.className = 'text-selection-popup';
    this.popup.innerHTML = `
      <button class="text-selection-action" data-action="rewrite">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 1.5l1 1-10 10-1.5.5.5-1.5 10-10zM15 2l-1-1 1-1 1 1-1 1z"/>
        </svg>
        Rewrite
      </button>
      <div class="translate-dropdown-container" style="position: relative; display: inline-block;">
        <button class="text-selection-action translate-button" data-action="translate">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 11L5.5 8h2l1 3h1.5l-3-8h-1l-3 8h1.5zM6 6.5L6.5 5h.5l.5 1.5H6z"/>
            <path d="M9 2h5v2h-1.5l-1.5 4-1-3H9V2z"/>
          </svg>
          Translate
        </button>
        <div class="language-dropdown" style="display: none;">
          <div class="language-option" data-language="German">German</div>
          <div class="language-option" data-language="English">English</div>
          <div class="language-option" data-language="Spanish">Spanish</div>
          <div class="language-option" data-language="French">French</div>
          <div class="language-option" data-language="Italian">Italian</div>
          <div class="language-option" data-language="Portuguese">Portuguese</div>
          <div class="language-option" data-language="Dutch">Dutch</div>
          <div class="language-option" data-language="Polish">Polish</div>
        </div>
      </div>
      <button class="text-selection-action" data-action="fix-grammar">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0l1.5 4.5L14 6l-4.5 1.5L8 12l-1.5-4.5L2 6l4.5-1.5L8 0z"/>
        </svg>
        Fix Grammar
      </button>
    `;

    this.applyPopupStyles(this.popup);
    this.positionPopup(this.popup, x, y);

    // Add event listeners to buttons
    const buttons = this.popup.querySelectorAll('.text-selection-action:not(.translate-button)');
    buttons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (button as HTMLElement).getAttribute('data-action');
        if (action) {
          this.handleAction(action as 'rewrite' | 'translate' | 'fix-grammar');
        }
      });
    });

    // Setup translate button with dropdown
    this.setupTranslateDropdown();

    document.body.appendChild(this.popup);
  }

  private positionPopup(popup: HTMLDivElement, x: number, y: number): void {
    // Position below the cursor
    let top = y + 10;
    let left = x;

    // Adjust if popup would go off screen
    const popupRect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (left + popupRect.width > viewportWidth) {
      left = viewportWidth - popupRect.width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    // Adjust vertical position - show above if not enough space below
    if (top + popupRect.height > viewportHeight) {
      top = y - popupRect.height - 10;
    }

    popup.style.top = `${top + window.scrollY}px`;
    popup.style.left = `${left + window.scrollX}px`;
  }

  private setupTranslateDropdown(): void {
    if (!this.popup) return;

    const container = this.popup.querySelector('.translate-dropdown-container');
    const translateButton = this.popup.querySelector('.translate-button');
    const dropdown = this.popup.querySelector('.language-dropdown') as HTMLDivElement;

    if (!container || !translateButton || !dropdown) return;

    let hideTimeout: number | null = null;

    // Show dropdown on hover
    container.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      dropdown.style.display = 'block';
    });

    container.addEventListener('mouseleave', () => {
      hideTimeout = window.setTimeout(() => {
        dropdown.style.display = 'none';
      }, 100);
    });

    // Handle language selection
    const languageOptions = dropdown.querySelectorAll('.language-option');
    languageOptions.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const language = (option as HTMLElement).getAttribute('data-language');
        if (language) {
          this.handleAction('translate', language);
        }
      });
    });
  }

  private hidePopup(): void {
    if (this.popup && document.contains(this.popup)) {
      this.popup.remove();
      this.popup = null;
    }
  }

  private async handleAction(
    action: 'rewrite' | 'translate' | 'fix-grammar',
    language?: string,
  ): Promise<void> {
    if (!this.selectedText || !this.selectionRange) {
      return;
    }

    this.hidePopup();

    // Show loading state
    this.showLoadingIndicator();

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_SELECTION',
        payload: {
          text: this.selectedText,
          action: action,
          language: language,
        },
      });

      this.hideLoadingIndicator();

      if (response.error) {
        alert(`Error: ${response.error}`);
        return;
      }

      const processedText = response.processedText;

      // Replace the selected text with the processed text
      this.replaceSelectedText(processedText);
    } catch (error) {
      this.hideLoadingIndicator();
      alert(`Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private replaceSelectedText(newText: string): void {
    if (!this.selectionRange) {
      return;
    }

    // Delete the selected content
    this.selectionRange.deleteContents();

    // Insert the new text
    const textNode = document.createTextNode(newText);
    this.selectionRange.insertNode(textNode);

    // Clear the selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    this.selectionRange = null;
    this.selectedText = '';
  }

  private showLoadingIndicator(): void {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const backgroundColor = isDarkMode ? '#2d2d2d' : 'white';
    const textColor = isDarkMode ? '#e0e0e0' : '#42526E';
    const boxShadow = isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)';

    const indicator = document.createElement('div');
    indicator.id = 'text-selection-loading';
    indicator.innerHTML = `
      <div class="spinner"></div>
      <span>Processing...</span>
    `;
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: ${boxShadow};
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10002;
      font-size: 14px;
      color: ${textColor};
    `;

    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
      #text-selection-loading .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #DFE1E6;
        border-top-color: #0052CC;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(spinnerStyle);
    document.body.appendChild(indicator);
  }

  private hideLoadingIndicator(): void {
    const indicator = document.getElementById('text-selection-loading');
    if (indicator) {
      indicator.remove();
    }
  }

  private applyPopupStyles(popup: HTMLDivElement): void {
    // Check if dark mode is enabled
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const backgroundColor = isDarkMode ? '#2d2d2d' : 'white';
    const borderColor = isDarkMode ? '#404040' : '#DFE1E6';
    const boxShadow = isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)';

    popup.style.cssText = `
      position: absolute;
      background: ${backgroundColor};
      border: 1px solid ${borderColor};
      border-radius: 3px;
      box-shadow: ${boxShadow};
      padding: 4px;
      display: flex;
      gap: 4px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    `;

    // Add styles for buttons
    const style = document.createElement('style');
    style.textContent = `
      .text-selection-popup {
        animation: fadeIn 0.15s ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .text-selection-action {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #42526E;
        transition: background 0.1s, color 0.1s;
        white-space: nowrap;
      }

      .text-selection-action:hover {
        background: #0052CC;
        color: white;
      }

      .text-selection-action svg {
        flex-shrink: 0;
      }

      .language-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        background: white;
        border: 1px solid #DFE1E6;
        border-radius: 3px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10002;
        min-width: 140px;
        max-height: 240px;
        overflow-y: auto;
      }

      .language-option {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        color: #42526E;
        transition: background 0.1s;
        white-space: nowrap;
      }

      .language-option:hover {
        background: #EBECF0;
      }

      .language-option:first-child {
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
      }

      .language-option:last-child {
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
      }

      @media (prefers-color-scheme: dark) {
        .text-selection-action {
          background: #2d2d2d;
          color: #e0e0e0;
        }

        .text-selection-action:hover {
          background: #0052CC;
          color: white;
        }

        .language-dropdown {
          background: #2d2d2d;
          border-color: #404040;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .language-option {
          color: #e0e0e0;
        }

        .language-option:hover {
          background: #404040;
        }
      }
    `;

    if (!document.head.querySelector('#text-selection-popup-styles')) {
      style.id = 'text-selection-popup-styles';
      document.head.appendChild(style);
    }
  }

  destroy(): void {
    this.hidePopup();
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }
}
