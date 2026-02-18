// app/api/cash-sales/route.ts — GET (list) / POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/session";
import { createCashSale, listCashSales } from "@/lib/db";
import { CreateCashSaleSchema, ListCashSalesSchema } from "@/lib/validators";
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
    const params = ListCashSalesSchema.parse({
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      orderBy: url.searchParams.get("orderBy"),
      orderDir: url.searchParams.get("orderDir"),
      cursor: url.searchParams.get("cursor"),
    });

    const { cashSales, total } = await listCashSales(ctx, params);

    logger.done("list_cash_sales", { total, count: cashSales.length });

    return NextResponse.json(
      { cashSales, total, limit: params.limit, offset: params.offset },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    logger.error("list_cash_sales_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to list cash sales" },
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

      const { total } = await listCashSales(ctx, { limit: 1 });
      if (total >= 50) {
        return NextResponse.json(
          { error: "Guest cash sale limit reached. Please sign in." },
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
    const validated = CreateCashSaleSchema.parse(body);

    const cashSale = await createCashSale(ctx, validated);

    logger.done("create_cash_sale", {
      cashSaleId: cashSale.id,
      publicId: cashSale.publicId,
    });

    return NextResponse.json(cashSale, { status: 201 });
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

    logger.error("create_cash_sale_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to create cash sale" },
      { status: 500 }
    );
  }
}
