// app/api/invoices/route.ts — GET (list) / POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/session";
import { createInvoice, listInvoices } from "@/lib/db";
import { CreateInvoiceSchema, ListInvoicesSchema } from "@/lib/validators";
import {
  checkRateLimit,
  invoiceCreateLimiter,
  privateCrudLimiter,
  guestInvoiceLimiter,
} from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

// Allow larger request bodies for base64 images
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const logger = createRequestLogger();

  // Rate limit
  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const url = new URL(request.url);
    const params = ListInvoicesSchema.parse({
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      orderBy: url.searchParams.get("orderBy"),
      orderDir: url.searchParams.get("orderDir"),
      cursor: url.searchParams.get("cursor"),
    });

    const { invoices, total } = await listInvoices(ctx, params);

    logger.done("list_invoices", { total, count: invoices.length });

    return NextResponse.json(
      { invoices, total, limit: params.limit, offset: params.offset },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    logger.error("list_invoices_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const logger = createRequestLogger();

  // Rate limit
  const limited = await checkRateLimit(invoiceCreateLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Guest abuse prevention: limit invoices per IP per day
    if (ctx.guestSessionId) {
      const guestLimited = await checkRateLimit(
        guestInvoiceLimiter,
        request
      );
      if (guestLimited) {
        return NextResponse.json(
          { error: "Guest invoice limit reached. Please sign in." },
          { status: 403 }
        );
      }

      // Check guest session cap (50 invoices max)
      const { total } = await listInvoices(ctx, { limit: 1 });
      if (total >= 50) {
        return NextResponse.json(
          { error: "Guest invoice limit reached. Please sign in." },
          { status: 403 }
        );
      }
    }

    // Validate body size
    const rawBody = await request.text();
    if (rawBody.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Request too large (max 4MB)" },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    const validated = CreateInvoiceSchema.parse(body);

    const invoice = await createInvoice(ctx, validated);

    logger.done("create_invoice", {
      invoiceId: invoice.id,
      publicId: invoice.publicId,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Zod validation errors
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

    logger.error("create_invoice_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
