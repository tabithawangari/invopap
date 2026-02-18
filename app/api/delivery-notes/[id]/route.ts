// app/api/delivery-notes/[id]/route.ts — GET / PUT / DELETE by delivery note ID
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/session";
import { getDeliveryNoteById, updateDeliveryNote, deleteDeliveryNote } from "@/lib/db";
import { UpdateDeliveryNoteSchema } from "@/lib/validators";
import { checkRateLimit, privateCrudLimiter } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await getDeliveryNoteById(ctx, params.id);
    if (!note) {
      return NextResponse.json({ error: "Delivery note not found" }, { status: 404 });
    }

    return NextResponse.json(note, {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
      },
    });
  } catch (error) {
    logger.error("get_delivery_note_error", {
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to get delivery note" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (rawBody.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Request too large (max 4MB)" },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    const validated = UpdateDeliveryNoteSchema.parse(body);

    const note = await updateDeliveryNote(ctx, params.id, validated);
    if (!note) {
      return NextResponse.json({ error: "Delivery note not found" }, { status: 404 });
    }

    logger.done("update_delivery_note", { id: params.id });
    return NextResponse.json(note);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { error: "Validation failed", details: (error as any).issues },
        { status: 400 }
      );
    }

    logger.error("update_delivery_note_error", {
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to update delivery note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logger = createRequestLogger();

  const limited = await checkRateLimit(privateCrudLimiter, request);
  if (limited) return limited;

  try {
    const ctx = await getTenantContext();
    if (!ctx.userId && !ctx.guestSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await deleteDeliveryNote(ctx, params.id);
    if (!success) {
      return NextResponse.json({ error: "Delivery note not found" }, { status: 404 });
    }

    logger.done("delete_delivery_note", { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("delete_delivery_note_error", {
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to delete delivery note" },
      { status: 500 }
    );
  }
}
