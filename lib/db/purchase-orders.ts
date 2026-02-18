// lib/db/purchase-orders.ts — Purchase Order CRUD (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type {
  PurchaseOrder,
  PurchaseOrderWithItems,
  PurchaseOrderLineItem,
} from "./types";
import type { TenantContext } from "@/lib/session";
import { calculatePurchaseOrderTotals } from "@/lib/utils/purchase-order-totals";
import { processImageField } from "@/lib/storage";
import type {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "@/lib/validators";

// =============================================================================
// Purchase Order Number Generation
// =============================================================================

function generatePurchaseOrderNumber(): string {
  const year = new Date().getFullYear();
  const suffix = createId().substring(0, 10).toUpperCase();
  return `PO-${year}-${suffix}`;
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
// Purchase Order CRUD
// =============================================================================

export async function createPurchaseOrder(
  ctx: TenantContext,
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrderWithItems> {
  const admin = getAdminClient();
  const purchaseOrderId = createId();
  const publicId = createId();

  // Process images
  const logoDataUrl = await processImageField(input.logoDataUrl, "logos");
  const signatureDataUrl = await processImageField(
    input.signatureDataUrl,
    "signatures"
  );

  // Calculate totals server-side (using SEPARATE PO totals function — NO discount)
  const totals = calculatePurchaseOrderTotals({
    items: input.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    taxRate: input.taxRate ?? 0,
  });

  const purchaseOrderNumber =
    input.purchaseOrderNumber || generatePurchaseOrderNumber();

  // Build record
  const poRecord = {
    id: purchaseOrderId,
    publicId,
    userId: ctx.userId,
    guestSessionId: ctx.guestSessionId,
    documentTitle: input.documentTitle || "PURCHASE ORDER",
    purchaseOrderNumber,
    issueDate: input.issueDate || new Date().toISOString(),
    expectedDeliveryDate: input.expectedDeliveryDate || null,
    paymentTerms: input.paymentTerms || null,
    orderNumber: input.orderNumber || null,
    fromName: input.fromName,
    fromEmail: input.fromEmail || null,
    fromPhone: input.fromPhone || null,
    fromMobile: input.fromMobile || null,
    fromFax: input.fromFax || null,
    fromAddress: input.fromAddress || null,
    fromCity: input.fromCity || null,
    fromZipCode: input.fromZipCode || null,
    fromBusinessNumber: input.fromBusinessNumber || null,
    fromWebsite: input.fromWebsite || null,
    toName: input.toName,
    toEmail: input.toEmail || null,
    toPhone: input.toPhone || null,
    toMobile: input.toMobile || null,
    toFax: input.toFax || null,
    toAddress: input.toAddress || null,
    toCity: input.toCity || null,
    toZipCode: input.toZipCode || null,
    toBusinessNumber: input.toBusinessNumber || null,
    shipToEnabled: input.shipToEnabled ?? false,
    shipToName: input.shipToName || null,
    shipToCompanyName: input.shipToCompanyName || null,
    shipToAddress: input.shipToAddress || null,
    shipToCity: input.shipToCity || null,
    shipToZipCode: input.shipToZipCode || null,
    shipToPhone: input.shipToPhone || null,
    authorizedByName: input.authorizedByName || null,
    authorizedByDesignation: input.authorizedByDesignation || null,
    currency: input.currency || "KES",
    taxRate: input.taxRate ?? 0,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    total: totals.total,
    accentColor: input.accentColor || "#d97706",
    logoDataUrl,
    signatureDataUrl,
    notes: input.notes || null,
  };

  // Insert purchase order
  const { error: poError } = await admin
    .from("PurchaseOrder")
    .insert(poRecord);

  if (poError) {
    throw new Error(`Failed to create purchase order: ${poError.message}`);
  }

  // Insert line items — with unitPrice and amount
  const lineItems: Omit<PurchaseOrderLineItem, "createdAt" | "updatedAt">[] =
    input.items.map((item, index) => ({
      id: createId(),
      purchaseOrderId: purchaseOrderId,
      description: item.description,
      additionalDetails: item.additionalDetails || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: totals.lineAmounts[index],
      sortOrder: index,
    }));

  const { error: itemsError } = await admin
    .from("PurchaseOrderLineItem")
    .insert(lineItems);

  if (itemsError) {
    throw new Error(`Failed to create line items: ${itemsError.message}`);
  }

  // Process photo uploads
  const photos: { id: string; purchaseOrderId: string; url: string; sortOrder: number }[] = [];
  if (input.photoDataUrls) {
    for (let i = 0; i < input.photoDataUrls.length; i++) {
      const url = await processImageField(input.photoDataUrls[i], "photos");
      if (url) {
        photos.push({
          id: createId(),
          purchaseOrderId: purchaseOrderId,
          url,
          sortOrder: i,
        });
      }
    }
    if (photos.length > 0) {
      await admin.from("PurchaseOrderPhoto").insert(photos);
    }
  }

  return {
    ...(poRecord as unknown as PurchaseOrder),
    id: purchaseOrderId,
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
    })) as PurchaseOrderLineItem[],
    photos: photos.map((p) => ({
      ...p,
      filename: null,
      createdAt: new Date().toISOString(),
    })),
  };
}

export async function getPurchaseOrderById(
  ctx: TenantContext,
  id: string
): Promise<PurchaseOrderWithItems | null> {
  const admin = getAdminClient();

  let query = admin.from("PurchaseOrder").select("*").eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { data: po } = await query.single();
  if (!po) return null;

  const { data: lineItems } = await admin
    .from("PurchaseOrderLineItem")
    .select("*")
    .eq("purchaseOrderId", id)
    .order("sortOrder");

  const { data: photos } = await admin
    .from("PurchaseOrderPhoto")
    .select("*")
    .eq("purchaseOrderId", id)
    .order("sortOrder");

  return {
    ...po,
    lineItems: lineItems || [],
    photos: photos || [],
  };
}

export async function getPurchaseOrderByPublicId(
  publicId: string
): Promise<PurchaseOrderWithItems | null> {
  const admin = getAdminClient();

  const { data: po } = await admin
    .from("PurchaseOrder")
    .select("*")
    .eq("publicId", publicId)
    .single();

  if (!po) return null;

  const { data: lineItems } = await admin
    .from("PurchaseOrderLineItem")
    .select("*")
    .eq("purchaseOrderId", po.id)
    .order("sortOrder");

  const { data: photos } = await admin
    .from("PurchaseOrderPhoto")
    .select("*")
    .eq("purchaseOrderId", po.id)
    .order("sortOrder");

  return {
    ...po,
    lineItems: lineItems || [],
    photos: photos || [],
  };
}

export async function updatePurchaseOrder(
  ctx: TenantContext,
  id: string,
  input: UpdatePurchaseOrderInput
): Promise<PurchaseOrderWithItems | null> {
  const admin = getAdminClient();

  // Verify ownership
  let ownerCheck = admin.from("PurchaseOrder").select("id").eq("id", id);
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
    "documentTitle", "purchaseOrderNumber", "issueDate",
    "expectedDeliveryDate", "paymentTerms", "orderNumber",
    "fromName", "fromEmail", "fromPhone", "fromMobile",
    "fromFax", "fromAddress", "fromCity", "fromZipCode",
    "fromBusinessNumber", "fromWebsite",
    "toName", "toEmail", "toPhone", "toMobile", "toFax", "toAddress",
    "toCity", "toZipCode", "toBusinessNumber",
    "shipToEnabled", "shipToName", "shipToCompanyName",
    "shipToAddress", "shipToCity", "shipToZipCode", "shipToPhone",
    "authorizedByName", "authorizedByDesignation",
    "currency", "taxRate",
    "accentColor", "notes",
  ] as const;

  for (const field of scalarFields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  // Replace line items if provided + recalculate totals
  if (input.items) {
    const totals = calculatePurchaseOrderTotals({
      items: input.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      taxRate: (input.taxRate ?? updates.taxRate) ?? 0,
    });

    updates.subtotal = totals.subtotal;
    updates.taxAmount = totals.taxAmount;
    updates.total = totals.total;

    await admin.from("PurchaseOrderLineItem").delete().eq("purchaseOrderId", id);

    const lineItems = input.items.map((item, index) => ({
      id: createId(),
      purchaseOrderId: id,
      description: item.description,
      additionalDetails: item.additionalDetails || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: totals.lineAmounts[index],
      sortOrder: index,
    }));

    await admin.from("PurchaseOrderLineItem").insert(lineItems);

    // Clear cached PDF
    updates.pdfUrl = null;
  }

  // Update purchase order
  if (Object.keys(updates).length > 0) {
    await admin.from("PurchaseOrder").update(updates).eq("id", id);
  }

  return getPurchaseOrderById(ctx, id);
}

export async function deletePurchaseOrder(
  ctx: TenantContext,
  id: string
): Promise<boolean> {
  const admin = getAdminClient();

  let query = admin.from("PurchaseOrder").delete().eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { error, count } = await query;
  if (error) throw new Error(`Failed to delete purchase order: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function listPurchaseOrders(
  ctx: TenantContext,
  params: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    cursor?: string;
  }
): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
  const admin = getAdminClient();

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy || "createdAt";
  const orderDir = params.orderDir || "desc";

  let query = admin
    .from("PurchaseOrder")
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

  if (error) throw new Error(`Failed to list purchase orders: ${error.message}`);

  return {
    purchaseOrders: data || [],
    total: count || 0,
  };
}

// =============================================================================
// Purchase Order Payment Helpers
// =============================================================================

export async function markPurchaseOrderPaid(
  purchaseOrderId: string,
  paidAt?: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("PurchaseOrder")
    .update({
      isPaid: true,
      paidAt: paidAt || new Date().toISOString(),
    })
    .eq("id", purchaseOrderId);
}

export async function updatePurchaseOrderPdfUrl(
  purchaseOrderId: string,
  pdfUrl: string
): Promise<void> {
  const admin = getAdminClient();
  await admin.from("PurchaseOrder").update({ pdfUrl }).eq("id", purchaseOrderId);
}
