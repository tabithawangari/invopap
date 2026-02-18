// app/api/health/route.ts — Health check endpoint
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    runtime: "supabase",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
}
