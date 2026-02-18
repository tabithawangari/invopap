// app/api/admin/stats/route.ts — Admin platform stats (protected by secret)
import { NextRequest, NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/db";
import { createRequestLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const logger = createRequestLogger();

  // Validate admin secret
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin endpoint not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getPlatformStats();

    logger.info("admin_stats_accessed");

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error) {
    logger.error("admin_stats_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
