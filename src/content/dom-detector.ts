export class JiraDomDetector {
  private observer: MutationObserver | null = null;

  detectDescriptionField(): HTMLElement | null {
    // Look for the ProseMirror editor with specific aria-label for description
    const editor = document.querySelector('.ProseMirror[aria-label*="Description"]');
    if (editor && this.isEditable(editor as HTMLElement)) {
      return editor as HTMLElement;
    }

    // Fallback: any ProseMirror with id ak-editor-textarea
    const fallback = document.querySelector('#ak-editor-textarea.ProseMirror');
    if (fallback && this.isEditable(fallback as HTMLElement)) {
      return fallback as HTMLElement;
    }

    return null;
  }

  findToolbar(): HTMLElement | null {
    const toolbar = document.querySelector('[role="toolbar"][aria-label="Editor"]');
    return toolbar as HTMLElement | null;
  }

  observeForDescriptionField(callback: (element: HTMLElement) => void): void {
    this.disconnect();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastFoundField: HTMLElement | null = null;

    this.observer = new MutationObserver(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        const field = this.detectDescriptionField();
        if (field && field !== lastFoundField) {
          lastFoundField = field;
          callback(field);
        }
      }, 300);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  isInEditMode(): boolean {
    // Strategy 1: Check if description field is contenteditable
    const descField = this.detectDescriptionField();
    if (descField && descField.getAttribute('contenteditable') === 'true') {
      return true;
    }

    // Strategy 2: Look for save/cancel buttons
    const buttonSelectors = [
      '[data-testid="comment-save-button"]',
      '[data-testid="comment-cancel-button"]',
      '[data-testid="issue-field-save-button"]',
      '[data-testid="issue-field-cancel-button"]',
    ];

    for (const selector of buttonSelectors) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }

  waitForEditMode(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isInEditMode()) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {
        if (this.isInEditMode()) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  extractDescriptionText(container: HTMLElement): string {
    const proseMirror = container.querySelector('.ProseMirror');
    if (proseMirror) {
      return this.extractFromProseMirror(proseMirror as HTMLElement);
    }

    return container.innerText || container.textContent || '';
  }

  pasteHtmlContent(container: HTMLElement, html: string): void {
    // Focus the editor
    container.focus();

    // IMPORTANT: Preserve attachments, images, and media before replacing content
    const preservedElements = this.extractPreservedElements(container);

    // Select all existing content
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(container);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Create a ClipboardEvent with HTML data
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', html);
    clipboardData.setData('text/plain', html.replace(/<[^>]*>/g, '')); // Fallback plain text

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboardData,
    });

    // Dispatch the paste event
    container.dispatchEvent(pasteEvent);

    // If paste event didn't work, try execCommand as fallback
    if (!pasteEvent.defaultPrevented) {
      document.execCommand('insertHTML', false, html);
    }

    // Re-append preserved elements (attachments, images, etc.)
    this.reinsertPreservedElements(container, preservedElements);

    // Trigger input/change events for Jira to detect the change
    container.dispatchEvent(new Event('input', { bubbles: true }));
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private extractPreservedElements(container: HTMLElement): Element[] {
    const preserved: Element[] = [];

    // Preserve media nodes (images, files, attachments)
    const mediaSelectors = [
      '.mediaSingle', // Jira media nodes
      '.media-single', // Alternative media wrapper
      '[data-node-type="mediaSingle"]',
      '[data-node-type="media"]',
      'img[data-media-id]', // Media images
      '.attachment', // Attachment nodes
      '[data-attachment-id]',
      '.inline-task-list', // Preserve task lists
      '.code-block', // Preserve code blocks
    ];

    mediaSelectors.forEach((selector) => {
      const elements = container.querySelectorAll(selector);
      elements.forEach((el) => {
        // Clone the element to preserve it
        preserved.push(el.cloneNode(true) as Element);
      });
    });

    return preserved;
  }

  private reinsertPreservedElements(container: HTMLElement, elements: Element[]): void {
    if (elements.length === 0) return;

    // Append preserved elements at the end of the content
    elements.forEach((el) => {
      // Add some spacing before attachments
      const spacer = document.createElement('p');
      spacer.innerHTML = '<br>';
      container.appendChild(spacer);

      container.appendChild(el);
    });
  }

  private isEditable(element: HTMLElement): boolean {
    return (
      element.getAttribute('contenteditable') === 'true' ||
      element.querySelector('[contenteditable="true"]') !== null
    );
  }

  private extractFromProseMirror(element: HTMLElement): string {
    const paragraphs = element.querySelectorAll('p');
    if (paragraphs.length > 0) {
      return Array.from(paragraphs)
        .map((p) => p.textContent || '')
        .join('\n\n');
    }

    return element.innerText || element.textContent || '';
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
