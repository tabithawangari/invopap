// lib/db/cash-sales.ts — Cash Sale CRUD (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type {
  CashSale,
  CashSaleWithItems,
  CashSaleLineItem,
} from "./types";
import type { TenantContext } from "@/lib/session";
import { calculateCashSaleTotals } from "@/lib/utils/cash-sale-totals";
import { processImageField } from "@/lib/storage";
import type {
  CreateCashSaleInput,
  UpdateCashSaleInput,
} from "@/lib/validators";

// =============================================================================
// Cash Sale Number Generation
// =============================================================================

function generateCashSaleNumber(): string {
  const year = new Date().getFullYear();
  const suffix = createId().substring(0, 10).toUpperCase();
  return `CSH-${year}-${suffix}`;
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
// Cash Sale CRUD
// =============================================================================

export async function createCashSale(
  ctx: TenantContext,
  input: CreateCashSaleInput
): Promise<CashSaleWithItems> {
  const admin = getAdminClient();
  const cashSaleId = createId();
  const publicId = createId();

  // Process images
  const logoDataUrl = await processImageField(input.logoDataUrl, "logos");
  const signatureDataUrl = await processImageField(
    input.signatureDataUrl,
    "signatures"
  );

  // Calculate totals server-side (using SEPARATE cash sale totals function)
  const totals = calculateCashSaleTotals({
    items: input.items.map((i) => ({ quantity: i.quantity, rate: i.rate })),
    taxRate: input.taxRate ?? 0,
    discountType: (input.discountType as "PERCENTAGE" | "FIXED") ?? "PERCENTAGE",
    discountValue: input.discountValue ?? 0,
  });

  const cashSaleNumber =
    input.cashSaleNumber || generateCashSaleNumber();

  // Build record — WITH financial fields
  const saleRecord = {
    id: cashSaleId,
    publicId,
    userId: ctx.userId,
    guestSessionId: ctx.guestSessionId,
    documentTitle: input.documentTitle || "CASH SALE",
    cashSaleNumber,
    issueDate: input.issueDate || new Date().toISOString(),
    orderNumber: input.orderNumber || null,
    referenceInvoiceNumber: input.referenceInvoiceNumber || null,
    paymentMethod: input.paymentMethod || "cash",
    transactionCode: input.transactionCode || null,
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
    taxRate: input.taxRate ?? 0,
    discountType: input.discountType || "PERCENTAGE",
    discountValue: input.discountValue ?? 0,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    discountAmount: totals.discountAmount,
    total: totals.total,
    accentColor: input.accentColor || "#22c55e",
    logoDataUrl,
    signatureDataUrl,
    notes: input.notes || null,
  };

  // Insert cash sale
  const { error: saleError } = await admin
    .from("CashSale")
    .insert(saleRecord);

  if (saleError) {
    throw new Error(`Failed to create cash sale: ${saleError.message}`);
  }

  // Insert line items — WITH rate and amount
  const lineItems: Omit<CashSaleLineItem, "createdAt" | "updatedAt">[] =
    input.items.map((item, index) => ({
      id: createId(),
      cashSaleId: cashSaleId,
      description: item.description,
      additionalDetails: item.additionalDetails || null,
      quantity: item.quantity,
      rate: item.rate,
      amount: totals.lineAmounts[index],
      sortOrder: index,
    }));

  const { error: itemsError } = await admin
    .from("CashSaleLineItem")
    .insert(lineItems);

  if (itemsError) {
    throw new Error(`Failed to create line items: ${itemsError.message}`);
  }

  // Process photo uploads
  const photos: { id: string; cashSaleId: string; url: string; sortOrder: number }[] = [];
  if (input.photoDataUrls) {
    for (let i = 0; i < input.photoDataUrls.length; i++) {
      const url = await processImageField(input.photoDataUrls[i], "photos");
      if (url) {
        photos.push({
          id: createId(),
          cashSaleId: cashSaleId,
          url,
          sortOrder: i,
        });
      }
    }
    if (photos.length > 0) {
      await admin.from("CashSalePhoto").insert(photos);
    }
  }

  return {
    ...(saleRecord as unknown as CashSale),
    id: cashSaleId,
    publicId,
    isPaid: false,
    paidAt: null,
    pdfUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lineItems: lineItems.map((li) => ({
      ...li,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as CashSaleLineItem[],
    photos: photos.map((p) => ({
      ...p,
      filename: null,
      createdAt: new Date().toISOString(),
    })),
  };
}

export async function getCashSaleById(
  ctx: TenantContext,
  id: string
): Promise<CashSaleWithItems | null> {
  const admin = getAdminClient();

  let query = admin.from("CashSale").select("*").eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { data: sale } = await query.single();
  if (!sale) return null;

  const { data: lineItems } = await admin
    .from("CashSaleLineItem")
    .select("*")
    .eq("cashSaleId", id)
    .order("sortOrder");

  const { data: photos } = await admin
    .from("CashSalePhoto")
    .select("*")
    .eq("cashSaleId", id)
    .order("sortOrder");

  return {
    ...sale,
    lineItems: lineItems || [],
    photos: photos || [],
  };
}

export async function getCashSaleByPublicId(
  publicId: string
): Promise<CashSaleWithItems | null> {
  const admin = getAdminClient();

  const { data: sale } = await admin
    .from("CashSale")
    .select("*")
    .eq("publicId", publicId)
    .single();

  if (!sale) return null;

  const { data: lineItems } = await admin
    .from("CashSaleLineItem")
    .select("*")
    .eq("cashSaleId", sale.id)
    .order("sortOrder");

  const { data: photos } = await admin
    .from("CashSalePhoto")
    .select("*")
    .eq("cashSaleId", sale.id)
    .order("sortOrder");

  return {
    ...sale,
    lineItems: lineItems || [],
    photos: photos || [],
  };
}

export async function updateCashSale(
  ctx: TenantContext,
  id: string,
  input: UpdateCashSaleInput
): Promise<CashSaleWithItems | null> {
  const admin = getAdminClient();

  // Verify ownership
  let ownerCheck = admin.from("CashSale").select("id").eq("id", id);
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
    "documentTitle", "cashSaleNumber", "issueDate",
    "orderNumber", "referenceInvoiceNumber",
    "paymentMethod", "transactionCode",
    "fromName", "fromEmail", "fromPhone", "fromMobile",
    "fromFax", "fromAddress", "fromCity", "fromZipCode", "fromBusinessNumber",
    "toName", "toEmail", "toPhone", "toMobile", "toFax", "toAddress",
    "toCity", "toZipCode", "toBusinessNumber",
    "currency", "taxRate", "discountType", "discountValue",
    "accentColor", "notes",
  ] as const;

  for (const field of scalarFields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  // Replace line items if provided + recalculate totals
  if (input.items) {
    const totals = calculateCashSaleTotals({
      items: input.items.map((i) => ({ quantity: i.quantity, rate: i.rate })),
      taxRate: (input.taxRate ?? updates.taxRate) ?? 0,
      discountType: ((input.discountType ?? updates.discountType) as "PERCENTAGE" | "FIXED") ?? "PERCENTAGE",
      discountValue: (input.discountValue ?? updates.discountValue) ?? 0,
    });

    updates.subtotal = totals.subtotal;
    updates.taxAmount = totals.taxAmount;
    updates.discountAmount = totals.discountAmount;
    updates.total = totals.total;

    await admin.from("CashSaleLineItem").delete().eq("cashSaleId", id);

    const lineItems = input.items.map((item, index) => ({
      id: createId(),
      cashSaleId: id,
      description: item.description,
      additionalDetails: item.additionalDetails || null,
      quantity: item.quantity,
      rate: item.rate,
      amount: totals.lineAmounts[index],
      sortOrder: index,
    }));

    await admin.from("CashSaleLineItem").insert(lineItems);

    // Clear cached PDF
    updates.pdfUrl = null;
  }

  // Update cash sale
  if (Object.keys(updates).length > 0) {
    await admin.from("CashSale").update(updates).eq("id", id);
  }

  return getCashSaleById(ctx, id);
}

export async function deleteCashSale(
  ctx: TenantContext,
  id: string
): Promise<boolean> {
  const admin = getAdminClient();

  let query = admin.from("CashSale").delete().eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { error, count } = await query;
  if (error) throw new Error(`Failed to delete cash sale: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function listCashSales(
  ctx: TenantContext,
  params: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    cursor?: string;
  }
): Promise<{ cashSales: CashSale[]; total: number }> {
  const admin = getAdminClient();

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy || "createdAt";
  const orderDir = params.orderDir || "desc";

  let query = admin
    .from("CashSale")
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

  if (error) throw new Error(`Failed to list cash sales: ${error.message}`);

  return {
    cashSales: data || [],
    total: count || 0,
  };
}

// =============================================================================
// Cash Sale Payment Helpers
// =============================================================================

export async function markCashSalePaid(
  cashSaleId: string,
  paidAt?: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("CashSale")
    .update({
      isPaid: true,
      paidAt: paidAt || new Date().toISOString(),
    })
    .eq("id", cashSaleId);
}

export async function updateCashSalePdfUrl(
  cashSaleId: string,
  pdfUrl: string
): Promise<void> {
  const admin = getAdminClient();
  await admin.from("CashSale").update({ pdfUrl }).eq("id", cashSaleId);
}
