// lib/db/quotation-payments.ts — Quotation Payment CRUD operations (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type { QuotationPayment } from "./types";

// =============================================================================
// Atomic Payment Creation via RPC
// =============================================================================

export async function createQuotationPaymentIfUnpaid(params: {
  quotationId: string;
  userId: string | null;
  phoneNumber: string;
  amount: number;
}): Promise<
  | { success: true; paymentId: string }
  | { success: false; error: string; code: string; paymentId?: string }
> {
  const admin = getAdminClient();
  const paymentId = createId();

  const { data, error } = await admin.rpc("create_quotation_payment_if_unpaid", {
    p_payment_id: paymentId,
    p_quotation_id: params.quotationId,
    p_user_id: params.userId,
    p_phone_number: params.phoneNumber,
    p_amount: params.amount,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
      code: "RPC_ERROR",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = data as any;
  if (result?.error) {
    return {
      success: false,
      error: result.error,
      code: result.code,
      paymentId: result.paymentId,
    };
  }

  return { success: true, paymentId };
}

// =============================================================================
// Payment Updates
// =============================================================================

export async function updateQuotationPaymentToProcessing(
  paymentId: string,
  merchantRequestId: string,
  checkoutRequestId: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("QuotationPayment")
    .update({
      status: "PROCESSING",
      merchantRequestId,
      checkoutRequestId,
    })
    .eq("id", paymentId);
}

export async function updateQuotationPaymentCompleted(
  checkoutRequestId: string,
  params: {
    mpesaReceiptNumber: string;
    transactionDate?: string;
    amount: number;
    phoneNumber?: string;
  }
): Promise<QuotationPayment | null> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("QuotationPayment")
    .update({
      status: "COMPLETED",
      mpesaReceiptNumber: params.mpesaReceiptNumber,
      transactionDate: params.transactionDate || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      resultCode: "0",
      resultDesc: "Success",
    })
    .eq("checkoutRequestId", checkoutRequestId)
    .not("status", "in", '("COMPLETED","FAILED","CANCELLED")')
    .select("*")
    .single();

  if (error || !data) return null;
  return data as unknown as QuotationPayment;
}

export async function updateQuotationPaymentFailed(
  checkoutRequestId: string,
  resultCode: string,
  resultDesc: string
): Promise<void> {
  const admin = getAdminClient();

  const status = resultCode === "1032" ? "CANCELLED" : "FAILED";

  await admin
    .from("QuotationPayment")
    .update({
      status,
      resultCode,
      resultDesc,
    })
    .eq("checkoutRequestId", checkoutRequestId)
    .not("status", "in", '("COMPLETED","FAILED","CANCELLED")');
}

// =============================================================================
// Payment Queries
// =============================================================================

export async function getQuotationPaymentByCheckoutRequestId(
  checkoutRequestId: string
): Promise<QuotationPayment | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("QuotationPayment")
    .select("*")
    .eq("checkoutRequestId", checkoutRequestId)
    .single();
  return data as QuotationPayment | null;
}

export async function getQuotationPaymentsByQuotationId(
  quotationId: string
): Promise<QuotationPayment[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("QuotationPayment")
    .select("*")
    .eq("quotationId", quotationId)
    .order("createdAt", { ascending: false });
  return (data || []) as QuotationPayment[];
}
