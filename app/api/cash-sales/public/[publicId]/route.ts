// app/api/cash-sales/public/[publicId]/route.ts — Public cash sale read
import { NextRequest, NextResponse } from "next/server";
import { getCashSaleByPublicId } from "@/lib/db";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const sale = await getCashSaleByPublicId(params.publicId);
    if (!sale) {
      return NextResponse.json(
        { error: "Cash sale not found" },
        { status: 404 }
      );
    }

    // Sanitize: remove sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guestSessionId, userId, pdfUrl, ...sanitized } = sale;

    return NextResponse.json(sanitized, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch cash sale" },
      { status: 500 }
    );
  }
}
