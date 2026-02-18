// app/api/cash-sales/[id]/route.ts — GET / PUT / DELETE by cash sale ID
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/session";
import { getCashSaleById, updateCashSale, deleteCashSale } from "@/lib/db";
import { UpdateCashSaleSchema } from "@/lib/validators";
import { checkRateLimit, privateCrudLimiter } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sale = await getCashSaleById(ctx, params.id);
    if (!sale) {
      return NextResponse.json({ error: "Cash sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale, {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
      },
    });
  } catch (error) {
    logger.error("get_cash_sale_error", {
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to get cash sale" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (rawBody.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Request too large (max 4MB)" },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    const validated = UpdateCashSaleSchema.parse(body);

    const sale = await updateCashSale(ctx, params.id, validated);
    if (!sale) {
      return NextResponse.json({ error: "Cash sale not found" }, { status: 404 });
    }

    logger.done("update_cash_sale", { id: params.id });
    return NextResponse.json(sale);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { error: "Validation failed", details: (error as any).issues },
        { status: 400 }
      );
    }

    logger.error("update_cash_sale_error", {
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to update cash sale" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await deleteCashSale(ctx, params.id);
    if (!success) {
      return NextResponse.json({ error: "Cash sale not found" }, { status: 404 });
    }

    logger.done("delete_cash_sale", { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("delete_cash_sale_error", {
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to delete cash sale" },
      { status: 500 }
    );
  }
}
