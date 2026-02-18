// lib/storage.ts — Supabase Storage upload helpers
import { getAdminClient } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import { log } from "@/lib/logger";

const BUCKET_NAME = "invoices";
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
const MAX_BASE64_LENGTH = 700_000; // ~500KB in base64

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * Upload a base64 data URL to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadBase64Image(
  dataUrl: string,
  folder: "logos" | "signatures" | "photos"
): Promise<string> {
  // Validate it's a data URL
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image data URL");
  }

  // Reject http:// URLs (SSRF prevention)
  if (dataUrl.startsWith("http://")) {
    throw new Error("HTTP URLs not allowed; use HTTPS or data URLs");
  }

  // If it's already a valid https URL (e.g., re-upload), return as-is
  if (dataUrl.startsWith("https://")) {
    return dataUrl;
  }

  // Validate size
  if (dataUrl.length > MAX_BASE64_LENGTH) {
    throw new Error(`Image too large (max ${MAX_IMAGE_SIZE / 1024}KB)`);
  }

  // Parse the data URL
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid base64 data URL format");
  }

  const mimeType = match[1];
  const base64Data = match[2];

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  // Decode base64
  const buffer = Buffer.from(base64Data, "base64");

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large (max ${MAX_IMAGE_SIZE / 1024}KB)`);
  }

  // Generate a unique filename
  const ext = mimeType.split("/")[1].replace("svg+xml", "svg");
  const filename = `${folder}/${createId()}.${ext}`;

  const admin = getAdminClient();
  const { error } = await admin.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "31536000", // 1 year
    });

  if (error) {
    log("error", "storage_upload_failed", {
      folder,
      error: error.message,
    });
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET_NAME).getPublicUrl(filename);

  return publicUrl;
}

/**
 * Upload a PDF buffer to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadPdf(
  publicId: string,
  buffer: Buffer
): Promise<string> {
  const filename = `pdfs/${publicId}.pdf`;
  const admin = getAdminClient();

  const { error } = await admin.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: "application/pdf",
      upsert: true,
      cacheControl: "31536000",
    });

  if (error) {
    log("error", "pdf_upload_failed", { publicId, error: error.message });
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET_NAME).getPublicUrl(filename);

  return publicUrl;
}

/**
 * Process image field: upload if base64, return URL if already uploaded.
 */
export async function processImageField(
  value: string | null | undefined,
  folder: "logos" | "signatures" | "photos"
): Promise<string | null> {
  if (!value) return null;

  // Already a URL (Supabase Storage)
  if (value.startsWith("https://")) {
    return value;
  }

  // Base64 data URL — upload
  if (value.startsWith("data:image/")) {
    return await uploadBase64Image(value, folder);
  }

  return null;
}
