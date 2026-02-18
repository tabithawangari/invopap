// app/api/quotations/public/[publicId]/route.ts — Public quotation read
import { NextRequest, NextResponse } from "next/server";
import { getQuotationByPublicId } from "@/lib/db";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const quotation = await getQuotationByPublicId(params.publicId);
    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Sanitize: remove sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guestSessionId, userId, pdfUrl, ...sanitized } = quotation;

    return NextResponse.json(sanitized, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 }
    );
  }
}
