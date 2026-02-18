// app/api/receipts/route.ts — GET (list) / POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/session";
import { createReceipt, listReceipts } from "@/lib/db";
import { CreateReceiptSchema, ListReceiptsSchema } from "@/lib/validators";
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
    const params = ListReceiptsSchema.parse({
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      orderBy: url.searchParams.get("orderBy"),
      orderDir: url.searchParams.get("orderDir"),
      cursor: url.searchParams.get("cursor"),
    });

    const { receipts, total } = await listReceipts(ctx, params);

    logger.done("list_receipts", { total, count: receipts.length });

    return NextResponse.json(
      { receipts, total, limit: params.limit, offset: params.offset },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    logger.error("list_receipts_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to list receipts" },
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

      const { total } = await listReceipts(ctx, { limit: 1 });
      if (total >= 50) {
        return NextResponse.json(
          { error: "Guest receipt limit reached. Please sign in." },
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
    const validated = CreateReceiptSchema.parse(body);

    const receipt = await createReceipt(ctx, validated);

    logger.done("create_receipt", {
      receiptId: receipt.id,
      publicId: receipt.publicId,
    });

    return NextResponse.json(receipt, { status: 201 });
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

    logger.error("create_receipt_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}
