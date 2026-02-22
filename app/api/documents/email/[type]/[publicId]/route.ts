// app/api/documents/email/[type]/[publicId]/route.ts — Send document via email
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";
import { sendDocumentEmail, checkEmailRateLimit, type DocumentType } from "@/lib/email";
import { isEmailEnabled } from "@/lib/env";

// Import all PDF renderers
import { renderInvoicePdf } from "@/lib/pdf";
import { renderCashSalePdf } from "@/lib/cash-sale-pdf";
import { renderDeliveryNotePdf } from "@/lib/delivery-note-pdf";
import { renderReceiptPdf } from "@/lib/receipt-pdf";
import { renderPurchaseOrderPdf } from "@/lib/purchase-order-pdf";
import { renderQuotationPdf } from "@/lib/quotation-pdf";

// Import DB getters
import {
  getInvoiceByPublicId,
  getCashSaleByPublicId,
  getDeliveryNoteByPublicId,
  getReceiptByPublicId,
  getPurchaseOrderByPublicId,
  getQuotationByPublicId,
} from "@/lib/db";

// Supported document types
const VALID_TYPES: DocumentType[] = [
  "invoice",
  "cash-sale",
  "delivery-note",
  "receipt",
  "purchase-order",
  "quotation",
];

// Table names for queries
const TABLE_NAMES: Record<DocumentType, string> = {
  invoice: "Invoice",
  "cash-sale": "CashSale",
  "delivery-note": "DeliveryNote",
  receipt: "Receipt",
  "purchase-order": "PurchaseOrder",
  quotation: "Quotation",
};

// Document number field names
const NUMBER_FIELDS: Record<DocumentType, string> = {
  invoice: "invoiceNumber",
  "cash-sale": "cashSaleNumber",
  "delivery-note": "deliveryNoteNumber",
  receipt: "receiptNumber",
  "purchase-order": "purchaseOrderNumber",
  quotation: "quotationNumber",
};

export const maxDuration = 60; // Email + PDF generation can take time

interface EmailRequestBody {
  recipientEmail: string;
  recipientName?: string;
}

async function generatePdfForDocument(
  documentType: DocumentType,
  publicId: string
): Promise<{ buffer: Buffer; documentNumber: string; senderName: string } | null> {
  switch (documentType) {
    case "invoice": {
      const doc = await getInvoiceByPublicId(publicId);
      if (!doc) return null;
      const buffer = await renderInvoicePdf(doc, { showWatermark: false });
      return { buffer, documentNumber: doc.invoiceNumber, senderName: doc.fromName };
    }
    case "cash-sale": {
      const doc = await getCashSaleByPublicId(publicId);
      if (!doc) return null;
      const buffer = await renderCashSalePdf(doc, { showWatermark: false });
      return { buffer, documentNumber: doc.cashSaleNumber, senderName: doc.fromName };
    }
    case "delivery-note": {
      const doc = await getDeliveryNoteByPublicId(publicId);
      if (!doc) return null;
      const buffer = await renderDeliveryNotePdf(doc, { showWatermark: false });
      return { buffer, documentNumber: doc.deliveryNoteNumber, senderName: doc.fromName };
    }
    case "receipt": {
      const doc = await getReceiptByPublicId(publicId);
      if (!doc) return null;
      const buffer = await renderReceiptPdf(doc, { showWatermark: false });
      return { buffer, documentNumber: doc.receiptNumber, senderName: doc.fromName };
    }
    case "purchase-order": {
      const doc = await getPurchaseOrderByPublicId(publicId);
      if (!doc) return null;
      const buffer = await renderPurchaseOrderPdf(doc, { showWatermark: false });
      return { buffer, documentNumber: doc.purchaseOrderNumber, senderName: doc.fromName };
    }
    case "quotation": {
      const doc = await getQuotationByPublicId(publicId);
      if (!doc) return null;
      const buffer = await renderQuotationPdf(doc, { showWatermark: false });
      return { buffer, documentNumber: doc.quotationNumber, senderName: doc.fromName };
    }
    default:
      return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string; publicId: string } }
) {
  const logger = createRequestLogger();
  const { type, publicId } = params;

  // Validate document type
  if (!VALID_TYPES.includes(type as DocumentType)) {
    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  }
  const documentType = type as DocumentType;

  // Check if email is enabled
  if (!isEmailEnabled()) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }

  // Rate limit check
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  // Parse request body
  let body: EmailRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Validate email
  const { recipientEmail, recipientName } = body;
  if (!recipientEmail || typeof recipientEmail !== "string") {
    return NextResponse.json(
      { error: "Recipient email is required" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  try {
    const admin = getAdminClient();
    const tableName = TABLE_NAMES[documentType];
    const numberField = NUMBER_FIELDS[documentType];

    // Fetch document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: document, error: fetchError } = await (admin as any)
      .from(tableName)
      .select(`id, publicId, isPaid, userId, guestSessionId, ${numberField}, fromName, fromEmail`)
      .eq("publicId", publicId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Payment guard
    if (!document.isPaid) {
      return NextResponse.json(
        { error: "Payment required to send email", publicId },
        { status: 402 }
      );
    }

    // Email rate limit check
    const rateLimit = await checkEmailRateLimit(
      document.userId,
      document.guestSessionId,
      10 // max 10 emails per hour
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Email rate limit exceeded. Please try again later.",
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt?.toISOString(),
        },
        { status: 429 }
      );
    }

    // Generate PDF
    let pdfResult;
    try {
      pdfResult = await generatePdfForDocument(documentType, publicId);
    } catch (error) {
      if (error instanceof Error && error.message === "PDF_BUSY") {
        return NextResponse.json(
          { error: "Server busy generating PDFs, please retry in a few seconds" },
          { status: 503, headers: { "Retry-After": "5" } }
        );
      }
      throw error;
    }

    if (!pdfResult) {
      return NextResponse.json(
        { error: "Failed to generate document" },
        { status: 500 }
      );
    }

    // Send email
    const emailResult = await sendDocumentEmail({
      documentType,
      documentId: document.id,
      publicId,
      documentNumber: pdfResult.documentNumber,
      recipientEmail,
      recipientName,
      senderName: pdfResult.senderName,
      senderEmail: document.fromEmail,
      pdfBuffer: pdfResult.buffer,
      userId: document.userId,
      guestSessionId: document.guestSessionId,
    });

    if (!emailResult.success) {
      logger.error("email_send_failed", {
        documentType,
        publicId,
        error: emailResult.error,
      });
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    logger.done("document_emailed", {
      documentType,
      publicId,
      recipientEmail,
      resendId: emailResult.resendId,
    });

    return NextResponse.json({
      success: true,
      message: `${documentType.replace("-", " ")} sent to ${recipientEmail}`,
      resendId: emailResult.resendId,
      remaining: rateLimit.remaining - 1,
    });
  } catch (error) {
    logger.error("email_endpoint_error", {
      documentType,
      publicId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to process email request" },
      { status: 500 }
    );
  }
}
