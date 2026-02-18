// app/api/invoices/public/[publicId]/status/route.ts — Payment status polling
import { NextRequest, NextResponse } from "next/server";
import { getInvoiceByPublicId, getPaymentsByInvoiceId } from "@/lib/db";
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

    const payments = await getPaymentsByInvoiceId(invoice.id);

    return NextResponse.json({
      isPaid: invoice.isPaid,
      paidAt: invoice.paidAt,
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
