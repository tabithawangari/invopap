// app/api/delivery-notes/public/[publicId]/status/route.ts — Payment status polling
import { NextRequest, NextResponse } from "next/server";
import { getDeliveryNoteByPublicId } from "@/lib/db";
import { getDeliveryNotePaymentsByNoteId } from "@/lib/db/delivery-note-payments";
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

    const payments = await getDeliveryNotePaymentsByNoteId(note.id);

    return NextResponse.json({
      isPaid: note.isPaid,
      paidAt: note.paidAt,
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
