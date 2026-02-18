// lib/db/cash-sale-payments.ts — Cash Sale Payment CRUD (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type { CashSalePayment } from "./types";

// =============================================================================
// Atomic Payment Creation via RPC
// =============================================================================

export async function createCashSalePaymentIfUnpaid(params: {
  cashSaleId: string;
  userId: string | null;
  phoneNumber: string;
  amount: number;
}): Promise<
  | { success: true; paymentId: string }
  | { success: false; error: string; code: string; paymentId?: string }
> {
  const admin = getAdminClient();
  const paymentId = createId();

  const { data, error } = await admin.rpc("create_cash_sale_payment_if_unpaid", {
    p_payment_id: paymentId,
    p_cash_sale_id: params.cashSaleId,
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

export async function updateCashSalePaymentToProcessing(
  paymentId: string,
  merchantRequestId: string,
  checkoutRequestId: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("CashSalePayment")
    .update({
      status: "PROCESSING",
      merchantRequestId,
      checkoutRequestId,
    })
    .eq("id", paymentId);
}

export async function updateCashSalePaymentCompleted(
  checkoutRequestId: string,
  params: {
    mpesaReceiptNumber: string;
    transactionDate?: string;
    amount: number;
    phoneNumber?: string;
  }
): Promise<CashSalePayment | null> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("CashSalePayment")
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
  return data as unknown as CashSalePayment;
}

export async function updateCashSalePaymentFailed(
  checkoutRequestId: string,
  resultCode: string,
  resultDesc: string
): Promise<void> {
  const admin = getAdminClient();

  const status = resultCode === "1032" ? "CANCELLED" : "FAILED";

  await admin
    .from("CashSalePayment")
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

export async function getCashSalePaymentByCheckoutRequestId(
  checkoutRequestId: string
): Promise<CashSalePayment | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("CashSalePayment")
    .select("*")
    .eq("checkoutRequestId", checkoutRequestId)
    .single();
  return data as CashSalePayment | null;
}

export async function getCashSalePaymentsBySaleId(
  cashSaleId: string
): Promise<CashSalePayment[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("CashSalePayment")
    .select("*")
    .eq("cashSaleId", cashSaleId)
    .order("createdAt", { ascending: false });
  return (data || []) as CashSalePayment[];
}
