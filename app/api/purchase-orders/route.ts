// app/api/purchase-orders/route.ts — GET (list) / POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/session";
import { createPurchaseOrder, listPurchaseOrders } from "@/lib/db";
import { CreatePurchaseOrderSchema, ListPurchaseOrdersSchema } from "@/lib/validators";
import {
  checkRateLimit,
  invoiceCreateLimiter,
  privateCrudLimiter,
  guestInvoiceLimiter,
} from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = ListPurchaseOrdersSchema.parse({
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      orderBy: url.searchParams.get("orderBy"),
      orderDir: url.searchParams.get("orderDir"),
      cursor: url.searchParams.get("cursor"),
    });

    const { purchaseOrders, total } = await listPurchaseOrders(ctx, params);

    logger.done("list_purchase_orders", { total, count: purchaseOrders.length });

    return NextResponse.json(
      { purchaseOrders, total, limit: params.limit, offset: params.offset },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    logger.error("list_purchase_orders_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to list purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(invoiceCreateLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Guest abuse prevention
    if (ctx.guestSessionId) {
      const guestLimited = await checkRateLimit(guestInvoiceLimiter, request);
      if (guestLimited) {
        return NextResponse.json(
          { error: "Guest limit reached. Please sign in." },
          { status: 403 }
        );
      }

      const { total } = await listPurchaseOrders(ctx, { limit: 1 });
      if (total >= 50) {
        return NextResponse.json(
          { error: "Guest purchase order limit reached. Please sign in." },
          { status: 403 }
        );
      }
    }

    const rawBody = await request.text();
    if (rawBody.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Request too large (max 4MB)" },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    const validated = CreatePurchaseOrderSchema.parse(body);

    const purchaseOrder = await createPurchaseOrder(ctx, validated);

    logger.done("create_purchase_order", {
      purchaseOrderId: purchaseOrder.id,
      publicId: purchaseOrder.publicId,
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        {
          error: "Validation failed",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: (error as any).issues,
        },
        { status: 400 }
      );
    }

    logger.error("create_purchase_order_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
