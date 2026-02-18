-- Migration 002: Storage Buckets
-- Creates the invoices storage bucket for logos, signatures, photos, and cached PDFs

-- Create the invoices bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true,
  5242880, -- 5MB max file size
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the invoices bucket
CREATE POLICY "Public read access on invoices bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'invoices');

-- Allow authenticated users to upload to the invoices bucket
CREATE POLICY "Authenticated users can upload to invoices bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices'
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- Allow service role to manage all objects
CREATE POLICY "Service role full access on invoices bucket"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'invoices'
    AND auth.role() = 'service_role'
  );
