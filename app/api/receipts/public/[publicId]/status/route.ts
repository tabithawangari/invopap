// app/api/receipts/public/[publicId]/status/route.ts — Payment status polling
import { NextRequest, NextResponse } from "next/server";
import { getReceiptByPublicId } from "@/lib/db";
import { getReceiptPaymentsByReceiptId } from "@/lib/db/receipt-payments";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const receipt = await getReceiptByPublicId(params.publicId);
    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const payments = await getReceiptPaymentsByReceiptId(receipt.id);

    return NextResponse.json({
      isPaid: receipt.isPaid,
      paidAt: receipt.paidAt,
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
