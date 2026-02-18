// lib/db/payments.ts — Payment CRUD (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type { Payment } from "./types";

// =============================================================================
// Atomic Payment Creation via RPC
// =============================================================================

export async function createPaymentIfUnpaid(params: {
  invoiceId: string;
  userId: string | null;
  phoneNumber: string;
  amount: number;
}): Promise<
  | { success: true; paymentId: string }
  | { success: false; error: string; code: string; paymentId?: string }
> {
  const admin = getAdminClient();
  const paymentId = createId();

  const { data, error } = await admin.rpc("create_payment_if_unpaid", {
    p_payment_id: paymentId,
    p_invoice_id: params.invoiceId,
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

export async function updatePaymentToProcessing(
  paymentId: string,
  merchantRequestId: string,
  checkoutRequestId: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("Payment")
    .update({
      status: "PROCESSING",
      merchantRequestId,
      checkoutRequestId,
    })
    .eq("id", paymentId);
}

export async function updatePaymentCompleted(
  checkoutRequestId: string,
  params: {
    mpesaReceiptNumber: string;
    transactionDate?: string;
    amount: number;
    phoneNumber?: string;
  }
): Promise<Payment | null> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("Payment")
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
  return data as unknown as Payment;
}

export async function updatePaymentFailed(
  checkoutRequestId: string,
  resultCode: string,
  resultDesc: string
): Promise<void> {
  const admin = getAdminClient();

  const status = resultCode === "1032" ? "CANCELLED" : "FAILED";

  await admin
    .from("Payment")
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

export async function getPaymentByCheckoutRequestId(
  checkoutRequestId: string
): Promise<Payment | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("Payment")
    .select("*")
    .eq("checkoutRequestId", checkoutRequestId)
    .single();
  return data as Payment | null;
}

export async function getPaymentsByInvoiceId(
  invoiceId: string
): Promise<Payment[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("Payment")
    .select("*")
    .eq("invoiceId", invoiceId)
    .order("createdAt", { ascending: false });
  return (data || []) as Payment[];
}

export async function getStaleProcessingPayments(): Promise<
  Array<{
    id: string;
    checkoutRequestId: string;
    invoiceId: string;
    amount: number;
  }>
> {
  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.rpc as any)("get_stale_processing_payments");
  if (error) return [];
  return data || [];
}

export async function expireStalePayments(): Promise<number> {
  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.rpc as any)("expire_stale_payments");
  if (error) return 0;
  return data as number;
}
