// app/api/quotations/public/[publicId]/status/route.ts — Payment status polling
import { NextRequest, NextResponse } from "next/server";
import { getQuotationByPublicId } from "@/lib/db";
import { getQuotationPaymentsByQuotationId } from "@/lib/db/quotation-payments";
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

    const payments = await getQuotationPaymentsByQuotationId(quotation.id);

    return NextResponse.json({
      isPaid: quotation.isPaid,
      paidAt: quotation.paidAt,
      payments: payments.map((p) => ({
        status: p.status,
        mpesaReceiptNumber: p.mpesaReceiptNumber,
        createdAt: p.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
