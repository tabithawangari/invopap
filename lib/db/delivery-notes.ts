// lib/db/delivery-notes.ts — Delivery Note CRUD (admin client)
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import type {
  DeliveryNote,
  DeliveryNoteWithItems,
  DeliveryNoteLineItem,
} from "./types";
import type { TenantContext } from "@/lib/session";
import { processImageField } from "@/lib/storage";
import type {
  CreateDeliveryNoteInput,
  UpdateDeliveryNoteInput,
} from "@/lib/validators";

// =============================================================================
// Delivery Note Number Generation
// =============================================================================

function generateDeliveryNoteNumber(): string {
  const year = new Date().getFullYear();
  const suffix = createId().substring(0, 10).toUpperCase();
  return `DLN-${year}-${suffix}`;
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
// Delivery Note CRUD
// =============================================================================

export async function createDeliveryNote(
  ctx: TenantContext,
  input: CreateDeliveryNoteInput
): Promise<DeliveryNoteWithItems> {
  const admin = getAdminClient();
  const noteId = createId();
  const publicId = createId();

  // Process images
  const logoDataUrl = await processImageField(input.logoDataUrl, "logos");
  const signatureDataUrl = await processImageField(
    input.signatureDataUrl,
    "signatures"
  );

  const deliveryNoteNumber =
    input.deliveryNoteNumber || generateDeliveryNoteNumber();

  // Build record — NO financial fields
  const noteRecord = {
    id: noteId,
    publicId,
    userId: ctx.userId,
    guestSessionId: ctx.guestSessionId,
    documentTitle: input.documentTitle || "DELIVERY NOTE",
    deliveryNoteNumber,
    issueDate: input.issueDate || new Date().toISOString(),
    orderNumber: input.orderNumber || null,
    referenceInvoiceNumber: input.referenceInvoiceNumber || null,
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
    acknowledgmentText: input.acknowledgmentText || "Goods received in good order",
    accentColor: input.accentColor || "#0d9488",
    logoDataUrl,
    signatureDataUrl,
    notes: input.notes || null,
  };

  // Insert delivery note
  const { error: noteError } = await admin
    .from("DeliveryNote")
    .insert(noteRecord);

  if (noteError) {
    throw new Error(`Failed to create delivery note: ${noteError.message}`);
  }

  // Insert line items — NO rate or amount
  const lineItems: Omit<DeliveryNoteLineItem, "createdAt" | "updatedAt">[] =
    input.items.map((item, index) => ({
      id: createId(),
      deliveryNoteId: noteId,
      description: item.description,
      additionalDetails: item.additionalDetails || null,
      quantity: item.quantity,
      sortOrder: index,
    }));

  const { error: itemsError } = await admin
    .from("DeliveryNoteLineItem")
    .insert(lineItems);

  if (itemsError) {
    throw new Error(`Failed to create line items: ${itemsError.message}`);
  }

  // Process photo uploads
  const photos: { id: string; deliveryNoteId: string; url: string; sortOrder: number }[] = [];
  if (input.photoDataUrls) {
    for (let i = 0; i < input.photoDataUrls.length; i++) {
      const url = await processImageField(input.photoDataUrls[i], "photos");
      if (url) {
        photos.push({
          id: createId(),
          deliveryNoteId: noteId,
          url,
          sortOrder: i,
        });
      }
    }
    if (photos.length > 0) {
      await admin.from("DeliveryNotePhoto").insert(photos);
    }
  }

  return {
    ...(noteRecord as unknown as DeliveryNote),
    id: noteId,
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
    })) as DeliveryNoteLineItem[],
    photos: photos.map((p) => ({
      ...p,
      filename: null,
      createdAt: new Date().toISOString(),
    })),
  };
}

export async function getDeliveryNoteById(
  ctx: TenantContext,
  id: string
): Promise<DeliveryNoteWithItems | null> {
  const admin = getAdminClient();

  let query = admin.from("DeliveryNote").select("*").eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { data: note } = await query.single();
  if (!note) return null;

  const { data: lineItems } = await admin
    .from("DeliveryNoteLineItem")
    .select("*")
    .eq("deliveryNoteId", id)
    .order("sortOrder");

  const { data: photos } = await admin
    .from("DeliveryNotePhoto")
    .select("*")
    .eq("deliveryNoteId", id)
    .order("sortOrder");

  return {
    ...note,
    lineItems: lineItems || [],
    photos: photos || [],
  };
}

export async function getDeliveryNoteByPublicId(
  publicId: string
): Promise<DeliveryNoteWithItems | null> {
  const admin = getAdminClient();

  const { data: note } = await admin
    .from("DeliveryNote")
    .select("*")
    .eq("publicId", publicId)
    .single();

  if (!note) return null;

  const { data: lineItems } = await admin
    .from("DeliveryNoteLineItem")
    .select("*")
    .eq("deliveryNoteId", note.id)
    .order("sortOrder");

  const { data: photos } = await admin
    .from("DeliveryNotePhoto")
    .select("*")
    .eq("deliveryNoteId", note.id)
    .order("sortOrder");

  return {
    ...note,
    lineItems: lineItems || [],
    photos: photos || [],
  };
}

export async function updateDeliveryNote(
  ctx: TenantContext,
  id: string,
  input: UpdateDeliveryNoteInput
): Promise<DeliveryNoteWithItems | null> {
  const admin = getAdminClient();

  // Verify ownership
  let ownerCheck = admin.from("DeliveryNote").select("id").eq("id", id);
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
    "documentTitle", "deliveryNoteNumber", "issueDate",
    "orderNumber", "referenceInvoiceNumber",
    "fromName", "fromEmail", "fromPhone", "fromMobile",
    "fromFax", "fromAddress", "fromCity", "fromZipCode", "fromBusinessNumber",
    "toName", "toEmail", "toPhone", "toMobile", "toFax", "toAddress",
    "toCity", "toZipCode", "toBusinessNumber",
    "acknowledgmentText", "accentColor", "notes",
  ] as const;

  for (const field of scalarFields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  // Replace line items if provided
  if (input.items) {
    await admin.from("DeliveryNoteLineItem").delete().eq("deliveryNoteId", id);

    const lineItems = input.items.map((item, index) => ({
      id: createId(),
      deliveryNoteId: id,
      description: item.description,
      additionalDetails: item.additionalDetails || null,
      quantity: item.quantity,
      sortOrder: index,
    }));

    await admin.from("DeliveryNoteLineItem").insert(lineItems);

    // Clear cached PDF
    updates.pdfUrl = null;
  }

  // Update delivery note
  if (Object.keys(updates).length > 0) {
    await admin.from("DeliveryNote").update(updates).eq("id", id);
  }

  return getDeliveryNoteById(ctx, id);
}

export async function deleteDeliveryNote(
  ctx: TenantContext,
  id: string
): Promise<boolean> {
  const admin = getAdminClient();

  let query = admin.from("DeliveryNote").delete().eq("id", id);
  query = applyTenantFilter(query, ctx);

  const { error, count } = await query;
  if (error) throw new Error(`Failed to delete delivery note: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function listDeliveryNotes(
  ctx: TenantContext,
  params: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    cursor?: string;
  }
): Promise<{ deliveryNotes: DeliveryNote[]; total: number }> {
  const admin = getAdminClient();

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy || "createdAt";
  const orderDir = params.orderDir || "desc";

  let query = admin
    .from("DeliveryNote")
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

  if (error) throw new Error(`Failed to list delivery notes: ${error.message}`);

  return {
    deliveryNotes: data || [],
    total: count || 0,
  };
}

// =============================================================================
// Delivery Note Payment Helpers
// =============================================================================

export async function markDeliveryNotePaid(
  deliveryNoteId: string,
  paidAt?: string
): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("DeliveryNote")
    .update({
      isPaid: true,
      paidAt: paidAt || new Date().toISOString(),
    })
    .eq("id", deliveryNoteId);
}

export async function updateDeliveryNotePdfUrl(
  deliveryNoteId: string,
  pdfUrl: string
): Promise<void> {
  const admin = getAdminClient();
  await admin.from("DeliveryNote").update({ pdfUrl }).eq("id", deliveryNoteId);
}
