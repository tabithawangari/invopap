import { v4 as uuidv4 } from 'uuid';
import { ConversationState, ConversationStep, DocumentType, LineItem } from './types.js';

export class StateManager {
  private states: Map<number, ConversationState> = new Map();
  private sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

  createState(chatId: number, userId: number): ConversationState {
    const guestSessionId = uuidv4();
    const state: ConversationState = {
      chatId,
      userId,
      guestSessionId,
      currentStep: 'select-doc-type',
      formData: {
        lineItems: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.states.set(chatId, state);
    return state;
  }

  getState(chatId: number): ConversationState | undefined {
    const state = this.states.get(chatId);
    if (!state) return undefined;

    // Check for timeout
    if (Date.now() - state.updatedAt > this.sessionTimeout) {
      this.deleteState(chatId);
      return undefined;
    }

    return state;
  }

  updateState(chatId: number, updates: Partial<ConversationState>): ConversationState {
    let state = this.getState(chatId);
    if (!state) {
      state = this.createState(chatId, chatId); // If no state, create new
    }

    const updated = {
      ...state,
      ...updates,
      updatedAt: Date.now(),
    };

    this.states.set(chatId, updated);
    return updated;
  }

  setStep(chatId: number, step: ConversationStep): ConversationState {
    return this.updateState(chatId, { currentStep: step });
  }

  setFormData(
    chatId: number,
    key: keyof ConversationState['formData'],
    value: any
  ): ConversationState {
    const state = this.getState(chatId);
    if (!state) {
      throw new Error(`No state found for chat ${chatId}`);
    }

    return this.updateState(chatId, {
      formData: {
        ...state.formData,
        [key]: value,
      },
    });
  }

  addLineItem(chatId: number, item: LineItem): ConversationState {
    const state = this.getState(chatId);
    if (!state) {
      throw new Error(`No state found for chat ${chatId}`);
    }

    const lineItems = [...state.formData.lineItems, item];
    return this.setFormData(chatId, 'lineItems', lineItems);
  }

  removeLineItem(chatId: number, index: number): ConversationState {
    const state = this.getState(chatId);
    if (!state) {
      throw new Error(`No state found for chat ${chatId}`);
    }

    const lineItems = state.formData.lineItems.filter((_, i) => i !== index);
    return this.setFormData(chatId, 'lineItems', lineItems);
  }

  setTempItemData(chatId: number, data: any): ConversationState {
    return this.updateState(chatId, {
      tempItemData: data,
    });
  }

  clearTempItemData(chatId: number): ConversationState {
    return this.updateState(chatId, {
      tempItemData: undefined,
    });
  }

  setDocumentInfo(
    chatId: number,
    docId: string,
    publicId: string,
    pdfUrl?: string
  ): ConversationState {
    return this.updateState(chatId, {
      documentId: docId,
      publicId,
      pdfUrl,
    });
  }

  setPaymentInfo(
    chatId: number,
    checkoutRequestId: string,
    merchantRequestId: string,
    phone: string
  ): ConversationState {
    return this.updateState(chatId, {
      checkoutRequestId,
      merchantRequestId,
      paymentPhone: phone,
    });
  }

  deleteState(chatId: number): void {
    this.states.delete(chatId);
  }

  // Utility: Get all active states (for monitoring/cleanup)
  getAllStates(): ConversationState[] {
    return Array.from(this.states.values());
  }

  // Cleanup: Remove expired sessions
  cleanupExpiredSessions(): number {
    const before = this.states.size;
    const now = Date.now();

    for (const [chatId, state] of this.states.entries()) {
      if (now - state.updatedAt > this.sessionTimeout) {
        this.states.delete(chatId);
      }
    }

    return before - this.states.size;
  }
}

// Singleton instance
export const stateManager = new StateManager();

// Cleanup expired sessions every 1 hour
setInterval(() => {
  const removed = stateManager.cleanupExpiredSessions();
  if (removed > 0) {
    console.log(`[StateManager] Cleaned up ${removed} expired sessions`);
  }
}, 60 * 60 * 1000);
