// app/api/purchase-orders/public/[publicId]/route.ts — Public purchase order read
import { NextRequest, NextResponse } from "next/server";
import { getPurchaseOrderByPublicId } from "@/lib/db";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const po = await getPurchaseOrderByPublicId(params.publicId);
    if (!po) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // Sanitize: remove sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guestSessionId, userId, pdfUrl, ...sanitized } = po;

    return NextResponse.json(sanitized, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}
