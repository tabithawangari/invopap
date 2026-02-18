// app/api/delivery-notes/public/[publicId]/route.ts — Public delivery note read
import { NextRequest, NextResponse } from "next/server";
import { getDeliveryNoteByPublicId } from "@/lib/db";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const note = await getDeliveryNoteByPublicId(params.publicId);
    if (!note) {
      return NextResponse.json(
        { error: "Delivery note not found" },
        { status: 404 }
      );
    }

    // Sanitize: remove sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guestSessionId, userId, pdfUrl, ...sanitized } = note;

    return NextResponse.json(sanitized, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch delivery note" },
      { status: 500 }
    );
  }
}
