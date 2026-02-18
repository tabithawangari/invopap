// app/api/purchase-orders/public/[publicId]/status/route.ts — Payment status polling
import { NextRequest, NextResponse } from "next/server";
import { getPurchaseOrderByPublicId } from "@/lib/db";
import { getPurchaseOrderPaymentsByOrderId } from "@/lib/db/purchase-order-payments";
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

    const payments = await getPurchaseOrderPaymentsByOrderId(po.id);

    return NextResponse.json({
      isPaid: po.isPaid,
      paidAt: po.paidAt,
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
