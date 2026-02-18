// app/api/cash-sales/public/[publicId]/status/route.ts — Payment status polling
import { NextRequest, NextResponse } from "next/server";
import { getCashSaleByPublicId } from "@/lib/db";
import { getCashSalePaymentsBySaleId } from "@/lib/db/cash-sale-payments";
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

    const payments = await getCashSalePaymentsBySaleId(sale.id);

    return NextResponse.json({
      isPaid: sale.isPaid,
      paidAt: sale.paidAt,
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
