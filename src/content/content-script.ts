import { JiraDomDetector } from './dom-detector';
import { UIInjector } from './ui-injector';
import { TextSelectionPopup } from './text-selection-popup';

const detector = new JiraDomDetector();
const injector = new UIInjector();
const textSelectionPopup = new TextSelectionPopup();

// Text selection popup is initialized and self-managing
void textSelectionPopup;

let currentDescriptionField: HTMLElement | null = null;
let isProcessing = false;

function initialize(): void {
  checkForDescriptionField();

  detector.observeForDescriptionField((field) => {
    const isEditMode = detector.isInEditMode();
    const buttonExists = checkIfButtonStillExists();

    if (isEditMode && !buttonExists) {
      injectButton(field);
    }
  });
}

function checkForDescriptionField(): void {
  const existingField = detector.detectDescriptionField();
  const isEditMode = detector.isInEditMode();
  const buttonExists = checkIfButtonStillExists();

  if (existingField && isEditMode && !buttonExists) {
    injectButton(existingField);
  }
}

function checkIfButtonStillExists(): boolean {
  const container = document.querySelector('.jira-improver-dropdown-container');
  return container !== null && document.contains(container);
}

function injectButton(field: HTMLElement): void {
  currentDescriptionField = field;
  const toolbar = detector.findToolbar();
  injector.injectImproveButton(field, handleImproveClick, toolbar);
}

async function handleImproveClick(length: 'concise' | 'standard' | 'detailed'): Promise<void> {
  if (isProcessing) {
    return;
  }

  if (!currentDescriptionField) {
    return;
  }

  const originalText = detector.extractDescriptionText(currentDescriptionField);

  if (!originalText || originalText.trim().length === 0) {
    alert('Description is empty. Please add some content first.');
    return;
  }

  isProcessing = true;
  injector.showLoading(currentDescriptionField, 'Improving description with AI...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'IMPROVE_DESCRIPTION',
      payload: { text: originalText, length },
    });

    injector.hideLoading();

    if (response.error) {
      alert(`Error: ${response.error}`);
      isProcessing = false;
      return;
    }

    const improvedHtml = response.improvedText;

    // Show preview dialog with accept/reject/regenerate options
    injector.showPreviewDialog(
      originalText,
      improvedHtml,
      () => {
        // User accepted - apply the changes
        if (currentDescriptionField) {
          detector.pasteHtmlContent(currentDescriptionField, improvedHtml);
        }
        isProcessing = false;
      },
      () => {
        // User rejected - do nothing
        isProcessing = false;
      },
      () => {
        // User wants to regenerate - call handleImproveClick again with same params
        isProcessing = false;
        handleImproveClick(length);
      },
    );
  } catch (error) {
    injector.hideLoading();
    alert(
      `Failed to improve description: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    isProcessing = false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
