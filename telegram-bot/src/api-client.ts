import axios, { AxiosInstance } from 'axios';
import {
  DocumentAPIPayload,
  DocumentType,
  PaymentInitiateResponse,
  PaymentQueryResponse,
  DocumentResponse,
} from './types.js';

export class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.API_BASE_URL || 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  // Create a document (invoice, quotation, etc.)
  async createDocument(
    documentType: DocumentType,
    payload: DocumentAPIPayload,
    guestSessionId: string
  ): Promise<DocumentResponse> {
    const endpoint = this.getDocumentEndpoint(documentType);

    try {
      const response = await this.client.post(endpoint, payload, {
        headers: {
          'x-guest-session-id': guestSessionId,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to create ${documentType}:`, error);
      throw new Error(`Failed to create ${documentType}: ${this.getErrorMessage(error)}`);
    }
  }

  // Get document details (fetch existing document)
  async getDocument(
    documentType: DocumentType,
    documentId: string,
    guestSessionId: string
  ): Promise<DocumentResponse> {
    const endpoint = `${this.getDocumentEndpoint(documentType)}/${documentId}`;

    try {
      const response = await this.client.get(endpoint, {
        headers: {
          'x-guest-session-id': guestSessionId,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${documentType} ${documentId}:`, error);
      throw new Error(`Failed to fetch document: ${this.getErrorMessage(error)}`);
    }
  }

  // Initiate M-Pesa payment
  async initiatePayment(
    publicId: string,
    phoneNumber: string,
    documentType: DocumentType,
    guestSessionId: string
  ): Promise<PaymentInitiateResponse> {
    try {
      const response = await this.client.post(
        '/api/payments/initiate',
        {
          publicId,
          phoneNumber,
          documentType,
        },
        {
          headers: {
            'x-guest-session-id': guestSessionId,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      throw new Error(`Failed to initiate payment: ${this.getErrorMessage(error)}`);
    }
  }

  // Query payment status
  async queryPaymentStatus(
    checkoutRequestId: string,
    guestSessionId: string
  ): Promise<PaymentQueryResponse> {
    try {
      const response = await this.client.get('/api/payments/query', {
        params: {
          checkoutRequestId,
        },
        headers: {
          'x-guest-session-id': guestSessionId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to query payment status:', error);
      throw new Error(`Failed to query payment: ${this.getErrorMessage(error)}`);
    }
  }

  // Generate preview link
  generatePreviewLink(documentType: DocumentType, publicId: string): string {
    return `${this.baseURL}/view/${documentType}/${publicId}?preview=true`;
  }

  // Helper: Get the correct API endpoint for document type
  private getDocumentEndpoint(documentType: DocumentType): string {
    const endpoints: Record<DocumentType, string> = {
      invoice: '/api/invoices',
      quotation: '/api/quotations',
      'cash-sale': '/api/cash-sales',
      'delivery-note': '/api/delivery-notes',
      'purchase-order': '/api/purchase-orders',
      receipt: '/api/receipts',
    };

    return endpoints[documentType];
  }

  // Helper: Extract error message
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    }
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

// Singleton instance
export const apiClient = new APIClient();
