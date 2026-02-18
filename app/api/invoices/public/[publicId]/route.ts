// app/api/invoices/public/[publicId]/route.ts — Public invoice read
import { NextRequest, NextResponse } from "next/server";
import { getInvoiceByPublicId } from "@/lib/db";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const invoice = await getInvoiceByPublicId(params.publicId);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Sanitize: remove sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guestSessionId, userId, pdfUrl, ...sanitized } = invoice;

    return NextResponse.json(sanitized, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
