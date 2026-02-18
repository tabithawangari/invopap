// app/api/documents/download/[publicId]/route.ts — PDF download 
import { NextRequest, NextResponse } from "next/server";
import { getInvoiceByPublicId, updateInvoicePdfUrl } from "@/lib/db";
import { renderInvoicePdf } from "@/lib/pdf";
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
    const invoice = await getInvoiceByPublicId(params.publicId);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Guard: payment required
    if (!invoice.isPaid) {
      return NextResponse.json(
        { error: "Payment required", publicId: params.publicId },
        { status: 402 }
      );
    }

    // 1. Serve cached PDF if available
    if (invoice.pdfUrl) {
      return NextResponse.redirect(invoice.pdfUrl, 302);
    }

    // 2. Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderInvoicePdf(invoice, { showWatermark: false });
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
      const url = await uploadPdf(params.publicId, pdfBuffer);
      await updateInvoicePdfUrl(invoice.id, url);
    } catch (cacheError) {
      // Non-critical: serve the PDF even if caching fails
      logger.warn("pdf_cache_failed", {
        publicId: params.publicId,
        error: cacheError instanceof Error ? cacheError.message : "unknown",
      });
    }

    // 4. Return PDF
    const filename = `${invoice.invoiceNumber}.pdf`;

    logger.done("pdf_download", {
      publicId: params.publicId,
      invoiceId: invoice.id,
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
    logger.error("pdf_download_error", {
      publicId: params.publicId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
