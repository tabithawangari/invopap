// app/api/documents/share/[type]/[publicId]/route.ts — Generate/retrieve share token
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, publicReadLimiter } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";
import { getAppUrl } from "@/lib/env";
import { randomUUID } from "crypto";

// Document type to table name mapping
const TABLE_NAMES: Record<string, string> = {
  invoice: "Invoice",
  "cash-sale": "CashSale",
  "delivery-note": "DeliveryNote",
  receipt: "Receipt",
  "purchase-order": "PurchaseOrder",
  quotation: "Quotation",
};

export const maxDuration = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string; publicId: string } }
) {
  const logger = createRequestLogger();
  const { type, publicId } = params;

  // Validate document type
  const tableName = TABLE_NAMES[type];
  if (!tableName) {
    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  }

  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const admin = getAdminClient();

    // Fetch document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: document, error: fetchError } = await (admin as any)
      .from(tableName)
      .select("id, publicId, isPaid, shareToken, shareTokenCreatedAt, userId, guestSessionId")
      .eq("publicId", publicId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Guard: payment required to generate share token
    if (!document.isPaid) {
      return NextResponse.json(
        { error: "Payment required to generate share link", publicId },
        { status: 402 }
      );
    }

    // Return existing token if present
    if (document.shareToken) {
      const shareUrl = `${getAppUrl()}/view/shared/${document.shareToken}`;
      
      logger.done("share_token_retrieved", {
        documentType: type,
        publicId,
        tokenExists: true,
      });

      return NextResponse.json({
        shareToken: document.shareToken,
        shareUrl,
        createdAt: document.shareTokenCreatedAt,
        isNewToken: false,
      });
    }

    // Generate new token
    const shareToken = randomUUID();
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from(tableName)
      .update({
        shareToken,
        shareTokenCreatedAt: now,
      })
      .eq("id", document.id);

    if (updateError) {
      logger.error("share_token_update_failed", {
        documentType: type,
        publicId,
        error: updateError.message,
      });
      return NextResponse.json(
        { error: "Failed to generate share token" },
        { status: 500 }
      );
    }

    const shareUrl = `${getAppUrl()}/view/shared/${shareToken}`;

    logger.done("share_token_generated", {
      documentType: type,
      publicId,
      isGuest: !document.userId,
    });

    return NextResponse.json({
      shareToken,
      shareUrl,
      createdAt: now,
      isNewToken: true,
    });
  } catch (error) {
    logger.error("share_token_error", {
      documentType: type,
      publicId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to process share request" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if share token exists without generating
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; publicId: string } }
) {
  const logger = createRequestLogger();
  const { type, publicId } = params;

  const tableName = TABLE_NAMES[type];
  if (!tableName) {
    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  }

  const limited = await checkRateLimit(publicReadLimiter, request);
  if (limited) return limited;

  try {
    const admin = getAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: document, error } = await (admin as any)
      .from(tableName)
      .select("shareToken, shareTokenCreatedAt, isPaid")
      .eq("publicId", publicId)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (!document.shareToken) {
      return NextResponse.json({
        hasShareToken: false,
        isPaid: document.isPaid,
      });
    }

    const shareUrl = `${getAppUrl()}/view/shared/${document.shareToken}`;

    return NextResponse.json({
      hasShareToken: true,
      shareUrl,
      createdAt: document.shareTokenCreatedAt,
      isPaid: document.isPaid,
    });
  } catch (error) {
    logger.error("share_token_check_error", {
      documentType: type,
      publicId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to check share status" },
      { status: 500 }
    );
  }
}
