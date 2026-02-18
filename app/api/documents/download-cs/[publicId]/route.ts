// app/api/documents/download-cs/[publicId]/route.ts — Cash Sale PDF download
import { NextRequest, NextResponse } from "next/server";
import { getCashSaleByPublicId, updateCashSalePdfUrl } from "@/lib/db";
import { renderCashSalePdf } from "@/lib/cash-sale-pdf";
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
    const sale = await getCashSaleByPublicId(params.publicId);
    if (!sale) {
      return NextResponse.json(
        { error: "Cash sale not found" },
        { status: 404 }
      );
    }

    // Guard: payment required
    if (!sale.isPaid) {
      return NextResponse.json(
        { error: "Payment required", publicId: params.publicId },
        { status: 402 }
      );
    }

    // 1. Serve cached PDF if available
    if (sale.pdfUrl) {
      return NextResponse.redirect(sale.pdfUrl, 302);
    }

    // 2. Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderCashSalePdf(sale, { showWatermark: false });
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
      const url = await uploadPdf(`cs-${params.publicId}`, pdfBuffer);
      await updateCashSalePdfUrl(sale.id, url);
    } catch (cacheError) {
      logger.warn("cs_pdf_cache_failed", {
        publicId: params.publicId,
        error: cacheError instanceof Error ? cacheError.message : "unknown",
      });
    }

    // 4. Return PDF
    const filename = `${sale.cashSaleNumber}.pdf`;

    logger.done("cs_pdf_download", {
      publicId: params.publicId,
      cashSaleId: sale.id,
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
    logger.error("cs_pdf_download_error", {
      publicId: params.publicId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
