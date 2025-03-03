import { Ref } from 'vue';

/**
 * Utility functions for displaying messages
 */
export class MessageUtils {
  private messageRef: Ref<string>;
  private messageTypeRef: Ref<string>;
  private defaultTimeout: number;

  /**
   * Create a new MessageUtils instance
   * @param messageRef - Reference to the message text
   * @param messageTypeRef - Reference to the message type
   * @param defaultTimeout - Default timeout in milliseconds
   */
  constructor(messageRef: Ref<string>, messageTypeRef: Ref<string>, defaultTimeout = 3000) {
    this.messageRef = messageRef;
    this.messageTypeRef = messageTypeRef;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Show a success message
   * @param text - Message text
   * @param timeout - Optional timeout in milliseconds
   */
  showSuccess(text: string, timeout?: number): void {
    this.showMessage(text, 'success', timeout);
  }

  /**
   * Show an error message
   * @param text - Message text
   * @param timeout - Optional timeout in milliseconds
   */
  showError(text: string, timeout?: number): void {
    this.showMessage(text, 'error', timeout);
  }

  /**
   * Show a message
   * @param text - Message text
   * @param type - Message type
   * @param timeout - Optional timeout in milliseconds
   */
  private showMessage(text: string, type: string, timeout?: number): void {
    this.messageRef.value = text;
    this.messageTypeRef.value = type;
    
    // Clear the message after timeout
    setTimeout(() => {
      this.messageRef.value = '';
    }, timeout || this.defaultTimeout);
  }

  /**
   * Clear the current message
   */
  clearMessage(): void {
    this.messageRef.value = '';
  }
}

/**
 * Create a new MessageUtils instance
 */
export function createMessageUtils(
  messageRef: Ref<string>,
  messageTypeRef: Ref<string>,
  defaultTimeout = 3000
): MessageUtils {
  return new MessageUtils(messageRef, messageTypeRef, defaultTimeout);
}