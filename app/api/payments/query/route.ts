// app/api/payments/query/route.ts — POST (manual STK Push status query for ALL document types)
import { NextRequest, NextResponse } from "next/server";
import { querySTKPush } from "@/lib/mpesa";
import {
  // Invoice
  getPaymentByCheckoutRequestId,
  updatePaymentCompleted,
  updatePaymentFailed,
  markInvoicePaid,
  // Cash sale
  getCashSalePaymentByCheckoutRequestId,
  updateCashSalePaymentCompleted,
  updateCashSalePaymentFailed,
  markCashSalePaid,
  // Delivery note
  getDeliveryNotePaymentByCheckoutRequestId,
  updateDeliveryNotePaymentCompleted,
  updateDeliveryNotePaymentFailed,
  markDeliveryNotePaid,
  // Receipt
  getReceiptPaymentByCheckoutRequestId,
  updateReceiptPaymentCompleted,
  updateReceiptPaymentFailed,
  markReceiptPaid,
  // Purchase order
  getPurchaseOrderPaymentByCheckoutRequestId,
  updatePurchaseOrderPaymentCompleted,
  updatePurchaseOrderPaymentFailed,
  markPurchaseOrderPaid,
  // Quotation
  getQuotationPaymentByCheckoutRequestId,
  updateQuotationPaymentCompleted,
  updateQuotationPaymentFailed,
  markQuotationPaid,
} from "@/lib/db";
import { QueryPaymentSchema } from "@/lib/validators";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

const DOWNLOAD_PRICE = 10;

// Generic payment record shape
interface PaymentRecord {
  id: string;
  documentId: string;
  status: string;
  mpesaReceiptNumber: string | null;
  documentType: "INVOICE" | "CASH_SALE" | "DELIVERY_NOTE" | "RECEIPT" | "PURCHASE_ORDER" | "QUOTATION";
}

// Search all payment tables
async function findPaymentByCheckoutRequestId(
  checkoutRequestId: string
): Promise<PaymentRecord | null> {
  const inv = await getPaymentByCheckoutRequestId(checkoutRequestId);
  if (inv) return { id: inv.id, documentId: inv.invoiceId, status: inv.status, mpesaReceiptNumber: inv.mpesaReceiptNumber, documentType: "INVOICE" };

  const cs = await getCashSalePaymentByCheckoutRequestId(checkoutRequestId);
  if (cs) return { id: cs.id, documentId: cs.cashSaleId, status: cs.status, mpesaReceiptNumber: cs.mpesaReceiptNumber, documentType: "CASH_SALE" };

  const dn = await getDeliveryNotePaymentByCheckoutRequestId(checkoutRequestId);
  if (dn) return { id: dn.id, documentId: dn.deliveryNoteId, status: dn.status, mpesaReceiptNumber: dn.mpesaReceiptNumber, documentType: "DELIVERY_NOTE" };

  const rct = await getReceiptPaymentByCheckoutRequestId(checkoutRequestId);
  if (rct) return { id: rct.id, documentId: rct.receiptId, status: rct.status, mpesaReceiptNumber: rct.mpesaReceiptNumber, documentType: "RECEIPT" };

  const po = await getPurchaseOrderPaymentByCheckoutRequestId(checkoutRequestId);
  if (po) return { id: po.id, documentId: po.purchaseOrderId, status: po.status, mpesaReceiptNumber: po.mpesaReceiptNumber, documentType: "PURCHASE_ORDER" };

  const q = await getQuotationPaymentByCheckoutRequestId(checkoutRequestId);
  if (q) return { id: q.id, documentId: q.quotationId, status: q.status, mpesaReceiptNumber: q.mpesaReceiptNumber, documentType: "QUOTATION" };

  return null;
}

// Complete payment by type
async function completePaymentByType(
  checkoutRequestId: string,
  params: { mpesaReceiptNumber: string; amount: number },
  documentType: string
) {
  switch (documentType) {
    case "INVOICE": return updatePaymentCompleted(checkoutRequestId, params);
    case "CASH_SALE": return updateCashSalePaymentCompleted(checkoutRequestId, params);
    case "DELIVERY_NOTE": return updateDeliveryNotePaymentCompleted(checkoutRequestId, params);
    case "RECEIPT": return updateReceiptPaymentCompleted(checkoutRequestId, params);
    case "PURCHASE_ORDER": return updatePurchaseOrderPaymentCompleted(checkoutRequestId, params);
    case "QUOTATION": return updateQuotationPaymentCompleted(checkoutRequestId, params);
    default: return null;
  }
}

// Fail payment by type
async function failPaymentByType(checkoutRequestId: string, resultCode: string, resultDesc: string, documentType: string) {
  switch (documentType) {
    case "INVOICE": return updatePaymentFailed(checkoutRequestId, resultCode, resultDesc);
    case "CASH_SALE": return updateCashSalePaymentFailed(checkoutRequestId, resultCode, resultDesc);
    case "DELIVERY_NOTE": return updateDeliveryNotePaymentFailed(checkoutRequestId, resultCode, resultDesc);
    case "RECEIPT": return updateReceiptPaymentFailed(checkoutRequestId, resultCode, resultDesc);
    case "PURCHASE_ORDER": return updatePurchaseOrderPaymentFailed(checkoutRequestId, resultCode, resultDesc);
    case "QUOTATION": return updateQuotationPaymentFailed(checkoutRequestId, resultCode, resultDesc);
  }
}

// Mark document as paid by type
async function markDocumentPaid(documentId: string, documentType: string) {
  switch (documentType) {
    case "INVOICE": return markInvoicePaid(documentId);
    case "CASH_SALE": return markCashSalePaid(documentId);
    case "DELIVERY_NOTE": return markDeliveryNotePaid(documentId);
    case "RECEIPT": return markReceiptPaid(documentId);
    case "PURCHASE_ORDER": return markPurchaseOrderPaid(documentId);
    case "QUOTATION": return markQuotationPaid(documentId);
  }
}

export async function POST(request: NextRequest) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const body = await request.json();
    const { checkoutRequestId } = QueryPaymentSchema.parse(body);

    // Look up our payment record across all tables
    const payment = await findPaymentByCheckoutRequestId(checkoutRequestId);
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Skip if already in terminal state
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(payment.status)) {
      return NextResponse.json({
        status: payment.status,
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
      });
    }

    // Query Daraja for actual status
    const result = await querySTKPush(checkoutRequestId);

    if (result.ResultCode === "0") {
      // Payment succeeded
      const updated = await completePaymentByType(
        checkoutRequestId,
        { mpesaReceiptNumber: "", amount: DOWNLOAD_PRICE },
        payment.documentType
      );

      if (updated) {
        await markDocumentPaid(payment.documentId, payment.documentType);
      }

      logger.info("payment_query_success", {
        paymentId: payment.id,
        documentId: payment.documentId,
        documentType: payment.documentType,
      });

      return NextResponse.json({
        status: "COMPLETED",
        mpesaReceiptNumber: updated?.mpesaReceiptNumber,
      });
    } else {
      // Payment failed
      await failPaymentByType(
        checkoutRequestId,
        result.ResultCode,
        result.ResultDesc,
        payment.documentType
      );

      return NextResponse.json({
        status: result.ResultCode === "1032" ? "CANCELLED" : "FAILED",
        resultDesc: result.ResultDesc,
      });
    }
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    logger.error("payment_query_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to query payment status" },
      { status: 500 }
    );
  }
}
