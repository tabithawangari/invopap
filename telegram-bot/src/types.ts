export type DocumentType = 'invoice' | 'quotation' | 'cash-sale' | 'delivery-note' | 'purchase-order' | 'receipt';

export type ConversationStep =
  | 'start'
  | 'select-doc-type'
  | 'enter-from-name'
  | 'enter-to-name'
  | 'enter-currency'
  | 'enter-tax-rate'
  | 'enter-due-date'
  | 'add-line-items'
  | 'add-item-name'
  | 'add-item-qty'
  | 'add-item-rate'
  | 'add-item-confirm'
  | 'review-document'
  | 'ready-to-preview'
  | 'payment-pending'
  | 'payment-phone'
  | 'payment-status'
  | 'download-pdf'
  | 'complete';

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export interface ConversationState {
  chatId: number;
  userId: number;
  guestSessionId: string;
  documentType?: DocumentType;
  currentStep: ConversationStep;
  formData: {
    fromName?: string;
    toName?: string;
    currency?: string;
    taxRate?: number;
    dueDate?: string;
    lineItems: LineItem[];
  };
  tempItemData?: {
    description?: string;
    quantity?: number;
    rate?: number;
  };
  documentId?: string;
  publicId?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  paymentPhone?: string;
  pdfUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentAPIPayload {
  fromName: string;
  toName: string;
  lineItems: LineItem[];
  taxRate?: number;
  dueDate?: string;
  currency?: string;
}

export interface PaymentInitiateResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
}

export interface PaymentQueryResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  mpesaReceiptNumber?: string;
}

export interface DocumentResponse {
  id: string;
  publicId: string;
  [key: string]: any;
  pdfUrl?: string;
}
