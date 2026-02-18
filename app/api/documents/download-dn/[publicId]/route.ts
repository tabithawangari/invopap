// app/api/documents/download-dn/[publicId]/route.ts — Delivery Note PDF download
import { NextRequest, NextResponse } from "next/server";
import { getDeliveryNoteByPublicId, updateDeliveryNotePdfUrl } from "@/lib/db";
import { renderDeliveryNotePdf } from "@/lib/delivery-note-pdf";
import { uploadPdf } from "@/lib/storage";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const logger = createRequestLogger();

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

    // Guard: payment required
    if (!note.isPaid) {
      return NextResponse.json(
        { error: "Payment required", publicId: params.publicId },
        { status: 402 }
      );
    }

    // 1. Serve cached PDF if available
    if (note.pdfUrl) {
      return NextResponse.redirect(note.pdfUrl, 302);
    }

    // 2. Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderDeliveryNotePdf(note, { showWatermark: false });
    } catch (error) {
      if (error instanceof Error && error.message === "PDF_BUSY") {
        return NextResponse.json(
          { error: "Server busy generating PDFs, please retry in a few seconds" },
          { status: 503, headers: { "Retry-After": "5" } }
        );
      }
      throw error;
    }

    // 3. Cache: upload to Storage
    try {
      const url = await uploadPdf(`dn-${params.publicId}`, pdfBuffer);
      await updateDeliveryNotePdfUrl(note.id, url);
    } catch (cacheError) {
      logger.warn("dn_pdf_cache_failed", {
        publicId: params.publicId,
        error: cacheError instanceof Error ? cacheError.message : "unknown",
      });
    }

    // 4. Return PDF
    const filename = `${note.deliveryNoteNumber}.pdf`;

    logger.done("dn_pdf_download", {
      publicId: params.publicId,
      deliveryNoteId: note.id,
      size: pdfBuffer.length,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("dn_pdf_download_error", {
      publicId: params.publicId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
