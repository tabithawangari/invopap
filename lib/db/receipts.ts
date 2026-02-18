// lib/db/receipts.ts — Receipt CRUD operations (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type { Receipt, ReceiptWithPhotos } from "./types";
import type { TenantContext } from "@/lib/session";
import { processImageField } from "@/lib/storage";
import { calculateReceiptBalance } from "@/lib/utils/receipt-totals";
import type { CreateReceiptInput, UpdateReceiptInput } from "@/lib/validators";

// =============================================================================
// Receipt Number Generation
// =============================================================================

function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const suffix = createId().substring(0, 10).toUpperCase();
  return `RCT-${year}-${suffix}`;
}

// =============================================================================
// Tenant Query Helpers
// =============================================================================

function applyTenantFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  ctx: TenantContext
) {
  if (ctx.userId) {
    return query.eq("userId", ctx.userId);
  }
  if (ctx.guestSessionId) {
    return query.eq("guestSessionId", ctx.guestSessionId);
  }
  throw new Error("No tenant context");
}

// =============================================================================
// Receipt CRUD
// =============================================================================

export async function createReceipt(
  ctx: TenantContext,
  input: CreateReceiptInput
): Promise<ReceiptWithPhotos> {
  const admin = getAdminClient();
  const receiptId = createId();
  const publicId = createId();

  // Process images
  const logoDataUrl = await processImageField(input.logoDataUrl, "logos");
  const signatureDataUrl = await processImageField(
    input.signatureDataUrl,
    "signatures"
  );

  const receiptNumber = input.receiptNumber || generateReceiptNumber();

  // Server-side balance calculation — separate from invoice totals
  const { totalAmountOwed, amountReceived, outstandingBalance } =
    calculateReceiptBalance({
      totalAmountOwed: input.totalAmountOwed ?? 0,
      amountReceived: input.amountReceived ?? 0,
    });

  const receiptRecord = {
    id: receiptId,
    publicId,
    userId: ctx.userId,
    guestSessionId: ctx.guestSessionId,
    documentTitle: input.documentTitle || "OFFICIAL RECEIPT",
    receiptNumber,
    issueDate: input.issueDate || new Date().toISOString(),
    fromName: input.fromName,
    fromEmail: input.fromEmail || null,
    fromPhone: input.fromPhone || null,
    fromMobile: input.fromMobile || null,
    fromFax: input.fromFax || null,
    fromAddress: input.fromAddress || null,
    fromCity: input.fromCity || null,
    fromZipCode: input.fromZipCode || null,
    fromBusinessNumber: input.fromBusinessNumber || null,
    toName: input.toName,
    toEmail: input.toEmail || null,
    toPhone: input.toPhone || null,
    toMobile: input.toMobile || null,
    toFax: input.toFax || null,
    toAddress: input.toAddress || null,
    toCity: input.toCity || null,
    toZipCode: input.toZipCode || null,
    toBusinessNumber: input.toBusinessNumber || null,
    currency: input.currency || "KES",
    totalAmountOwed,
    amountReceived,
    outstandingBalance,
    amountInWords: input.amountInWords || null,
    beingPaymentOf: input.beingPaymentOf || null,
    paymentMethod: input.paymentMethod || "cash",
    transactionCode: input.transactionCode || null,
    accentColor: input.accentColor || "#4c1d95",
    logoDataUrl,
    signatureDataUrl,
    notes: input.notes || null,
  };

  // Insert receipt
  const { error: receiptError } = await admin
    .from("Receipt")
    .insert(receiptRecord);

  if (receiptError) {
    throw new Error(`Failed to create receipt: ${receiptError.message}`);
  }

  // Process photo uploads
  const photos: {
    id: string;
    receiptId: string;
    url: string;
    sortOrder: number;
  }[] = [];
  if (input.photoDataUrls) {
    for (let i = 0; i < input.photoDataUrls.length; i++) {
      const url = await processImageField(input.photoDataUrls[i], "photos");
      if (url) {
        photos.push({
          id: createId(),
          receiptId: receiptId,
          url,
          sortOrder: i,
        });
      }
    }
    if (photos.length > 0) {
      await admin.from("ReceiptPhoto").insert(photos);
    }
  }

  return {
    ...(receiptRecord as unknown as Receipt),
    id: receiptId,
    publicId,
    isPaid: false,
    paidAt: null,
    pdfUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    photos: photos.map((p) => ({
      ...p,
      filename: null,
      createdAt: new Date().toISOString(),
    })),
  };
}

export async function getReceiptById(
  ctx: TenantContext,
  id: string
): Promise<ReceiptWithPhotos | null> {
  const admin = getAdminClient();

  let query = admin.from("Receipt").select("*").eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { data: receipt } = await query.single();
  if (!receipt) return null;

  const { data: photos } = await admin
    .from("ReceiptPhoto")
    .select("*")
    .eq("receiptId", id)
    .order("sortOrder");

  return {
    ...receipt,
    photos: photos || [],
  };
}

export async function getReceiptByPublicId(
  publicId: string
): Promise<ReceiptWithPhotos | null> {
  const admin = getAdminClient();

  const { data: receipt } = await admin
    .from("Receipt")
    .select("*")
    .eq("publicId", publicId)
    .single();

  if (!receipt) return null;

  const { data: photos } = await admin
    .from("ReceiptPhoto")
    .select("*")
    .eq("receiptId", receipt.id)
    .order("sortOrder");

  return {
    ...receipt,
    photos: photos || [],
  };
}

export async function updateReceipt(
  ctx: TenantContext,
  id: string,
  input: UpdateReceiptInput
): Promise<ReceiptWithPhotos | null> {
  const admin = getAdminClient();

  // Verify ownership
  let ownerCheck = admin.from("Receipt").select("id, totalAmountOwed, amountReceived").eq("id", id);
  ownerCheck = applyTenantFilter(ownerCheck, ctx);
  const { data: existing } = await ownerCheck.single();
  if (!existing) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  if (input.logoDataUrl !== undefined) {
    updates.logoDataUrl = await processImageField(input.logoDataUrl, "logos");
  }
  if (input.signatureDataUrl !== undefined) {
    updates.signatureDataUrl = await processImageField(
      input.signatureDataUrl,
      "signatures"
    );
  }

  // Copy scalar fields
  const scalarFields = [
    "documentTitle",
    "receiptNumber",
    "issueDate",
    "fromName",
    "fromEmail",
    "fromPhone",
    "fromMobile",
    "fromFax",
    "fromAddress",
    "fromCity",
    "fromZipCode",
    "fromBusinessNumber",
    "toName",
    "toEmail",
    "toPhone",
    "toMobile",
    "toFax",
    "toAddress",
    "toCity",
    "toZipCode",
    "toBusinessNumber",
    "currency",
    "totalAmountOwed",
    "amountReceived",
    "amountInWords",
    "beingPaymentOf",
    "paymentMethod",
    "transactionCode",
    "accentColor",
    "notes",
  ] as const;

  for (const field of scalarFields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  // Recalculate balance server-side if financial fields changed
  const newTotalOwed =
    input.totalAmountOwed ?? (existing.totalAmountOwed as number);
  const newAmountReceived =
    input.amountReceived ?? (existing.amountReceived as number);

  if (
    input.totalAmountOwed !== undefined ||
    input.amountReceived !== undefined
  ) {
    const { outstandingBalance } = calculateReceiptBalance({
      totalAmountOwed: newTotalOwed,
      amountReceived: newAmountReceived,
    });
    updates.outstandingBalance = outstandingBalance;
  }

  // Handle photo replacements
  if (input.photoDataUrls !== undefined) {
    await admin.from("ReceiptPhoto").delete().eq("receiptId", id);

    const photos: {
      id: string;
      receiptId: string;
      url: string;
      sortOrder: number;
    }[] = [];
    for (let i = 0; i < input.photoDataUrls.length; i++) {
      const url = await processImageField(input.photoDataUrls[i], "photos");
      if (url) {
        photos.push({
          id: createId(),
          receiptId: id,
          url,
          sortOrder: i,
        });
      }
    }
    if (photos.length > 0) {
      await admin.from("ReceiptPhoto").insert(photos);
    }

    // Clear cached PDF
    updates.pdfUrl = null;
  }

  // Update receipt
  if (Object.keys(updates).length > 0) {
    updates.pdfUrl = null; // Always clear cached PDF on update
    await admin.from("Receipt").update(updates).eq("id", id);
  }

  return getReceiptById(ctx, id);
}

export async function deleteReceipt(
  ctx: TenantContext,
  id: string
): Promise<boolean> {
  const admin = getAdminClient();

  let query = admin.from("Receipt").delete().eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { error, count } = await query;
  if (error) throw new Error(`Failed to delete receipt: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function listReceipts(
  ctx: TenantContext,
  params: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    cursor?: string;
  }
): Promise<{ receipts: Receipt[]; total: number }> {
  const admin = getAdminClient();

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy || "createdAt";
  const orderDir = params.orderDir || "desc";

  let query = admin
    .from("Receipt")
    .select("*", { count: "exact" })
    .order(orderBy, { ascending: orderDir === "asc" })
    .range(offset, offset + limit - 1);

  query = applyTenantFilter(query, ctx);

  if (params.cursor) {
    const [cursorDate, cursorId] = params.cursor.split("_");
    if (cursorDate && cursorId) {
      query = query.or(
        `createdAt.lt.${cursorDate},and(createdAt.eq.${cursorDate},id.lt.${cursorId})`
      );
    }
  }

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to list receipts: ${error.message}`);

  return {
    receipts: data || [],
    total: count || 0,
  };
}

// =============================================================================
// Receipt Payment Helpers
// =============================================================================

export async function markReceiptPaid(
  receiptId: string,
  paidAt?: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("Receipt")
    .update({
      isPaid: true,
      paidAt: paidAt || new Date().toISOString(),
    })
    .eq("id", receiptId);
}

export async function updateReceiptPdfUrl(
  receiptId: string,
  pdfUrl: string
): Promise<void> {
  const admin = getAdminClient();
  await admin.from("Receipt").update({ pdfUrl }).eq("id", receiptId);
}
